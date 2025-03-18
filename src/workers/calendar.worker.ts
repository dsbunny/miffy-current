// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import '@ungap/global-this';
import * as Comlink from 'comlink';
import { DateTime, Duration } from 'luxon';
import { CalendarEvent, CalendarEventSeries, CalendarRecurrence } from '../lib/occurency.js';

console.info('CALENDAR: WebWorker started.');
let calendar_event: CalendarEvent<any> | undefined;

// Certain objects need special attention to transfer over "Comlink",
// Luxon's DateTime is coded in milliseconds, ⚠️ losing timezone.
const DateTimeHandler: Comlink.TransferHandler<DateTime, number> = {
	canHandle: (val): val is DateTime => val instanceof DateTime,
	serialize: (val: DateTime) => {
		return [val.toMillis(), []];
	},
	deserialize: (num) => DateTime.fromMillis(num),
};
// CalendarEvent and CalendarEvent[] are flattened into JSON due to many Luxon
// DateTime instances within.
const CalendarEventHandler: Comlink.TransferHandler<CalendarEvent<any>, object> = {
	canHandle: (val): val is CalendarEvent<any> => val instanceof CalendarEvent,
	serialize: (val: CalendarEvent<any>) => {
		return [val.toJSON(), []];
	},
	deserialize: (obj) => CalendarEvent.fromJSON(obj),
};
const CalendarEventArrayHandler: Comlink.TransferHandler<CalendarEvent<any>[], object[]> = {
	canHandle: (val): val is CalendarEvent<any>[] =>
		Array.isArray(val) && val.every(x => x instanceof CalendarEvent),
	serialize: (val: CalendarEvent<any>[]) => {
		return [val.map(x => x.toJSON()), []];
	},
	deserialize: (obj: any[]) => obj.map(x => CalendarEvent.fromJSON(x)),
};
Comlink.transferHandlers.set("DATETIME", DateTimeHandler);
Comlink.transferHandlers.set("CALENDAREVENT", CalendarEventHandler);
Comlink.transferHandlers.set("CALENDAREVENTARRAY", CalendarEventArrayHandler);

// The APIs exposed to the caller.
Comlink.expose({
	parseSchedule,
	getEvents,
	prefetchEvents,
});

// Create a CalendarEvent or CalendarEventSeries from JSON schedule.
function parseSchedule(
	parentId: string | null,
	json: any
) {
	if(json['@type'] !== 'Event') {
		console.warn(`CALENDAR: @type is not Event (${json['@type']})`, parentId, json);
		throw new Error('Invalid @type in schedule.');
	}
	console.log('CALENDAR: json', json);
	const startTime = DateTime.fromISO(json.start, { zone: json.timeZone });
	const endTime = startTime.plus(Duration.fromISO(json.duration));
	if('recurrenceRules' in json) {
		const recurrence = new CalendarRecurrence();
		for(const rule of json.recurrenceRules) {
			switch(rule.frequency) {
			case 'yearly':
				if('interval' in rule) {
					recurrence.addYearlyRule().interval(rule.interval);
				} else {
					recurrence.addYearlyRule();
				}
				break;
			case 'monthly':
				if('interval' in rule) {
					recurrence.addMonthlyRule().interval(rule.interval);
				} else {
					recurrence.addMonthlyRule();
				}
				break;
			case 'weekly':
				if('interval' in rule) {
					recurrence.addWeeklyRule().interval(rule.interval);
				} else {
					recurrence.addWeeklyRule();
				}
				break;
			case 'daily':
				if('interval' in rule) {
					recurrence.addDailyRule().interval(rule.interval);
				} else {
					recurrence.addDailyRule();
				}
				break;
			case 'hourly':
				if('interval' in rule) {
					recurrence.addHourlyRule().interval(rule.interval);
				} else {
					recurrence.addHourlyRule();
				}
				break;
			case 'minutely':
				if('interval' in rule) {
					recurrence.addMinutelyRule().interval(rule.interval);
				} else {
					recurrence.addMinutelyRule();
				}
				break;
			case 'secondly':
				if('interval' in rule) {
					recurrence.addSecondlyRule().interval(rule.interval);
				} else {
					recurrence.addSecondlyRule();
				}
				break;
			default:
				break;
			}
		}
		calendar_event = new CalendarEventSeries(
			json.id,
			parentId,
			json.playlist,
			startTime,
			endTime,
			json.priority,
			recurrence
		);
	} else {
		calendar_event = new CalendarEvent(
			json.id,
			parentId,
			json.playlist,
			startTime,
			endTime,
			json.priority
		);
	}
}

// Find the events that exist between startTime and endTime for the parsed
// schedule.
function getEvents(
	startTime: DateTime,
	endTime: DateTime
): CalendarEvent<any>[] {
//	  console.log(`getEvents(${startTime.toISO()}, ${endTime.toISO()})`);
	if(typeof calendar_event === "undefined") {
		return [];
	}
	try {
		const events = calendar_event.getEvents(startTime, endTime);
		return events;
	} catch(ex) {
		console.error(ex);
	}
	return [];
}

// Explicitly not to return a value;
function prefetchEvents(
	startTime: DateTime,
	endTime: DateTime
) {
	getEvents(startTime, endTime);
}
