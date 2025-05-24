// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import 'subworkers';
import 'finally-polyfill';
import * as Comlink from 'comlink';
import {
	DateTime,
	Duration,
	DurationLike,
	Interval,
} from 'luxon';
import * as jsonref from 'jsonref';
import EventTarget from '@ungap/event-target';
import { RecipeSchema } from '@dsbunny/publisher-schema';
import {
	Constants,
	Scheduler,
	SchedulerState,
	EventSeriesSummary,
	MediaListSummary,
} from '../lib/scheduler.js';
import {
	AssetDecl,
	HashDecl,
	MediaDecl,
	ScopedMediaDecl,
} from './media.js';
import {
	CalendarWorker,
	CalendarEvent,
} from '../lib/occurency.js';

const MAX_DATE = DateTime.fromJSDate(new Date(8.64e15));
const MAX_DURATION = Duration.fromMillis(8.64e15);

// The base meta-data for scheduled events.
export class ScheduleItem {
	// eventSeries: id of the scheduled event.
	constructor(
		public readonly eventSeries: string,
		public readonly decl: MediaDecl,
		public readonly start_offset: Duration,
		public readonly end_offset: Duration,
	) {}
	get shortEventSeries() { return this.eventSeries.substring(0, 7); }
	get id() { return this.decl.id; }
	get shortId() { return this.decl.id.substring(0, 7); }
	get duration() { return this.decl.duration; }
}

// For a given time window.
export class ScheduleItemView {
	protected _start_time: DateTime;
	protected _end_time: DateTime;
	constructor(
		protected readonly schedule_item: ScheduleItem,
		playlist_start: DateTime,
	) {
		this._start_time = playlist_start.plus(schedule_item.start_offset);
		this._end_time = playlist_start.plus(schedule_item.end_offset);
	}
	get eventSeries() { return this.schedule_item.eventSeries; }
	get shortEventSeries() { return this.schedule_item.shortEventSeries; }
	get id() { return this.decl.id; }
	get shortId() { return this.decl.id.substring(0, 7); }
	get currentSrc() { return this.decl.href; }
	get start_time() { return this._start_time; }
	get end_time() { return this._end_time; }
	get decl() { return this.schedule_item.decl; }
	get start_offset() { return this.schedule_item.start_offset; }
	get end_offset() { return this.schedule_item.end_offset; }

	protected _remainingTime(datetime: DateTime): number | string {
		if(this._end_time.equals(MAX_DATE)) {
			return "Infinity";
		}
		const interval = Interval.fromDateTimes(datetime, this._end_time);
		return interval.length('milliseconds');
	}

	summary(datetime: DateTime) {
		if(datetime <= this._end_time) {
			return {
				decl: this.decl,
				remainingTimeMs: this._remainingTime(datetime),
				startTime: this._start_time.equals(MAX_DATE) ?
					"Infinity" : this._start_time.toISO(),
				endTime: this._end_time.equals(MAX_DATE) ?
					"Infinity" : this._end_time.toISO(),
			};
		}
		return	{
			decl: this.decl,
			remainingTimeMs: "Infinity",
			startTime: this._start_time.equals(MAX_DATE) ?
				"Infinity" : this._start_time.toISO(),
			endTime: this._end_time.equals(MAX_DATE) ?
				"Infinity" : this._end_time.toISO(),
		};
	}
}

const DateTimeHandler: Comlink.TransferHandler<DateTime, number> = {
	canHandle: (val): val is DateTime => val instanceof DateTime,
	serialize: (val: DateTime) => {
		return [val.toMillis(), []];
	},
	deserialize: (num) => DateTime.fromMillis(num),
};
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

interface EventMatch {
	'@type': string;
	[key: string]: any;
}

export class CalendarSchedule {
	protected _worker: Worker;
	protected _calendar: Comlink.Remote<CalendarWorker>;
	protected _lowWatermark: Duration;
	protected _highWatermark: Duration;
	protected _queue: CalendarEvent<RecipeSchema.Playlist>[] = [];
	protected _isOnce = false;
	protected _isToggle = false;
	protected get _isDynamic() { return this._isOnce || this._isToggle; }
	protected _isReady = false;
	protected _hasDeathNote = false;
	protected _isActivated = false;
	protected _isPulling = false;
	protected _onceListener: any;
	protected _enableListener: any;
	protected _disableListener: any;
	constructor(
		readonly decl: RecipeSchema.Event,
		lowWatermark: DurationLike,
		highWatermark: DurationLike,
	) {
		this._worker = this._workerFactory();
		this._calendar = Comlink.wrap<CalendarWorker>(this._worker);
		this._lowWatermark = Duration.fromDurationLike(lowWatermark);
		this._highWatermark = Duration.fromDurationLike(highWatermark);
		this._isOnce = this.decl.hasOwnProperty('onceOn');
		this._isToggle = this.decl.hasOwnProperty('enableOn') && this.decl.hasOwnProperty('disableOn');
		if(this._isOnce) {
			const match: EventMatch = this.decl.onceOn!.match;
			console.log(`${this.shortId}: once schedule: ${JSON.stringify(match)}`);
			this._onceListener = (event: any) => {
				console.log(`${this.shortId}: event ${JSON.stringify(event)}`);
				for(const prop in match) {
					console.log('prop', prop)
					if(prop[0] === '@') {
						continue;
					}
					if(!event.detail.hasOwnProperty(prop)) {
						console.log('no prop');
						continue;
					}
					if(event.detail[prop] === match[prop]) {
						const datetime = DateTime.now();
						this._activate(datetime);
					}
				}
			};
			self.addEventListener(this.decl.onceOn!.type, this._onceListener);
		} else if(this._isToggle) {
			const matchOn: EventMatch = this.decl.enableOn!.match;
			const matchOff: EventMatch = this.decl.disableOn!.match;
			console.log(`${this.shortId}: toggle schedule: ${JSON.stringify(matchOn)}, ${JSON.stringify(matchOff)}`);
			this._enableListener = (event: any) => {
				console.log(`${this.shortId}: event ${JSON.stringify(event)}`);
				for(const prop in matchOn) {
					console.log('prop', prop)
					if(prop[0] === '@') {
						continue;
					}
					if(!event.detail.hasOwnProperty(prop)) {
						console.log('no prop');
						continue;
					}
					if(event.detail[prop] === matchOn[prop]) {
						const datetime = DateTime.now();
						this._activate(datetime);
					}
				}
			};
			this._disableListener = (event: any) => {
				console.log(`${this.shortId}: event ${JSON.stringify(event)}`);
				for(const prop in matchOff) {
					console.log('prop', prop)
					if(prop[0] === '@') {
						continue;
					}
					if(!event.detail.hasOwnProperty(prop)) {
						console.log('no prop');
						continue;
					}
					if(event.detail[prop] === matchOff[prop]) {
						const datetime = DateTime.now();
						this._deactivate(datetime);
					}
				}
			};
			self.addEventListener(this.decl.enableOn!.type, this._enableListener);
			self.addEventListener(this.decl.disableOn!.type, this._disableListener);
		}
		this._isActivated = !this._isDynamic;
	}

