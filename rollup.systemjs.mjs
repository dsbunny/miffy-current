// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import path from 'node:path';
import includePaths from 'rollup-plugin-includepaths';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import sourcemaps from 'rollup-plugin-sourcemaps';
import summary from 'rollup-plugin-summary';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

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
		includePaths({
			include: {
				"requestidlecallback-polyfill": path.join(process.cwd(), 'node_modules/requestidlecallback-polyfill/index.js'),
				"@lit/reactive-element": path.join(process.cwd(), "node_modules/@lit/reactive-element/reactive-element.js"),
				"@lit/reactive-element/decorators/custom-element.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/custom-element.js"),
				"@lit/reactive-element/decorators/property.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/property.js"),
				"@lit/reactive-element/decorators/state.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/state.js"),
				"@lit/reactive-element/decorators/event-options.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/event-options.js"),
				"@lit/reactive-element/decorators/query.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/query.js"),
				"@lit/reactive-element/decorators/query-all.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/query-all.js"),
				"@lit/reactive-element/decorators/query-async.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/query-async.js"),
				"@lit/reactive-element/decorators/query-assigned-elements.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/query-assigned-elements.js"),
				"@lit/reactive-element/decorators/query-assigned-nodes.js": path.join(process.cwd(), "node_modules/@lit/reactive-element/decorators/query-assigned-nodes.js"),
				"lit-html": path.join(process.cwd(), "node_modules/lit-html/lit-html.js"),
				"lit": path.join(process.cwd(), "node_modules/lit/index.js"),
				"lit/decorators.js": path.join(process.cwd(), "node_modules/lit/decorators.js"),
				"lit-element/lit-element.js": path.join(process.cwd(), "node_modules/lit-element/lit-element.js"),
				"lit-html/is-server.js": path.join(process.cwd(), "node_modules/lit-html/is-server.js"),
				"@msgpack/msgpack": path.join(process.cwd(), "build/third-party/@msgpack/msgpack/src/index.js"),
				"luxon": path.join(process.cwd(), "node_modules/luxon/build/es6/luxon.js"),
				"jsonref": path.join(process.cwd(), "node_modules/jsonref/dist/index.js"),
				"rrule": path.join(process.cwd(), "build/third-party/rrule/index.js"),
				"@ungap/event-target": path.join(process.cwd(), 'node_modules/@ungap/event-target/esm/index.js'),
				"@dsbunny/rtcmesh": path.join(process.cwd(), 'node_modules/@dsbunny/rtcmesh/dist/rtcmesh.js'),
				"@dsbunny/raft": path.join(process.cwd(), 'node_modules/@dsbunny/raft/raft.js'),
				"@dsbunny/app": path.join(process.cwd(), 'node_modules/@dsbunny/app/dist/index.js'),
				"zod": path.join(process.cwd(), 'node_modules/zod/dist/esm/index.js'),
				"three": path.join(process.cwd(), 'node_modules/three/build/three.module.js'),
			},
			paths: [
				path.join(process.cwd(), 'node_modules/comlink/dist/esm'),
			],
			extensions: ['.mjs', '.js', '.json']
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
	external: [
	],
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
		resolve({
			moduleDirectories: [
				'node_modules',
				'third-party'
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
	external: [
	],
	output: {
		file: 'dist/scheduler.bundle~chrome53.mjs',
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
	external: [
	],
	output: {
		file: 'dist/calendar.bundle~chrome53.mjs',
		format: 'esm',
		sourcemap: true,
	},
	preserveEntrySignatures: 'strict',
},
];
