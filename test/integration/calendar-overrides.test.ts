import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DateTime } from 'luxon';
import { RecipeSchema } from '@dsbunny/recipe-schema';
import type { CalendarWorker } from '../../src/lib/occurency.js';

// R1, R3: JSCalendar recurrence overrides at the worker boundary.
describe('calendar recurrence overrides', () => {
	it('applies exclusions, additional dates and patches to a validated schedule', async (t) => {
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
		const schedule = RecipeSchema.ScheduledPlaylistSchema.parse({
			...fixture,
			recurrenceOverrides: {
				'2024-01-05T10:00:00': { start: '2024-01-08T10:00:00' },
				'2024-01-01T10:00:00': { excluded: true },
				'2024-01-02T10:00:00': {},
				'2024-01-03T10:00:00': { priority: 3, duration: 'PT30M', 'playlist/name': 'Override' },
				'2024-01-07T10:00:00': {},
			},
		});

		worker.parseSchedule('parent', schedule);
		const events = worker.getEvents(start, start.plus({ days: 8 }));

		assert.deepEqual(events.map((event) => event.start.toUTC().toISO()), [
			'2024-01-02T10:00:00.000Z',
			'2024-01-03T10:00:00.000Z',
			'2024-01-07T10:00:00.000Z',
			'2024-01-08T10:00:00.000Z',
		]);
		assert.equal(events[1].priority, 3);
		assert.equal(events[1].duration.toMillis(), 30 * 60 * 1000);
		assert.equal(events[1].data.name, 'Override');
		assert.equal(events[1].parentId, 'parent');
		assert.equal(events[2].data.name, fixture.playlist.name);
		assert.equal(fixture.playlist.name, 'Test playlist');

		const { recurrenceRules: _, ...single } = fixture;
		worker.parseSchedule(null, {
			...single,
			recurrenceOverrides: {
				'2024-01-01T10:00:00': { excluded: true },
				'2023-12-31T10:00:00': {},
			},
		});
		assert.deepEqual(
			worker.getEvents(start.minus({ days: 2 }), start.plus({ days: 2 })).map((event) => event.start.toUTC().toISO()),
			['2023-12-31T10:00:00.000Z'],
		);

		worker.parseSchedule(null, {
			...single,
			start: '2024-11-03T05:30:00Z',
			timeZone: 'America/New_York',
			recurrenceOverrides: {
				'2024-11-03T01:30:00': { excluded: true },
				'2024-11-04T01:30:00': {},
			},
		});
		const fold = DateTime.fromISO('2024-11-03T05:00:00Z');
		assert.deepEqual(
			worker.getEvents(fold, fold.plus({ days: 2 })).map((event) => event.start.toUTC().toISO()),
			['2024-11-04T06:30:00.000Z'],
		);

		worker.parseSchedule(null, {
			...fixture,
			start: '2024-03-09T15:00:00Z',
			timeZone: 'America/New_York',
			recurrenceRules: [{ '@type': 'RecurrenceRule', frequency: 'daily' }],
			recurrenceOverrides: { '2024-03-10T10:00:00': { excluded: true } },
		});
		const spring = DateTime.fromISO('2024-03-09T00:00:00Z');
		assert.deepEqual(
			worker.getEvents(spring, spring.plus({ days: 3 })).map((event) => event.start.toUTC().toISO()),
			['2024-03-09T15:00:00.000Z', '2024-03-11T14:00:00.000Z'],
		);

		worker.parseSchedule(null, {
			...single,
			playlist: { ...fixture.playlist, tags: ['before'] },
			recurrenceOverrides: {
				'2024-01-02T10:00:00': { 'playlist/tags/0': 'after' },
				'2024-03-10T02:30:00': { timeZone: 'America/New_York' },
			},
		});
		const patchedEvents = worker.getEvents(start, start.plus({ days: 2 }));
		assert.deepEqual(patchedEvents[0].data.tags, ['before']);
		assert.deepEqual(patchedEvents[1].data.tags, ['after']);
		const gap = DateTime.fromISO('2024-03-10T07:00:00Z');
		assert.deepEqual(
			worker.getEvents(gap, gap.plus({ hours: 2 })).map((event) => event.start.toUTC().toISO()),
			['2024-03-10T07:30:00.000Z'],
		);

		const invalidPatches: NonNullable<RecipeSchema.ScheduledPlaylist['recurrenceOverrides']>[string][] = [
			{ excluded: true, priority: 3 },
			{ excluded: false },
			{ priority: 'wrong' },
			{ '@type': 'Event' },
			{ playlist: {}, 'playlist/name': 'conflict' },
			{ 'playlist/missing/name': 'invalid' },
			{ 'playlist/unrecognized': 'invalid' },
			{ 'playlist/tags/0': 'invalid' },
			{ 'playlist/__proto__/polluted': true },
			{ duration: 'invalid' },
			{ timeZone: 'Invalid/Zone' },
			{ start: '2024-01-03T10:00:00-05:00' },
		];
		for(const patch of invalidPatches) {
			assert.throws(
				() => worker.parseSchedule(null, { ...fixture, recurrenceOverrides: { '2024-01-03T10:00:00': patch } }),
			);
		}
		assert.deepEqual(worker.getEvents(start, start.plus({ days: 2 })).map((event) => event.data.tags), [
			['before'], ['after'],
		]);
		assert.throws(() => worker.parseSchedule(null, {
			...fixture,
			recurrenceOverrides: { '2024-01-01T10:00:00Z': { excluded: true } },
		}), /Invalid recurrence override ID/);
	});
});
