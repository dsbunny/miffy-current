// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as Comlink from 'comlink';
import { default as fetchMock, MockResponseInit } from 'jest-fetch-mock';
// FIXME: VS Code cannot find 'jest' globals.
import { jest, describe, expect, test } from '@jest/globals';
import { DateTime, Duration, Interval } from 'luxon';
import { CalendarEvent, CalendarWorker } from '../lib/occurency';

const transferHandlers = new Map<string, Comlink.TransferHandler<unknown, unknown>>;
const comlinkWrap = jest.fn();
jest.unstable_mockModule('comlink', () => {
	return {
		wrap: comlinkWrap,
		transferHandlers,
	};
});

// Must dynamic import to apply module mock.
const { ScheduleItem, ScheduleItemView, BasicScheduler } = await import('../lib/basic-scheduler');

describe('ScheduleItem', () => {
	test('Can create', () => {
		const eventSeries = "a8d1b7c3-f8ba-482e-9eb1-c034504be17f";
		const decl = {
			"@type": "HTMLImageElement",
			id: "2701cb89-6740-41cf-9865-da17fac65259",
			href: "https://miffy.dsbunny.com/media/椎名林檎台壓封面.jpg",
			size: 1572783,
			hash: {
				method: "SHA256",
				hex: "6bdd5b6b6edcf5b6fde1eef8d3577779cd1ae766dc7fd6f9dfaf78d7af3777ae9b77df5e7786fc6f5774d1a75be3cedf"
			},
			integrity: "sha384-/+X/ecKO6E0/LZiS48/x54C2FYfkqJ+ZfWIHc2GHSMiTr/4HEeRoaSl4n/wkStBI",
			duration: 5,
		};
		const start_offset = Duration.fromMillis(0);
		const end_offset = Duration.fromMillis(decl.duration * 1000);
		const item = new ScheduleItem(eventSeries, decl, start_offset, end_offset);
		expect(item).toBeDefined();
	});
});

describe('ScheduleItemView', () => {
	const eventSeries = "a8d1b7c3-f8ba-482e-9eb1-c034504be17f";
	const decl = {
		"@type": "HTMLImageElement",
		id: "2701cb89-6740-41cf-9865-da17fac65259",
		href: "https://miffy.dsbunny.com/media/椎名林檎台壓封面.jpg",
		size: 1572783,
		hash: {
			method: "SHA256",
			hex: "6bdd5b6b6edcf5b6fde1eef8d3577779cd1ae766dc7fd6f9dfaf78d7af3777ae9b77df5e7786fc6f5774d1a75be3cedf"
		},
		integrity: "sha384-/+X/ecKO6E0/LZiS48/x54C2FYfkqJ+ZfWIHc2GHSMiTr/4HEeRoaSl4n/wkStBI",
		duration: 5,
	};
	test('Zero offset start', () => {
		const start_offset = Duration.fromMillis(0);
		const end_offset = Duration.fromMillis(decl.duration * 1000);
		const item = new ScheduleItem(eventSeries, decl, start_offset, end_offset);
		const window_start = DateTime.local();
		const view = new ScheduleItemView(item, window_start);
		expect(view.start_time).toEqual(window_start);
		expect(view.end_time).toEqual(window_start.plus({ seconds: 5 }));
		expect(view.decl).toEqual(decl);
		expect(view.start_offset.toString()).toMatch("PT0S");
		expect(view.end_offset.toString()).toMatch(`PT${decl.duration}S`);
	});
	test('Non-zero offset start', () => {
		const start_offset = Duration.fromMillis(1234);
		const end_offset = Duration.fromMillis(1234 + decl.duration * 1000);
		const item = new ScheduleItem(eventSeries, decl, start_offset, end_offset);
		const window_start = DateTime.local();
		const view = new ScheduleItemView(item, window_start);
		expect(view.start_time).toEqual(window_start.plus({ seconds: 1, millisecond: 234 }));
		expect(view.end_time).toEqual(window_start.plus({ seconds: 1 + decl.duration, milliseconds: 234 }));
	});
});

