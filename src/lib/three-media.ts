// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as THREE from 'three';
import { MediaDecl } from './media.js';

// TBD: Audio.
// TBD: Seeking, within CMS UI.
// TBD: Poster.
export abstract class ThreeAsset extends EventTarget {
	texture: THREE.Texture | undefined;
	autoplay = true;
	loop = false;
	protected _url: URL;
	protected _src: string;
	protected _params: any;
	// Per HTMLMediaElement.
	protected _duration: number;
	protected _ended = false;
	protected _error = null;
	protected _networkState: number = HTMLMediaElement.NETWORK_EMPTY;
	protected _paused= true;
	protected _readyState: number = HTMLMediaElement.HAVE_NOTHING;

	constructor(
		src: string,
		params: any,
		duration: number,
		public readonly collection: ThreeCollection,
	) {
		super();
		this._url = new URL(src, self.location.href);
		this._src = src;
		this._params = params;
		this._duration = duration;
	}

	abstract close(): void;

	get params() { return this._params; }
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
	get height() { return 0; }
	get width() { return 0; }

	get debugUrl() { return this._url; }

	abstract load(): void;
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
export class ThreeImage extends ThreeAsset {
	protected _startTime: DOMHighResTimeStamp | number = NaN;
	protected _lastTimeUpdate: DOMHighResTimeStamp = 0;
	protected _currentTime: DOMHighResTimeStamp = 0;

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: ThreeImageCollection,
	) {
		super(src, params, duration, collection);
	}

	override close(): void {
		if(this.texture instanceof THREE.Texture) {
			(this.collection as ThreeImageCollection).release(this.texture.image);
			this.texture.dispose();
		}
	}

	override get params() { return super.params; }
	// Per HTMLMediaElement.
	override get src() { return super.src; }
	override get currentSrc() { return super.currentSrc; }
	override get currentTime() { return this._currentTime; }
	override set currentTime(timestamp: DOMHighResTimeStamp) {
		this._currentTime = timestamp;
		this._startTime = NaN;
	}
	override get duration() { return super.duration; }
	override set duration(duration: number) { this._duration = duration; }
	override get ended() { return super.ended; }
	override get error() { return super.error; }
	override get networkState() { return super.networkState; }
	override get paused() { return super.paused; }
	override get readyState() { return super.readyState; }
	// Per HTMLVideoElement.
	override get height() {
		if(typeof this.texture === "undefined") {
			return NaN;
		}
		return this.texture.image.height;
	}
	override get width() {
		if(typeof this.texture === "undefined") {
			return NaN;
		}
		return this.texture.image.width;
	}

	override load(): void {
		super.dispatchEvent(new Event('loadstart'));
		const img = (this.collection as ThreeImageCollection).acquire();
//console.info('MEDIA: img.src', this.src);
		img.src = this.src;
		this._networkState = HTMLMediaElement.NETWORK_LOADING;
		img.decode()
		.then(() => {
			this._networkState = HTMLMediaElement.NETWORK_IDLE;
			super.dispatchEvent(new Event('durationchange'));
			this.texture = new THREE.Texture(img);
			this._readyState =  HTMLMediaElement.HAVE_METADATA;
			super.dispatchEvent(new Event('loadedmetadata'));
			this.texture.needsUpdate = true;
			this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
			super.dispatchEvent(new Event('loadeddata'));
			this._readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
			super.dispatchEvent(new Event('canplay'));
			this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA
			super.dispatchEvent(new Event('canplaythrough'));
		})
		.catch((encodingError: DOMException) => {
			console.error("MEDIA:", encodingError);
			this._networkState = HTMLMediaElement.NETWORK_IDLE;
			(this.collection as ThreeImageCollection).release(img);
			super.dispatchEvent(new Event('error'));
		});
	}

	override pause(): void {
		if(this._paused) return;
		this._paused = true;
		super.dispatchEvent(new Event('pause'));
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
		super.dispatchEvent(new Event('play'));
		super.dispatchEvent(new Event('playing'));
	}

	// FIXME: delta for paused.
	override paint(now: DOMHighResTimeStamp, _remaining: number): void {
		if(this.paused || this.ended) return;
		const elapsed = (now - this._startTime) / 1000;
		this._currentTime += elapsed;
		if(this._currentTime > this.duration) {
			this._setEndedState();
		} else {
			if(Math.floor(this._currentTime) > this._lastTimeUpdate) {
				this._lastTimeUpdate = this._currentTime;
				super.dispatchEvent(new Event('timeupdate'));
			}
		}
	}