	// Use relative path on local file system due to LG WebOS security policy.
	protected _workerFactory() {
		if(location.protocol === 'file:') {
			return new Worker('../dist/calendar.bundle~chrome53.mjs', {
				type: 'classic',
				credentials: 'omit',
				name: `Calendar - ${this.shortId}`,
			});
		}
		return new Worker(new URL('../dist/calendar.bundle.mjs', location.href).pathname, {
			type: 'module',
			credentials: 'omit',
			name: `Calendar - ${this.shortId}`,
		});
	}

	protected async _activate(
		datetime: DateTime,
	) {
		console.log(`${this.shortId}: _activate(${datetime.toISO()})`);
		await this._calendar.parseSchedule(
			this.id,
			{
				...this.decl,
				start: datetime.toISO(),
			}
		);
		this._isActivated = true;
	}

	protected _deactivate(
		datetime: DateTime,
	) {
		console.log(`${this.shortId}: _deactivate(${datetime.toISO()})`);
		this._isActivated = false;
	}

	get id() { return this.decl.id; }
	get shortId() { return this.id.substring(0, 7); }

	set isReady(
		isReady: boolean,
	) {
		console.log(`${this.shortId}: isReady(${isReady})`);
		this._isReady = isReady;
	}
	get isReady() { return this._isReady; }
	get isActive() { return this._isReady && this._isActivated; }

	// Forced re-interpretation of Recipe schema to wider type.
	get entries() { return this.decl.playlist.entries as MediaDecl[]; }
	get sources(): AssetDecl[] {
		const hrefs = new Set<AssetDecl>();
		for(const decl of this.entries) {
			// Primary asset,
			hrefs.add({
				"@type": decl["@type"],
				id: decl.id,
				href: decl.href,
				size: decl.size,
				hash: decl.hash,
				integrity: decl.integrity,
				md5: decl.md5,
			});
			// Dependent assets.
			if('sources' in decl
				&& Array.isArray(decl.sources))
			{
				for(const asset of decl.sources) {
					hrefs.add(asset);
				}
			}
		}
		return Array.from(hrefs.values());
	}

	summary(
		datetime: DateTime,
	): EventSeriesSummary {
		let pct = 0;
		if(typeof this.tail !== "undefined") {
			const tail = this.tail.end.toISO();
			const interval = Interval.fromDateTimes(datetime, this.tail.end);
			const duration = interval.toDuration('milliseconds');
			pct = (100 * Math.min(duration.toMillis(), this._highWatermark.toMillis()))
				/ this._highWatermark.toMillis();
		}
		const queue = this._queue.map(entry => entry.interval.toISO());
		return {
			id: this.shortId,
			pct,
			queue,
		};
	}

	async parseSchedule(
		decl: RecipeSchema.Event,
	): Promise<void> {
		console.log(`${this.shortId}: parseSchedule`);
		if(this._isDynamic) {
			return;
		}
		await this._calendar.parseSchedule(this.id, decl);
	}

	protected async _getEvents(
		startTime: DateTime,
		endTime: DateTime,
	): Promise<CalendarEvent<RecipeSchema.Playlist>[]> {
//		console.log(`${this.shortId}: getEvents ${startTime.toISO()} -> ${endTime.toISO()}.`);
		return await this._calendar.getEvents(startTime, endTime);
	}

	setLowWatermark(
		durationLike: DurationLike,
	) {
		console.log(`${this.shortId}: setLowWatermark(${JSON.stringify(durationLike)})`);
		this._lowWatermark = Duration.fromDurationLike(durationLike);
	}

	setHighWatermark(
		durationLike: DurationLike,
	) {
		console.log(`${this.shortId}: setHighWatermark(${JSON.stringify(durationLike)})`);
		this._highWatermark = Duration.fromDurationLike(durationLike);
	}

	// Fill to high watermark when breaking low.
	async pull(
		datetime: DateTime,
	): Promise<boolean> {
//		console.log(`${this.shortId}: pull(${datetime.toISO()})`);
		if(!this._isActivated) {
			return false;
		}
		if(this._aboveLowWatermark(datetime)) {
			return false;
		}
		const headTime = typeof this.head === "undefined" ? datetime : this.head.start;
		const endTime = headTime.plus(this._highWatermark);
		const t0 = performance.now();
		const events = await this._getEvents(datetime, endTime);
		console.log(`${this.shortId}: getEvents ${Math.round(performance.now() - t0)}ms.`);
		this._queue = events;
		return true;
	}

	prefetch(
		datetime: DateTime,
	) {
		const headTime = typeof this.head === "undefined" ? datetime : this.head.start;
		const tailTime = typeof this.tail === "undefined" ? datetime : this.tail.end;
		const endTime = headTime.plus(this._highWatermark).plus(this._lowWatermark);
		if(endTime > tailTime) {
			this._calendar.prefetchEvents(headTime, endTime)
			.catch(err => {
				console.error(err);
			});
		}
	}

