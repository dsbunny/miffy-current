import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DateTime } from 'luxon';
import { RecipeSchema } from '@dsbunny/recipe-schema';
import type { CalendarWorker } from '../../src/lib/occurency.js';

// R1, R3: Recurrence count and inclusive end limits at the worker boundary.
describe('calendar recurrence limits', () => {
	it('enforces limits, preserves overrides and rejects invalid rules', async (t) => {
		let api: CalendarWorker | undefined;
		t.mock.module('comlink', {
			exports: {
				transferHandlers: new Map(),
				expose(value: CalendarWorker) { api = value; },
			},
		});
		await import('../../src/workers/calendar.worker.js');
		const worker = api;
		assert.ok(worker);
		const fixture = RecipeSchema.ScheduledPlaylistSchema.parse(
			JSON.parse(await readFile(new URL('../fixtures/calendar-event.json', import.meta.url), 'utf8')),
		);
		const start = DateTime.fromISO(fixture.start);
		const daily = { '@type': 'RecurrenceRule', frequency: 'daily' } as const;
		const dates = (from: DateTime, to: DateTime) =>
			worker.getEvents(from, to).map((event) => event.start.toUTC().toISO());

		worker.parseSchedule(null, RecipeSchema.ScheduledPlaylistSchema.parse({
			...fixture,
			recurrenceRules: [{ ...daily, times: 2 }],
			recurrenceOverrides: {
				'2024-01-01T10:00:00': { excluded: true },
				'2024-01-04T10:00:00': {},
			},
		}));
		assert.deepEqual(dates(start, start.plus({ days: 5 })), [
			'2024-01-02T10:00:00.000Z',
			'2024-01-04T10:00:00.000Z',
		]);
		assert.deepEqual(dates(start.plus({ days: 5 }), start.plus({ days: 6 })), []);

		worker.parseSchedule(null, {
			...fixture,
			recurrenceRules: [{ ...daily, until: '2024-01-03T10:00:00Z' }],
		});
		assert.deepEqual(dates(start, start.plus({ days: 5 })), [
			'2024-01-01T10:00:00.000Z',
			'2024-01-02T10:00:00.000Z',
			'2024-01-03T10:00:00.000Z',
		]);
		worker.parseSchedule(null, {
			...fixture,
			recurrenceRules: [{ ...daily, until: '2024-01-03T09:59:59Z' }],
		});
		assert.deepEqual(dates(start.plus({ days: 2 }), start.plus({ days: 5 })), []);
		worker.parseSchedule(null, {
			...fixture,
			recurrenceRules: [{ ...daily, until: '2023-12-31T10:00:00Z' }],
		});
		assert.deepEqual(dates(start, start.plus({ days: 5 })), []);

		worker.parseSchedule(null, {
			...fixture,
			start: '2024-03-09T07:30:00Z',
			timeZone: 'America/New_York',
			recurrenceRules: [{ ...daily, times: 2 }],
		});
		const spring = DateTime.fromISO('2024-03-09T00:00:00Z');
		assert.deepEqual(dates(spring, spring.plus({ days: 4 })), [
			'2024-03-09T07:30:00.000Z',
			'2024-03-11T06:30:00.000Z',
		]);

		worker.parseSchedule(null, {
			...fixture,
			start: '2024-11-02T05:30:00Z',
			timeZone: 'America/New_York',
			recurrenceRules: [{ ...daily, until: '2024-11-03T06:15:00Z' }],
		});
		const fall = DateTime.fromISO('2024-11-02T00:00:00Z');
		assert.deepEqual(dates(fall, fall.plus({ days: 4 })), [
			'2024-11-02T05:30:00.000Z',
			'2024-11-03T05:30:00.000Z',
		]);

		for(const rule of [
			{ ...daily, times: 0 },
			{ ...daily, times: 1001 },
			{ ...daily, times: 1.5 },
			{ ...daily, until: 'invalid' },
			{ ...daily, until: '2024-02-31T10:00:00Z' },
			{ ...daily, until: '2024-01-03T10:00:00' },
			{ ...daily, times: 2, until: '2024-01-03T10:00:00Z' },
		]) {
			assert.throws(() => worker.parseSchedule(null, { ...fixture, recurrenceRules: [rule] }));
		}
	});
});
