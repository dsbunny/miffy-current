// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import { AbstractLunaAsset } from './luna-media.js';

export class LunaRendererAsset {
	user_data: any = {};
	constructor(
		readonly id: string,
		public media_asset: AbstractLunaAsset,
	) {}

	get paused() { return this.media_asset.paused; }
	get ended() { return this.media_asset.ended; }
	get error() { return this.media_asset.error; }
	get readyState() { return this.media_asset.readyState; }
	get networkState() { return this.media_asset.networkState; }
	get texture() { return this.media_asset.element; }
	get currentSrc() { return this.media_asset.currentSrc; }
	get currentTime() { return this.media_asset.currentTime; }

	get className() { return this.media_asset.className; }
	set className(value: string) { this.media_asset.className = value; }
	get classList() { return this.media_asset.classList; }

	get opacity() { return this.media_asset.opacity; }
	set opacity(value: number) { this.media_asset.opacity = value; }

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
			console.error(`RENDERER: ${error}`);
		}
	}

	close(): void {
		this.media_asset.close();
	}

	visible(): void {
		this.media_asset.visible();
	}

	hide(): void {
		this.media_asset.hide();
	}

	async play() {
		await this.media_asset.play();
	}

	paint(now: number, remaining: number) {
		this.media_asset.paint(now, remaining);
	}
}