	// Destructive to queue.
	getCalendarEvent(
		datetime: DateTime,
	): CalendarEvent<RecipeSchema.Playlist> | null {
//		console.log(`${this.shortId}: getCalendarEvent(${datetime.toISO()})`);
		if(!this.isActive) {
			return null;
		} else if(this._isOnce) {
			if(typeof this.head !== "undefined"
				&& datetime > this.head.end)
			{
				this._deactivate(datetime);
				return null;
			}
		}
		if(!this._isPulling) {
			this._isPulling = true;
			this.pull(datetime)
			.then(() => {
				this.prefetch(datetime);
			}).finally(() => {
				this._isPulling = false;
			});
		}
		while(true) {
			if(typeof this.head === "undefined") {
				return null;
			}
			if(datetime < this.head.end) {
				break;
			}
			this._queue.shift();
		}
		return this.head;
	}

	peekCalendarEvent(
		datetime: DateTime,
	): CalendarEvent<RecipeSchema.Playlist> | null {
//		console.log(`${this.shortId}: peekCalendarEvent(${datetime.toISO()})`);
		if(!this.isActive) {
			return null;
		} else if(this._isOnce) {
			if(typeof this.head !== "undefined"
				&& datetime > this.head.end)
			{
				this._deactivate(datetime);
				return null;
			}
		}
		if(!this._isPulling) {
			this._isPulling = true;
			this.pull(datetime)
			.then(() => {
				this.prefetch(datetime);
			}).finally(() => {
				this._isPulling = false;
			});
		}
		for(const entry of this._queue) {
			if(datetime < entry.end) {
				return entry;
			}
		}
		return null;
	}

	get isEmpty() { return this._queue.length === 0; }
	get head() { return this.isEmpty ? undefined : this._queue[0]; }
	get tail() { return this.isEmpty ? undefined : this._queue[this._queue.length - 1]; }

	protected _aboveLowWatermark(
		datetime: DateTime,
	): boolean {
//		console.log(`aboveLowWatermark(${datetime.toISO()})`);
		if(typeof this.tail === "undefined") {
			return false;
		}
		const interval = Interval.fromDateTimes(datetime, this.tail.end);
		const duration = interval.toDuration('seconds');
		return duration > this._lowWatermark;
	}

	close() {
		if(typeof this._onceListener !== "undefined") {
			self.removeEventListener(this.decl.onceOn!.type, this._onceListener);
		}
		if(typeof this._enableListener !== "undefined") {
			self.removeEventListener(this.decl.enableOn!.type, this._enableListener);
		}
		if(typeof this._disableListener !== "undefined") {
			self.removeEventListener(this.decl.disableOn!.type, this._disableListener);
		}
		this._calendar[Comlink.releaseProxy]();
		this._worker.terminate();

		this._isReady = false;
	}

	closeWhenHidden() {
		this._hasDeathNote = true;
		if(!this.isReady) {
			console.log(`${this.shortId}: Closing.`);
			this.close();
		}
	}

	hidden() {
		if(this._hasDeathNote) {
			console.log(`${this.shortId}: Closing when hidden.`);
			this.close();
		}
	}

	toJSON() {
		return {
			decl: this.decl,
			"_lowWatermark": this._lowWatermark.toISO(),
			"_highWatermark": this._highWatermark.toISO(),
			"_queue": this._queue.map(x => x.toJSON()),
		};
	}
}

export class BasicScheduler extends EventTarget implements Scheduler {
	autoplay = true;
	mergePlaylist = true;

	protected _src = "";
	protected _src_id = "";
	protected _src_size = 0;
	protected _src_hash: HashDecl | undefined = undefined;
	protected _src_integrity = "";
	protected _src_md5 = "";
	protected _currentTime = DateTime.fromMillis(0);	// UNIX epoch.
	protected _inTransition = false;
	protected _transitionStartTime = DateTime.fromMillis(0);
	protected _transitionEndTime = DateTime.fromMillis(0);
	protected _transitionPercent = 0;
	protected _transitionPercentSpeed = 0;

	protected _play_resolve: EventListenerOrEventListenerObject | null = null;
	protected _play_reject: EventListenerOrEventListenerObject | null = null;
	protected _schedule_cluster: any = undefined;

	// Per HTMLMediaElement.
	protected _ended = false;
	protected _error = null;
	protected _networkState: number = Constants.NETWORK_NO_SOURCE;
	protected _paused = true;
	protected _readyState: number = Constants.HAVE_NOTHING;
	protected _seeking = false;

	constructor() {
		super();
		this.addEventListener('loadedmetadata', (event: Event) => this._onLoadedMetadata(event));
	}

	get debugInTransition() { return this._inTransition; }

	protected _schedulerFactory(
		decl: RecipeSchema.Event,
		lowWatermark: DurationLike,
		highWatermark: DurationLike,
	): CalendarSchedule {
		return new CalendarSchedule(decl, lowWatermark, highWatermark);
	}

	close(): void {}

	get src() { return this._src; }
	set src(href: string) {
		if(!this.mergePlaylist || href.length === 0) {
			(async () => {
				await this._clear();
			})();
		}
		this._src = href;
		if(this.autoplay
			&& this.src.length !== 0)
		{
			console.log(`BASIC-SCHEDULER: Auto-playing ${this.src} (${this.src_id})`);
			(async () => {
				await this.play();
			})();
		}
	}

	get src_id() { return this._src_id; }
	set src_id(src_id: string) {
		this._src_id = src_id;
	}

	get src_size() { return this._src_size; }
	set src_size(size: number) {
		this._src_size = size;
	}

	get src_hash(): HashDecl | undefined { return this._src_hash; }
	set src_hash(hash: HashDecl | undefined) {
		this._src_hash = hash;
	}

	get src_integrity() { return this._src_integrity; }
	set src_integrity(integrity: string) {
		this._src_integrity = integrity;
	}

	get src_md5() { return this._src_md5; }
	set src_md5(md5: string) {
		this._src_md5 = md5;
	}