	protected _setEndedState(): void {
		this._currentTime = this.duration;
		this._ended = true;
		this._startTime = NaN;
		super.dispatchEvent(new Event('ended'));
	}
}

export class ThreeVideo extends ThreeAsset {
	protected _redispatchEvent: (event: string | Event) => any;

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: ThreeVideoCollection,
	) {
		super(src, params, duration, collection);
		this._redispatchEvent = (event: string | Event) => {
			super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
		};
	}

	override close(): void {
		if(this.texture instanceof THREE.Texture) {
			(this.collection as ThreeVideoCollection).release(this.texture.image);
			this.texture.dispose();
		}
	}

	override get params() { return super.params; }
	// Per HTMLMediaElement.
	override get src() { return super.src; }
	override get currentSrc() {
		if(typeof this.texture === "undefined") {
			return super.currentSrc;
		}
		return this.texture.image.currentSrc;
	}
	override get currentTime() {
		if(typeof this.texture === "undefined") {
			return super.currentTime;
		}
		return this.texture.image.currentTime;
	}
	override set currentTime(timestamp: DOMHighResTimeStamp) {
		if(typeof this.texture === "undefined") {
			return;
		}
		this.texture.image.currentTime = timestamp;
	}
	override get duration() {
		if(typeof this.texture === "undefined") {
			return NaN;
		}
		return this.texture.image.duration;
	}
	override get ended() {
		if(typeof this.texture === "undefined") {
			return false;
		}
		return this.texture?.image.ended;
	}
	override get error() {
		if(typeof this.texture === "undefined") {
			return false;
		}
		return this.texture?.image.error;
	}
	override get networkState() {
		if(typeof this.texture === "undefined") {
			return HTMLMediaElement.NETWORK_EMPTY;
		}
		return this.texture?.image.networkState;
	}
	override get paused() {
		if(typeof this.texture === "undefined") {
			return true;
		}
		return this.texture?.image.paused;
	}
	override get readyState() {
		if(typeof this.texture === "undefined") {
			return HTMLMediaElement.HAVE_NOTHING;
		}
		return this.texture?.image.readyState;
	}
	// Per HTMLVideoElement.
	override get height() {
		if(typeof this.texture === "undefined") {
			return NaN;
		}
		return this.texture.image.height;
	}
	override get width() {
		if(typeof this.texture === "undefined") {
			return NaN;
		}
		return this.texture.image.width;
	}

	override load(): void {
		const video = (this.collection as ThreeVideoCollection).acquire();
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
			console.log("create video texture ...");
			this.texture = new THREE.VideoTexture(video);
			this.texture.needsUpdate = true;
			this._redispatchEvent(event);
		};
		try {
			console.log("load video ...");
			video.load();
		} catch(encodingError) {
			(this.collection as ThreeVideoCollection).release(video);
			throw encodingError;
		}
	}

	override pause(): void {
		this.texture?.image.pause();
	}

	override async play(): Promise<void> {
		if(typeof this.texture === "undefined") {
			return;
		}
		await this.texture.image.play();
	}

	override paint(_now: DOMHighResTimeStamp, _remaining: number): void {}
}

