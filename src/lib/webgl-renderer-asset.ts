// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import { AbstractThreeAsset } from '../lib/three-media.js';

export class WebGLRendererAsset {
	is_loading = false;
	has_texture = false;
	end_time = NaN;
	protected _ref_count = 0;

	constructor(readonly id: string, public media_asset: AbstractThreeAsset) {}

	get paused() { return this.media_asset.paused; }
	get ended() { return this.media_asset.ended; }
	get readyState() { return this.media_asset.readyState; }
	get networkState() { return this.media_asset.networkState; }
	get texture() { return this.media_asset.texture; }
	get currentSrc() { return this.media_asset.currentSrc; }
	get currentTime() { return this.media_asset.currentTime; }

	load(): void {
		try {
			this.media_asset.load();
		} catch(ex: any) {
			console.error(`RENDERER: ${ex.message}`);
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

	close() {
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