	get currentTime() { return this._currentTime; }
	set currentTime(datetime: DateTime) {
		this._currentTime = datetime;
	}

	// Per HTMLMediaElement.
	get ended() { return this._ended; }
	get error() { return this._error; }
	get networkState() { return this._networkState; }
	get paused() { return this._paused; }
	get readyState() { return this._readyState; }
	get seeking() { return this._seeking; }

	load(): void {
		(async () => {
			try {
				console.log("BASIC-SCHEDULER: load");
				this.dispatchEvent(new Event('loadstart'));
				this._networkState = Constants.NETWORK_LOADING;
				const schedule = await this._fetch(this.src);
				this._networkState = Constants.NETWORK_IDLE;
				await this._parseRecipe(schedule);
				this._readyState = Constants.HAVE_FUTURE_DATA;
				this.dispatchEvent(new Event('loadedmetadata'));
				this.dispatchEvent(new Event('loadeddata'));
			} catch(e) {
				console.warn(e);
				this._networkState = Constants.NETWORK_IDLE;
				const event = new CustomEvent('error', { detail: e });
				this.dispatchEvent(event);
			}
		})();
	}

	pause(): void {
		if(this.paused) {
			return;
		}
		console.log(`BASIC-SCHEDULER: Pausing ${this.src} (${this.src_id})`);
		this._paused = true;
		this.dispatchEvent(new Event('pause'));
	}

	async play(): Promise<void> {
		console.log("BASIC-SCHEDULER: play");
		if(this._play_resolve !== null) {
			this.removeEventListener('canplay', this._play_resolve);
		}
		if(this._play_reject !== null) {
			this.removeEventListener('error', this._play_reject);
		}
		await new Promise<void>((resolve, reject) => {
			this._play_resolve = (_event: Event): void => {
				this._play_resolve = null;
				resolve();
			};
			this._play_reject = (event: Event): void => {
				this._play_reject = null;
				console.warn(event);
				reject(event);
			};
			this.addEventListener('canplay', this._play_resolve, { once: true });
			this.addEventListener('error', this._play_reject, { once: true });
			try {
				this.load();
			} catch(ex: any) {
				console.warn(ex);
				reject(ex);
			}
		});
		this._paused = false;
		this.dispatchEvent(new Event('play'));
		this.dispatchEvent(new Event('playing'));
	}

	update(
		datetime: DateTime,
	): void {
//		console.log("BASIC-SCHEDULER: update", datetime.toISO());
		if(this.paused) {
			return;
		}
		let need_seek = false;
		if(this._hasInterrupt) {
			console.debug(`BASIC-SCHEDULER: Event playback, ${datetime.toISO()}.`);
			need_seek = true;
		} else if(datetime < this._currentTime) {
			console.debug(`BASIC-SCHEDULER: Rewinding playback, ${this._currentTime.toISO()} -> ${datetime.toISO()}.`);
			need_seek = true;
		} else if(this._media_current === null) {
			console.debug(`BASIC-SCHEDULER: Fast-seek forward, ${this._currentTime.toISO()} -> ${datetime.toISO()}.`);
			need_seek = true;
		} else if(datetime >= this._mediaCurrentEndTime) {
			console.debug(`BASIC-SCHEDULER: Fast-forward playback, ${this._currentTime.toISO()} -> ${datetime.toISO()}.`);
			need_seek = true;
		}
		this._currentTime = datetime;
		if(need_seek) {
			this._onSeekStarted();
		}

		const last_calendar_schedule_id = this._media_list_current?.parentId;
		this._media_list_current = this._getMediaListContains(datetime);
		this._updateMediaList(this._media_list_current);
		if(this._media_list_current !== null) {
			this._media_current = this._seekMediaList(datetime, this._media_list_current);
			if(this._media_current !== null) {
				const next_events = this._peekMediaListContains(this._media_current.end_time);
				if(next_events !== null) {
					this._media_next = this._seekMediaList(this._media_current.end_time, next_events);
				} else {
					this._media_next = null;
				}
			}
		} else {
			this._media_current = null;
		}
		if(typeof last_calendar_schedule_id !== "undefined") {
			if(this._media_list_current === null
				|| last_calendar_schedule_id !== this._media_list_current.parentId)
			{
				const last_calendar_schedule = this._calendar_schedules.find(x => x.id === last_calendar_schedule_id);
				if(typeof last_calendar_schedule !== "undefined") {
					last_calendar_schedule.hidden();
				}
			}
		}
		if(this._media_current === null) {
			const next_events = this._peekMediaListAfter(datetime);
			if(next_events !== null) {
				const next_datetime = DateTime.max(datetime, next_events.start);
				this._media_next = this._seekMediaList(next_datetime, next_events);
			} else {
				this._media_next = null;
			}
		}
		if(need_seek) {
			this._onSeekEnded();
		}

		// [ intro ] -- content -- [ outro ] [ intro ] -- next content --
		// Into and outro are scoped to the current media, thus after current media
		// end time, i.e. the intro of the next content, the values for both intro
		// and outro will have advanced in time.
		if(!this._inTransition) {
			if(datetime >= this._transitionOutroStartTime
				&& datetime < this._transitionOutroEndTime)
			{
				console.debug(`BASIC-SCHEDULER: Start transition on outro: ${this._transitionOutroEndTime} > ${datetime.toISO()} >= ${this._transitionOutroStartTime.toISO()}`);
				this._onTransitionStart(this._transitionOutroStartTime);
			}
			else if(datetime >= this._transitionIntroStartTime
				&& datetime < this._transitionIntroEndTime)
			{
				console.debug(`BASIC-SCHEDULER: Start transition on intro: ${this._transitionIntroEndTime.toISO()} > ${datetime.toISO()} >= ${this._transitionIntroStartTime.toISO()}`);
				this._onTransitionStart(this._transitionPreviousOutroStartTime);
			}
		} else {
			// Explicitly only a transition that has been started.
			if(datetime >= this._transitionEndTime) {
				this._onTransitionEnded(this._transitionEndTime);
			}
		}
		if(this._inTransition) {
			this._updateTransition(datetime);
		}
//		console.info(this.state(datetime));
	}

