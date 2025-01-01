// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Interface for occurances.

import { DateTime, Duration, Interval } from 'luxon';
//import { DateTime, Duration, Interval } from '../../external/node_modules/luxon/build/es6/luxon.js';
import { RRule, Frequency, Weekday } from 'rrule';

export interface CalendarWorker {
	parseSchedule(parentId: string | null, json: any): void;
	getEvents(startTime: DateTime, endTime: DateTime): CalendarEvent<any>[];
	prefetchEvents(startTime: DateTime, endTime: DateTime): void;
}

// REF: https://hg.mozilla.org/comm-central/file/d18e33f0603fa1b1f240424041564672869076ca/calendar/base/modules/Ical.jsm#l214
// Find the index for insertion using binary search.
function findIndex(
	list: any[],
	value: any,
	cmp: (a: any, b: any) => number
): number {
	if(!list.length) {
		return 0;
	}

	let low = 0, high = list.length - 1, mid = 0, cmpval = 0;

	while(low <= high) {
		mid = low + Math.floor((high - low) / 2);
		cmpval = cmp(value, list[mid]);

		if(cmpval < 0)
			high = mid - 1;
		else if(cmpval > 0)
			low = mid + 1;
		else
			break;
	}

	if (cmpval < 0)
		return mid; // insertion is displacing, so use mid outright.
	else if (cmpval > 0)
		return mid + 1;
	return mid;
}

function compareDateTime(
	a: DateTime,
	b: DateTime
): number {
	return a.toMillis() - b.toMillis();
}

function RRuleFrequencyFromString(
	frequency: string
): Frequency {
	switch(frequency) {
	case 'yearly': return RRule.YEARLY;
	case 'monthly': return RRule.MONTHLY;
	case 'weekly': return RRule.WEEKLY;
	case 'daily': return RRule.DAILY;
	case 'hourly': return RRule.HOURLY;
	case 'minutely': return RRule.MINUTELY;
	case 'secondly': return RRule.SECONDLY;
	default: throw new Error('invalid frequency.');
	}
};
function RRuleWeekDayFromString(
	day: string,
	nthOfPeriod: number = 0,
): Weekday {
	switch(day) {
	case 'mo': return nthOfPeriod ? RRule.MO.nth(nthOfPeriod) : RRule.MO;
	case 'tu': return nthOfPeriod ? RRule.TU.nth(nthOfPeriod) : RRule.TU;
	case 'we': return nthOfPeriod ? RRule.WE.nth(nthOfPeriod) : RRule.WE;
	case 'th': return nthOfPeriod ? RRule.TH.nth(nthOfPeriod) : RRule.TH;
	case 'fr': return nthOfPeriod ? RRule.FR.nth(nthOfPeriod) : RRule.FR;
	case 'sa': return nthOfPeriod ? RRule.SA.nth(nthOfPeriod) : RRule.SA;
	case 'su': return nthOfPeriod ? RRule.SU.nth(nthOfPeriod) : RRule.SU;
	default: throw new Error('invalid weekday.');
	}
}

export class CalendarEvent<T> {
	id: string;
	parentId: string | null = null;
	data: T;
	start: DateTime;
	end: DateTime;
	duration: Duration;
//	updated: DateTime;
//	sequence: number;
	priority: number;
	protected _interval: Interval;

	constructor(
		id: string,
		parentId: string | null,
		data: T,
		startTime: DateTime,
		endTime: DateTime,
		priority: number,
	) {
		this.id = id;
		this.parentId = parentId;
		this.data = data;
		this.start = startTime;
		this.end = endTime;
		const interval = Interval.fromDateTimes(startTime, endTime);
		this.duration = interval.toDuration();
		this.priority = priority;
		this._interval = interval;
	}

	get shortId() { return this.id.substring(0, 7); }

	setPriority(
		priority: number
	): CalendarEvent<T> {
		this.priority = priority;
		return this;
	}

	contains(
		dateTime: DateTime
	): boolean {
		return this._interval.contains(dateTime);
	}

