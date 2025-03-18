// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as THREE from 'three';
import EventTarget from '@ungap/event-target';
import { MediaDecl } from './media.js';
import "./htmlimageelement-decode-polyfill.js";

// TBD: Audio.
// TBD: Seeking, within CMS UI.
// TBD: Poster.
export abstract class CssAsset extends EventTarget {
	texture: HTMLElement | undefined;
	autoplay = true;
	loop = false;
	protected _url: URL;
	protected _src: string;
	protected _opacity = 1;
	// Per HTMLMediaElement.
	protected _duration: number;
	protected _ended = false;
	protected _error: any = null;
	protected _networkState: number = HTMLMediaElement.NETWORK_NO_SOURCE;
	protected _paused= true;
	protected _readyState: number = HTMLMediaElement.HAVE_NOTHING;

	constructor(src: string, duration: number, public readonly collection: CssCollection) {
		super();
		this._url = new URL(src, self.location.href);
		this._src = src;
		if(this._src.length !== 0) {
			this._networkState = HTMLMediaElement.NETWORK_EMPTY;
		}
		this._duration = duration;
	}

	// Per HTMLMediaElement.
	get src() { return this._src; }
	get currentSrc() { return this._url.href; }
	get currentTime() { return 0; }
	set currentTime(_timestamp: DOMHighResTimeStamp) {}
	get duration() { return this._duration; }
	get ended() { return this._ended; }
	get error() { return this._error; }
	get networkState() { return this._networkState; }
	get paused() { return this._paused; }
	get readyState() { return this._readyState; }
	// Per HTMLVideoElement.
	get className() { return ''; }
	set className(_value: string) {}
	get classList() { return new DOMTokenList(); }
	get height() { return 0; }
	get width() { return 0; }
	get opacity() { return this._opacity; }
	set opacity(value: number) { this._opacity = value; }

	abstract visible(): void;
	abstract hide(): void;

	get debugUrl() { return this._url; }

	abstract load(): void;
	abstract unload(): void;
	abstract pause(): void;
	abstract play(): Promise<void>;
	abstract paint(now: DOMHighResTimeStamp, remaining: number) : void;

	// Events:
	// abort
	// canplay
	// canplaythrough
	// durationchange
	// emptied
	// ended
	// error
	// loadeddata
	// loadedmetadata
	// loadstart
	// beforeunload
	// unload
	// pause
	// play
	// playing
	// progress
	// stalled
	// suspend
	// timeupdate
	// waiting
}

// super must be used to call functions only, operation is undefined when
// accessing variables that are not hidden behind getters and setters.
export class CssImage extends CssAsset {
	protected _image: HTMLImageElement | undefined;
	protected _startTime: DOMHighResTimeStamp | number = NaN;
	protected _lastTimeUpdate: DOMHighResTimeStamp = 0;
	protected _currentTime: DOMHighResTimeStamp = 0;

	constructor(src: string, duration: number, collection: ImageCollection) {
		super(src, duration, collection);
	}

	// Per HTMLMediaElement.
	override get src() { return this._src; }
	override get currentSrc() { return this._url.href; }
	override get currentTime() { return this._currentTime; }
	override set currentTime(timestamp: DOMHighResTimeStamp) {
		this._currentTime = timestamp;
		this._startTime = NaN;
	}
	override get duration() { return this._duration; }
	override set duration(duration: number) { this._duration = duration; }
	override get ended() { return this._ended; }
	override get error() { return this._error; }
	override get networkState() { return this._networkState; }
	override get paused() { return this._paused; }
	override get readyState() { return this._readyState; }
	// Per HTMLVideoElement.
	override get className() {
		if(typeof this._image === "undefined") {
			return '';
		}
		return this._image.className;
	}
	override set className(value: string) {
		if(typeof this._image !== "undefined") {
			this._image.className = value;
		}
	}
	override get classList() {
		if(typeof this._image === "undefined") {
			return new DOMTokenList();
		}
		return this._image.classList;
	}
	override get height() {
		if(typeof this.texture === "undefined") {
			return NaN;
		}
		return (this.texture as HTMLImageElement).height;
	}
	override get width() {
		if(typeof this.texture === "undefined") {
			return NaN;
		}
		return (this.texture as HTMLImageElement).width;
	}
	override set opacity(value: number) {
		if(typeof this._image !== "undefined") {
			const opacity = (value === 1) ? '' : value.toString();
			if(this._image.style.opacity !== opacity) {
				this._image.style.opacity = opacity;
			}
		}
		this._opacity = value;
	}

