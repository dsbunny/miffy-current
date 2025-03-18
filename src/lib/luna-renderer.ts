// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

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