	protected _onTransitionStart(
		datetime: DateTime,
	) {
		console.debug(`BASIC-SCHEDULER: _onTransitionStart(${datetime.toISO()})`);
		if(this._media_current === null) {
			throw new Error("current is null.");
		}
		this._transitionFrom = this._media_current.decl;
		// Schedule may have updated and next media has not been set.
		if(this._media_next === null) {
			console.warn("next is null.");
			return;
		}
		if(typeof this._transitionTime === "undefined") {
			throw new Error("transition time is undefined.");
		}
		this._transitionTo = this._media_next.decl;
		this._inTransition = true;
		this._transitionStartTime = datetime;
		this._transitionEndTime = datetime.plus({ seconds: this._transitionTime });
		console.debug(`BASIC-SCHEDULER: Transition end: ${this._transitionEndTime.toISO()}`);
	}

	protected _updateTransition(
		datetime: DateTime,
	): void {
//		console.log("BASIC-SCHEDULER: _updateTransition");
		const interval = Interval.fromDateTimes(this._transitionStartTime, datetime);
		const elapsed = interval.length('seconds');
		if(typeof this._transitionTime === "undefined") {
			throw new Error("transition time is undefined.");
		}
		this._transitionPercent = Math.min(1.0, elapsed / this._transitionTime);
		this._transitionPercentSpeed = 1 / this._transitionTime;
		if(this._media_next === null) {
			throw new Error("next is null.");
		}
	}

	protected _onTransitionEnded(
		datetime: DateTime,
	) {
		console.debug(`BASIC-SCHEDULER: _onTransitionEnded(${datetime.toISO()}`);
		this._inTransition = false;
		this._transitionFrom = null;
		this._transitionTo = null;
	}

	protected _onSeekStarted() {
//		console.log("BASIC-SCHEDULER: _onSeekStarted");
		this._seeking = true;
		this.dispatchEvent(new Event('seeking'));
	}

	protected _onSeekEnded() {
//		console.log("BASIC-SCHEDULER: _onSeekEnded");
		this._seeking = false;
		this.dispatchEvent(new Event('seeked'));
		this.dispatchEvent(new Event('playing'));
	}

	state(
		datetime: DateTime,
	): SchedulerState {
		const currentTime = datetime.toISO();
		if(currentTime === null) {
			throw new Error("Cannot convert datetime to ISO.");
		}
		const eventSeries = this._calendar_schedules.map(calendar =>
			calendar.summary(datetime));
		const mediaList: MediaListSummary[] = this._active_media_assets.map(asset => {
			const start =
				asset.start_offset.equals(MAX_DURATION)
				? "Infinity"
				: asset.start_offset.toISO();
			if(start === null) {
				throw new Error("Cannot convert start offset to ISO.");
			}
			const end =
				asset.end_offset.equals(MAX_DURATION)
				? "Infinity"
				: asset.end_offset.toISO();
			if(end === null) {
				throw new Error("Cannot convert end offset to ISO.");
			}
			const media: MediaListSummary = {
				id: asset.shortId,
				start,
				end,
			};
			return media;
		});
		const mediaCurrent: any = this._media_current === null ? null : this._media_current.summary(datetime);
		const mediaNext: any = this._media_next === null ? null : this._media_next.summary(datetime);
		const transition = (this._inTransition
			&& this._transitionFrom !== null
			&& this._transitionTo !== null
			&& typeof this._transitionUrl === "string") ? {
			from: {
				decl: this._transitionFrom,
			},
			to: {
				decl: this._transitionTo,
			},
			url: this._transitionUrl,
			percent: this._transitionPercent,
			percentSpeed: this._transitionPercentSpeed,
		} : null;
		return {
			currentTime,
			eventSeries,
			mediaList,
			mediaCurrent,
			mediaNext,
			transition,
		};
	}

	protected _onLoadedMetadata(
		_event: Event,
	): void {
		(async () => {
			console.groupCollapsed("BASIC-SCHEDULER: _onLoadedMetadata");
			this._media_list_current = this._getMediaListContains(this._currentTime);
			this._updateMediaList(this._media_list_current);
			if(this._media_list_current !== null) {
				this._media_current = this._seekMediaList(this._currentTime, this._media_list_current);
			}
			if(this._media_current !== null) {
				const event = this._peekMediaListContains(this._mediaCurrentEndTime);
				this._media_next = null;
				if(event !== null
					&& event.data.entries.length !== 0)
				{
					this._media_next = this._seekMediaList(this._mediaCurrentEndTime, event);
				}
			} else if(this._media_next !== null) {
				const event = this._peekMediaListAfter(this._currentTime);
				if(event !== null) {
					this._media_next = this._seekMediaList(event.start, event);
				}
			}
			this.dispatchEvent(new Event('canplay'));
			console.groupEnd();
		})();
	}

	protected async _fetch(
		url: string,
	): Promise<any> {
		console.log("BASIC-SCHEDULER: _fetch", url);
		const response = await fetch(url);
		const referenced = await response.json();
		const result = await jsonref.parse(referenced, {
			scope: self.location.href,
		});
		return structuredClone(result);
	}

	// Active MediaAssets.
	protected _joined_cluster: string | undefined = undefined;
	protected _active_media_assets: ScheduleItem[] = [];
	protected _media_list_duration = Duration.fromMillis(0);
	protected _media_list_current: CalendarEvent<RecipeSchema.Playlist> | null = null;
	protected _media_current: ScheduleItemView | null = null;
	protected _media_next: ScheduleItemView | null = null;
	protected _transitionFrom: MediaDecl | null = null;
	protected _transitionTo: MediaDecl | null = null;
	protected _hasInterrupt = false;
	protected _transitionId: string | undefined;
	protected _transitionUrl: string | undefined;
	protected _transitionSize = 0;
	protected _transitionHash: HashDecl | undefined;
	protected _transitionIntegrity: string | undefined;
	protected _transitionMd5: string | undefined;
	protected _transitionTime: number | undefined;
	protected _calendar_schedules: CalendarSchedule[] = [];