async function mockScheduleJson(request: Request): Promise<MockResponseInit> {
	console.log('mock request ....', request.url);
	if(request.url.endsWith('/schedule.json')) {
		return {
			body: `{
	"transition": {
		"@type": "Transition",
		"id": "dc094fbd-20b9-417b-8dce-ce75cb97cac7",
		"href": "https://miffy.dsbunny.com/media/displacement-map.jpg",
		"size": 143244,
                "hash": {
                        "method": "SHA256",
                        "hex": "6db6bcd5ad1aeb9d7a6ddeb7f5c7f8f75ddeedbe757fde3971fe7adf7dbc779e5d6bad1c75df35f1af77df87f7ef8e5c"
                },
                "integrity": "sha384-TtijMyJ33SJDdbi6eApfqScqgrlU6Y8dYGjL3gHym2aVGvhDP28OXBCKiA/VF0tV",
		"duration": 1
	},
	"schedule": [
		{
			"@type": "Event",
			"id": "63526a9e-4949-4f2a-a653-79383c1d5d98",
			"priority": 1,
			"start": "2020-07-04T17:00:00",
			"timeZone": "America/New_York",
			"duration": "PT40S",
			"playlist": { "$ref": "#/$defs/my-playlist" },
			"recurrenceRules": [{
				"@type": "RecurrenceRule",
				"frequency": "minutely",
				"interval": 1
			}]
		}, {
			"@type": "Event",
			"id": "a8d1b7c3-f8ba-482e-9eb1-c034504be17f",
			"priority": 9,
			"start": "1900-01-01T00:00:00",
			"duration": "P1D",
			"playlist": { "$ref": "#/$defs/default" },
			"recurrenceRules": [{
				"@type": "RecurrenceRule",
				"frequency": "daily"
			}]
		}
	],
	"$defs": {
		"default": {
			"@type": "Playlist",
			"entries": [{
				"@type": "HTMLImageElement",
				"id": "2701cb89-6740-41cf-9865-da17fac65259",
				"href": "https://miffy.dsbunny.com/media/椎名林檎台壓封面.jpg",
				"size": 1572783,
                                "hash": {
                                        "method": "SHA256",
                                        "hex": "6bdd5b6b6edcf5b6fde1eef8d3577779cd1ae766dc7fd6f9dfaf78d7af3777ae9b77df5e7786fc6f5774d1a75be3cedf"
                                },
                                "integrity": "sha384-/+X/ecKO6E0/LZiS48/x54C2FYfkqJ+ZfWIHc2GHSMiTr/4HEeRoaSl4n/wkStBI",
				"duration": 5
			},{
				"@type": "HTMLImageElement",
				"id": "b49a5647-3806-42de-9e34-01be1f6851a2",
				"href": "https://miffy.dsbunny.com/media/三毒史.jpg",
				"size": 159786,
                                "hash": {
                                        "method": "SHA256",
                                        "hex": "e1b775f3c71ee79d9a739ef4e776bcd1f779739e78f1fe5edb7eb871ee9dd5a6f67797bcd9ae756bdf79f7be9b71d79c"
                                },
                                "integrity": "sha384-qGcHv8KOn+vQMn1FayEwHIfpEkfsAX8VSMvto/H9pewWOqjMOXJkoQtAB+WIWA61",
				"duration": 5
			}]
		},
		"my-playlist": {
			"@type": "Playlist",
			"entries": [{
				"@type": "HTMLImageElement",
				"id": "91a25e27-af63-46e0-81a4-95869e5b6486",
				"href": "https://miffy.dsbunny.com/media/color%20the%20cover.jpg",
				"size": 66917,
                                "hash": {
                                        "method": "SHA256",
                                        "hex": "6b67dfededfb738f35d1cebadb9df571ed74df5f1a69c738dbbf1a6bcdddf1a7def5e737d7877deb57db75c69dd5ce7d"
                                },
                                "integrity": "sha384-vQzCK4eZTl1licPykO58UWDwRJOxLfwbv1ILlhOhByn1SdRluJiH5kSP7OCKgKJ1",
				"duration": 5
			}, {
				"@type": "CustomElement",
				"id": "0c8f3cc3-7d9f-41e4-abf3-fc23a1b25728",
				"href": "https://miffy.dsbunny.com/app/dist/bundle.mjs",
				"size": 2280,
                                "hash": {
                                        "method": "SHA256",
                                        "hex": "f7df5a71fe1cf74f5ef3be3b6dce1cedfef5df56f8f37eb57ba6daf38d1e7fdebcddc7bdf1d75b7b6f767347baf5b6db"
                                },
                                "integrity": "sha384-2y1up6izt0ppd1PI/N3VaDmyJn3jylloJG2zwOceoCajY9sR7yz1ER9FvtFuq1q6",
				"duration": 5
			}, {
				"@type": "HTMLVideoElement",
				"id": "7adc9b4f-1173-4076-9dc7-4284a691aa26",
				"href": "https://miffy.dsbunny.com/media/Bold.%20Beautiful.%20Sustainable.%20%23POPsurf-i3JqnlOu5wo.mp4",
				"size": 3705200,
                                "hash": {
                                        "method": "SHA256",
                                        "hex": "d7b6fa77de9dd1ef7de5fe1b6dadb9db6f757fc737db5d5c737d5c69ed78d38e75ef47de79b6b873571bddcd9b6dd6da"
                                },
                                "integrity": "sha384-w+mUtHRnMnQJRvMkjayUYYDlRq4yoXkiWY2na0+Y1s0jsEsztSbxa0dddf09oqM6",
				"duration": 30
			}]
		}
	}
}`,
			headers: {
				'Content-Type': 'application/json',
			}
		} as MockResponseInit;
	} else {
		return {
			status: 404,
			body: 'not found',
		} as MockResponseInit;
	}
}

