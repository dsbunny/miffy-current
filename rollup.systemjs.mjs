// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import sourcemaps from 'rollup-plugin-sourcemaps';
import summary from 'rollup-plugin-summary';

export default [
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
				'node_modules',
				'third-party',
			],
		}),
		getBabelOutputPlugin({
			compact: true,
			presets: [
				[
					'@babel/preset-env',
					{
						targets: {
							chrome: '53',
						},
						modules: 'systemjs',
					},
				],
			],
		}),
		summary(),
	],
	external: [],
	output: {
		file: 'dist/luna.systemjs.js',
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
		commonjs(),
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party',
			],
		}),
		getBabelOutputPlugin({
			compact: true,
			presets: [
				[
					'@babel/preset-env',
					{
						targets: {
							chrome: '53',
						},
					},
				],
			],
		}),
		summary(),
	],
	external: [],
	output: {
		file: 'dist/scheduler.bundle~chrome53.js',
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
		commonjs(),
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party',
			],
		}),
		getBabelOutputPlugin({
			compact: true,
			presets: [
				[
					'@babel/preset-env',
					{
						targets: {
							chrome: '53',
						},
					},
				],
			],
		}),
		summary(),
	],
	external: [],
	output: {
		file: 'dist/calendar.bundle~chrome53.js',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
},
];