	getEvents(
		startTime: DateTime,
		endTime: DateTime
	): CalendarEvent<T>[] {
		const interval = Interval.fromDateTimes(startTime, endTime);
		return interval.overlaps(this._interval)
			? [this] : [];
	}

	getEventsForDay(
		date: DateTime
	): CalendarEvent<T>[] {
		const startTime = date.startOf('day');
		const endTime = date.endOf('day');
		const interval = Interval.fromDateTimes(startTime, endTime);
		return interval.overlaps(this._interval)
			? [this] : [];
	}

	get interval() { return this._interval; }

	toJSON(): any {
		return {
			id: this.id,
			parentId: this.parentId,
			start: this.start.toISO(),
			duration: this.duration.toISO(),
			priority: this.priority,
			data: this.data,
		};
	}

	static fromJSON<T>(
		json: any
	): CalendarEvent<T> {
		const startTime = DateTime.fromISO(json.start);
		const endTime = startTime.plus(Duration.fromISO(json.duration));
		const event = new CalendarEvent<T>(json.id,
			json.parentId,
			json.data,
			startTime,
			endTime,
			json.priority);
		return event;
	}
}

export class CalendarEventSeries<T> extends CalendarEvent<T> {
	recurrence: CalendarRecurrence;

	constructor(
		id: string,
		parentId: string | null,
		data: T,
		startTime: DateTime,
		endTime: DateTime,
		priority: number,
		recurrence: CalendarRecurrence,
	) {
		super(id, parentId, data, startTime, endTime, priority);
		this.recurrence = recurrence;
	}

	override contains(
		dateTime: DateTime
	): boolean {
//console.log('contains', dateTime.toISO());
		if(dateTime < this.start) {
			return false;
		}
		if(dateTime < this.end) {
			return true;
		}
		const events = this.getEventsForDay(dateTime);
//let i = 1;
		for(const event of events) {
//console.log(i++, event.toJSON());
			if(event.contains(dateTime)) {
				return true;
			}
		}
		return false;
	}

	override getEvents(
		startTime: DateTime,
		endTime: DateTime
	): CalendarEvent<T>[] {
		//console.log(`getEvents(${startTime.toISO()},${endTime.toISO()})`);
		const events: CalendarEvent<T>[] = [];
		const iterator = (dateTime: DateTime) => {
			const event = new CalendarEvent<T>(
				this.id,
				this.parentId,
				this.data,
				dateTime,
				dateTime.plus(this.duration),
				this.priority
			);
			events.push(event);
		};
		this._getEvents(startTime,
			endTime,
			iterator);
//console.log("events =", JSON.stringify(events));
		return events;
	}

	override getEventsForDay(
		date: DateTime
	): CalendarEvent<T>[] {
		console.log(`getEventsForDay(${date.toISO()})`);
		const events: CalendarEvent<T>[] = [];
		const iterator = (dateTime: DateTime) => {
			const event = new CalendarEvent<T>(
				this.id,
				this.parentId,
				this.data,
				dateTime,
				dateTime.plus(this.duration),
				this.priority
			);
			events.push(event);
		};
		this._getEvents(date.startOf('day'),
			date.endOf('day'),
			iterator);
//console.log("events =", JSON.stringify(events));
		return events;
	}

