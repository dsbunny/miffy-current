// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import sourcemaps from 'rollup-plugin-sourcemaps';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from "rollup-plugin-dts";
import copy from 'rollup-plugin-copy';
import summary from 'rollup-plugin-summary';

export default [
{
	input: [
		'build/src/elements/web-bundle.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		commonjs(),
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		copy({
			targets: [
				{ src: 'src/manifest.json', dest: 'dist' },
			],
			hook: 'writeBundle',
		}),
		summary(),
	],
	external: [
		'@dsbunny/publisher-schema',
                'three',
		'zod/v4',
        ],
	output: {
		file: 'dist/web.bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
}, {
	input: [
		'build/src/elements/web-bundle.d.ts',
	],
	plugins: [
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		commonjs(),
		dts(),
		summary(),
	],
	external: [
                '@dsbunny/publisher-schema',
                'three',
		'zod/v4',
        ],
	output: {
		file: 'dist/web.bundle.d.ts',
		format: 'esm',
	},
}, {
	input: [
		'build/src/elements/brightsign-bundle.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		commonjs(),
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		summary(),
	],
	external: [
                '@dsbunny/publisher-schema',
                'three',
		'zod/v4',
        ],
	output: {
		file: 'dist/brightsign.bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
}, {
	input: [
		'build/src/elements/brightsign-bundle.d.ts',
	],
	plugins: [
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		commonjs(),
		dts(),
		summary(),
	],
	external: [
                '@dsbunny/publisher-schema',
                'three',
		'zod/v4',
        ],
	output: {
		file: 'dist/brightsign.bundle.d.ts',
		format: 'esm',
	},
},
{
	input: [
		'build/src/elements/luna-play-list.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		commonjs(),
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		summary(),
	],
	external: [
                '@dsbunny/publisher-schema',
                'three',
		'zod/v4',
        ],
	output: {
		file: 'dist/luna.bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
}, {
	input: [
		'build/src/elements/luna-play-list.d.ts',
	],
	plugins: [
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		commonjs(),
		dts(),
		summary(),
	],
	external: [
                '@dsbunny/publisher-schema',
                'three',
		'zod/v4',
        ],
	output: {
		file: 'dist/luna.bundle.d.ts',
		format: 'esm',
	},
}, {
	input: [
		'build/src/workers/scheduler.worker.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		commonjs(),
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		summary(),
	],
	external: [
        ],
	output: {
		file: 'dist/scheduler.bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
}, {
	input: [
		'build/src/workers/calendar.worker.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		commonjs(),
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		summary(),
	],
	external: [
        ],
	output: {
		file: 'dist/calendar.bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
}, {
	input: [
		'build/src/workers/prefetch.service-worker.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		commonjs(),
		resolve({
			moduleDirectories: [
				'third-party',
				'node_modules',
			],
		}),
		summary(),
	],
	external: [
        ],
	output: {
		file: 'dist/prefetch.bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
}];
