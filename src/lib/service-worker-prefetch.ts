// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as Comlink from 'comlink';
import EventTarget from '@ungap/event-target';
import { Prefetch } from './prefetch.js';
import { AssetDecl } from './media.js';
import { PrefetchWorker } from '../workers/prefetch.worker.js';

export class ServiceWorkerPrefetch extends EventTarget implements Prefetch {
	protected _activated = false;
	protected _serviceWorker: ServiceWorker | undefined;
	protected _prefetch: Comlink.Remote<PrefetchWorker> | undefined;

	constructor() {
		super();
		if('serviceWorker' in navigator) {
			(async () => {
				await this._registerServiceWorker();
			})();
		} else {
			console.error("PREFETCH: ServiceWorker not supported.");
		}
	}

	protected async _registerServiceWorker() {
		console.log("PREFETCH: Registering service worker ...");
		if(navigator.serviceWorker.controller) {
			console.log(`PREFETCH: Currently controlled by:`, navigator.serviceWorker.controller);
		} else {
			console.log('PREFETCH: Not currently controlled by a service worker.');
		}
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			console.log(`PREFETCH: Now controlled by:`, navigator.serviceWorker.controller);
		});
		// Note href not URL.
		const href = new URL('./prefetch.bundle.js', import.meta.url).href;
		const serviceWorkerOptions: RegistrationOptions = {
			scope: '/',
			type: 'module',
		};
		const registration = await navigator.serviceWorker.register(href, serviceWorkerOptions);
		console.log(`PREFETCH: Service worker registration successful with scope: ${registration.scope}.`);
      		registration.addEventListener('updatefound', () => {
        		console.log("PREFETCH: Service worker updating ...");
      		});
		if(registration.installing) {
			this._serviceWorker = registration.installing;
			console.log("PREFETCH: Service worker installing ...");
		} else if(registration.waiting) {
			this._serviceWorker = registration.waiting;
			console.log("PREFETCH: Service worker waiting ...");
		} else if(registration.active) {
			this._serviceWorker = registration.active;
			console.log("PREFETCH: Service worker active.");
console.log(navigator.serviceWorker);
			this._onActivatedWorker();
		}
		if(typeof this._serviceWorker !== "undefined") {
			this._serviceWorker.addEventListener('statechange', (e: Event) => {
console.log(e);
				if(e.target === null) {
					return;
				}
				if(!(e.target instanceof ServiceWorker)) {
					return;
				}
				console.log(`PREFETCH: Service worker state change: ${e.target.state}.`);
			});
			navigator.serviceWorker.startMessages();
		}
	}

	async acquireSources(scope: string, sources: AssetDecl[]) {
		console.log(`PREFETCH: setSources ${scope} ${JSON.stringify(sources)}`);
		if(!this._activated) {
			console.warn(`PREFETCH: Not activated.`);
			return;
		}
		if(typeof this._prefetch === "undefined") {
			console.warn(`PREFETCH: Comlink not available.`);
			return;
		}
		await this._prefetch.setSources(scope, sources);
	}

	async releaseSources(_scope: string): Promise<void> {
		// No-op, browser engine manages expiration LRU or similar.
	}

	// Simple pass-through.
	getCachedPath(origin: string): string {
		return origin;
	}

	protected _onActivatedWorker() {
		console.log(`PREFETCH: _onActivatedWorker`);
		if(this._activated) {
			return;
		}
		if(typeof this._serviceWorker === "undefined") {
			return;
		}
		this._activated = true;
		console.log("PREFETCH: Service worker activated.");
		const channel = new MessageChannel();
  		this._serviceWorker.postMessage(channel.port2, [channel.port2]);
		this._prefetch = Comlink.wrap<PrefetchWorker>(channel.port1);
  		channel.port1.start();
	}
}