	async _clear(): Promise<void> {
		this._currentTime = DateTime.fromMillis(0);
		this._inTransition = false;
		this._transitionStartTime = DateTime.fromMillis(0);
		this._transitionEndTime = DateTime.fromMillis(0);
		this._transitionPercent = 0;
		this._transitionPercentSpeed = 0;

		this._ended = false;
		this._error = null;
		this._networkState = Constants.NETWORK_NO_SOURCE;
		this._paused = true;
		this._readyState = Constants.HAVE_NOTHING;
		this._seeking = false;

		if(typeof this._joined_cluster === "string"
			&& typeof this._leave === "function")
		{
			await this._leave();
			this._joined_cluster = undefined;
		}

		this._active_media_assets = [];
		this._media_list_duration = Duration.fromMillis(0);
		this._media_list_current = null;
		this._media_current = null;
		this._media_next = null;
		this._transitionFrom = null;
		this._transitionTo = null;
		this._hasInterrupt = false;
		this._transitionId = undefined;
		this._transitionUrl = undefined;
		this._transitionSize = 0;
		this._transitionHash = undefined;
		this._transitionIntegrity = undefined;
		this._transitionTime = undefined;

		for(const calendar of this._calendar_schedules) {
			calendar.close();
		}
		this._calendar_schedules = [];
	}

	get currentSrc() {
		if(this._media_current === null) {
			return this._media_current;
		}
		return this._media_current.currentSrc;
	}

	// All MediaDecl's for set of schedules.
	get entries() {
		let entries: MediaDecl[] = [];
		for(const schedule of this._calendar_schedules) {
			entries = entries.concat(schedule.entries);
		}
		return entries;
	}

	// Unique media URLs for set of schedules.
	get sources() {
		const sources: ScopedMediaDecl[] = [];
		if(this._src) {
			sources.push({
				scope: 'schedule',
				entries: [{
					'@type': 'Text',
					id: this._src_id,
					href: this._src,
					size: this._src_size,
					hash: this._src_hash,
					integrity: this._src_integrity,
					md5: this._src_md5,
					duration: 0,
				}],
				isReady: true,
			});
		}
		if(this._transitionId
			&& this._transitionUrl
			&& this._transitionSize
			&& this._transitionHash
			&& this._transitionIntegrity
			&& this._transitionMd5
			&& this._transitionTime)
		{
			sources.push({
				scope: this._transitionId,
				entries: [{
					'@type': 'HTMLImageElement',
					id: this._transitionId,
					href: this._transitionUrl,
					size: this._transitionSize,
					hash: this._transitionHash,
					integrity: this._transitionIntegrity,
					md5: this._transitionMd5,
					duration: this._transitionTime,
				}],
				// TODO: enable transition once it is ready.
				isReady: false,
			});
		}
		for(const schedule of this._calendar_schedules) {
			sources.push({
				scope: schedule.id,
				entries: schedule.entries,
				// Forward getter/setter to calendar schedule.
				get isReady() { return schedule.isReady; },
				set isReady(isReady: boolean) { schedule.isReady = isReady; },
			})
		}
		return sources;
	}

	// Duration of one iteration of content inside the media list,
	// as opposed to the window of playback.
	protected _calculateMediaListIterationDuration(
		calendar_event: CalendarEvent<RecipeSchema.Playlist>,
	): number {
		return calendar_event.data.entries.reduce(
			(accumulator: number, currentValue: any) => accumulator + currentValue.duration,
			0
		);
	}

	protected _calculateMediaListStart(
		datetime: DateTime,
		duration: Duration,
	): DateTime {
		const start_time = datetime.minus({
			milliseconds: datetime.toMillis() % duration.toMillis(),
		});
//		console.log('list-start', datetime.toISO(), duration.toISO(), '->', start_time.toISO());
		return start_time;
	}

	// ScheduleItemView must be in respect to the media list boundary.
	protected _seekMediaList(
		datetime: DateTime,
		calendar_event: CalendarEvent<RecipeSchema.Playlist>,
	): ScheduleItemView | null {
//		console.log("BASIC-SCHEDULER: _seekMediaList", datetime.toISO());
		if(calendar_event.data.entries.length === 0) {
			return null;
		}
		const duration = Duration.fromMillis(1000 * this._calculateMediaListIterationDuration(calendar_event));
		let media_list_start = this._calculateMediaListStart(datetime, duration);
		while(datetime >= media_list_start.plus(duration)) {
			media_list_start = media_list_start.plus(duration);
		}
		let start_offset = Duration.fromMillis(0);
		for(let i = 0; i < calendar_event.data.entries.length; i++) {
			const end_offset = start_offset.plus({ seconds: calendar_event.data.entries[i].duration });
			const entry = new ScheduleItem(calendar_event.id, calendar_event.data.entries[i], start_offset, end_offset);
			const view = new ScheduleItemView(entry, media_list_start);
			if(datetime >= view.start_time
				&& datetime < view.end_time)
			{
				return view;
			}
			start_offset = end_offset;
		}
		return null;
	}

	protected _add(
		eventSeries: string,
		decl: MediaDecl,
	): void {
//		console.log("BASIC-SCHEDULER: _add", decl.toString());
		const start_offset = this._media_list_duration;
		const end_offset = start_offset.plus({ seconds: decl.duration });
//console.log("BASIC-SCHEDULER: start", start_offset.toISO(), "end", end_offset.toISO());
		this._active_media_assets.push(new ScheduleItem(eventSeries, decl, start_offset, end_offset));
		this._media_list_duration = end_offset;
	}

//	protected _has(id: string): boolean {
//		const pos = this.values().findIndex(x => x.decl.id === id);
//		return pos !== -1;
//	}

