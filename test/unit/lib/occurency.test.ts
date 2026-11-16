import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { CalendarEvent, CalendarEventSeries, CalendarRecurrence } from '../../../src/lib/occurency.js';

const start = DateTime.fromISO('2024-01-01T10:00:00Z', { setZone: true });

// R1: Calendar intervals and serialization.
describe('CalendarEvent', () => {
	it('includes the start but excludes the end of an event', () => {
		const event = new CalendarEvent('event', null, { name: 'image' }, start, start.plus({ hours: 1 }), 2);

		assert.equal(event.contains(start), true);
		assert.equal(event.contains(start.plus({ minutes: 59 })), true);
		assert.equal(event.contains(start.plus({ hours: 1 })), false);
		assert.equal(event.contains(start.minus({ milliseconds: 1 })), false);
	});

	it('returns only events overlapping the requested interval', () => {
		const event = new CalendarEvent('event', null, {}, start, start.plus({ hours: 1 }), 2);

		assert.deepEqual(event.getEvents(start.plus({ minutes: 30 }), start.plus({ hours: 2 })), [event]);
		assert.deepEqual(event.getEvents(start.plus({ hours: 1 }), start.plus({ hours: 2 })), []);
		assert.deepEqual(event.getEvents(start.minus({ hours: 1 }), start), []);
	});

	it('round trips the event including parent, duration, priority and payload', () => {
		const event = new CalendarEvent('event', 'parent', { name: 'image' }, start, start.plus({ hours: 1 }), 2);

		const restored = CalendarEvent.fromJSON(event.toJSON());

		assert.equal(restored.start.toMillis(), event.start.toMillis());
		assert.equal(restored.end.toMillis(), event.end.toMillis());
		assert.equal(restored.parentId, event.parentId);
		assert.equal(restored.priority, event.priority);
		assert.deepEqual(restored.data, event.data);
	});
});

// R1: Repeated calendar events.
describe('CalendarEventSeries', () => {
	it('honors an interval between daily occurrences', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().interval(2);
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		assert.equal(event.contains(start.minus({ milliseconds: 1 })), false);
		assert.equal(event.contains(start.plus({ minutes: 1 })), true);
		assert.equal(event.contains(start.plus({ days: 1, minutes: 1 })), false);
		assert.equal(event.contains(start.plus({ days: 2, minutes: 1 })), true);
	});

	it('round trips recurrence rules and exclusions', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addWeeklyRule().interval(2);
		recurrence.addDateExclusion(start.plus({ days: 14 }));

		const restored = CalendarRecurrence.fromJSON(recurrence.toJSON());

		assert.deepEqual(restored.toJSON().recurrenceRules, recurrence.toJSON().recurrenceRules);
		assert.equal(restored.excluded, true);
		assert.equal(restored.recurrenceOverrides[0].toMillis(), start.plus({ days: 14 }).toMillis());
	});

	it('does not return an occurrence that starts after the requested range', {
		todo: 'CalendarEventSeries currently includes the next out-of-range occurrence',
	}, () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().interval(2);
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start, start.plus({ hours: 2 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [start.toMillis()]);
	});

	it('marks a finite recurrence iterator as done after its last occurrence', {
		todo: 'CalendarRecurrence currently leaves exhausted iterators unfinished',
	}, () => {
		const recurrence = new CalendarRecurrence();
		const rule = recurrence.addDailyRule();
		rule.times(1);
		const iterator = rule.iterator(start, start.minus({ seconds: 1 }));

		iterator.next();
		iterator.next();

		assert.equal(iterator.done, true);
	});
});