export class ThreeApp extends ThreeAsset {
	protected _startTime: DOMHighResTimeStamp | number = NaN;
	protected _lastTimeUpdate: DOMHighResTimeStamp = 0;
	protected _currentTime: DOMHighResTimeStamp = 0;
	protected _redispatchEvent: (event: string | Event) => any;

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: ThreeAppCollection,
	) {
		super(src, params, duration, collection);
		this._redispatchEvent = (event: string | Event) => {
			super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
		};
	}

	override close(): void {
		if(this.texture instanceof THREE.Texture) {
			this.texture.userData.close();
			this.texture.userData = {};
			this.texture.dispose();
		}
	}

	override get params() { return super.params; }
	// Per HTMLMediaElement.
	override get src() { return super.src; }
	override get currentSrc() { return super.currentSrc; }
	override get currentTime() { return this._currentTime; }
	override set currentTime(timestamp: DOMHighResTimeStamp) {
		this._currentTime = timestamp;
		this._startTime = NaN;
	}
	override get duration() { return super.duration; }
	override set duration(duration: number) { this._duration = duration; }
	override get ended() { return super.ended; }
	override get error() { return super.error; }
	override get networkState() { return super.networkState; }
	override get paused() { return super.paused; }
	override get readyState() { return super.readyState; }
	// Per HTMLVideoElement.
	override get height() { return this.texture?.image.height; }
	override get width() { return this.texture?.image.width; }

	override load(): void {
console.log('MEDIA: load');
		super.dispatchEvent(new Event('loadstart'));
		this._networkState = HTMLMediaElement.NETWORK_LOADING;
		const collection = this.collection as ThreeAppCollection;
		const fbo = collection.acquire();
		collection.importModule(this.src)
		// FIXME: Possibly an interface?
		.then((App: any) => {
			try {
				const app = new App(this.params);
				if(typeof app.init !== "function") {
					throw new Error('App.init() not implemented.');
				}
				if(typeof app.animate !== "function") {
					throw new Error('App.paint() not implemented.');
				}
				app.onerror = this._redispatchEvent;
				app.init(fbo, collection.renderer);
				fbo.texture.userData = app;
				this._networkState = HTMLMediaElement.NETWORK_IDLE;
				super.dispatchEvent(new Event('durationchange'));
				this.texture = fbo.texture;
				this._readyState =  HTMLMediaElement.HAVE_METADATA;
				super.dispatchEvent(new Event('loadedmetadata'));
				this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
				super.dispatchEvent(new Event('loadeddata'));
				this._readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
				super.dispatchEvent(new Event('canplay'));
				this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA
				super.dispatchEvent(new Event('canplaythrough'));
			} catch(initError: any) {
				console.error("MEDIA:", initError);
				this._networkState = HTMLMediaElement.NETWORK_IDLE;
				collection.release(fbo);
				super.dispatchEvent(new Event('error'));
			}
		})
		.catch((moduleError: any) => {
			console.error("MEDIA:", moduleError);
			this._networkState = HTMLMediaElement.NETWORK_IDLE;
			collection.release(fbo);
			super.dispatchEvent(new Event('error'));
		})
	}

	override pause(): void {
		if(this._paused) return;
		this._paused = true;
		super.dispatchEvent(new Event('pause'));
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
		super.dispatchEvent(new Event('play'));
		super.dispatchEvent(new Event('playing'));
	}

	override paint(now: DOMHighResTimeStamp, remaining: number): void {
		if(this.paused || this.ended) return;
		const elapsed = (now - this._startTime) / 1000;
		if(this._currentTime > this.duration) {
			this._setEndedState();
		} else if(typeof this.texture !== "undefined") {
			this.texture.userData.animate(now, remaining);
			if(Math.floor(this._currentTime) > this._lastTimeUpdate) {
				this._lastTimeUpdate = this._currentTime;
				super.dispatchEvent(new Event('timeupdate'));
			}
		}
	}

	protected _setEndedState(): void {
		this._currentTime = this.duration;
		this._ended = true;
		this._startTime = NaN;
		super.dispatchEvent(new Event('ended'));
	}
}

abstract class ThreeCollection {
	constructor(readonly renderRoot: (HTMLElement | ShadowRoot)) {}
	abstract acquire(): HTMLImageElement | HTMLVideoElement | THREE.WebGLRenderTarget;
	abstract createThreeAsset(src: string, params: any, duration: number): ThreeImage | ThreeVideo | ThreeApp;
	abstract release(asset: HTMLImageElement | HTMLVideoElement | THREE.WebGLRenderTarget): void;
	abstract clear(): void;
}

class ThreeImageCollection extends ThreeCollection {
	protected _images: HTMLImageElement[] = [];

	constructor(renderRoot: (HTMLElement | ShadowRoot)) {
		super(renderRoot);
	}

	// TSC forces pop() to return undefined even if length is checked.
	override acquire(): HTMLImageElement {
		let img = this._images.pop();
		if(typeof img === "undefined") {
			img = new Image();
		}
		return img;
	}

	override createThreeAsset(
		src: string,
		params: any,
		duration: number,
	): ThreeImage {
		return new ThreeImage(src, params, duration, this);
	}

	override release(img: HTMLImageElement): void {
		img.src = '';
		this._images.push(img);
	}

