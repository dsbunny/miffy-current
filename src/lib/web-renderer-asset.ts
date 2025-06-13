// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import { AbstractWebAsset } from './web-media.js';

export class WebRendererAsset {
	is_loading = false;
	has_element = false;
	end_time = NaN;
	protected _ref_count = 0;

	constructor(
		readonly id: string,
		public web_asset: AbstractWebAsset,
	) {}

	get paused() { return this.web_asset.paused; }
	get ended() { return this.web_asset.ended; }
	get error() { return this.web_asset.error; }
	get readyState() { return this.web_asset.readyState; }
	get networkState() { return this.web_asset.networkState; }
	get element() { return this.web_asset.element; }
	get currentSrc() { return this.web_asset.currentSrc; }
	get currentTime() { return this.web_asset.currentTime; }

	get className() { return this.web_asset.className; }
	set className(value: string) { this.web_asset.className = value; }
	get classList() { return this.web_asset.classList; }
	get style() { return this.web_asset.style; }

	load(): void {
		if(this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
			return;
		}
		if(this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
			return;
		}
		try {
			this.web_asset.load();
		} catch(error: unknown) {
			console.error(`WEB-ASSET: ${error}`);
		}
	}

	async play() {
		await this.web_asset.play();
	}

	paint(now: number, remaining: number) {
		this.web_asset.paint(now, remaining);
	}

	pause() {
		this.web_asset.pause();
	}

	close(): void {
		this.web_asset.close();
	}

	get ref_count() { return this._ref_count; }

	ref() {
		this._ref_count++;
	}

	unref() {
		this._ref_count--;
	}
}
