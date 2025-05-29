// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import sourcemaps from 'rollup-plugin-sourcemaps';
import summary from 'rollup-plugin-summary';

export default [
{
	input: [
		'build/src/elements/web-play-list.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party'
			],
		}),
		summary(),
	],
	external: [
                'three',
        ],
	output: {
		file: 'dist/web.bundle.mjs',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
},
{
	input: [
		'build/src/elements/webgl-play-list.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party'
			],
		}),
		summary(),
	],
	external: [
                'three',
        ],
	output: {
		file: 'dist/webgl.bundle.mjs',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
},
{
	input: [
		'build/src/elements/brightsign-play-list.js',
	],
	onwarn(warning) {
		if (warning.code !== 'THIS_IS_UNDEFINED') {
			console.error(`(!) ${warning.message}`);
		}
	},
	plugins: [
		sourcemaps(),
		replace({'Reflect.decorate': 'undefined', preventAssignment: true}),
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party'
			],
		}),
		summary(),
	],
	external: [
                'three',
        ],
	output: {
		file: 'dist/brightsign.bundle.mjs',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
},
{
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
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party'
			],
		}),
		summary(),
	],
	external: [
                'three',
        ],
	output: {
		file: 'dist/scheduler.bundle.mjs',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
},
{
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
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party'
			],
		}),
		summary(),
	],
	external: [
                'three',
        ],
	output: {
		file: 'dist/calendar.bundle.mjs',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
},
{
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
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party'
			],
		}),
		summary(),
	],
	external: [
                'three',
        ],
	output: {
		file: 'dist/prefetch.bundle.mjs',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
}
];
