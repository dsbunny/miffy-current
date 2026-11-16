import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PrefetchWorker } from '../../src/lib/prefetch.js';

class FakeCache {
	entries = new Map<string, Response>();

	async match(request: Request) {
		return this.entries.get(request.url)?.clone();
	}

	async put(request: Request, response: Response) {
		this.entries.set(request.url, response.clone());
	}
}

class FakeCaches {
	caches = new Map<string, FakeCache>();

	async open(name: string) {
		let cache = this.caches.get(name);
		if (!cache) {
			cache = new FakeCache();
			this.caches.set(name, cache);
		}
		return cache;
	}

	async match(request: Request) {
		for (const cache of this.caches.values()) {
			const response = await cache.match(request);
			if (response) return response;
		}
		return undefined;
	}
}

class LifetimeEvent extends Event {
	promise: Promise<unknown> | undefined;

	waitUntil(promise: Promise<unknown>) { this.promise = promise; }
}

class RequestEvent extends Event {
	promise: Promise<Response> | undefined;

	constructor(readonly request: Request) { super('fetch'); }
	respondWith(promise: Promise<Response>) { this.promise = promise; }
}

// R5, R8, R9: Service-worker cache and fetch behavior without network access.
describe('prefetch service worker', () => {
	it('caches successful assets, bypasses non-GET requests and skips partial responses', async (t) => {
		const caches = new FakeCaches();
		const scope = new EventTarget();
		let claimed = false;
		Object.assign(scope, {
			caches,
			skipWaiting() {},
			clients: { async claim() { claimed = true; } },
		});
		const previousSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');
		Object.defineProperty(globalThis, 'self', { value: scope, configurable: true });
		t.after(() => {
			if (previousSelf) Object.defineProperty(globalThis, 'self', previousSelf);
			else Reflect.deleteProperty(globalThis, 'self');
		});
		const NativeRequest = globalThis.Request;
		class BrowserRequest extends NativeRequest {
			constructor(input: RequestInfo | URL, options?: RequestInit) {
				// Browsers resolve a relative referrer against the worker URL.
				const init = options?.referrer === 'client'
					? { ...options, referrer: 'https://fixtures.invalid/client' }
					: options;
				super(input, init);
			}
		}
		Object.defineProperty(globalThis, 'Request', { value: BrowserRequest, configurable: true });
		t.after(() => Object.defineProperty(globalThis, 'Request', { value: NativeRequest, configurable: true }));
		t.mock.method(performance, 'now', () => 0);
		const fetch = t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
			const url = input instanceof Request ? input.url : String(input);
			switch (url) {
			case './manifest.json':
				return new Response(JSON.stringify(['https://fixtures.invalid/image.png']));
			case 'https://fixtures.invalid/image.png':
				return new Response('image');
			case 'https://fixtures.invalid/partial.png':
				return new Response('partial', { status: 206 });
			default:
				throw new Error(`Unexpected fetch: ${url}`);
			}
		});
		let worker: PrefetchWorker | undefined;
		t.mock.module('comlink', {
			exports: { expose(value: PrefetchWorker) { worker = value; } },
		});
		await import('../../src/workers/prefetch.service-worker.js');

		const install = new LifetimeEvent('install');
		scope.dispatchEvent(install);
		assert.ok(install.promise);
		await install.promise;
		const hit = new RequestEvent(new Request('https://fixtures.invalid/image.png'));
		scope.dispatchEvent(hit);
		assert.ok(hit.promise);
		assert.equal(await (await hit.promise).text(), 'image');
		const post = new RequestEvent(new Request('https://fixtures.invalid/image.png', { method: 'POST' }));
		scope.dispatchEvent(post);
		assert.equal(post.promise, undefined);
		const activate = new LifetimeEvent('activate');
		scope.dispatchEvent(activate);
		assert.ok(activate.promise);
		await activate.promise;
		assert.equal(claimed, true);

		const channel = new MessageChannel();
		t.after(() => { channel.port1.close(); channel.port2.close(); });
		scope.dispatchEvent(new MessageEvent('message', { data: channel.port1 }));
		const exposed = worker;
		assert.ok(exposed, 'service worker did not expose its API');
		await exposed.setSources('scope', [{
			'@type': 'HTMLImageElement',
			asset_id: 'partial',
			href: 'https://fixtures.invalid/partial.png',
		}]);
		assert.equal((await caches.open('scope')).entries.size, 0);
		assert.equal(fetch.mock.callCount(), 3);
	});
});
