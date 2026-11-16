import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Faker, en } from '@faker-js/faker';
import { DateTime } from 'luxon';
import type { CalendarWorker } from '../../src/lib/occurency.js';

// R1, R3, R8: Calendar worker API and invalid schedules.
describe('calendar worker', () => {
	it('exposes an empty calendar, parses a recurrence and rejects invalid types', async (t) => {
		let api: CalendarWorker | undefined;
		t.mock.module('comlink', {
			exports: {
				transferHandlers: new Map(),
				expose(value: CalendarWorker) { api = value; },
			},
		});
		await import('../../src/workers/calendar.worker.js');
		const worker = api;
		assert.ok(worker, 'calendar worker did not expose its API');
		const start = DateTime.fromISO('2024-01-01T10:00:00Z', { setZone: true });
		const fixture = JSON.parse(await readFile(new URL('../fixtures/calendar-event.json', import.meta.url), 'utf8'));
		const faker = new Faker({ locale: [en] });
		faker.seed(1);
		const id = faker.string.uuid();

		assert.deepEqual(worker.getEvents(start, start.plus({ hours: 2 })), []);
		assert.throws(() => worker.parseSchedule(null, { '@type': 'Invalid' }), /Invalid @type/);
		worker.parseSchedule('parent', { ...fixture, id });
		const events = worker.getEvents(start, start.plus({ hours: 2 }));

		assert.ok(events.length > 0);
		assert.equal(events[0].id, id);
		assert.equal(events[0].start.toMillis(), start.toMillis());
		assert.equal(events[0].parentId, 'parent');
	});
});