	// This method returns events that start during the given time range, end
	// during the time range, or encompass the time range.
	// EXRULE is deprecated, so only process RDATE, RRULE, and EXDATE.
	protected _getEvents(
		start: DateTime,
		end: DateTime,
		iterator: (dateTime: DateTime) => void
	): void {
		const ruleIterators: { next: () => void, value: any, done: boolean }[] = [];
		let ruleDateIndex = 0;
		let exDateIndex = 0;
		let exDate: DateTime | null = null;
		let ruleDate: DateTime | null = null;
		const from = start.minus(this.duration);
		let last = from;
		// RDATE
//const t0 = performance.now();
		const ruleDates = this.recurrence.recurrenceOverrides;
		if(!this.recurrence.excluded
			&& ruleDates.length !== 0)
		{
			if(ruleDates[0] < last) {
				ruleDateIndex = 0;
				last = ruleDates[0];
			} else {
				ruleDateIndex = findIndex(ruleDates, last, compareDateTime);
			}
			ruleDate = ruleDates[ruleDateIndex];
		}
//const t1 = performance.now();
//console.log('RDATE', (t1 - t0) / 1000);
		// RRULE
		for(const rule of this.recurrence.recurrenceRules) {
			const it = rule.iterator(this.start, from);
			ruleIterators.push(it);
			it.next();  // find first value.
		}
//const t2 = performance.now();
//console.log('RRULE', (t2 - t1) / 1000);
		// EXDATE
		if(this.recurrence.excluded
			&& ruleDates.length !== 0)
		{
			exDateIndex = findIndex(ruleDates, last, compareDateTime);
			exDate = ruleDates[exDateIndex];
		}
//const t3 = performance.now();
//console.log('EXDATE', (t3 - t2) / 1000);
		// Occurrences.
		const findNextRuleIterator = () => {
			if(ruleIterators.length === 0) {
				return null;
			}
			let nextIterator: any = null;
			for(const it of ruleIterators) {
				if(it.done) {
					continue;
				}
				if(nextIterator === null
					|| it.value < nextIterator.value)
				{
					nextIterator = it;
				}
			}
			return nextIterator;
		};
		const getNextRuleDay = () => {
			ruleDate = ruleDates[++ruleDateIndex];
		};
		const getNextExDay = () => {
			exDate = ruleDates[++exDateIndex];
		};
		const getNextOccurrence = (): DateTime | null => {
			while(true) {
				let next = ruleDate;
				const it = findNextRuleIterator();
				if(next === null && it === null) {
//console.log("no matches");
					break;
				}
				let has_changed = false;
				if(next === null
					|| (it !== null
						&& it.value < next))
				{
//console.log("have rrule ...");
					has_changed = true;
					// @ts-ignore: Object is possibly 'null'.
					next = it.value;
//console.log("value:", next?.toISO());
					// @ts-ignore: Object is possibly 'null'.
					it.next();
				}
				if(!has_changed) {
					getNextRuleDay();
				}
				// @ts-ignore: Type 'null' is not assignable to type 'DateTime'.
				last = next;
				if(exDate !== null) {
					if(last > exDate) {
						getNextExDay();
					} else if(last.equals(exDate)) {
						continue;
					}
				}
				return last;
			}
			return null;
		};
//console.log("loop start", last.toISO(), end.toISO());
		while(last < end) {
			const occ = getNextOccurrence();
//console.log("occurrence:", occ && occ.toISO());
			if(!occ) break;
			iterator(occ);
		}
//console.log("loop end");
//const t4 = performance.now();
//console.log('occurrences', (t4 - t3) / 1000);
	}

	override toJSON(): any {
		return {
			id: this.id,
			start: this.start.toISO(),
			duration: this.duration.toISO(),
			priority: this.priority,
			recurrence: this.recurrence.toJSON(),
		};
	}

	static override fromJSON<T>(
		json: any
	): CalendarEventSeries<T> {
		const startTime = DateTime.fromISO(json.start);
		const endTime = startTime.plus(Duration.fromISO(json.duration));
		const recurrence = CalendarRecurrence.fromJSON(json.recurrence);
		const event = new CalendarEventSeries<T>(
			json.id,
			json.parentId,
			json.data,
			startTime,
			endTime,
			json.priority,
			recurrence
		);
		return event;
	}
}

export class CalendarRecurrence {
	recurrenceRules: RecurrenceRule[];
	recurrenceOverrides: DateTime[];
	excluded: boolean;

	constructor() {
		this.recurrenceRules = [];
		this.recurrenceOverrides = [];
		this.excluded = false;
	}

	addDailyRule(): RecurrenceRule {
		const rule = new RecurrenceRule('daily');
		this.recurrenceRules.push(rule);
		return rule;
	}