	protected _remove(
		id: string,
	): void {
//		console.log("BASIC-SCHEDULER: _remove", id);
		const pos = this._active_media_assets.findIndex(x => x.decl.id === id);
		const media_asset = this._active_media_assets[pos];
		this._media_list_duration = this._media_list_duration.minus({ seconds: media_asset.duration });
		this._active_media_assets.splice(pos, 1);
	}

	protected _join: ((decl: RecipeSchema.Cluster) => Promise<void>) | undefined;
	protected _leave: (() => Promise<void>) | undefined;

	exposeNetwork(
		join: (decl: RecipeSchema.Cluster) => Promise<void>,
		leave: () => Promise<void>,
	) {
		this._join = join;
		this._leave = leave;
	}

	protected async _parseRecipe(
		json: any,
	): Promise<void> {
		console.groupCollapsed("BASIC-SCHEDULER: _parseRecipe");

		// Parse and validate through ZOD.
		const recipe = RecipeSchema.Recipe.parse(json);

		if('cluster' in recipe
			&& typeof recipe.cluster === 'object'
			&& typeof this._join === 'function')
		{
			const cluster_as_text = JSON.stringify(recipe.cluster);
			if(typeof this._joined_cluster === 'string'
				&& this._joined_cluster === cluster_as_text)
			{
				console.log("BASIC-SCHEDULER: Already joined cluster.");
			}
			else if(typeof this._leave === 'function')
			{
				await this._leave();
			}
			await this._join(recipe.cluster);
			this._joined_cluster = cluster_as_text;
		}
		else if(typeof this._leave === 'function')
		{
			await this._leave();
			this._joined_cluster = undefined;
		}

		this._transitionId = recipe.transition.id;
		this._transitionUrl = recipe.transition.href;
		this._transitionSize = recipe.transition.size;
		this._transitionHash = recipe.transition.hash;
		this._transitionIntegrity = recipe.transition.integrity;
		this._transitionMd5 = recipe.transition.md5;
		this._transitionTime = recipe.transition.duration;

		const calendar_schedules: CalendarSchedule[] = [];
		let trash_stack: CalendarSchedule[] = [];

		// Copy umodified calendar schedules from running state.
		const running_schedules_by_id = new Map<string, CalendarSchedule>();
		for(const schedule of this._calendar_schedules) {
			running_schedules_by_id.set(schedule.id, schedule);
		}
		for(const decl of recipe.schedule) {
			const calendar_schedule = running_schedules_by_id.get(decl.id);
			if(typeof calendar_schedule !== "undefined") {
				calendar_schedules.push(calendar_schedule);
				running_schedules_by_id.delete(decl.id);
			}
		}
		trash_stack = trash_stack.concat(Array.from(running_schedules_by_id.values()));

		let promises: Promise<any>[] = [];
		const now = DateTime.local();
		const lowWatermark = { 'seconds': 30 };
		let highWatermark = { 'seconds': 90 };
		const t0 = performance.now();
		for(const decl of recipe.schedule) {
			const schedule = new CalendarSchedule(decl, lowWatermark, highWatermark);
			promises.push(schedule.parseSchedule(decl));
			calendar_schedules.push(schedule);
		}
		await Promise.all(promises);

		// preload events, ensuring calculation time is less than 60% of playback time.
		let round = 1;
		let t1 = t0;
		while(true) {
			promises = [];
			for(const schedule of calendar_schedules) {
				schedule.setHighWatermark(highWatermark);
				promises.push(schedule.pull(now));
			}
			console.log(`Round ${round}: High watermark: ${highWatermark.seconds/60} minutes.`);
			await Promise.all(promises);
			const t2 = performance.now();
			const elapsed = (t2 - t1) / 1000;
			const limit = .1 * highWatermark.seconds;
			console.log(`Round ${round}: ${elapsed}s, limit: ${limit}s.`);
			if(elapsed < limit) {
				break;
			}
			t1 = t2;
			highWatermark.seconds *= 2;
			round++;
			if(round >= 8) {  // 768 minutes.
				break;
			}
		}
		const t3 = performance.now();
		console.log(`Schedule parsed after ${(t3 - t0) / 1000}s.`);
		console.groupEnd();

		for(const schedule of calendar_schedules) {
			schedule.prefetch(now);
		}

		this._calendar_schedules = calendar_schedules;

		// FIXME: Needs a close on complete flag to prevent interruption
		// of playing content.
		for(const schedule of trash_stack) {
			schedule.closeWhenHidden();
		}
	}

// ---> current playlist, respect end date within media.
	protected _updateMediaList(
		calendar_event: CalendarEvent<RecipeSchema.Playlist> | null,
	): void {
//		console.log("BASIC-SCHEDULER: _updateMediaList");
		if(calendar_event === null)
		{
			for(const entry of this._active_media_assets) {
				this._remove(entry.decl.id);
			}
		}
		else
		{
			const old_list = this._active_media_assets;
			const new_list = this._createMediaListFromCalendarEvent(calendar_event);
			// dirty playlist needs evaluation.
			const additions = (x: MediaDecl[], y: ScheduleItem[]): MediaDecl[] =>
				x.filter(z => y.findIndex(w => w.decl.id === z.id) === -1);
			const deletions = (x: ScheduleItem[], y: MediaDecl[]): ScheduleItem[] =>
				x.filter(z => y.findIndex(w => w.id === z.decl.id) === -1);
			for(const entry of additions(new_list, old_list)) {
				this._add(calendar_event.id, entry);
			}
			for(const entry of deletions(old_list, new_list)) {
				this._remove(entry.decl.id);
			}
		}
	}

