import { DateTime, Duration } from 'luxon';
import { RecipeSchema } from '@dsbunny/recipe-schema';

type Override = {
	recurrenceId: DateTime;
	event: {
		start: DateTime;
		end: DateTime;
		priority: number;
		playlist: RecipeSchema.Playlist;
	} | null;
};

function parseDateTime(value: string, zone: string): DateTime {
	const date = DateTime.fromISO(value, { zone });
	if(!date.isValid) {
		throw new Error(`Invalid recurrence override date or time zone: ${value} (${zone}).`);
	}
	if(/(?:Z|[+-]\d\d:\d\d)$/.test(value)) {
		return date;
	}
	return date.getPossibleOffsets().reduce((first, candidate) =>
		candidate.toMillis() < first.toMillis() ? candidate : first, date);
}

function applyPatch(target: Record<string, unknown>, patch: Record<string, unknown>): void {
	const paths = Object.keys(patch).map((path) => {
		if(/~(?![01])/.test(path)) {
			throw new Error(`Invalid recurrence override path: ${path}.`);
		}
		const tokens = path.split('/').map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));
		if(!['start', 'timeZone', 'duration', 'priority', 'playlist'].includes(tokens[0])
			|| tokens.some((token) => ['__proto__', 'prototype', 'constructor'].includes(token)))
		{
			throw new Error(`Unsupported recurrence override path: ${path}.`);
		}
		return { path, tokens };
	});

	for(const { path, tokens } of paths) {
		if(paths.some((other) => other.path !== path
			&& other.tokens.length < tokens.length
			&& other.tokens.every((token, index) => token === tokens[index])))
		{
			throw new Error(`Conflicting recurrence override path: ${path}.`);
		}
		let parent: unknown = target;
		for(const token of tokens.slice(0, -1)) {
			if(parent === null || typeof parent !== 'object'
				|| !Object.prototype.hasOwnProperty.call(parent, token))
			{
				throw new Error(`Invalid recurrence override path: ${path}.`);
			}
			if(Array.isArray(parent) && (!/^(0|[1-9]\d*)$/.test(token) || Number(token) >= parent.length)) {
				throw new Error(`Invalid recurrence override array index: ${path}.`);
			}
			parent = (parent as Record<string, unknown>)[token];
		}
		if(parent === null || typeof parent !== 'object') {
			throw new Error(`Invalid recurrence override path: ${path}.`);
		}
		const key = tokens[tokens.length - 1];
		const value = patch[path];
		if(Array.isArray(parent)) {
			if(!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= parent.length || value === null) {
				throw new Error(`Invalid recurrence override array index: ${path}.`);
			}
			parent[Number(key)] = value;
		} else if(value === null) {
			delete (parent as Record<string, unknown>)[key];
		} else {
			(parent as Record<string, unknown>)[key] = value;
		}
	}
}

function equalJSON(a: unknown, b: unknown): boolean {
	if(a === b) return true;
	if(a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
	if(Array.isArray(a) || Array.isArray(b)) {
		return Array.isArray(a) && Array.isArray(b)
			&& a.length === b.length && a.every((value, index) => equalJSON(value, b[index]));
	}
	const left = Object.entries(a);
	const right = Object.entries(b);
	return left.length === right.length && left.every(([key, value]) =>
		Object.prototype.hasOwnProperty.call(b, key) && equalJSON(value, (b as Record<string, unknown>)[key]));
}

export function parseRecurrenceOverrides(schedule: RecipeSchema.ScheduledPlaylist): Override[] {
	const overrides: Override[] = [];
	const instants = new Set<number>();
	const { recurrenceOverrides, ...base } = schedule;
	for(const [id, patch] of Object.entries(recurrenceOverrides ?? {})) {
		if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(id)) {
			throw new Error(`Invalid recurrence override ID: ${id}.`);
		}
		const recurrenceId = parseDateTime(id, schedule.timeZone);
		if(instants.has(recurrenceId.toMillis())) {
			throw new Error(`Duplicate recurrence override instant: ${id}.`);
		}
		instants.add(recurrenceId.toMillis());
		if('excluded' in patch) {
			if(patch.excluded !== true || Object.keys(patch).length !== 1) {
				throw new Error(`Invalid excluded recurrence override: ${id}.`);
			}
			overrides.push({ recurrenceId, event: null });
			continue;
		}

		const patched: Record<string, unknown> = JSON.parse(JSON.stringify(base));
		applyPatch(patched, patch);
		const hasStart = Object.prototype.hasOwnProperty.call(patch, 'start');
		const overrideStart = hasStart ? patched.start : id;
		if(typeof patched.timeZone !== 'string' || typeof overrideStart !== 'string') {
			throw new Error(`Invalid recurrence override date or time zone: ${id}.`);
		}
		if(hasStart && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(overrideStart)
			&& !RecipeSchema.ScheduledPlaylistSchema.shape.start.safeParse(overrideStart).success)
		{
			throw new Error(`Invalid recurrence override start: ${id}.`);
		}
		const start = parseDateTime(overrideStart, patched.timeZone);
		const startISO = start.toUTC().toISO();
		if(startISO === null) {
			throw new Error(`Invalid recurrence override start: ${id}.`);
		}
		patched.start = startISO;
		const validated = RecipeSchema.ScheduledPlaylistSchema.parse(patched);
		for(const [path, value] of Object.entries(patch)) {
			if(path === 'start') continue;
			let actual: unknown = validated;
			for(const token of path.split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))) {
				if(actual === null || typeof actual !== 'object'
					|| !Object.prototype.hasOwnProperty.call(actual, token))
				{
					actual = undefined;
					break;
				}
				actual = (actual as Record<string, unknown>)[token];
			}
			if(value === null ? actual !== undefined : !equalJSON(value, actual)) {
				throw new Error(`Unsupported recurrence override value: ${path}.`);
			}
		}
		const duration = Duration.fromISO(validated.duration);
		if(!duration.isValid || duration.toMillis() < 0) {
			throw new Error(`Invalid recurrence override duration: ${id}.`);
		}
		overrides.push({
			recurrenceId,
			event: { start, end: start.plus(duration), priority: validated.priority, playlist: validated.playlist },
		});
	}
	return overrides;
}

export function getScheduleEntries(schedule: RecipeSchema.ScheduledPlaylist): RecipeSchema.PlaylistEntry[] {
	const entries = [...schedule.playlist.entries];
	const seen = new Set(entries.map((entry) => JSON.stringify(entry)));
	for(const override of parseRecurrenceOverrides(schedule)) {
		for(const entry of override.event?.playlist.entries ?? []) {
			const key = JSON.stringify(entry);
			if(!seen.has(key)) {
				seen.add(key);
				entries.push(entry);
			}
		}
	}
	return entries;
}
