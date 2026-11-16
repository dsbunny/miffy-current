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

// R1: Exclusions match instants and do not disrupt later occurrences.
describe('recurrence exclusions', () => {
	it('does not contain an excluded initial occurrence, but contains later occurrences', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().times(2);
		recurrence.addDateExclusion(start.setZone('America/New_York'));
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		assert.deepEqual(event.getEvents(start, start.plus({ days: 1 })), []);
		assert.equal(event.contains(start), false);
		assert.equal(event.contains(start.plus({ minutes: 30 })), false);
		assert.equal(event.contains(start.plus({ days: 1, minutes: 30 })), true);
		assert.equal(event.contains(start.plus({ days: 1, hours: 1 })), false);
	});

	it('excludes the same instant in another zone and keeps later occurrences', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().times(3);
		recurrence.addDateExclusion(start.setZone('America/New_York'));
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start, start.plus({ days: 3 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [
			start.plus({ days: 1 }).toMillis(),
			start.plus({ days: 2 }).toMillis(),
		]);
	});

	it('sorts exclusions without mutating them and skips all earlier unmatched dates', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().interval(3);
		for (const days of [6, 2, 1, 3]) {
			recurrence.addDateExclusion(start.plus({ days }).toLocal());
		}
		const originalOrder = recurrence.recurrenceOverrides.map((date) => date.toMillis());
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start, start.plus({ days: 7 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [start.toMillis()]);
		assert.deepEqual(recurrence.recurrenceOverrides.map((date) => date.toMillis()), originalOrder);
	});

	it('keeps later occurrences when all exclusions precede the requested window', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().times(5);
		recurrence.addDateExclusion(start.plus({ days: 1 }).toLocal());
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start.plus({ days: 2 }), start.plus({ days: 5 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [2, 3, 4].map(
			(days) => start.plus({ days }).toMillis(),
		));
	});

	it('distinguishes the two instants with the same wall time during a DST fold', () => {
		const first = DateTime.fromISO('2024-11-03T05:30:00Z', { setZone: true });
		const recurrence = new CalendarRecurrence();
		recurrence.addHourlyRule().times(2);
		recurrence.addDateExclusion(first.setZone('America/New_York'));
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ minutes: 30 }), 2, recurrence);

		const events = event.getEvents(first, first.plus({ hours: 2 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [first.plus({ hours: 1 }).toMillis()]);
	});

	it('excludes duplicate occurrences from multiple rules', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().times(1);
		recurrence.addDailyRule().times(1);
		recurrence.addDateExclusion(start.toLocal());
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start, start.plus({ days: 1 }));

		assert.deepEqual(events, []);
	});
});

