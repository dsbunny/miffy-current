import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime, Duration } from 'luxon';
import { BasicScheduler, ScheduleItem, ScheduleItemView } from '../../../src/lib/basic-scheduler.js';

const start = DateTime.fromISO('2024-01-01T10:00:00Z', { setZone: true });

// R2: Playlist item timing and state.
describe('ScheduleItemView', () => {
	it('reports the current item and remaining time within the playlist window', () => {
		const decl = {
			'@type': 'HTMLImageElement',
			asset_id: 'image-1',
			href: 'https://fixtures.invalid/image.png',
			duration: 5,
		};
		const item = new ScheduleItem('event-1', decl, Duration.fromMillis(2000), Duration.fromMillis(7000));
		const view = new ScheduleItemView(item, start);

		const result = view.summary(start.plus({ seconds: 4 }));

		assert.equal(result.remainingTimeMs, 3000);
		assert.equal(result.startTime, start.plus({ seconds: 2 }).toISO());
		assert.equal(result.endTime, start.plus({ seconds: 7 }).toISO());
		assert.deepEqual(result.decl, decl);
	});

	it('reports infinite remaining time after the view has ended', () => {
		const decl = {
			'@type': 'HTMLImageElement',
			asset_id: 'image-1',
			href: 'https://fixtures.invalid/image.png',
			duration: 5,
		};
		const item = new ScheduleItem('event-1', decl, Duration.fromMillis(0), Duration.fromMillis(5000));
		const view = new ScheduleItemView(item, start);

		const result = view.summary(start.plus({ seconds: 6 }));

		assert.equal(result.remainingTimeMs, 'Infinity');
	});
});

// R2, R8: Scheduler load failures.
describe('BasicScheduler', () => {
	it('emits an error and returns to idle when recipe loading fails', async (t) => {
		const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(null, {
			status: 404,
			statusText: 'Not Found',
		}));
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = 'https://fixtures.invalid/recipe.json';
		const error = new Promise<CustomEvent>((resolve) => {
			scheduler.addEventListener('error', (event) => resolve(event as CustomEvent), { once: true });
		});

		scheduler.load();
		const event = await error;

		assert.equal(fetch.mock.callCount(), 1);
		assert.match(event.detail.message, /404 Not Found/);
		assert.equal(scheduler.networkState, 1);
	});
});
