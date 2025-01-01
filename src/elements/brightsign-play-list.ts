// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Extend the CssPlayListElement for BrightSign players.

import { customElement } from 'lit/decorators.js';
import { Renderer } from '../lib/renderer.js';
import CssPlaylistElement from './css-play-list.js';
import { BrightSignPrefetch } from '../lib/brightsign-prefetch.js';

@customElement('brightsign-play-list')
export default class BrightSignPlaylistElement extends CssPlaylistElement {

	// Override the renderer to use BrightSign compatible asset prefetcher.
	protected override _createRenderer(): Renderer {
		return super._createRenderer(BrightSignPrefetch);
	}
}
