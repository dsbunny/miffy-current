// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import EventTarget from '@ungap/event-target';
import { View, Renderer } from '../lib/renderer.js';
import { SchedulerState } from '../lib/scheduler.js';
import { AssetDecl } from './media.js';

export class NullRenderer extends EventTarget implements Renderer {

	constructor() {
		super();
	}

	get ended() { return false; }
	get error() { return null; }
	get networkState() { return HTMLMediaElement.NETWORK_EMPTY; }
	get paused() { return true; }
	get readyState() { return HTMLMediaElement.HAVE_NOTHING; }

	// Called after placement in DOM.
	init() {
		console.log("NULL-RENDERER: init");
	}

	close() {
		console.log("NULL-RENDERER: close");
	}

	setSetStateHook(_cb: any): void {}
	clearSetStateHook(): void {}

	setSchedulerMessagePort(scheduler: MessagePort): void {
		console.log("NULL-RENDERER: setSchedulerMessagePort", scheduler);
	}

	// Called by Scheduler or via Cluster as a follower.  This API receives
	// the near and immediate scheduling state to render the current and
	// next media asset, including the transition between the two.
	async setState(_value: SchedulerState): Promise<void> {}
	async setStateUnhooked(_value: SchedulerState): Promise<void> {}

	setAssetTarget(assetTarget: HTMLElement): void {
		console.log("NULL-RENDERER: setAssetTarget", assetTarget);
	}

	setRenderTarget(renderTarget: HTMLElement): void {
		console.log("NULL-RENDERER: setRenderTarget", renderTarget);
	}

	setPixelRatio(value: number): void {
		console.log("NULL-RENDERER: setPixelRatio", value);
	}

	setSize(width: number, height: number): void {
		console.log("NULL-RENDERER: setSize", width, height);
	}

	setViews(views: View[]): void {
		console.log("NULL-RENDERER: setViews", views);
	}

	async setSources(_scope: string, _sources: AssetDecl[]): Promise<void> {
		// no-op
	}

	// on requestAnimationFrame() callback.
	render(_timestamp: DOMHighResTimeStamp): void {}

	// on requestIdleCallback() callback.
	idle(): void {}
}
