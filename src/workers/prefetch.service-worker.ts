// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Service worker with asset API.

export type {};
declare var self: ServiceWorkerGlobalScope;

import * as Comlink from 'comlink';
import { AssetDecl } from '../lib/media.js';
import { PrefetchWorker } from '../workers/prefetch.worker.js';

class PrefetchServiceWorker {
	constructor() {
		self.addEventListener('install', (event: ExtendableEvent) => {
			self.skipWaiting();
			event.waitUntil(this.#install());
		});
		self.addEventListener('fetch', (event: FetchEvent) => {
			// Let the browser do its default thing
			// for non-GET requests.
			if (event.request.method !== "GET") {
				return;
			}
			event.respondWith(this.#fetch(event.request));
		});
		self.addEventListener('activate', (event: ExtendableEvent) => {
			event.waitUntil(this.#activate());
		});
//		self.addEventListener('message', (event: ExtendableMessageEvent) => {
//			this.#onMessage(event.source, event.data);
//		});
	}

	async #install() {
		const cache = await self.caches.open('miffy');
		const hrefs = [
			//'./index.html',
			'/media/favicon.png',
			'../dist/calendar.bundle.mjs',
			'../dist/css.bundle.mjs',
			'../dist/kuromi.bundle.mjs',
			'../dist/prefetch.bundle.mjs',
			'../dist/raft.mjs',
			'../dist/rmm.bundle.mjs',
			'../dist/rtcmesh.mjs',
			'../dist/scheduler.bundle.mjs',
			'../dist/webgl.bundle.mjs',
			'/external/node_modules/lit/index.js',
			'/external/node_modules/lit/decorators.js',
			'/external/node_modules/lit-html/lit-html.js',
			'/external/node_modules/lit-element/lit-element.js',
			'/external/node_modules/@lit/reactive-element/css-tag.js',
			'/external/node_modules/@lit/reactive-element/reactive-element.js',
			'/external/node_modules/@lit/reactive-element/decorators/base.js',
			'/external/node_modules/@lit/reactive-element/decorators/custom-element.js',
			'/external/node_modules/@lit/reactive-element/decorators/property.js',
			'/external/node_modules/@lit/reactive-element/decorators/state.js',
			'/external/node_modules/@lit/reactive-element/decorators/event-options.js',
			'/external/node_modules/@lit/reactive-element/decorators/query.js',
			'/external/node_modules/@lit/reactive-element/decorators/query-all.js',
			'/external/node_modules/@lit/reactive-element/decorators/query-async.js',
			'/external/node_modules/@lit/reactive-element/decorators/query-assigned-elements.js',
			'/external/node_modules/@lit/reactive-element/decorators/query-assigned-nodes.js',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/index.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/CachedKeyDecoder.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/encode.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/decode.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/decodeAsync.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/Decoder.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/DecodeError.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/Encoder.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/ExtensionCodec.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/ExtData.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/timestamp.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/utils/stream.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/utils/prettyByte.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/utils/int.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/utils/utf8.mjs',
			'/external/node_modules/@msgpack/msgpack/dist.es5+esm/utils/typedArrays.mjs',
			'/external/node_modules/three/build/three.module.js',
		];
		const options = {
			method: 'GET',
			cache: 'force-cache' as RequestCache,
		};
		const resources = hrefs.map(href => {
			const request = new Request(href, options);
			return request;
		});
		console.info(`PREFETCH-SERVICEWORKER: Start.`);
		const t0 = performance.now();
		try {
			await this.#cacheAddAll(cache, resources);
		} catch(e) {
			console.warn(`PREFETCH-SERVICEWORKER: Failed preparing resources: ${e}.`);
		} finally {
			const t1 = performance.now();
			console.info(`PREFETCH-SERVICEWORKER: Complete ${Math.round(t1 - t0)}ms.`);
		}
	}

	// Explicitly add one request at a time to ensure all resources
	// are settled, compare to Cache.AddAll which bails on first error.
	async #cacheAddAll(cache: Cache, resources: Request[]) {
		const deferred = [];
		const networkFetch = async (request: Request) => {
			const networkResponse = await fetch(request);
			if(networkResponse.ok
				&& networkResponse.status !== 206)
			{
				await cache.put(request, networkResponse);
				console.log(`PREFETCH-SERVICEWORKER: Cache updated ${request.url}`, request);
				return;
			}
			console.warn(`PREFETCH-SERVICEWORKER: Failed ${request.url}`, request);
		};
		const t0 = performance.now();
		for(const request of resources) {
			try {
				const cachedResponse = await cache.match(request);
				if(!cachedResponse) {
					await networkFetch(request);
				} else {
					deferred.push(networkFetch(request));
				}
			} catch(ex) {
				console.warn(`PREFETCH-SERVICEWORKER: ${ex}`);
			}
		}
		const t1 = performance.now();
		console.log(`PREFETCH-SERVICEWORKER: Fetch ${Math.round(t1 - t0)}ms.`);
		if(deferred.length) {
			try {
				await Promise.allSettled(deferred);
			} catch(ex) {
				console.warn(`PREFETCH-SERVICEWORKER: ${ex}`);
			}
			const t2 = performance.now();
			console.log(`PREFETCH-SERVICEWORKER: Revalidate ${Math.round(t2 - t1)}ms.`);
		}
	}

	async #fetch(request: Request) {
		// Response should include `Vary: Origin` and `Vary: Accept-Encoding`.
		const cachedResponse = await self.caches.match(request, { ignoreVary: true });
		if(cachedResponse) {
			//console.log(`PREFETCH-SERVICEWORKER: Cache hit ${request.url}.`);
			return cachedResponse;
		}
		// Default to network if unavailable in cache, i.e. SSE streams.
		console.log(`PREFETCH-SERVICEWORKER: Cache miss ${request.url}.`, request);
		return fetch(request);
	}

	async #activate() {
		await this.#upgradeCaches();
		// Take control of pages immediately, including those loaded
		// via a different service worker.
		await self.clients.claim();
	}

	// REF: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/activate_event
	// Typically delete old caches.
	async #upgradeCaches() {
		// no-op.
	}

	async setSources(scope: string, sources: AssetDecl[]) {
		console.log(`PREFETCH-SERVICEWORKER: Cache scope ${scope}.`);
		const cache = await self.caches.open(scope);
		const options: RequestInit = {
			cache: 'no-cache',
			credentials: 'omit',
			keepalive: true,
			method: 'GET',
			mode: 'cors',
			//priority: 'low',
			redirect: 'follow',
			referrer: 'client',
			referrerPolicy: 'strict-origin-when-cross-origin',
		};
		await this.#cacheAddAll(cache, sources.map(source => {
			const request = new Request(source.href, {
				// FIXME: SRI crying wolf.
				//integrity: source.integrity,
				...options,
			});
			return request;
		}));
		console.log(`PREFETCH-SERVICEWORKER: Complete scope ${scope}.`);
	}
}

console.info("PREFETCH-SERVICEWORKER: Started.");
const prefetch_service_worker = new PrefetchServiceWorker();

self.addEventListener('message', (event: ExtendableMessageEvent) => {
	if(event.data instanceof MessagePort) {
		Comlink.expose({
			setSources: async (scope: string, sources: AssetDecl[]) => {
				await prefetch_service_worker.setSources(scope, sources);
			},
		} as PrefetchWorker, event.data);
		event.data.start();
	}
});
