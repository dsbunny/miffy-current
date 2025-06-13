// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as THREE from 'three';
import { AppBaseParams, AppManifestSchema, AppParams, WebGLApp, WebGLAppConstructor } from '@dsbunny/app';
import { MediaDecl } from './media.js';

export abstract class AbstractThreeAsset extends EventTarget {
	texture: THREE.Texture | null = null;

	protected _src: string;
	protected _params: AppBaseParams;
	// Per `HTMLMediaElement`.
	protected _duration: number;
	protected _ended = false;
	protected _error: any = null;
	protected _networkState: number = HTMLMediaElement.NETWORK_NO_SOURCE;
	protected _paused = true;
	protected _readyState: number = HTMLMediaElement.HAVE_NOTHING;

	constructor(
		src: string,
		params: any,
		duration: number,
		public readonly collection: ThreeCollection,
	) {
		super();
		const url = new URL(src, self.location.href);
		this._src = url.href;
		if(this._src.length !== 0) {
			this._networkState = HTMLMediaElement.NETWORK_EMPTY;
		}
		this._params = params;
		this._duration = duration;
	}

	abstract close(): void;
	abstract paint(now: DOMHighResTimeStamp, remaining: number) : void;

	get params() { return this._params; }
	// Per `HTMLMediaElement`.
	get currentSrc() { return this._src; }
	get currentTime() { return 0; }
	get duration() { return this._duration; }
	get ended() { return this._ended; }
	get error() { return this._error; }
	get networkState() { return this._networkState; }
	get paused() { return this._paused; }
	get readyState() { return this._readyState; }
	get src() { return this._src; }
	get srcObject(): MediaProvider | null { return null; }
	abstract load(): void;
	abstract pause(): void;
	abstract play(): Promise<void>;
	// Per `HTMLVideoElement`.
	get height() { return 0; }
	get width() { return 0; }
}

// super must be used to call functions only, operation is undefined when
// accessing variables that are not hidden behind getters and setters.
export class ThreeImageAsset extends AbstractThreeAsset {
	protected _startTime: DOMHighResTimeStamp | number = NaN;
	protected _lastTimeUpdate: DOMHighResTimeStamp = 0;
	protected _currentTime: DOMHighResTimeStamp = 0;

	constructor(
		src: string,
		params: AppBaseParams,
		duration: number,
		collection: ThreeImageCollection,
	) {
		super(src, params, duration, collection);
	}

	get image(): HTMLImageElement | null {
		return this.texture?.image as HTMLImageElement || null;
	}

	override close(): void {
		if(this.texture === null || this.image === null) {
			return;
		}
		console.log(`unload image ... "${this.src}"`);
		this.pause();
		const collection = this.collection as ThreeImageCollection;
		collection.release(this.image);
		this.texture.dispose();
		this.texture = null;
		this._readyState = HTMLMediaElement.HAVE_NOTHING;
		this._networkState = HTMLMediaElement.NETWORK_EMPTY;
		this._currentTime = 0;
		this._startTime = NaN;
		this._lastTimeUpdate = 0;
		this._ended = false;
		this._error = null;
	}

	// FIXME: delta for paused.
	override paint(now: DOMHighResTimeStamp, _remaining: number): void {
		if(this.paused || this.ended) return;
		const elapsed = (now - this._startTime) / 1000;
		this._currentTime += elapsed;
		if(this._currentTime > this._duration) {
			this._setEndedState();
		} else {
			if(Math.floor(this._currentTime) > this._lastTimeUpdate) {
				this._lastTimeUpdate = this._currentTime;
				this.dispatchEvent(new Event('timeupdate'));
			}
		}
	}

	protected _setEndedState(): void {
		this._currentTime = this._duration;
		this._ended = true;
		this._startTime = NaN;
		this.dispatchEvent(new Event('ended'));
	}