	override clear(): void {
		this._images = [];
	}
}

class ThreeVideoCollection extends ThreeCollection {
	protected _videos: HTMLVideoElement[] = [];

	constructor(renderRoot: (HTMLElement | ShadowRoot)) {
		super(renderRoot);
	}

	override acquire(): HTMLVideoElement {
		let video = this._videos.pop();
		if(typeof video === "undefined") {
			video = document.createElement('video');
			video.autoplay = false;
			video.crossOrigin = 'anonymous';
			video.muted = true;
			video.playsInline = true;
			video.preload = 'auto';  // The video will be played soon.
			// Video must be within DOM to playback.
			this.renderRoot.appendChild(video);
		}
		return video;
	}

	override createThreeAsset(
		src: string,
		params: any,
		_duration: number,
	): ThreeVideo {
		return new ThreeVideo(src, params, NaN, this);
	}

	override release(video: HTMLVideoElement): void {
		if(!video.paused) video.pause();
		this._videos.push(video);
	}

	override clear(): void {
		for(const video of this._videos) {
			this.renderRoot.removeChild(video);
		}
		this._videos = [];
	}
}

class ThreeAppWrapper {
	constructor(public readonly app: any) {}
}

class ThreeAppCollection extends ThreeCollection {
	protected _apps = new Map<string, ThreeAppWrapper>();
	protected _fbo: THREE.WebGLRenderTarget;

	constructor(
		renderRoot: (HTMLElement | ShadowRoot),
		public readonly renderer: THREE.WebGLRenderer,
	) {
		super(renderRoot);
		// this.#mesh width & height;
		const width = 1024;  // * renderer.getPixelRatio();
		const height = 1024;  // * renderer.getPixelRatio();
		this._fbo = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			depthBuffer: false,
			stencilBuffer: false,
		});
	}

	override acquire(): THREE.WebGLRenderTarget {
		return this._fbo;
	}

	async importModule(src: string): Promise<Function> {
		const module = this._apps.get(src);
		if(typeof module === 'undefined') {
			const { default: App } = await import(src);
console.log('MEDIA: Dynamically imported', App);
			this._apps.set(src, new ThreeAppWrapper(App));
			return App;
		}
		return module.app;
	}

	override createThreeAsset(
		src: string,
		params: any,
		duration: number,
	): ThreeApp {
		return new ThreeApp(src, params, duration, this);
	}

	override release(_fbo: THREE.WebGLRenderTarget): void {}

	override clear(): void {
		this._fbo.dispose();
	}
}

export class ThreeAssetManager {
	protected _renderTarget: HTMLElement | undefined;
	protected _renderer: THREE.WebGLRenderer | undefined;
	protected _collection: Map<string, ThreeCollection> = new Map();

	setAssetTarget(renderTarget: HTMLElement): void {
		this._renderTarget = renderTarget;
	}

	setRenderer(renderer: THREE.WebGLRenderer): void {
		this._renderer = renderer;
	}

	protected _createCollection(
		renderTarget: HTMLElement,
		renderer: THREE.WebGLRenderer,
	): Map<string, ThreeCollection> {
		// TypeScript assumes iterator of first type.
		const collection = new Map([
			['HTMLImageElement', new ThreeImageCollection(renderTarget) as ThreeCollection],
			['HTMLVideoElement', new ThreeVideoCollection(renderTarget) as ThreeCollection],
			['CustomElement', new ThreeAppCollection(renderTarget, renderer) as ThreeCollection],
		]);
		return collection;
	}

	// decl: { type, href }
	// Returns: asset.
	createThreeAsset(decl: MediaDecl): ThreeAsset {
		if(this._collection.size === 0) {
			if(typeof this._renderTarget === "undefined") {
				throw new Error("undefined render target.");
			}
			if(typeof this._renderer === "undefined") {
				throw new Error("undefined renderer.");
			}
			this._collection = this._createCollection(this._renderTarget, this._renderer);
		}
		const collection = this._collection.get(decl['@type']);
		if(typeof collection === "undefined") {
			throw new Error('Undefined collection.');
		}
		return collection.createThreeAsset(
			decl.href,
			decl.params,
			decl.duration,
		);
	}

	clear(): void {
		for(const value of this._collection.values()) {
			value.clear();
		}
	}
}
