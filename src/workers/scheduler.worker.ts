// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import '@ungap/global-this';
import 'fromentries';
import * as Comlink from 'comlink';
import { DateTime } from 'luxon';
import { Scheduler } from '../lib/scheduler.js';
import { BasicScheduler } from '../lib/basic-scheduler.js';
import { HashDecl, ScopedMediaDecl } from '../lib/media.js';

console.info('SCHEDULER: WebWorker started.');
const scheduler: Scheduler = new BasicScheduler();
scheduler.autoplay = false;
scheduler.addEventListener('loadeddata', () => {
	console.log(`SCHEDULER: Media list loaded.`);
	(async() => {
		for(const sources of scheduler.sources) {
			console.log(`SCHEDULER: Preparing scope "${sources.scope}" with ${sources.entries.length} entries.`);
			await renderer.setSources(sources.scope, sources.entries);

			console.log(`SCHEDULER: Scope "${sources.scope}" ready.`);
			// Scope content is loaded and ready for usage.
			sources.isReady = true;
		}
	})();
});

let statePort: MessagePort | undefined;
let update_id: number | undefined;
let renderer: any;

// An equivalent to self.requestAnimationFrame() or self.requestIdleCallback()
// that runs at a constant fixed frequency.
const interval = 1000 / 10 /* 10 Hz */;
let lastTime = 0;
function requestUpdate(callback: Function): number {
	const now = performance.now();
	const target = Math.max(0, interval - (now - lastTime));
	const id = self.setTimeout(() => callback(now + target), target);
	lastTime = now + target;
	return id;
}
function clearUpdate(id: number): void {
	self.clearTimeout(id);
}

Comlink.expose({
	setStatePort(
		port: MessagePort,
	): void {
		statePort = port;
		if(statePort instanceof MessagePort) {
			console.log(`SCHEDULER: Received "statePort" ${statePort}.`);
			renderer = Comlink.wrap(statePort);
		}
	},
	exposeNetwork(
		join: (decl: any) => Promise<void>,
		leave: () => Promise<void>,
	) {
		scheduler.exposeNetwork(join, leave);
	},
	setSource(
		src: string,
		id: string,
		size: number,
		hash: HashDecl,
		integrity: string,
		md5: string,
	): void {
		console.log(`SCHEDULER: ${JSON.stringify({src, id, size, hash, integrity, md5})}`);
		scheduler.src_md5 = md5;
		scheduler.src_integrity = integrity;
		scheduler.src_hash = hash;
		scheduler.src_size = size;
		scheduler.src_id = id;
		scheduler.src = src;
	},
	// Plural meaning sources of set source.
	getScopedSources(): ScopedMediaDecl[] {
		return scheduler.sources;
	},
	async play(): Promise<void> {
		await scheduler.play();
		prepareNextUpdate();
	},
	pause(): void {
		if(typeof update_id === "number") {
			clearUpdate(update_id);
			update_id = undefined;
		}
	},
});

// Run one step of the scheduler state engine.  Note we use the real-time clock
// instead of the performance counter as we need to refer to calendar
// entries for starting and stopping schedules.
function update(_timestamp: DOMHighResTimeStamp): void {
//	console.log("update", timestamp);
	(async () => {
		try {
			const now = DateTime.local();
			scheduler.update(now);
			// Serialize the state to forward to the renderer.
			if(typeof renderer !== 'undefined') {
				const state = scheduler.state(now);
				await renderer.setState(state);
			}
			prepareNextUpdate();
		} catch(ex: any) {
			console.warn("SCHEDULER:", ex);
		}
	})();
}

function prepareNextUpdate(): void {
//	console.log("prepareNextUpdate");
	update_id = requestUpdate((timestamp: DOMHighResTimeStamp) => update(timestamp));
}
