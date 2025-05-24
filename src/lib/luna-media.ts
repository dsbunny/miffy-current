// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import {
	WebImageCollection,
	WebVideoCollection,
	WebAssetManager,
	WebCollection,
} from "./web-media.js";

// REF: https://webossignage-docs.developer.lge.com/guides/developer-guides/media-playback/audio-video-attribute/texture-attribute
type LunaHTMLVideoElement = HTMLVideoElement & { texture: boolean };

class LunaVideoCollection extends WebVideoCollection {
	override acquire(): HTMLVideoElement {
		const video = super.acquire();
		(video as LunaHTMLVideoElement).texture = true;
		return video;
	}
}

export class LunaAssetManager extends WebAssetManager {
	protected override _createCollection(renderTarget: HTMLElement): Map<string, WebCollection> {
		// TypeScript assumes iterator of first type.
		const collection = new Map([
			['HTMLImageElement', new WebImageCollection(renderTarget) as WebCollection],
			['HTMLVideoElement', new LunaVideoCollection(renderTarget) as WebCollection],
		]);
		return collection;
	}
}