	override get params() { return super.params; }
	// Per HTMLMediaElement.
	override get currentSrc() { return super.currentSrc; }
	override get currentTime() { return this._currentTime; }
	override get duration() { return super.duration; }
	override get ended() { return super.ended; }
	override get error() { return super.error; }
	override get networkState() { return super.networkState; }
	override get paused() { return super.paused; }
	override get readyState() { return super.readyState; }
	override get src() { return super.src; }
	override get srcObject() { return null; }

	override load(): void {
		(async () => {
			const collection = this.collection as ThreeImageCollection;
			const img = collection.acquire();
			this._networkState = HTMLMediaElement.NETWORK_LOADING;
			try {
				console.log(`load image ... "${this.src}"`);
				img.crossOrigin = 'anonymous';
				img.setAttribute('src', this.src);
				await img.decode();
				this.texture = new THREE.Texture(img);
				this.texture.needsUpdate = true;
				this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA
				super.dispatchEvent(new Event('canplay'));
			} catch(encodingError: unknown) {
				console.warn(`Failed to load image: "${this.src}" Error: ${encodingError}`);
				this._error = encodingError;
				this._networkState = HTMLMediaElement.NETWORK_IDLE;
				collection.release(img);
				super.dispatchEvent(new Event('error'));
			}
		})();
	}

	override pause(): void {
		if(this._paused) return;
		this._paused = true;
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
	}

	// Per `HTMLVideoElement`.
	override get height() {
		if(this.image === null) {
			return NaN;
		}
		return this.image.height;
	}
	override get width() {
		if(this.image === null) {
			return NaN;
		}
		return this.image.width;
	}
}

export class ThreeVideoAsset extends AbstractThreeAsset {
	protected _redispatchEvent = (event: string | Event) => {
		super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
	};

	constructor(
		src: string,
		params: AppBaseParams,
		duration: number,
		collection: ThreeVideoCollection,
	) {
		super(src, params, duration, collection);
	}

	get video(): HTMLVideoElement | null {
		return this.texture?.image as HTMLVideoElement || null;
	}

	override close(): void {
		if(this.texture === null || this.video === null) {
			return;
		}
		console.log(`unload video ... "${this.src}"`);
		this.pause();
		const collection = this.collection as ThreeVideoCollection;
		const video = this.video!;
		video.oncanplay = null;
		video.onended = null;
		video.onerror = null;
		video.onloadeddata = null;
		video.removeAttribute('src');
		collection.release(video);
		this.texture.dispose();
		this.texture = null;
	}

	override paint(_now: DOMHighResTimeStamp, _remaining: number): void {}

	override get params() { return super.params; }
	// Per `HTMLMediaElement`.
	override get currentSrc() {
		if(this.video === null) {
			return super.currentSrc;
		}
		return this.video.currentSrc;
	}
	override get currentTime() {
		if(this.video === null) {
			return super.currentTime;
		}
		return this.video.currentTime;
	}
	override get duration() {
		if(this.video === null) {
			return NaN;
		}
		return this.video.duration;
	}
	override get ended() {
		if(this.video === null) {
			return false;
		}
		return this.video.ended;
	}
	override get error() {
		if(this.video === null) {
			return false;
		}
		return this.video.error;
	}
	override get networkState() {
		if(this.video === null) {
			return HTMLMediaElement.NETWORK_EMPTY;
		}
		return this.video.networkState;
	}
	override get paused() {
		if(this.video === null) {
			return true;
		}
		return this.video.paused;
	}
	override get readyState() {
		if(this.video === null) {
			return HTMLMediaElement.HAVE_NOTHING;
		}
		return this.video.readyState;
	}
	override get src() { return super.src; }
	override get srcObject() {
		if(this.video === null) {
			return null;
		}
		return this.video.srcObject;
	}

	override load(): void {
		const collection = this.collection as ThreeVideoCollection;
		const video = collection.acquire();
		video.oncanplay = this._redispatchEvent;
		video.onended = this._redispatchEvent;
		video.onerror = this._redispatchEvent;
		// Avoid "WebGL: INVALID_VALUE: texImage2D: no video".
		video.onloadeddata = (event: Event) => {
			console.log(`create video texture ... "${this.src}"`);
			this.texture = new THREE.VideoTexture(video);
			this.texture.needsUpdate = true;
			this._redispatchEvent(event);
		};
		try {
			console.log(`load video ... "${this.src}"`);
			video.crossOrigin = 'anonymous';
			video.setAttribute('src', this.src);
			video.load();
		} catch(encodingError: unknown) {
			collection.release(video);
			throw encodingError;
		}
	}

