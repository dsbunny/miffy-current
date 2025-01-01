// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// CSS Renderer for LG WebOS displays.

import { Renderer } from '../lib/renderer.js';
import { CSSRenderer } from "./css-renderer.js";
import { LunaCssAssetManager } from '../lib/css-media.js';
import { LunaPrefetch } from './luna-prefetch.js';

export class LunaRenderer extends CSSRenderer implements Renderer {
	protected override _mam = new LunaCssAssetManager();

	constructor() {
		super(LunaPrefetch);
	}
}
