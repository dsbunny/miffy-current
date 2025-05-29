// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Renderer } from '../lib/renderer.js';
import { LunaRenderer } from '../lib/luna-renderer.js';
import WebPlaylistElement from './web-play-list.js';
import { Prefetch } from '../lib/prefetch.js';
import { LunaPrefetch } from '../lib/luna-prefetch.js';

@customElement('luna-play-list')
export default class LunaPlaylistElement extends WebPlaylistElement {

	// Remove "contain: strict" from the host element for LG WebOS.
	static override styles = css`
		:host {
			display: block;
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
			visibility: hidden;
			display: block;
			position: absolute;
			top: 0;
			left: 0;
		}
		:host > main > .map1 {
			visibility: visible;
			will-change: opacity;
			z-index: 2;
		}
		:host > main > .map2 {
			visibility: visible;
			z-index: 1;
		}
		:host > main > article {
			width: 100%;
			height: 100%;
		}
	`;

	// Cannot access absolute file:// URLs from LG WebOS.
	protected override _createWorker(): Worker {
		return new Worker('./dist/scheduler.bundle~chrome53.mjs', {
			type: 'classic',
			credentials: 'omit',
			name: 'Scheduler',  // Shown in debugger.
		});
	}

	// Override the renderer to use LG WebOS compatible CSS Renderer.
	protected override _createRenderer(
		prefetchFactory: { new(): Prefetch } = LunaPrefetch,
	): Renderer {
		if(this._section === null) {
			throw new Error("cannot find <section> element to attach to.");
		}
		if(this._main === null) {
			throw new Error("cannot find <main> element to attach to.");
		}

		const renderer = new LunaRenderer(prefetchFactory);
		renderer.init();

		this._connectSchedulerToRenderer(this._scheduler, renderer);
		this._connectRaftCluster(this._scheduler, renderer);

		renderer.setAssetTarget(this._main);
		renderer.setRenderTarget(this._main);

		return renderer;
	}
}