	override visible(): void {
		if(typeof this._image !== "undefined") {
			this._image.style.visibility = '';
		}
	}
	override hide(): void {
		if(typeof this._image !== "undefined") {
			this._image.style.visibility = 'hidden';
		}
	}

	override load(): void {
		console.log(`load image ... ${this.src}`);
		this.dispatchEvent(new Event('loadstart'));
		const image = this.texture = this._image = (this.collection as ImageCollection).acquire();
		image.crossOrigin = 'anonymous';
		image.src = this.src;
		this._networkState = HTMLMediaElement.NETWORK_LOADING;
		image.decode()
		.then(() => {
			this._networkState = HTMLMediaElement.NETWORK_IDLE;
			this.dispatchEvent(new Event('durationchange'));
			this._readyState =  HTMLMediaElement.HAVE_METADATA;
			this.dispatchEvent(new Event('loadedmetadata'));
			this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
			this.dispatchEvent(new Event('loadeddata'));
			this._readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
			this.dispatchEvent(new Event('canplay'));
			this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA
			this.dispatchEvent(new Event('canplaythrough'));
		})
		.catch((encodingError: DOMException) => {
			console.error(`MEDIA: ${this.src}`, image, encodingError);
			this._networkState = HTMLMediaElement.NETWORK_EMPTY;
			this._readyState = HTMLMediaElement.HAVE_NOTHING;
			if(typeof image !== "undefined") {
				(this.collection as ImageCollection).release(image);
				this.texture = this._image = undefined;
			}
			this.dispatchEvent(new Event('error'));
		});
	}
	override unload(): void {
		console.log(`unload image ... ${this.src}`);
		this.dispatchEvent(new Event('beforeunload'));
		this.pause();
		if(typeof this._image !== "undefined") {
			(this.collection as ImageCollection).release(this._image);
			this.texture = this._image = undefined;
		}
		this._readyState = HTMLMediaElement.HAVE_NOTHING;
		this._networkState = HTMLMediaElement.NETWORK_EMPTY;
		this._currentTime = 0;
		this._startTime = NaN;
		this._lastTimeUpdate = 0;
		this._ended = false;
		this.dispatchEvent(new Event('unload'));
	}
	override pause(): void {
		if(this._paused) return;
		this._paused = true;
		this.dispatchEvent(new Event('pause'));
	}
	override async play(): Promise<void> {
		this._paused = false;
		if(this._ended) {
			this._ended = false;
			this._currentTime = 0;
		}
		if(isNaN(this._startTime)) {
			this._startTime = performance.now() - this._currentTime;
		}
		this.dispatchEvent(new Event('play'));
		this.dispatchEvent(new Event('playing'));
	}
	// FIXME: delta for paused.
	override paint(now: DOMHighResTimeStamp, _remaining: number): void {
		if(this.paused || this.ended) return;
		const elapsed = (now - this._startTime) / 1000;
		this._currentTime += elapsed;
		if(this._currentTime > this.duration) {
			this.#ended();
		} else {
			if(Math.floor(this._currentTime) > this._lastTimeUpdate) {
				this._lastTimeUpdate = this._currentTime;
				this.dispatchEvent(new Event('timeupdate'));
			}
		}
	}
	#ended(): void {
		this._currentTime = this.duration;
		this._ended = true;
		this._startTime = NaN;
		this.dispatchEvent(new Event('ended'));
	}
}

export class CssVideo extends CssAsset {
	protected _video: HTMLVideoElement | undefined;
	protected _redispatchEvent: (event: string | Event) => any;

	constructor(src: string, duration: number, collection: VideoCollection) {
		super(src, duration, collection);
		this._redispatchEvent = (event: string | Event) => {
			this.dispatchEvent(new Event(event instanceof Event ? event.type : event));
		};
	}

