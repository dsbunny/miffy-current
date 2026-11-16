import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { transformTypeScript } from '../helpers/instrument.mjs';

declare global {
	interface Window {
		testWorkers?: { terminated: boolean; calls: string[] }[];
	}
}

// R7, R9: Custom-element playback and cleanup in an isolated browser.
describe('web playlist', () => {
	it('initializes, starts and releases its worker on removal', async () => {
		const coverageDir = process.env.MIFFY_COVERAGE_DIR;
		const sourceRoot = path.resolve('src') + path.sep;
		const result = await build({
			entryPoints: ['src/elements/web-bundle.ts'],
			bundle: true,
			format: 'esm',
			platform: 'browser',
			tsconfig: 'common-tsconfig.json',
			write: false,
			logLevel: 'silent',
			plugins: coverageDir ? [{
				name: 'instrument-first-party',
				setup(plugin) {
					plugin.onLoad({ filter: /\.ts$/ }, async (args) => {
						if (!args.path.startsWith(sourceRoot)) return;
						const transformed = await transformTypeScript(args.path, true);
						return { contents: transformed.code, loader: 'js', resolveDir: path.dirname(args.path) };
					});
				},
			}] : [],
		});
		const browser = await chromium.launch();
		try {
			const context = await browser.newContext({ serviceWorkers: 'block' });
			try {
				const page = await context.newPage();
				page.setDefaultTimeout(5000);
				const unexpected: string[] = [];
				const errors: string[] = [];
				page.on('pageerror', (error) => errors.push(error.message));
				await page.route('**/*', (route) => {
					const url = route.request().url();
					if (url === 'https://fixtures.invalid/') {
						return route.fulfill({
							contentType: 'text/html',
							body: '<!doctype html><web-play-list></web-play-list><script type="module" src="/bundle.js"></script>',
						});
					}
					if (url === 'https://fixtures.invalid/bundle.js') {
						return route.fulfill({ contentType: 'text/javascript', body: result.outputFiles[0].text });
					}
					unexpected.push(url);
					return route.abort();
				});
				await page.addInitScript({ content: `
					const RealDate = Date;
					window.Date = class extends RealDate {
						constructor(...args) {
							if (args.length) super(...args);
							else super('2024-01-01T00:00:00Z');
						}
						static now() { return RealDate.parse('2024-01-01T00:00:00Z'); }
					};
					Object.defineProperty(performance, 'now', { value: () => 0 });
					const workers = [];
					Object.assign(window, { testWorkers: workers });
					class FakeWorker extends EventTarget {
						constructor() {
							super();
							this.terminated = false;
							this.calls = [];
							workers.push(this);
						}
						postMessage(message) {
							this.calls.push(message.path?.join('.') ?? '');
							queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', {
								data: { id: message.id, type: 'RAW', value: undefined },
							})));
						}
						terminate() { this.terminated = true; }
					}
					Object.defineProperty(window, 'Worker', { value: FakeWorker });
					Object.defineProperty(navigator, 'serviceWorker', {
						value: {
							controller: null,
							addEventListener() {},
							startMessages() {},
							async register() { return { addEventListener() {} }; },
						},
					});
					window.requestAnimationFrame = () => 1;
					window.cancelAnimationFrame = () => {};
					window.requestIdleCallback = () => 1;
					window.cancelIdleCallback = () => {};
					window.fetch = async () => { throw new Error('Unexpected fetch'); };
					window.WebSocket = class { constructor() { throw new Error('Unexpected WebSocket'); } };
					window.RTCPeerConnection = class { constructor() { throw new Error('Unexpected WebRTC'); } };
				` });

				await page.goto('https://fixtures.invalid/');
				await page.waitForFunction(() => customElements.get('web-play-list') !== undefined);
				const state = await page.evaluate(async () => {
					const element = document.querySelector('web-play-list') as HTMLElement & {
						updateComplete: Promise<boolean>;
						play(): Promise<void>;
						playing: boolean;
					};
					await element.updateComplete;
					await element.play();
					const playing = element.playing;
					element.remove();
					const workers = window.testWorkers;
					if (!workers?.length) throw new Error('No fake worker was created');
					return { playing, worker: workers[0] };
				});

				assert.equal(state.playing, true);
				assert.equal(state.worker.terminated, true);
				assert.ok(state.worker.calls.includes('play'));
				assert.deepEqual(unexpected, []);
				assert.deepEqual(errors, []);
				if (coverageDir) {
					const browserCoverage = await page.evaluate(() =>
						(globalThis as typeof globalThis & { __coverage__?: object }).__coverage__);
					assert.ok(browserCoverage, 'Browser coverage was not collected');
					await writeFile(path.join(coverageDir, `${process.pid}-browser.json`), JSON.stringify(browserCoverage));
				}
			} finally {
				await context.close();
			}
		} finally {
			await browser.close();
		}
	});
});