	addDateExclusion(date: DateTime): CalendarRecurrence {
		this.recurrenceOverrides.push(date);
		this.excluded = true;
		return this;
	}

	addDate(date: DateTime): CalendarRecurrence {
		this.recurrenceOverrides.push(date);
		return this;
	}

	addHourlyRule(): RecurrenceRule {
		const rule = new RecurrenceRule('hourly');
		this.recurrenceRules.push(rule);
		return rule;
	}

	addMinutelyRule(): RecurrenceRule {
		const rule = new RecurrenceRule('minutely');
		this.recurrenceRules.push(rule);
		return rule;
	}

	addSecondlyRule(): RecurrenceRule {
		const rule = new RecurrenceRule('secondly');
		this.recurrenceRules.push(rule);
		return rule;
	}

	addMonthlyRule(): RecurrenceRule {
		const rule = new RecurrenceRule('monthly');
		this.recurrenceRules.push(rule);
		return rule;
	}

	addWeeklyRule(): RecurrenceRule {
		const rule = new RecurrenceRule('weekly');
		this.recurrenceRules.push(rule);
		return rule;
	}

	addYearlyRule(): RecurrenceRule {
		const rule = new RecurrenceRule('yearly');
		this.recurrenceRules.push(rule);
		return rule;
	}

	toJSON(): any {
		return {
			recurrenceRules: this.recurrenceRules.map((element: RecurrenceRule) => element.toJSON()),
			recurrenceOverrides: this.recurrenceOverrides.map((element: DateTime) => element.toISO()),
			excluded: this.excluded,
		};
	}

	static fromJSON(
		json: any
	): CalendarRecurrence {
		const recurrence = new CalendarRecurrence();
		for(const rule of json.recurrenceRules) {
			recurrence.recurrenceRules.push(
				RecurrenceRule.fromJSON(rule)
			);
		}
		for(const override of json.recurrenceOverrides) {
			recurrence.recurrenceOverrides.push(
				DateTime.fromISO(override)
			);
		}
		recurrence.excluded = json.excluded;
		return recurrence;
	}
}

class NDay {
	constructor(
		public readonly day: string,
		public readonly nthOfPeriod?: number
	) {
		if(nthOfPeriod === 0) {
			throw new Error('nthOfPeriod must not be zero.');
		}
	}

	toJSON() {
		return (typeof this.nthOfPeriod === 'number') ? {
			day: this.day,
			nthOfPeriod: this.nthOfPeriod,
		} : {
			day: this.day,
		}
	}

	static fromJSON(
		json: any
	): NDay {
		if('nthOfPeriod' in json) {
			return new NDay(json.day, json.nthOfPeriod);
		}
		return new NDay(json.day);
	}
}

// Some components not supported in Google Apps Script.
//
// The rule parts are not ordered in any particular sequence.
// The FREQ rule part is REQUIRED.
// The UNTIL or COUNT rule parts are OPTIONAL, but they MUST NOT occur in the
// same 'recur'.
// The other rule parts are OPTIONAL.
//
// BYxxx rule parts for a period of time that is the same or greater than the
// frequency generally reduce or limit the number of occurrences of the
// recurrence generated.
//
// BYxxx rule parts for a period of time less than the frequency generally
// increase or expand the number of occurrences of the recurrence.
class RecurrenceRule {
	protected _frequency: string;
	protected _interval: number;
//	protected _rscale: string;
//	protected _skip: string;
	protected _firstDayOfWeek: string;  // aka WKST.
	protected _byDay: NDay[];  // weekday.  Within MONTHLY or YEARLY can be nth occurrence.
	protected _byMonthDay: number[];
	protected _byMonth: number[];
	protected _byYearDay: number[];
	protected _byWeekNo: number[];
	protected _byHour: number[];
	protected _byMinute: number[];
	protected _bySecond: number[];
	protected _bySetPosition: number[];  // aka BYSETPOS.
	protected _timeZone: string | undefined;
	protected _times: number | undefined;  // aka COUNT.
	protected _until: DateTime | undefined;
	protected _cache: any = null;

