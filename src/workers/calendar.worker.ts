// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import 'core-js/stable';
import * as Comlink from 'comlink';
import { DateTime, Duration } from 'luxon';
import { RecipeSchema } from '@dsbunny/recipe-schema';
import {
	CalendarEvent,
	CalendarEventSeries,
	CalendarRecurrence,
	CalendarWorker,
} from '../lib/occurency.js';
import { parseRecurrenceOverrides } from '../lib/recurrence-overrides.js';

console.info('CALENDAR: WebWorker started.');
let calendar_event: CalendarEvent<RecipeSchema.Playlist> | undefined;
let override_events: CalendarEvent<RecipeSchema.Playlist>[] = [];

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
	parseSchedule: parseScheduledPlaylist,
	getEvents,
	prefetchEvents,
} satisfies CalendarWorker);

// Create a CalendarEvent or CalendarEventSeries from JSON schedule.
function parseScheduledPlaylist(
	parentId: string | null,
	json: RecipeSchema.ScheduledPlaylist
) {
	if(json['@type'] !== 'ScheduledPlaylist') {
		console.warn(`CALENDAR: @type is not ScheduledPlaylist (${json['@type']})`, parentId, json);
		throw new Error('Invalid @type in schedule.');
	}
	console.log('CALENDAR: json', json);
	const startTime = DateTime.fromISO(json.start, { zone: json.timeZone });
	const duration = Duration.fromISO(json.duration);
	if(!startTime.isValid || !duration.isValid || duration.toMillis() < 0) {
		throw new Error('Invalid schedule start, time zone or duration.');
	}
	const endTime = startTime.plus(duration);
	const overrides = parseRecurrenceOverrides(json);
	const nextOverrides = overrides.flatMap(({ event }) => event === null ? [] : [
		new CalendarEvent(json.scheduled_playlist_id, parentId, event.playlist,
			event.start, event.end, event.priority),
	]);
	let nextEvent: CalendarEvent<RecipeSchema.Playlist> | undefined;
	if(json.recurrenceRules?.length) {
		const recurrence = new CalendarRecurrence();
		for(const rule of json.recurrenceRules) {
			let recurrenceRule;
			switch(rule.frequency) {
			case 'yearly':
				recurrenceRule = recurrence.addYearlyRule();
				break;
			case 'monthly':
				recurrenceRule = recurrence.addMonthlyRule();
				break;
			case 'weekly':
				recurrenceRule = recurrence.addWeeklyRule();
				break;
			case 'daily':
				recurrenceRule = recurrence.addDailyRule();
				break;
			case 'hourly':
				recurrenceRule = recurrence.addHourlyRule();
				break;
			case 'minutely':
				recurrenceRule = recurrence.addMinutelyRule();
				break;
			case 'secondly':
				recurrenceRule = recurrence.addSecondlyRule();
				break;
			default:
				throw new Error(`Invalid recurrence frequency: ${rule.frequency}.`);
			}
			if(rule.interval !== undefined) {
				recurrenceRule.interval(rule.interval);
			}
			if(rule.times !== undefined && rule.until !== undefined) {
				throw new Error('Recurrence rule cannot specify both times and until.');
			}
			if(rule.times !== undefined) {
				if(!RecipeSchema.RecurrenceRuleSchema.shape.times.safeParse(rule.times).success) {
					throw new Error('Invalid recurrence times.');
				}
				recurrenceRule.times(rule.times);
			}
			if(rule.until !== undefined) {
				if(!RecipeSchema.RecurrenceRuleSchema.shape.until.safeParse(rule.until).success) {
					throw new Error('Invalid recurrence until.');
				}
				const until = DateTime.fromISO(rule.until, { setZone: true });
				if(!until.isValid) {
					throw new Error('Invalid recurrence until.');
				}
				recurrenceRule.until(until);
			}
			const timeZone = rule.timeZone ?? json.timeZone;
			if(!startTime.setZone(timeZone).isValid) {
				throw new Error(`Invalid recurrence time zone: ${timeZone}.`);
			}
			recurrenceRule.setTimeZone(timeZone);
		}
		for(const override of overrides) {
			recurrence.addDateExclusion(override.recurrenceId);
		}
		nextEvent = new CalendarEventSeries(
			json.scheduled_playlist_id,
			parentId,
			json.playlist,
			startTime,
			endTime,
			json.priority,
			recurrence
		);
	} else if(!overrides.some((override) => override.recurrenceId.toMillis() === startTime.toMillis())) {
		nextEvent = new CalendarEvent(
			json.scheduled_playlist_id,
			parentId,
			json.playlist,
			startTime,
			endTime,
			json.priority
		);
	}
	calendar_event = nextEvent;
	override_events = nextOverrides;
}

// Find the events that exist between startTime and endTime for the parsed
// schedule.
function getEvents(
	startTime: DateTime,
	endTime: DateTime
): CalendarEvent<RecipeSchema.Playlist>[] {
//	  console.log(`getEvents(${startTime.toISO()}, ${endTime.toISO()})`);
	try {
		const events = calendar_event?.getEvents(startTime, endTime) ?? [];
		for(const event of override_events) {
			events.push(...event.getEvents(startTime, endTime));
		}
		events.sort((a, b) => a.start.toMillis() - b.start.toMillis());
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