	protected _getMediaListContains(
		datetime: DateTime,
	): CalendarEvent<RecipeSchema.Playlist> | null {
//		console.groupCollapsed("BASIC-SCHEDULER: _getMediaListContains", datetime.toISO());
		const all_events: CalendarEvent<RecipeSchema.Playlist>[] = [];
		for(const schedule of this._calendar_schedules) {
			const event = schedule.getCalendarEvent(datetime);
			if(event === null) {
				continue;
			}
			if(event.contains(datetime)) {
				all_events.push(event);
			}
		}
		// 0 = undefined, 1 = highest priority, 9 = lowest priority.
		// Sort to find the active media list, but does not determine playback boundary.
		all_events.sort((a: CalendarEvent<RecipeSchema.Playlist>, b: CalendarEvent<RecipeSchema.Playlist>): number => {
			const priority = a.priority - b.priority;
			if(priority !== 0) {
				return priority;
			}
			const start = a.start.toMillis() - b.start.toMillis();
			return start;
		});
		const events = all_events.slice(0, 1);
//		console.groupEnd();
		return events.length === 0 ? null : events[0];
	}

	protected _peekMediaListContains(
		datetime: DateTime,
	): CalendarEvent<RecipeSchema.Playlist> | null {
//		console.groupCollapsed("BASIC-SCHEDULER: _peekMediaListContains", datetime.toISO());
		const all_events: CalendarEvent<RecipeSchema.Playlist>[] = [];
		for(const schedule of this._calendar_schedules) {
			const event = schedule.peekCalendarEvent(datetime);
			if(event === null) {
				continue;
			}
			if(event.contains(datetime)) {
				all_events.push(event);
			}
		}
		// 0 = undefined, 1 = highest priority, 9 = lowest priority.
//		console.log("raw", JSON.stringify(all_events.map(x => {
//			return {
//				id: x.shortId,
//				start: x.start.toMillis(),
//				text: x.start.toISO(),
//				priority: x.priority,
//			};
//		})));
		// Sort to find the active media list, but does not determine playback boundary.
		all_events.sort((a: CalendarEvent<RecipeSchema.Playlist>, b: CalendarEvent<RecipeSchema.Playlist>): number => {
			const priority = a.priority - b.priority;
			if(priority !== 0) {
				return priority;
			}
			const start = a.start.toMillis() - b.start.toMillis();
			return start;
		});
//		console.log("sorted", JSON.stringify(all_events.map(x => {
//			return {
//				id: x.shortId,
//				start: x.start.toMillis(),
//				text: x.start.toISO(),
//				priority: x.priority,
//			};
//		})));
		const events = all_events.slice(0, 1);
//		console.groupEnd();
		return events.length === 0 ? null : events[0];
	}

	protected _peekMediaListAfter(
		datetime: DateTime,
	): CalendarEvent<RecipeSchema.Playlist> | null {
//		console.groupCollapsed("BASIC-SCHEDULER: _peekMediaListAfter", datetime.toISO());
		const all_events: CalendarEvent<RecipeSchema.Playlist>[] = [];
		for(const schedule of this._calendar_schedules) {
			const event = schedule.peekCalendarEvent(datetime);
			if(event === null) {
				continue;
			}
			if(event.start >= datetime
				|| event.end >= datetime)
			{
				all_events.push(event);
			}
		}
		all_events.sort((a: CalendarEvent<RecipeSchema.Playlist>, b: CalendarEvent<RecipeSchema.Playlist>): number => {
			const priority = a.priority - b.priority;
			if(priority !== 0) {
				return priority;
			}
			const start = a.start.toMillis() - b.start.toMillis();
			return start;
		});
		const events = all_events.slice(0, 1);
//		console.log("events", all_events);
//		console.groupEnd();
		return events.length === 0 ? null : events[0];
	}

	protected _createMediaListFromCalendarEvent(
		calendar_event: CalendarEvent<RecipeSchema.Playlist>,
	): MediaDecl[] {
		const media_list: MediaDecl[] = [];
		for(const entry of calendar_event.data.entries) {
			switch(entry["@type"]) {
			case "HTMLImageElement":
			case "HTMLVideoElement": {
				const {
					'@type': type, id, href, size, hash, md5, integrity, params, duration
				} = entry;
				media_list.push({ '@type': type, id, href, size, hash, md5, integrity, params, duration });
				break;
			}
			case 'CustomElement': {
				const {
					'@type': type, id, href, size, hash, md5, integrity, params, duration, sources = undefined
				} = entry;
				media_list.push({ '@type': type, id, href, size, hash, md5, integrity, params, duration, sources });
				break;
			}
			default:
				console.warn(`BASIC-SCHEDULER: Unknown media type ${entry["@type"]}`);
				break;
			}
		}
		return media_list;
	}

	protected get _mediaCurrentEndTime(): DateTime {
		if(this._media_current === null) {
			// By definition, end time is infinite.
			return MAX_DATE;
		}
		return this._media_current.end_time;
	}

	protected get _transitionIntroStartTime(): DateTime {
		if(this._media_current === null) {
			// By definition, start time is infinite.
			return MAX_DATE;
		}
		return this._media_current.start_time;
	}

	protected get _transitionIntroEndTime(): DateTime {
		if(this._media_current === null) {
			// By definition, end time is infinite.
			return MAX_DATE;
		}
		if(typeof this._transitionTime === "undefined") {
			throw new Error("transition time is undefined.");
		}
		return this._media_current.start_time.plus({ seconds: this._transitionTime / 2 });
	}

	protected get _transitionOutroStartTime(): DateTime {
		if(this._media_current === null) {
			// By definition, end time is infinite.
			return MAX_DATE;
		}
		if(typeof this._transitionTime === "undefined") {
			throw new Error("transition time is undefined.");
		}
		// Has to be current for calculation post start-time to be valid.
		return this._media_current.end_time.minus({ seconds: this._transitionTime / 2 });
	}

	protected get _transitionOutroEndTime(): DateTime {
		if(this._media_current === null) {
			// By definition, end time is infinite.
			return MAX_DATE;
		}
		return this._media_current.end_time;
	}

	protected get _transitionPreviousOutroStartTime(): DateTime {
		if(this._media_current === null) {
			// By definition, end time is infinite.
			return MAX_DATE;
		}
		if(typeof this._transitionTime === "undefined") {
			throw new Error("transition time is undefined.");
		}
		// Has to be current for calculation post start-time to be valid.
		return this._media_current.start_time.minus({ seconds: this._transitionTime / 2 });
	}
}