	// Per HTMLMediaElement.
	override get src() { return this._src; }
	override get currentSrc() {
		if(typeof this._video === "undefined") {
			return this._url.href;
		}
		return this._video.currentSrc;
	}
	override get currentTime() {
		if(typeof this._video === "undefined") {
			return 0;
		}
		return this._video.currentTime;
	}
	override set currentTime(timestamp: DOMHighResTimeStamp) {
		if(typeof this._video === "undefined") {
			return;
		}
		this._video.currentTime = timestamp;
	}
	override get duration() {
		if(typeof this._video === "undefined") {
			return NaN;
		}
		return this._video.duration;
	}
	override get ended() {
		if(typeof this._video === "undefined") {
			return false;
		}
		return this._video.ended;
	}
	override get error() {
		if(typeof this._video === "undefined") {
			return false;
		}
		return this._video.error;
	}
	override get networkState() {
		if(typeof this._video === "undefined") {
			return HTMLMediaElement.NETWORK_EMPTY;
		}
		return this._video.networkState;
	}
	override get paused() {
		if(typeof this._video === "undefined") {
			return true;
		}
		return this._video.paused;
	}
	override get readyState() {
		if(typeof this._video === "undefined") {
			return HTMLMediaElement.HAVE_NOTHING;
		}
		return this._video.readyState;
	}
	// Per HTMLVideoElement.
	override get className() {
		if(typeof this._video === "undefined") {
			return '';
		}
		return this._video.className;
	}
	override set className(value: string) {
		if(typeof this._video !== "undefined") {
			this._video.className = value;
		}
	}
	override get classList() {
		if(typeof this._video === "undefined") {
			return new DOMTokenList();
		}
		return this._video.classList;
	}
	override get height() {
		if(typeof this._video === "undefined") {
			return NaN;
		}
		return this._video.height;
	}
	override get width() {
		if(typeof this._video === "undefined") {
			return NaN;
		}
		return this._video.width;
	}
	override set opacity(value: number) {
		if(typeof this._video !== "undefined") {
			const opacity = (value === 1) ? '' : value.toString();
			if(this._video.style.opacity !== opacity) {
				this._video.style.opacity = opacity;
			}
		}
		this._opacity = value;
	}
	override visible(): void {
		if(typeof this._video !== "undefined") {
			this._video.style.visibility = '';
		}
	}
	override hide(): void {
		if(typeof this._video !== "undefined") {
			this._video.style.visibility = 'hidden';
		}
	}

	override load(): void {
		console.log(`load video ... ${this.src}`);
		const video = this.texture = this._video = (this.collection as VideoCollection).acquire();
		video.onabort = this._redispatchEvent;
		video.oncanplay = this._redispatchEvent;
		video.oncanplaythrough = this._redispatchEvent;
		video.ondurationchange = this._redispatchEvent;
		video.onemptied = this._redispatchEvent;
		video.onended = this._redispatchEvent;
		video.onerror = this._redispatchEvent;
		video.onloadedmetadata = this._redispatchEvent;
		video.onloadstart = this._redispatchEvent;
		video.onpause = this._redispatchEvent;
		video.onplay = this._redispatchEvent;
		video.onplaying = this._redispatchEvent;
		video.onprogress = this._redispatchEvent;
		video.onstalled = this._redispatchEvent;
		video.onsuspend = this._redispatchEvent;
		video.ontimeupdate = this._redispatchEvent;
		video.onwaiting = this._redispatchEvent;
		video.src = this.src;
		// Avoid "WebGL: INVALID_VALUE: texImage2D: no video".
		video.onloadeddata = (event: Event) => {
			this._redispatchEvent(event);
		};
		try {
			video.load();
		} catch(encodingError: unknown) {
			(this.collection as VideoCollection).release(video);
			this.texture = this._video = undefined;
			throw encodingError;
		}
	}

	override unload(): void {
		console.log(`unload video ... ${this.src}`);
		this.dispatchEvent(new Event('beforeunload'));
		this.pause();
		if(typeof this._video !== "undefined") {
			(this.collection as VideoCollection).release(this._video);
			this.texture = this._video = undefined;
		}
		this.dispatchEvent(new Event('unload'));
	}

	override pause(): void {
		if(typeof this._video === "undefined") {
			return;
		}
		this._video.pause();
	}

	override async play(): Promise<void> {
		if(typeof this._video === "undefined") {
			return;
		}
		await this._video.play();
	}

	override paint(_now: DOMHighResTimeStamp, _remaining: number): void {}
}

abstract class CssCollection {
	constructor(readonly renderRoot: (HTMLElement | ShadowRoot)) {}
	abstract acquire(): HTMLImageElement | HTMLVideoElement;
	abstract createCssAsset(src: string, duration: number): CssImage | CssVideo;
	abstract release(asset: HTMLImageElement | HTMLVideoElement): void;
	abstract clear(): void;
}

class ImageCollection extends CssCollection {
	protected _images: HTMLImageElement[] = [];
	protected _count = 0;

	constructor(renderRoot: (HTMLElement | ShadowRoot)) {
		super(renderRoot);
	}

