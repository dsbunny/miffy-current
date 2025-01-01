// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Interface for a scheduler.

import { DateTime } from 'luxon';
import { HashDecl, MediaDecl, ScopedMediaDecl } from '../lib/media.js';

export class Constants {
	static readonly NETWORK_EMPTY = 0;
	static readonly NETWORK_IDLE = 1;
	static readonly NETWORK_LOADING = 2;
	static readonly NETWORK_NO_SOURCE = 3;

	static readonly HAVE_NOTHING = 0;
	static readonly HAVE_METADATA = 1;
	static readonly HAVE_CURRENT_DATA = 2;
	static readonly HAVE_FUTURE_DATA = 3;
	static readonly HAVE_ENOUGH_DATA = 4;
}

export interface Scheduler extends EventTarget {
	autoplay: boolean;
	mergePlaylist: boolean;
	src: string;
	src_id: string;
	src_size: number;
	src_hash: HashDecl | undefined;
	src_integrity: string;
	src_md5: string;
	sources: ScopedMediaDecl[];

	close(): void;
	play(): Promise<void>;
	update(datetime: DateTime): void;
	state(timestamp: DateTime): SchedulerState;
	exposeNetwork(join: (decl: object) => Promise<void>, leave: () => Promise<void>): void;
}

export interface SchedulerAssetDecl {
	decl: MediaDecl;
}

export interface SchedulerAssetDeclWithRemainingTime extends SchedulerAssetDecl {
	remainingTimeMs: number | string;
}

export interface SchedulerAssetTransition {
	from: SchedulerAssetDecl;
	to: SchedulerAssetDecl;
	url: string;
	percent: number;
	percentSpeed: number;
}

export interface PlaylistDecl {
	'@type': string;
	id: string;
	href: string;
	duration: number;
}

export interface RecurrenceDecl {
	'@type': string;
	frequency: string;
	interval: number;
}

export interface EventSeriesDecl {
	'@type': string;
	id: string;
	priority: number;
	start: string;
	timeZone: string;
	duration: number;
	playlist: PlaylistDecl;
	recurrenceRules: RecurrenceDecl;
}

export interface EventSeriesSummary {
	id: string;
	pct: number;
	queue: any[];
}

export interface MediaListSummary {
	id: string;
	start: string;
	end: string;
}

export interface SchedulerState {
	currentTime: string;
	eventSeries: EventSeriesSummary[];
	mediaList: MediaListSummary[];
	mediaCurrent: SchedulerAssetDeclWithRemainingTime | null;
	mediaNext: SchedulerAssetDeclWithRemainingTime | null;
	transition: SchedulerAssetTransition | null;
}
