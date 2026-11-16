import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SchedulerState, SchedulerWorker } from '../../src/lib/scheduler.js';

// R2, R3, R9: Scheduler worker forwarding and timer cleanup.
describe('scheduler worker', () => {
	it('forwards source and state updates and cancels scheduled work on pause', async (t) => {
		const timers = new Map<number, () => void>();
		let nextId = 0;
		let onRescheduled: (() => void) | undefined;
		const rescheduled = new Promise<void>((resolve) => { onRescheduled = resolve; });
		const previousSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');
		const fakeSelf = {
			setTimeout(callback: () => void) {
				const id = ++nextId;
				timers.set(id, callback);
				if (id === 2) onRescheduled?.();
				return id;
			},
			clearTimeout(id: number) { timers.delete(id); },
		};
		Object.defineProperty(globalThis, 'self', { configurable: true, value: fakeSelf });
		t.after(() => {
			if (previousSelf) Object.defineProperty(globalThis, 'self', previousSelf);
			else Reflect.deleteProperty(globalThis, 'self');
		});
		t.mock.method(performance, 'now', () => 0);
		t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2024, 0, 1) });

		let scheduler: FakeScheduler | undefined;
		class FakeScheduler extends EventTarget {
			autoplay = true;
			src = '';
			src_expires = '';
			src_size = 0;
			src_hash = {};
			src_integrity = '';
			src_md5 = '';
			sources = [];
			updates = 0;
			constructor() { super(); scheduler = this; }
			async play() {}
			update() { this.updates++; }
			state() { return { currentTime: 'fixed' }; }
			exposeNetwork() {}
		}
		const states: SchedulerState[] = [];
		let stateSent: (() => void) | undefined;
		const sent = new Promise<void>((resolve) => { stateSent = resolve; });
		const renderer = {
			async setState(state: SchedulerState) { states.push(state); stateSent?.(); },
		};
		let api: SchedulerWorker | undefined;
		t.mock.module('comlink', {
			exports: {
				expose(value: SchedulerWorker) { api = value; },
				wrap() { return renderer; },
			},
		});
		t.mock.module(new URL('../../src/lib/basic-scheduler.ts', import.meta.url), {
			exports: { BasicScheduler: FakeScheduler },
		});
		await import('../../src/workers/scheduler.worker.js');
		Object.defineProperty(globalThis, 'self', { configurable: true, value: fakeSelf });
		const worker = api;
		const subject = scheduler;
		assert.ok(worker, 'scheduler worker did not expose its API');
		assert.ok(subject, 'scheduler was not created');
		const channel = new MessageChannel();
		t.after(() => { channel.port1.close(); channel.port2.close(); });

		worker.setStatePort(channel.port1);
		worker.setSource('https://fixtures.invalid/recipe.json', '', 3, { method: 'SHA256', hex: 'abc' }, 'sha256-x', 'md5');
		await worker.play();
		assert.equal(timers.size, 1);
		const scheduled = timers.entries().next().value;
		assert.ok(scheduled);
		timers.delete(scheduled[0]);
		scheduled[1]();
		await sent;
		await rescheduled;

		assert.equal(subject.src, 'https://fixtures.invalid/recipe.json');
		assert.equal(subject.updates, 1);
		assert.equal(states[0].currentTime, 'fixed');
		assert.equal(timers.size, 1);
		worker.pause();
		assert.equal(timers.size, 0);
	});
});