	// TSC forces pop() to return undefined even if length is checked.
	override acquire(): HTMLImageElement {
		let img = this._images.pop();
		if(typeof img === "undefined") {
			img = new Image();
			this._count++;
			this.renderRoot.appendChild(img);
		} else {
			img.className = '';
		}
		return img;
	}

	override createCssAsset(src: string, duration: number): CssImage {
		return new CssImage(src, duration, this);
	}

	override release(img: HTMLImageElement): void {
		img.removeAttribute('src');
		if(this._count > 2) {
			this.renderRoot.removeChild(img);
			this._count--;
			return;
		}
		img.className = 'spare';
		img.style.opacity = '';
		img.style.visibility = '';
		this._images.push(img);
	}

	// Clears the trash stack, not the elements acquired by the user.
	override clear(): void {
		for(const img of this._images) {
			this.renderRoot.removeChild(img);
		}
		this._images = [];
	}
}

class VideoCollection extends CssCollection {
	protected _videos: HTMLVideoElement[] = [];
	protected _count = 0;

	constructor(renderRoot: (HTMLElement | ShadowRoot)) {
		super(renderRoot);
	}

	override acquire(): HTMLVideoElement {
		let video = this._videos.pop();
		if(typeof video === "undefined") {
			video = document.createElement('video');
			this._count++;
			video.autoplay = false;
			video.crossOrigin = 'anonymous';
			video.muted = true;
			video.playsInline = true;
			video.preload = 'auto';  // The video will be played soon.
			// Video must be within DOM to playback.
			this.renderRoot.appendChild(video);
		} else {
			video.className = '';
		}
		return video;
	}

	override createCssAsset(src: string, _duration: number): CssVideo {
		return new CssVideo(src, NaN, this);
	}

	override release(video: HTMLVideoElement): void {
		if(!video.paused) {
			video.pause();
		}
		// Some platforms treat `video.src = ''` as loading the current
		// location, so we use `video.removeAttribute('src')` instead.
		video.removeAttribute('src');
		if(this._count > 2) {
			this.renderRoot.removeChild(video);
			this._count--;
			return;
		}
		video.className = 'spare';
		video.style.opacity = '';
		video.style.visibility = '';
		this._videos.push(video);
	}

	override clear(): void {
		for(const video of this._videos) {
			this.renderRoot.removeChild(video);
		}
		this._videos = [];
	}
}

// REF: https://webossignage-docs.developer.lge.com/guides/developer-guides/media-playback/audio-video-attribute/texture-attribute
type LGHTMLVideoElement = HTMLVideoElement & { texture: boolean };

class LunaVideoCollection extends VideoCollection {
	override acquire(): HTMLVideoElement {
		const video = super.acquire();
		(video as LGHTMLVideoElement).texture = true;
		return video;
	}
}

export class CssAssetManager {
	protected _renderTarget: HTMLElement | undefined;
	protected _collection: Map<string, CssCollection> = new Map();

	setAssetTarget(renderTarget: HTMLElement): void {
		this._renderTarget = renderTarget;
	}

	setRenderer(_renderer: THREE.WebGLRenderer): void {}

	protected _createCollection(renderTarget: HTMLElement): Map<string, CssCollection> {
		// TypeScript assumes iterator of first type.
		const collection = new Map([
			['HTMLImageElement', new ImageCollection(renderTarget) as CssCollection],
			['HTMLVideoElement', new VideoCollection(renderTarget) as CssCollection],
		]);
		return collection;
	}

	// decl: { type, href }
	// Returns: asset.
	createCssAsset(decl: MediaDecl): CssAsset {
		if(this._collection.size === 0) {
			if(typeof this._renderTarget === "undefined") {
				throw new Error("undefined render target.");
			}
			this._collection = this._createCollection(this._renderTarget);
		}
		const collection = this._collection.get(decl['@type']);
		if(typeof collection === "undefined") {
			throw new Error('Undefined collection.');
		}
		return collection.createCssAsset(decl.href, decl.duration);
	}

	clear(): void {
		for(const value of this._collection.values()) {
			value.clear();
		}
	}
}

export class LunaCssAssetManager extends CssAssetManager {
	protected override _createCollection(renderTarget: HTMLElement): Map<string, CssCollection> {
		// TypeScript assumes iterator of first type.
		const collection = new Map([
			['HTMLImageElement', new ImageCollection(renderTarget) as CssCollection],
			['HTMLVideoElement', new LunaVideoCollection(renderTarget) as CssCollection],
		]);
		return collection;
	}
}