	constructor(frequency: string) {
		this._frequency = frequency;
		this._interval = 1;
//		this.#rscale = 'gregorian';
//		this.#skip = 'omit';
		this._firstDayOfWeek = 'mo';
		this._byDay = [];
		this._byMonthDay = [];
		this._byMonth = [];
		this._byYearDay = [];
		this._byWeekNo = [];
		this._byHour = [];
		this._byMinute = [];
		this._bySecond = [];
		this._bySetPosition = [];
		this._timeZone = undefined;
		this._times = undefined;
		this._until = undefined;
	}

	toJSON() {
		return {
			frequency: this._frequency,
			interval: this._interval,
//			rscale: this.#rscale,
//			skip: this.#skip,
			firstDayOfWeek: this._firstDayOfWeek,
			byDay: this._byDay.map(day => day.toJSON()),
			byMonthDay: this._byMonthDay,
			byMonth: this._byMonth,
			byYearDay: this._byYearDay,
			byWeekNo: this._byWeekNo,
			byHour: this._byHour,
			byMinute: this._byMinute,
			bySecond: this._bySecond,
			bySetPosition: this._bySetPosition,
			timeZone: this._timeZone,
			times: this._times,
			until: this._until ? this._until.toISO() : undefined,
		};
	}

	static fromJSON(json: any): RecurrenceRule {
		const recurrence = new RecurrenceRule(json.frequency);
		recurrence.interval(json.interval);
		if(typeof json.firstDayOfWeek === 'string' && json.firstDayOfWeek.length) {
			recurrence.weekStartsOn(json.firstDayOfWeek);
		}
		if(Array.isArray(json.byDay) && json.byDay.length) {
			const byDay: NDay[] = [];
			for(const day of json.byDay) {
				byDay.push(NDay.fromJSON(day));
			}
			recurrence.onlyOnWeekDays(byDay);
		}
		if(Array.isArray(json.byMonthDay) && json.byMonthDay.length) {
			recurrence.onlyOnMonthdays(json.byMonthDay);
		}
		if(Array.isArray(json.byMonth) && json.byMonth.length) {
			recurrence.onlyInMonths(json.byMonth);
		}
		if(Array.isArray(json.byYearDay) && json.byYearDay.length) {
			recurrence.onlyOnYearDays(json.byYearDay);
		}
		if(Array.isArray(json.byWeekNo) && json.byWeekNo.length) {
			recurrence.onlyOnWeeks(json.byWeekNo);
		}
		if(Array.isArray(json.byHour) && json.byHour.length) {
			recurrence.onlyOnHours(json.byHour);
		}
		if(Array.isArray(json.byMinute) && json.byMinute.length) {
			recurrence.onlyOnMinutes(json.byMinute);
		}
		if(Array.isArray(json.bySecond) && json.bySecond.length) {
			recurrence.onlyOnSeconds(json.bySecond);
		}
		if(Array.isArray(json.bySetPosition) && json.bySetPosition.length) {
			recurrence.bySetPosition(json.bySetPosition);
		}
		if(typeof json.timeZone === 'string' && json.timeZone.length) {
			recurrence.setTimeZone(json.timeZone);
		}
		if(typeof json.times === 'number') {
				recurrence.times(json.times);
		}
		if(typeof json.until === 'string' && json.until.length) {
			recurrence.until(DateTime.fromISO(json.until));
		}
		return recurrence;
	}