describe('BasicScheduler', () => {
	const parseSchedule = jest.fn<CalendarWorker['parseSchedule']>();
	const getEvents = jest.fn<CalendarWorker['getEvents']>();
	beforeEach(() => {
		parseSchedule.mockReset();
		getEvents.mockReset();
		comlinkWrap.mockReset();
		comlinkWrap.mockImplementation(() => {
			return { parseSchedule, getEvents };
		});
		transferHandlers.clear();
	});
	test('Simple load', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		const promises: Promise<void>[] = [];
		promises.push(new Promise<void>(resolve => {
			scheduler.addEventListener('loadstart', event => {
				expect(event).toBeTruthy();
				resolve();
			});
		}));
		promises.push(new Promise<void>(resolve => {
			scheduler.addEventListener('loadedmetadata', event => {
				expect(event).toBeTruthy();
				resolve();
			});
		}));
		promises.push(new Promise<void>(resolve => {
			scheduler.addEventListener('canplay', event => {
				expect(event).toBeTruthy();
				resolve();
			});
		}));
		promises.push(new Promise<void>(resolve => {
			scheduler.addEventListener('loadeddata', event => {
				expect(event).toBeTruthy();
				resolve();
			});
		}));
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents(${startTime.toISO()}, ${endTime.toISO()})`);
			return [];
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		scheduler.load();
		await Promise.all(promises);
		scheduler.close();
		expect(parseSchedule).toHaveBeenCalledTimes(2);
		expect(getEvents).toHaveBeenCalledTimes(4);
	});
	test('Simple load-play', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		const play = jest.fn();
		scheduler.addEventListener('play', play);
		const playing = jest.fn();
		scheduler.addEventListener('playing', playing);
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents(${startTime.toISO()}, ${endTime.toISO()})`);
			return [];
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		scheduler.load();
		await expect(scheduler.play()).resolves.toBeUndefined();
		expect(play).toHaveBeenCalledWith(expect.any(Event));
		expect(playing).toHaveBeenCalledWith(expect.any(Event));
		scheduler.close();
		expect(parseSchedule).toHaveBeenCalledTimes(4);
		expect(getEvents).toHaveBeenCalledTimes(8);
	});
	test('Simply play', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		const play = jest.fn();
		scheduler.addEventListener('play', play);
		const playing = jest.fn();
		scheduler.addEventListener('playing', playing);
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents(${startTime.toISO()}, ${endTime.toISO()})`);
			return [];
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		await expect(scheduler.play()).resolves.toBeUndefined();
		expect(play).toHaveBeenCalledWith(expect.any(Event));
		expect(playing).toHaveBeenCalledWith(expect.any(Event));
		scheduler.close();
		expect(parseSchedule).toHaveBeenCalledTimes(2);
		expect(getEvents).toHaveBeenCalledTimes(4);
	});
	test("Auto-play", done => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = true;
		const play = jest.fn();
		scheduler.addEventListener('play', play);
		const playing = jest.fn(() => {
			expect(play).toHaveBeenCalledWith(expect.any(Event));
			expect(playing).toHaveBeenCalledWith(expect.any(Event));
			scheduler.close();
			expect(parseSchedule).toHaveBeenCalledTimes(2);
			expect(getEvents).toHaveBeenCalledTimes(4);
			done();
		});
		scheduler.addEventListener('playing', playing);
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents(${startTime.toISO()}, ${endTime.toISO()})`);
			return [];
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
	});
	test('Error loading', done => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/invalid.json";
		const play = jest.fn();
		scheduler.addEventListener('play', play);
		const error = jest.fn(() => {
			expect(play).not.toHaveBeenCalledWith(expect.any(Event));
			expect(error).toHaveBeenCalledWith(expect.any(Event));
			scheduler.close();
			expect(parseSchedule).toHaveBeenCalledTimes(0);
			expect(getEvents).toHaveBeenCalledTimes(0);
			done();
		});
		scheduler.addEventListener('error', error);
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		scheduler.load();
	});
	test('Play, seeking, playing', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		scheduler.currentTime = DateTime.fromISO('2020-01-01T00:00:00');
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents(${startTime.toISO()}, ${endTime.toISO()})`);
			return [];
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		await expect(scheduler.play()).resolves.toBeUndefined();
		const datetime = DateTime.fromISO('2020-07-04T17:00:00');  // "my-playlist"
		expect(+datetime).toBeGreaterThan(+scheduler.currentTime);  // Coerce to avoid typing issues.
		const seeking = jest.fn();
		scheduler.addEventListener('seeking', seeking);
		let done: any;
		const promise = new Promise(resolve => { done = resolve; });
		const playing = jest.fn(() => done());
		scheduler.addEventListener('playing', playing);
		await scheduler.update(datetime);
		await promise;
		expect(seeking).toHaveBeenCalledWith(expect.any(Event));
		expect(playing).toHaveBeenCalledWith(expect.any(Event));
		scheduler.close();
		expect(parseSchedule).toHaveBeenCalledTimes(2);
		expect(getEvents).toHaveBeenCalledTimes(8);
	});
	const playlist = {
		'@type': 'Playlist',
		entries: [{
			'@type': 'HTMLImageElement',
			id: '91a25e27-af63-46e0-81a4-95869e5b6486',
			href: 'https://miffy.dsbunny.com/media/color%20the%20cover.jpg',
			size: 66917,
			hash: {
				method: "SHA256",
				hex: "6b67dfededfb738f35d1cebadb9df571ed74df5f1a69c738dbbf1a6bcdddf1a7def5e737d7877deb57db75c69dd5ce7d"
			},
                        integrity: "sha384-vQzCK4eZTl1licPykO58UWDwRJOxLfwbv1ILlhOhByn1SdRluJiH5kSP7OCKgKJ1",
			duration: 5,
		}, {
			'@type': 'CustomElement',
			id: '0c8f3cc3-7d9f-41e4-abf3-fc23a1b25728',
			href: 'https://miffy.dsbunny.com/app/dist/bundle.mjs',
			size: 2280,
			hash: {
				method: "SHA256",
				hex: "f7df5a71fe1cf74f5ef3be3b6dce1cedfef5df56f8f37eb57ba6daf38d1e7fdebcddc7bdf1d75b7b6f767347baf5b6db"
			},
			integrity: "sha384-2y1up6izt0ppd1PI/N3VaDmyJn3jylloJG2zwOceoCajY9sR7yz1ER9FvtFuq1q6",
			duration: 5,
		}, {
			'@type': 'HTMLVideoElement',
			id: '7adc9b4f-1173-4076-9dc7-4284a691aa26',
			href: 'https://miffy.dsbunny.com/media/Bold.%20Beautiful.%20Sustainable.%20%23POPsurf-i3JqnlOu5wo.mp4',
			size: 3705200,
			hash: {
				method: "SHA256",
				hex: "d7b6fa77de9dd1ef7de5fe1b6dadb9db6f757fc737db5d5c737d5c69ed78d38e75ef47de79b6b873571bddcd9b6dd6da"
			},
			integrity: "sha384-w+mUtHRnMnQJRvMkjayUYYDlRq4yoXkiWY2na0+Y1s0jsEsztSbxa0dddf09oqM6",
			duration: 30,
		}],
	};
	const interval = Interval.fromISO('2020-07-04T17:00:00.000-00:00/2020-07-04T17:06:00.000-00:00');
	test('Transition', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		const datetime = DateTime.fromISO('2020-07-04T17:00:00');  // "my-playlist"
		scheduler.currentTime = datetime;
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents ${startTime.toISO()}/${endTime.toISO()}`);
			if(interval.engulfs(Interval.fromDateTimes(startTime, endTime))) {
				return [
					new CalendarEvent(
						'63526a9e-4949-4f2a-a653-79383c1d5d98',
						null,
						playlist,
						DateTime.fromISO('2020-07-04T17:00:00.000-00:00'),
						DateTime.fromISO('2020-07-04T17:00:40.000-00:00'),
						1
					),
				];
			} else {
				console.log("Returning []");
				return [];
			}
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		await expect(scheduler.play()).resolves.toBeUndefined();
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:00'));
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/media/color%20the%20cover.jpg");
		await scheduler.update(datetime.plus({ seconds: 4 }));
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:04'));
		expect(scheduler.debugInTransition).toBe(false);
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/media/color%20the%20cover.jpg");
		await scheduler.update(datetime.plus({ seconds: 4, milliseconds: 500 }));
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:04.500'));
		expect(scheduler.debugInTransition).toBe(true);
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/media/color%20the%20cover.jpg");
		await scheduler.update(datetime.plus({ seconds: 5 }));
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:05'));
		expect(scheduler.debugInTransition).toBe(true);
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/app/dist/bundle.mjs");
		await scheduler.update(datetime.plus({ seconds: 5, milliseconds: 500 }));
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:05.500'));
		expect(scheduler.debugInTransition).toBe(false);
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/app/dist/bundle.mjs");
		scheduler.close();
		expect(parseSchedule).toHaveBeenCalledTimes(2);
		expect(getEvents).toHaveBeenCalled();
	});
	test('Start to in-transition', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		const datetime = DateTime.fromISO('2020-07-04T17:00:00');  // "my-playlist"
		scheduler.currentTime = datetime;
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents ${startTime.toISO()}/${endTime.toISO()}`);
			if(interval.engulfs(Interval.fromDateTimes(startTime, endTime))) {
				return [
					new CalendarEvent(
						'63526a9e-4949-4f2a-a653-79383c1d5d98',
						null,
						playlist,
						DateTime.fromISO('2020-07-04T17:00:00.000-00:00'),
						DateTime.fromISO('2020-07-04T17:00:40.000-00:00'),
						1
					),
				];
			} else {
				console.log("Returning []");
				return [];
			}
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		await expect(scheduler.play()).resolves.toBeUndefined();
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:00'));
		await scheduler.update(datetime.plus({ seconds: 4, milliseconds: 500 }));
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:04.500'));
		expect(scheduler.debugInTransition).toBe(true);
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/media/color%20the%20cover.jpg");
		expect(parseSchedule).toHaveBeenCalledTimes(2);
		expect(getEvents).toHaveBeenCalled();
	});
	test('Start to post-current', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		const datetime = DateTime.fromISO('2020-07-04T17:00:00');  // "my-playlist"
		scheduler.currentTime = datetime;
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents ${startTime.toISO()}/${endTime.toISO()}`);
			if(interval.engulfs(Interval.fromDateTimes(startTime, endTime))) {
				return [
					new CalendarEvent(
						'63526a9e-4949-4f2a-a653-79383c1d5d98',
						null,
						playlist,
						DateTime.fromISO('2020-07-04T17:00:00.000-00:00'),
						DateTime.fromISO('2020-07-04T17:00:40.000-00:00'),
						1
					),
				];
			} else {
				console.log("Returning []");
				return [];
			}
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		await expect(scheduler.play()).resolves.toBeUndefined();
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:00'));
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/media/color%20the%20cover.jpg");
		await scheduler.update(datetime.plus({ seconds: 5 }));
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:05'));
		expect(scheduler.debugInTransition).toBe(true);
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/app/dist/bundle.mjs");
		expect(parseSchedule).toHaveBeenCalledTimes(2);
		expect(getEvents).toHaveBeenCalled();
	});
	test('Start to post-transition', async () => {
		fetchMock.mockIf(/^https:\/\/miffy.dsbunny.com\/.*$/, mockScheduleJson);
		const scheduler = new BasicScheduler();
		scheduler.autoplay = false;
		scheduler.src = "https://miffy.dsbunny.com/schedule.json";
		const datetime = DateTime.fromISO('2020-07-04T17:00:00');  // "my-playlist"
		scheduler.currentTime = datetime;
		parseSchedule.mockImplementation((_json: any) => {
			console.log(`parseSchedule`);
		});
		getEvents.mockImplementation((startTime: DateTime, endTime: DateTime) => {
			console.log(`getEvents ${startTime.toISO()}/${endTime.toISO()}`);
			if(interval.engulfs(Interval.fromDateTimes(startTime, endTime))) {
				return [
					new CalendarEvent(
						'63526a9e-4949-4f2a-a653-79383c1d5d98',
						null,
						playlist,
						DateTime.fromISO('2020-07-04T17:00:00.000-00:00'),
						DateTime.fromISO('2020-07-04T17:00:40.000-00:00'),
						1
					),
				];
			} else {
				console.log("Returning []");
				return [];
			}
		});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		await expect(scheduler.play()).resolves.toBeUndefined();
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:00'));
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/media/color%20the%20cover.jpg");
		await scheduler.update(datetime.plus({ seconds: 5, milliseconds: 500 }));
		expect(scheduler.currentTime).toEqual(DateTime.fromISO('2020-07-04T17:00:05.500'));
		expect(scheduler.debugInTransition).toBe(false);
		expect(scheduler.currentSrc).toMatch("https://miffy.dsbunny.com/app/dist/bundle.mjs");
		expect(parseSchedule).toHaveBeenCalledTimes(2);
		expect(getEvents).toHaveBeenCalled();
	});
});
