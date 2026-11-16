import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RecipeSchema } from '@dsbunny/recipe-schema';
import { CalendarSchedule } from '../../../src/lib/basic-scheduler.js';

class MockWorker extends EventTarget implements Worker {
	onerror = null;
	onmessage = null;
	onmessageerror = null;
	postMessage(): void {}
	terminate(): void {}
}

class TestCalendarSchedule extends CalendarSchedule {
	protected override _workerFactory(): Worker {
		return new MockWorker();
	}
}

// R1, R3: Override media must be included in the schedule's prepared sources.
describe('recurrence override sources', () => {
	it('includes changed playlist entries without duplicating unchanged ones', async () => {
		const fixture = JSON.parse(await readFile(new URL('../../fixtures/calendar-event.json', import.meta.url), 'utf8'));
		const image = {
			'@type': 'HTMLImageElement',
			asset_id: '00000000-0000-4000-8000-000000000003',
			version: 1,
			name: 'Image',
			href: 'https://fixtures.invalid/original.png',
			size: 20,
			hash: { '@type': 'HashValue', method: 'SHA256', hex: 'abc' },
			md5: 'AAAAAAAAAAAAAAAAAAAAAAAA',
			integrity: 'sha256-example',
			duration: 5,
		};
		const schedule = RecipeSchema.ScheduledPlaylistSchema.parse({
			...fixture,
			playlist: { ...fixture.playlist, entries: [image] },
			recurrenceOverrides: {
				'2024-01-03T10:00:00': { 'playlist/entries/0/href': 'https://fixtures.invalid/other.png' },
				'2024-01-04T10:00:00': {},
				'2024-01-05T10:00:00': { excluded: true },
			},
		});

		const calendar = new TestCalendarSchedule(schedule, { seconds: 1 }, { seconds: 10 });
		const entries = calendar.entries;

		assert.deepEqual(entries.map((entry) => entry.href), [
			'https://fixtures.invalid/original.png',
			'https://fixtures.invalid/other.png',
		]);
		assert.equal(schedule.playlist.entries[0].href, 'https://fixtures.invalid/original.png');
	});
});
