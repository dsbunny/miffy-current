// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import { AbstractLunaAsset } from './luna-media.js';

export class LunaRendererAsset {
	is_loading = false;
	has_element = false;
	end_time = NaN;
	protected _ref_count = 0;

	constructor(
		readonly id: string,
		public luna_asset: AbstractLunaAsset,
	) {}

	get paused() { return this.luna_asset.paused; }
	get ended() { return this.luna_asset.ended; }
	get error() { return this.luna_asset.error; }
	get readyState() { return this.luna_asset.readyState; }
	get networkState() { return this.luna_asset.networkState; }
	get element() { return this.luna_asset.element; }
	get currentSrc() { return this.luna_asset.currentSrc; }
	get currentTime() { return this.luna_asset.currentTime; }

	get className() { return this.luna_asset.className; }
	set className(value: string) { this.luna_asset.className = value; }
	get classList() { return this.luna_asset.classList; }
	get style() { return this.luna_asset.style; }

	load(): void {
		if(this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
			return;
		}
		if(this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
			return;
		}
		try {
			this.luna_asset.load();
		} catch(error: unknown) {
			console.error(`LUNA-ASSET: ${error}`);
		}
	}

	async play() {
		await this.luna_asset.play();
	}

	paint(now: number, remaining: number) {
		this.luna_asset.paint(now, remaining);
	}

	pause() {
		this.luna_asset.pause();
	}

	close(): void {
		this.luna_asset.close();
	}

	get ref_count() { return this._ref_count; }

	ref() {
		this._ref_count++;
	}

	unref() {
		this._ref_count--;
	}
}