	override pause(): void {
		if(this.video === null) {
			return;
		}
		this.video.pause();
	}

	override async play(): Promise<void> {
		if(this.video === null) {
			return;
		}
		await this.video.play();
	}

	// Per `HTMLVideoElement`.
	override get height() {
		if(this.video === null) {
			return NaN;
		}
		return this.video.height;
	}
	override get width() {
		if(this.video === null) {
			return NaN;
		}
		return this.video.width;
	}
}

export class ThreeAppAsset extends AbstractThreeAsset {
	protected _app: WebGLApp | null = null;
	protected _fbo: THREE.WebGLRenderTarget | null = null;
	protected _redispatchEvent = (event: string | Event) => {
		super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
	};

	constructor(
		src: string,
		params: AppBaseParams,
		duration: number,
		collection: ThreeAppCollection,
	) {
		super(src, params, duration, collection);
	}

	override close(): void {
		if(this.texture === null) {
			return;
		}
		console.log(`unload app ... "${this.src}"`);
		this.pause();
		const collection = this.collection as ThreeAppCollection;
		if(this._app !== null) {
			this._app.close();
			this._app.removeEventListener('canplay', this._redispatchEvent);
			this._app.removeEventListener('ended', this._redispatchEvent);
			this._app.removeEventListener('error', this._redispatchEvent);
			this._app = null;
		}
		if(this._fbo !== null) {
			collection.release(this._fbo);
			this._fbo = null;
		}
		this.texture.dispose();
		this.texture = null;
	}

	override paint(now: DOMHighResTimeStamp, remaining: number): void {
		if(this.paused || this.ended) return;
		if(this._app === null) {
			return;
		}
		this._app.animate(now, remaining);
	}

	override get params() { return super.params; }
	// Per `HTMLMediaElement`.
	override get currentSrc() {
		if(this._app === null) {
			return super.currentSrc;
		}
		return this._app.currentSrc;
	}
	override get currentTime() {
		if(this._app === null) {
			return super.currentTime;
		}
		return this._app.currentTime;
	}
	override get duration() {
		if(this._app === null) {
			return NaN;
		}
		return this._app.duration;
	}
	override get ended() {
		if(this._app === null) {
			return false;
		}
		return this._app.ended;
	}
	override get error() {
		if(this._app === null) {
			return false;
		}
		return this._app.error;
	}
	override get networkState() {
		if(this._app === null) {
			return HTMLMediaElement.NETWORK_EMPTY;
		}
		return this._app.networkState;
	}
	override get paused() {
		if(this._app === null) {
			return true;
		}
		return this._app.paused;
	}
	override get readyState() {
		if(this._app === null) {
			return HTMLMediaElement.HAVE_NOTHING;
		}
		return this._app.readyState;
	}
	override get src() { return super.src; }
	override get srcObject() { return super.srcObject; }

	override load(): void {
		(async () => {
			const collection = this.collection as ThreeAppCollection;
			const fbo = this._fbo = collection.acquire();
			try {
				console.log(`import module ... "${this.src}"`);
				const manifest = await collection.importModule(this.src);
				console.log(`create WebGLApp ... "${this.src}"`);
				const params = {
					...this.params,
					src: this.src,
					duration: super.duration,  // WARNING: `super` not `this`.
				}
				const app = this._app = manifest.WebGLApp!.create(
					fbo,
					collection.renderer,
					params,
				);
				app.addEventListener('canplay', this._redispatchEvent);
				app.addEventListener('ended', this._redispatchEvent);
				app.addEventListener('error', this._redispatchEvent);
				this.texture = fbo.texture;
				console.log(`init "${manifest.name}" with params:`, params);
				app.load();
			} catch(initError: unknown) {
				console.warn(`Failed to load app: "${this.src}"`, initError);
				collection.release(fbo);
				super.dispatchEvent(new Event('error'));
			}
		})();
	}