// R1: Repeated calendar events.
describe('CalendarEventSeries', () => {
	it('skips nonexistent local recurrences without consuming the count', () => {
		const first = DateTime.fromISO('2024-03-09T02:30:00', { zone: 'America/New_York' });
		const recurrence = new CalendarRecurrence();
		const rule = recurrence.addDailyRule();
		rule.setTimeZone('America/New_York');
		rule.times(2);
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(first, first.plus({ days: 4 }));

		assert.deepEqual(events.map((item) => item.start.toUTC().toISO()), [
			'2024-03-09T07:30:00.000Z',
			'2024-03-11T06:30:00.000Z',
		]);
		assert.deepEqual(
			event.getEvents(first.plus({ days: 2 }), first.plus({ days: 4 })).map((item) => item.start.toUTC().toISO()),
			['2024-03-11T06:30:00.000Z'],
		);
	});

	it('keeps minutely occurrences ordered across a DST gap', () => {
		const first = DateTime.fromISO('2024-03-10T01:59:00', { zone: 'America/New_York' });
		const recurrence = new CalendarRecurrence();
		recurrence.addMinutelyRule().setTimeZone('America/New_York');
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ minutes: 1 }), 2, recurrence);

		const events = event.getEvents(first, first.plus({ minutes: 3 }));

		assert.deepEqual(events.map((item) => item.start.toUTC().toISO()), [
			'2024-03-10T06:59:00.000Z',
			'2024-03-10T07:00:00.000Z',
			'2024-03-10T07:01:00.000Z',
		]);
	});

	it('advances secondly recurrences across a DST gap', { timeout: 10000 }, () => {
		const first = DateTime.fromISO('2024-03-10T01:59:59', { zone: 'America/New_York' });
		const recurrence = new CalendarRecurrence();
		recurrence.addSecondlyRule().setTimeZone('America/New_York');
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ seconds: 1 }), 2, recurrence);

		const events = event.getEvents(first, first.plus({ seconds: 2 }));

		assert.deepEqual(events.map((item) => item.start.toUTC().toISO()), [
			'2024-03-10T06:59:59.000Z',
			'2024-03-10T07:00:00.000Z',
		]);
	});

	it('applies an absolute recurrence limit across a DST fold', () => {
		const first = DateTime.fromISO('2024-11-02T05:30:00Z', { setZone: true });
		const recurrence = new CalendarRecurrence();
		const rule = recurrence.addDailyRule();
		rule.setTimeZone('America/New_York');
		rule.until(DateTime.fromISO('2024-11-03T06:15:00Z'));
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ minutes: 30 }), 2, recurrence);

		const events = event.getEvents(first, first.plus({ days: 3 }));

		assert.deepEqual(events.map((item) => item.start.toUTC().toISO()), [
			'2024-11-02T05:30:00.000Z',
			'2024-11-03T05:30:00.000Z',
		]);
	});

	it('keeps an initial occurrence in the second side of a DST fold', () => {
		const first = DateTime.fromISO('2024-11-03T06:30:00Z').setZone('America/New_York');
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().setTimeZone('America/New_York');
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ minutes: 30 }), 2, recurrence);
		const queryStart = DateTime.fromISO('2024-11-03T06:15:00Z');

		const events = event.getEvents(queryStart, queryStart.plus({ hours: 1 }));

		assert.deepEqual(events.map((item) => item.start.toUTC().toISO()), ['2024-11-03T06:30:00.000Z']);
	});

	it('counts an initial occurrence on the second side of a DST fold', () => {
		const first = DateTime.fromISO('2024-11-03T06:30:00Z').setZone('America/New_York');
		const recurrence = new CalendarRecurrence();
		const rule = recurrence.addDailyRule();
		rule.setTimeZone('America/New_York');
		rule.times(2);
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ minutes: 30 }), 2, recurrence);

		assert.deepEqual(event.getEvents(first.minus({ minutes: 15 }), first.plus({ days: 3 }))
			.map((item) => item.start.toUTC().toISO()), [
			'2024-11-03T06:30:00.000Z',
			'2024-11-04T06:30:00.000Z',
		]);
	});

	it('preserves a finite secondly count across a DST gap', () => {
		const first = DateTime.fromISO('2024-03-10T01:59:59', { zone: 'America/New_York' });
		const recurrence = new CalendarRecurrence();
		const rule = recurrence.addSecondlyRule();
		rule.setTimeZone('America/New_York');
		rule.times(2);
		const event = new CalendarEventSeries('event', null, {}, first, first.plus({ seconds: 1 }), 2, recurrence);

		assert.deepEqual(event.getEvents(first, first.plus({ seconds: 3 }))
			.map((item) => item.start.toUTC().toISO()), [
			'2024-03-10T06:59:59.000Z',
			'2024-03-10T07:00:00.000Z',
		]);
		assert.deepEqual(event.getEvents(first.plus({ seconds: 2 }), first.plus({ seconds: 3 })), []);
	});

	it('exhausts the maximum worker count when queried after its last occurrence', () => {
		const recurrence = new CalendarRecurrence();
		const rule = recurrence.addSecondlyRule();
		rule.setTimeZone('UTC');
		rule.times(1000);
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ seconds: 1 }), 2, recurrence);

		assert.deepEqual(event.getEvents(start.plus({ seconds: 999 }), start.plus({ seconds: 1001 }))
			.map((item) => item.start.toMillis()), [start.plus({ seconds: 999 }).toMillis()]);
		assert.deepEqual(event.getEvents(start.plus({ seconds: 1000 }), start.plus({ seconds: 1001 })), []);
	});

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

	it('does not return an occurrence that starts after the requested range', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().interval(2);
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start, start.plus({ hours: 2 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [start.toMillis()]);
	});

	it('excludes occurrences at the end but keeps occurrences overlapping the start', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule();
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		assert.deepEqual(event.getEvents(start.minus({ hours: 1 }), start), []);
		assert.deepEqual(
			event.getEvents(start.plus({ minutes: 30 }), start.plus({ hours: 2 })).map((item) => item.start.toMillis()),
			[start.toMillis()],
		);
		assert.deepEqual(event.getEvents(start.plus({ hours: 1 }), start.plus({ hours: 2 })), []);
	});

	it('excludes explicit occurrences that ended before the requested range', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDate(start.minus({ days: 2 }));
		recurrence.addDate(start);
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start, start.plus({ hours: 2 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [start.toMillis()]);
	});

	it('includes occurrences in the last millisecond of a day, but not the next day', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule();
		const lastMillisecond = start.endOf('day');
		const event = new CalendarEventSeries(
			'event', null, {}, lastMillisecond, lastMillisecond.plus({ seconds: 1 }), 2, recurrence,
		);

		const events = event.getEventsForDay(start);

		assert.deepEqual(events.map((item) => item.start.toMillis()), [lastMillisecond.toMillis()]);
	});

	it('marks a finite recurrence iterator as done after its last occurrence', () => {
		const recurrence = new CalendarRecurrence();
		const rule = recurrence.addDailyRule();
		rule.times(1);
		const iterator = rule.iterator(start, start.minus({ seconds: 1 }));

		iterator.next();
		iterator.next();

		assert.equal(iterator.done, true);
		assert.equal(iterator.value, undefined);
		iterator.next();
		assert.equal(iterator.done, true);
	});

	it('continues selecting occurrences from other rules after a finite rule is exhausted', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().times(1);
		recurrence.addDailyRule().interval(2);
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start.plus({ days: 1 }), start.plus({ days: 3 }));

		assert.deepEqual(events.map((item) => item.start.toMillis()), [start.plus({ days: 2 }).toMillis()]);
	});

	it('handles an excluded final occurrence of a finite rule', () => {
		const recurrence = new CalendarRecurrence();
		recurrence.addDailyRule().times(1);
		recurrence.addDateExclusion(start.toLocal());
		const event = new CalendarEventSeries('event', null, {}, start, start.plus({ hours: 1 }), 2, recurrence);

		const events = event.getEvents(start, start.plus({ days: 2 }));

		assert.deepEqual(events, []);
	});
});
