// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import { AbstractWebAsset } from './web-media.js';

export class WebRendererAsset {
	is_loading = false;
	has_element = false;
	end_time = NaN;
	protected _ref_count = 0;

	constructor(
		readonly id: string,
		public media_asset: AbstractWebAsset,
	) {}

	get paused() { return this.media_asset.paused; }
	get ended() { return this.media_asset.ended; }
	get error() { return this.media_asset.error; }
	get readyState() { return this.media_asset.readyState; }
	get networkState() { return this.media_asset.networkState; }
	get element() { return this.media_asset.element; }
	get currentSrc() { return this.media_asset.currentSrc; }
	get currentTime() { return this.media_asset.currentTime; }

	get className() { return this.media_asset.className; }
	set className(value: string) { this.media_asset.className = value; }
	get classList() { return this.media_asset.classList; }
	get style() { return this.media_asset.style; }

	load(): void {
		if(this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
			return;
		}
		if(this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
			return;
		}
		try {
			this.media_asset.load();
		} catch(error: unknown) {
			console.error(`WEB-ASSET: ${error}`);
		}
	}

	async play() {
		await this.media_asset.play();
	}

	paint(now: number, remaining: number) {
		this.media_asset.paint(now, remaining);
	}

	pause() {
		this.media_asset.pause();
	}

	close(): void {
		this.media_asset.close();
	}

	get ref_count() { return this._ref_count; }

	ref() {
		this._ref_count++;
	}

	unref() {
		this._ref_count--;
	}
}