	override pause(): void {
		if(this._app === null) {
			return;
		}
		this._app.pause();
	}

	override async play(): Promise<void> {
		if(this._app === null) {
			return;
		}
		await this._app.play();
	}

	// Per `HTMLVideoElement`.
	override get height() {
		if(this._app === null) {
			return NaN;
		}
		return this._app.height;
	}
	override get width() {
		if(this._app === null) {
			return NaN;
		}
		return this._app.width;
	}
}

abstract class ThreeCollection {
	constructor(readonly renderRoot: (HTMLElement | ShadowRoot)) {}
	abstract acquire(): HTMLImageElement | HTMLVideoElement | THREE.WebGLRenderTarget;
	abstract createThreeAsset(src: string, params: AppBaseParams, duration: number): ThreeImageAsset | ThreeVideoAsset | ThreeAppAsset;
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
		params: AppBaseParams,
		duration: number,
	): ThreeImageAsset {
		return new ThreeImageAsset(src, params, duration, this);
	}

	override release(img: HTMLImageElement): void {
		img.removeAttribute('src');
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
		params: AppBaseParams,
		_duration: number,
	): ThreeVideoAsset {
		return new ThreeVideoAsset(src, params, NaN, this);
	}

	override release(video: HTMLVideoElement): void {
		if(!video.paused) {
			video.pause();
		}
		video.removeAttribute('src');
		this._videos.push(video);
	}

	override clear(): void {
		for(const video of this._videos) {
			this.renderRoot.removeChild(video);
		}
		this._videos = [];
	}
}

class ThreeAppCollection extends ThreeCollection {
	protected _manifests = new Map<string, AppManifestSchema>();
	protected _fbos: THREE.WebGLRenderTarget[] = [];

	constructor(
		renderRoot: (HTMLElement | ShadowRoot),
		public readonly renderer: THREE.WebGLRenderer,
	) {
		super(renderRoot);
	}

	override acquire(): THREE.WebGLRenderTarget {
		let fbo = this._fbos.pop();
		if(typeof fbo === "undefined") {
			const width = 1024;  // * this.renderer.getPixelRatio();
			const height = 1024;  // * this.renderer.getPixelRatio();
			fbo = new THREE.WebGLRenderTarget(width, height, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter,
				depthBuffer: false,
				stencilBuffer: false,
			});
		}
		return fbo;
	}

	async importModule(src: string): Promise<AppManifestSchema> {
		let manifest = this._manifests.get(src);
		if(typeof manifest === 'undefined') {
			console.log(`import app manifest ... "${src}"`);
			const module = await import(src);
			console.log(`validate app manifest ... "${src}"`);
			const result = AppManifestSchema.safeParse(module.default);
			console.log(`app manifest validation result: ${result.success} ... "${src}"`);
			if(!result.success) {
				throw new Error(`Invalid app manifest: "${src}"`);
			}
			if(!result.data.WebGLApp) {
				throw new Error(`WebGLApp constructor not found in manifest: "${src}"`);
			}
			manifest = result.data;
			this._manifests.set(src, manifest);
		}
		return manifest;
	}

	override createThreeAsset(
		src: string,
		params: AppBaseParams,
		duration: number,
	): ThreeAppAsset {
		return new ThreeAppAsset(src, params, duration, this);
	}

	override release(fbo: THREE.WebGLRenderTarget): void {
		this._fbos.push(fbo);
	}

	override clear(): void {
		for(const fbo of this._fbos) {
			fbo.dispose();
		}
		this._fbos = [];
		this._manifests.clear();
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
	createThreeAsset(decl: MediaDecl): AbstractThreeAsset {
		console.log(`createThreeAsset: ${decl['@type']} ${decl.href} (${decl.duration}s)`);
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
