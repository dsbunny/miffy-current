// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import { customElement } from 'lit/decorators.js';
import { Renderer } from '../lib/renderer.js';
import { WebGLPlaylistElement } from './webgl-play-list.js';
import { BrightSignPrefetch } from '../lib/brightsign-prefetch.js';

@customElement('brightsign-webgl-play-list')
export class BrightSignWebGLPlaylistElement extends WebGLPlaylistElement {

	// Override the renderer to use BrightSign compatible asset prefetcher.
	protected override _createRenderer(): Renderer {
		return super._createRenderer(BrightSignPrefetch);
	}
}
