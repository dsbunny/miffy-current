// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import { DateTime } from 'luxon';
import { CalendarEvent, CalendarEventSeries, CalendarRecurrence } from '../lib/occurency';
// FIXME: VS Code cannot find 'jest' globals.
import { describe, expect, test } from '@jest/globals';

describe('CalendarEvent', () => {
	const startTime = DateTime.local();
	const endTime = startTime.plus({ 'days': 1 });
	const insideTime = startTime.plus({ 'hours' : 12 });
	const outsideTime = startTime.minus({ 'hours' : 12 });
	const defaultPriority = 0;
	const highPriority = 9;
	test('Set priority', () => {
		const calendar_event = new CalendarEvent('id', null, 'data', startTime, endTime, defaultPriority);
		expect(calendar_event.priority).toBe(defaultPriority);
		calendar_event.setPriority(highPriority);
		expect(calendar_event.priority).toBe(highPriority);
	});
	test('Contains', () => {
		const calendar_event = new CalendarEvent('id', null, 'data', startTime, endTime, defaultPriority);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(outsideTime)).toBe(false);
	});
	test('Get events', () => {
		const calendar_event = new CalendarEvent('id', null, 'data', startTime, endTime, defaultPriority);
		const inside_list = calendar_event.getEvents(insideTime, insideTime);
		expect(inside_list).toEqual([ calendar_event ]);
		const outside_list = calendar_event.getEvents(outsideTime, outsideTime);
		expect(outside_list).toHaveLength(0);
	});
});

describe('CalendarRecurrence', () => {
	const interval = 3;
	test('Add daily rule', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addDailyRule();
		const json = calendar_recurrence.toJSON();
		expect(json.recurrenceRules).toHaveLength(1);
		expect(json.recurrenceRules[0].frequency).toBe('daily');
		expect(json.recurrenceRules[0].interval).toBe(1);
	});
	test('Add interval daily rule', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addDailyRule().interval(interval);
		const json = calendar_recurrence.toJSON();
		expect(json.recurrenceRules).toHaveLength(1);
		expect(json.recurrenceRules[0].frequency).toBe('daily');
		expect(json.recurrenceRules[0].interval).toBe(interval);
	});
	test('Add secondly rule', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addSecondlyRule();
		const json = calendar_recurrence.toJSON();
		expect(json.recurrenceRules).toHaveLength(1);
		expect(json.recurrenceRules[0].frequency).toBe('secondly');
		expect(json.recurrenceRules[0].interval).toBe(1);
	});
	test('Add interval secondly rule', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addSecondlyRule().interval(interval);
		const json = calendar_recurrence.toJSON();
		expect(json.recurrenceRules).toHaveLength(1);
		expect(json.recurrenceRules[0].frequency).toBe('secondly');
		expect(json.recurrenceRules[0].interval).toBe(interval);
	});
});

describe('CalendarEventSeries', () => {
	const startTime = DateTime.local();
	const endTime = startTime.plus({ 'days': 1 });
	const insideTime = startTime.plus({ 'hours' : 12 });
	const outsideTime = startTime.minus({ 'hours' : 12 });
	const interval = 3;
	const defaultPriority = 0;
	// Dailys
	test('Contains daily first occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addDailyRule();
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(outsideTime)).toBe(false);
	});
	test('Contains daily second occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addDailyRule();
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(endTime)).toBe(true);
		expect(calendar_event.contains(startTime.plus({ 'hours' : 36 }))).toBe(true);
	});
	test('Contains daily interval second occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addDailyRule().interval(interval);
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(endTime)).toBe(false);
		expect(calendar_event.contains(startTime.plus({ 'days' : interval }))).toBe(true);
	});
	test('Contains daily short ocurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addDailyRule();
		const endTime = startTime.plus({ 'seconds': 10 });
		const insideTime = startTime.plus({ 'seconds': 2 });
		const outsideTime = startTime.plus({ 'seconds' : 12 });
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(outsideTime)).toBe(false);
	});
	// Hourlys (smaller)
	test('Contains hourly first occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addHourlyRule();
		const endTime = startTime.plus({ 'seconds': 10 });
		const insideTime = startTime.plus({ 'seconds': 2 });
		const outsideTime = startTime.plus({ 'seconds' : 12 });
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(outsideTime)).toBe(false);
	});
	test('Contains hourly second occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addHourlyRule();
		const endTime = startTime.plus({ 'seconds': 10 });
		const insideTime = startTime.plus({ 'hours': 1, 'seconds': 2 });
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(startTime.plus({ 'seconds' : 12 }))).toBe(false);
		expect(calendar_event.contains(startTime.plus({ 'hours': 1, 'seconds' : 12 }))).toBe(false);
	});
	test('Contains hourly interval occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addHourlyRule().interval(interval);
		const endTime = startTime.plus({ 'seconds': 10 });
		const insideTime = startTime.plus({ 'hours': interval, 'seconds': 2 });
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(startTime.plus({ 'seconds' : 12 }))).toBe(false);
		expect(calendar_event.contains(startTime.plus({ 'hours': 1, 'seconds' : 2 }))).toBe(false);
	});
	// Weeklys (larger)
	test('Contains weekly first occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addWeeklyRule();
		const endTime = startTime.plus({ 'seconds': 10 });
		const insideTime = startTime.plus({ 'seconds': 2 });
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(startTime.plus({ 'seconds' : 12 }))).toBe(false);
		expect(calendar_event.contains(startTime.plus({ 'days': 1, 'seconds' : 12 }))).toBe(false);
	});
	test('Contains weekly second occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addWeeklyRule();
		const endTime = startTime.plus({ 'seconds': 10 });
		const insideTime = startTime.plus({ 'weeks': 1, 'seconds': 2 });
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(startTime.plus({ 'seconds' : 12 }))).toBe(false);
		expect(calendar_event.contains(startTime.plus({ 'weeks': 1, 'seconds' : 12 }))).toBe(false);
	});
	test('Contains weekly interval occurrence', () => {
		const calendar_recurrence = new CalendarRecurrence();
		calendar_recurrence.addWeeklyRule().interval(interval);
		const endTime = startTime.plus({ 'seconds': 10 });
		const insideTime = startTime.plus({ 'weeks': interval, 'seconds': 2 });
		const calendar_event = new CalendarEventSeries<string>('id', null, 'data', startTime, endTime, defaultPriority, calendar_recurrence);
		expect(calendar_event.contains(insideTime)).toBe(true);
		expect(calendar_event.contains(startTime.plus({ 'seconds' : 12 }))).toBe(false);
		expect(calendar_event.contains(startTime.plus({ 'weeks': 1, 'seconds' : 2 }))).toBe(false);
	});
});
