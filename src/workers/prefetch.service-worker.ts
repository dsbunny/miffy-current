// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

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
			'../dist/calendar.bundle.mjs',
			'../dist/css.bundle.mjs',
			'../dist/prefetch.bundle.mjs',
			'../dist/scheduler.bundle.mjs',
			'../dist/webgl.bundle.mjs',
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
