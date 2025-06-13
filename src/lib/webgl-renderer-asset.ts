// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import { AbstractThreeAsset } from '../lib/three-media.js';

export class WebGLRendererAsset {
	is_loading = false;
	has_texture = false;
	end_time = NaN;
	protected _ref_count = 0;

	constructor(
		readonly id: string,
		public webgl_asset: AbstractThreeAsset,
	) {}

	get paused() { return this.webgl_asset.paused; }
	get ended() { return this.webgl_asset.ended; }
	get error() { return this.webgl_asset.error; }
	get readyState() { return this.webgl_asset.readyState; }
	get networkState() { return this.webgl_asset.networkState; }
	get texture() { return this.webgl_asset.texture; }
	get currentSrc() { return this.webgl_asset.currentSrc; }
	get currentTime() { return this.webgl_asset.currentTime; }

	load(): void {
		if(this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
			return;
		}
		if(this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
			return;
		}
		try {
			this.webgl_asset.load();
		} catch(error: any) {
			console.error(`WEGBL-ASSET: ${error}`);
		}
	}

	async play() {
		await this.webgl_asset.play();
	}

	paint(now: number, remaining: number) {
		this.webgl_asset.paint(now, remaining);
	}

	pause() {
		this.webgl_asset.pause();
	}

	close(): void {
		this.webgl_asset.close();
	}

	get ref_count() { return this._ref_count; }

	ref() {
		this._ref_count++;
	}

	unref() {
		this._ref_count--;
	}
}
