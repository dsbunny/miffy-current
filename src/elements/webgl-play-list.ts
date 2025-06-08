// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Renderer } from '../lib/renderer.js';
import { WebGLRenderer } from '../lib/webgl-renderer.js';
import { WebPlaylistElement } from './web-play-list.js';
import { Prefetch } from '../lib/prefetch.js';
import { ServiceWorkerPrefetch } from '../lib/service-worker-prefetch.js';

// Convenience configuration to disable HiDPI rendering, which can be slow on
// some platforms, or produce artifacts on low resolution content.
const DEBUG_DISABLE_HIDPI = false;

@customElement('webgl-play-list')
export class WebGLPlaylistElement extends WebPlaylistElement {

	static override styles = css`
		:host {
			display: block;
			contain: strict;
			overflow: clip;
			font-size: 0;
		}
		:host > section {
			display: none;
		}
		:host > main {
			position: relative;
			margin-left: 600px;
		}
		:host > main > * {
			display: block;
			position: absolute;
			top: 0;
			left: 0;
		}
	`;

	// Override the renderer to use WebGL.
	protected override _createRenderer(
		prefetchFactory: { new(): Prefetch } = ServiceWorkerPrefetch,
	): Renderer {
		if(this._section === null) {
			throw new Error("cannot find <section> element to attach to.");
		}
		if(this._main === null) {
			throw new Error("cannot find <main> element to attach to.");
		}

		const renderer = new WebGLRenderer(prefetchFactory);
		renderer.init();

		this._connectSchedulerToRenderer(this._scheduler, renderer);
		this._connectRaftCluster(this._scheduler, renderer);

		renderer.setAssetTarget(this._section);
		renderer.setRenderTarget(this._main);

		// Override for performance testing.
		renderer.setPixelRatio(DEBUG_DISABLE_HIDPI ? 1 : window.devicePixelRatio);

		return renderer;
	}
}