	getFrequency(): string { return this._frequency; }
	getInterval(): number { return this._interval; }
	interval(interval: number): void { this._interval = interval; }
	getWeekStartsOn(): string { return this._firstDayOfWeek; }
	weekStartsOn(day: string) { this._firstDayOfWeek = day; }
	getOnlyOnWeekDays(): NDay[] { return this._byDay; }
	onlyOnWeekDays(days: NDay[]) { this._byDay = days; }
	getOnlyOnMonthDays(): number[] { return this._byMonthDay; }
	onlyOnMonthdays(days: number[]) { this._byMonthDay = days; }
	getOnlyInMonths(): number[] { return this._byMonth; }
	onlyInMonths(months: number[]) { this._byMonth = months; }
	getOnlyOnYearDays(): number[] { return this._byYearDay; }
	onlyOnYearDays(days: number[]) { this._byYearDay = days; }
	getOnlyOnWeeks(): number[] { return this._byWeekNo; }
	onlyOnWeeks(weeks: number[]) { this._byWeekNo = weeks; }
	getOnlyOnHours(): number[] { return this._byHour; }
	onlyOnHours(hours: number[]) { this._byHour = hours; }
	getOnlyOnMinutes(): number[] { return this._byMinute; }
	onlyOnMinutes(minutes: number[]) { this._byMinute = minutes; }
	getOnlyOnSeconds(): number[] { return this._bySecond; }
	onlyOnSeconds(seconds: number[]) { this._bySecond = seconds; }
	bySetPosition(positions: number[]) { this._bySetPosition = positions; }
	getSetPosition(): number[] { return this._bySetPosition; }
	getTimeZone(): string | undefined { return this._timeZone; }
	setTimeZone(timeZone: string) { this._timeZone = timeZone; }
	getTimes(): number | undefined { return this._times; }
	times(times: number) { this._times = times; }
	getUntil(): DateTime | undefined { return this._until; }
	until(endDate: DateTime) { this._until = endDate; }

	isFinite(): boolean { return !!(this._times || this._until); }
	isByCount(): boolean { return !!(this._times && !this._until); }

	iterator(
		dtstart: DateTime,
		from: DateTime
	): { next: () => void, value: any, done: boolean } {
		let options: any = {};
		// RRule is somewhat broken and silently errors on empty or
		// undefined options.
		options['freq'] = RRuleFrequencyFromString(this._frequency);
		options['dtstart'] = dtstart.toJSDate();
		options['interval'] = this._interval;
		if(this._firstDayOfWeek) {
                        options['wkst'] = RRuleWeekDayFromString(this._firstDayOfWeek);
                }
		if(this._times) {
			options['count'] = this._times;
		}
		if(this._until) {
			options['until'] = this._until.toJSDate();
		}
		if(this._timeZone) {
			options['tzid'] = this._timeZone;
		}
		if(this._bySetPosition.length) {
			options['bysetpos'] = this._bySetPosition;
		}
		if(this._byMonth.length) {
			options['bymonth'] = this._byMonth;
		}
		if(this._byMonthDay.length) {
			options['bymonthday'] = this._byMonthDay;
		}
		if(this._byYearDay.length) {
			options['byyearday'] = this._byYearDay;
		}
		if(this._byWeekNo.length) {
			options['byweekno'] = this._byWeekNo;
		}
		if(this._byDay.length) {
			options['byweekday'] =
				this._byDay.map(
					element => RRuleWeekDayFromString(
						element.day,
						element.nthOfPeriod,
					)
				);
		}
		if(this._byHour.length) {
			options['byhour'] = this._byHour;
		}
		if(this._byMinute.length) {
			options['byminute'] = this._byMinute;
		}
		if(this._bySecond.length) {
			options['bysecond'] = this._bySecond;
		}
//		console.info(options);
		let rrule: RRule;
		if(this._cache === null) {
			rrule = new RRule(options, false);
			this._cache = rrule._cache;
		} else {
			rrule = new RRule(options, true /* no-cache */);
			rrule._cache = this._cache;
		}
//		console.info(rrule.toString());
		let date = from.toJSDate();
		let value: any = undefined;
		let done = false;
		const next = (): void => {
			if(date === null) {
				return;
			}
//console.info("rrule.after(", date, ")");
			date = rrule.after(date);
//console.group();
//console.info("date:", date.toISOString());
			value = (date !== null) ? DateTime.fromJSDate(date) : undefined;
//console.info("value:", value && value.toISO());
			done = value === null;
//console.info("done:", done);
//console.groupEnd();
		};
		const it = {
			next,
			get value() { return value; },
			get done() { return done; },
		};
		return it;
	}
}
