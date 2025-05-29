// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import EventTarget from '@ungap/event-target';
import { AppManifestSchema, WebApp, WebAppConstructor } from '@dsbunny/app';
import { MediaDecl } from './media.js';
import "./htmlimageelement-decode-polyfill.js";

export abstract class AbstractWebAsset extends EventTarget {
	element: HTMLElement | null = document.createElement('div');

	protected _src: string;
	protected _opacity = 1;
	protected _params: any;
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
		public readonly collection: WebCollection,
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
	// Per `HTMLElement`.
	get className() { return this.element!.className; }
	set className(_value: string) { this.element!.className = _value; }
	get classList() { return this.element!.classList; }
	get style() { return this.element!.style; }
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
export class WebImageAsset extends AbstractWebAsset {
	protected _startTime: DOMHighResTimeStamp | number = NaN;
	protected _lastTimeUpdate: DOMHighResTimeStamp = 0;
	protected _currentTime: DOMHighResTimeStamp = 0;

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: WebImageCollection,
	) {
		super(src, params, duration, collection);
	}

	get image(): HTMLImageElement | null {
		return this.element as HTMLImageElement;
	}

	override close(): void {
		if(typeof this.image === "undefined") {
			return;
		}
		console.log(`unload image ... ${this.src}`);
		this.pause();
		const collection = this.collection as WebImageCollection;
		collection.release(this.image!);
		this.element = null;
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
		if(this._currentTime > this.duration) {
			this._setEndedState();
		} else {
			if(Math.floor(this._currentTime) > this._lastTimeUpdate) {
				this._lastTimeUpdate = this._currentTime;
				this.dispatchEvent(new Event('timeupdate'));
			}
		}
	}

	protected _setEndedState(): void {
		this._currentTime = this.duration;
		this._ended = true;
		this._startTime = NaN;
		this.dispatchEvent(new Event('ended'));
	}

	override get params() { return super.params; }
	// Per `HTMLElement`.
	override get className() { return super.className; }
	override set className(value: string) { super.className = value; }
	override get classList() { return super.classList; }
	override get style() { return super.style; }

	// Per `HTMLMediaElement`.
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
			const collection = this.collection as WebImageCollection;
			const img = this.element = collection.acquire();
			img.crossOrigin = 'anonymous';
			img.src = this.src;
			this._networkState = HTMLMediaElement.NETWORK_LOADING;
			try {
				console.log(`load image ... ${this.src}`);
				await img.decode();
				this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA
				super.dispatchEvent(new Event('canplay'));
			} catch(encodingError: unknown) {
				console.warn(`Failed to load image: ${this.src}`, encodingError);
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
		return this.image!.height;
	}
	override get width() {
		if(this.image === null) {
			return NaN;
		}
		return this.image!.width;
	}
}

export class WebVideoAsset extends AbstractWebAsset {
	protected _redispatchEvent = (event: string | Event) => {
		super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
	};

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: WebVideoCollection,
	) {
		super(src, params, duration, collection);
	}

	get video(): HTMLVideoElement | null {
		return this.element as HTMLVideoElement;
	}

	override close(): void {
		if(typeof this.video === "undefined") {
			return;
		}
		console.log(`unload video ... ${this.src}`);
		this.pause();
		const collection = this.collection as WebVideoCollection;
		const video = this.video as HTMLVideoElement;
		video.oncanplay = null;
		video.onended = null;
		video.onerror = null;
		video.onloadeddata = null;
		video.removeAttribute('src');
		collection.release(video);
		this.element = null;
	}

	override paint(_now: DOMHighResTimeStamp, _remaining: number): void {}

	override get params() { return super.params; }
	// Per `HTMLElement`.
	override get className() { return super.className; }
	override set className(value: string) { super.className = value; }
	override get classList() { return super.classList; }
	override get style() { return super.style; }

	// Per `HTMLMediaElement`.
	override get currentSrc() {
		if(this.video === null) {
			return super.currentSrc;
		}
		return this.video!.currentSrc;
	}
	override get currentTime() {
		if(this.video === null) {
			return 0;
		}
		return this.video!.currentTime;
	}
	override get duration() {
		if(this.video === null) {
			return NaN;
		}
		return this.video!.duration;
	}
	override get ended() {
		if(this.video === null) {
			return false;
		}
		return this.video!.ended;
	}
	override get error() {
		if(this.video === null) {
			return false;
		}
		return this.video!.error;
	}
	override get networkState() {
		if(this.video === null) {
			return HTMLMediaElement.NETWORK_EMPTY;
		}
		return this.video!.networkState;
	}
	override get paused() {
		if(this.video === null) {
			return true;
		}
		return this.video!.paused;
	}
	override get readyState() {
		if(this.video === null) {
			return HTMLMediaElement.HAVE_NOTHING;
		}
		return this.video!.readyState;
	}
	override get src() { return this._src; }
	override get srcObject() {
		if(this.video === null) {
			return null;
		}
		return this.video!.srcObject;
	}

	override load(): void {
		const collection = this.collection as WebVideoCollection;
		const video = this.element = collection.acquire();
		video.oncanplay = this._redispatchEvent;
		video.onended = this._redispatchEvent;
		video.onerror = this._redispatchEvent;
		video.src = this.src;
		// Avoid "WebGL: INVALID_VALUE: texImage2D: no video".
		video.onloadeddata = this._redispatchEvent;
		try {
			console.log(`load video ... ${this.src}`);
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
		this.video!.pause();
	}

	override async play(): Promise<void> {
		if(this.video === null) {
			return;
		}
		await this.video!.play();
	}

	// Per `HTMLVideoElement`.
	override get height() {
		if(this.video === null) {
			return NaN;
		}
		return this.video!.height;
	}
	override get width() {
		if(this.video === null) {
			return NaN;
		}
		return this.video!.width;
	}
}

export class WebAppAsset extends AbstractWebAsset {
	protected _app: WebApp | null = null;
	protected _redispatchEvent = (event: string | Event) => {
		//console.log(`redispatch event: ${event instanceof Event ? event.type : event}`);
		super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
	};

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: WebAppCollection,
	) {
		super(src, params, duration, collection);
	}

	get container(): HTMLElement | null {
		return this.element;
	}

	override close(): void {
		if(typeof this.element === "undefined") {
			return
		}
		console.log(`unload app ... ${this.src}`);
		this.pause();
		const collection = this.collection as WebAppCollection;
		if(this._app !== null) {
			this._app.close();
			this._app.removeEventListener('canplay', this._redispatchEvent);
			this._app.removeEventListener('ended', this._redispatchEvent);
			this._app.removeEventListener('error', this._redispatchEvent);
			this._app = null;
		}
		collection.release(this.container!);
		this.element = null;
	}

	override paint(now: DOMHighResTimeStamp, remaining: number): void {
		if(this.paused || this.ended) return;
		if(this._app === null){
			return;
		}
		this._app.animate(now, remaining);
	}

	override get params() { return super.params; }
	// Per `HTMLElement`.
	override get className() { return super.className; }
	override set className(value: string) { super.className = value; }
	override get classList() { return super.classList; }
	override get style() { return super.style; }

	// Per HTMLMediaElement.
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
			const collection = this.collection as WebAppCollection;
			const renderRoot = this.element = collection.acquire();
			try {
				console.log(`import module ... ${this.src}`);
				const manifest = await collection.importModule(this.src);
				console.log(`create WebApp ... ${this.src}`);
				const params = {
					...((typeof this.params === "undefined") ? {} : this.params),
					src: this.src,
					duration: super.duration,  // WARNING: `super` not `this`.
				}
				const app = this._app = manifest.WebApp!.create(
					renderRoot,
					params,
				);
				app.addEventListener('canplay', this._redispatchEvent);
				app.addEventListener('ended', this._redispatchEvent);
				app.addEventListener('error', this._redispatchEvent);
				console.log(`load app ... ${this.src}`);
				app.load();
			} catch(initError: any) {
				collection.release(renderRoot);
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

export abstract class WebCollection {
	constructor(readonly renderRoot: (HTMLElement | ShadowRoot)) {}
	abstract acquire(): HTMLImageElement | HTMLVideoElement | HTMLElement;
	abstract createWebAsset(src: string, params: any, duration: number): WebImageAsset | WebVideoAsset | WebAppAsset;
	abstract release(asset: HTMLImageElement | HTMLVideoElement | HTMLElement): void;
	abstract clear(): void;
}

export class WebImageCollection extends WebCollection {
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

	override createWebAsset(
		src: string,
		params: any,
		duration: number,
	): WebImageAsset {
		return new WebImageAsset(src, params, duration, this);
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
		this._count = 0;
	}
}

export class WebVideoCollection extends WebCollection {
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

	override createWebAsset(
		src: string,
		params: any,
		_duration: number,
	): WebVideoAsset {
		return new WebVideoAsset(src, params, NaN, this);
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
		this._count = 0;
	}
}

export class WebAppCollection extends WebCollection {
	protected _manifests = new Map<string, AppManifestSchema>();
	protected _roots: HTMLElement[] = [];
	protected _count = 0;

	constructor(
		renderRoot: (HTMLElement | ShadowRoot),
	) {
		super(renderRoot);
	}

	override acquire(): HTMLElement {
		let root = this._roots.pop();
		if(typeof root === "undefined") {
			root = document.createElement('article');
			this._count++;
			this.renderRoot.appendChild(root);
		} else {
			root.className = '';
		}
		return root;
	}

	async importModule(src: string): Promise<AppManifestSchema> {
		let manifest = this._manifests.get(src);
		if(typeof manifest === 'undefined') {
			const module = await import(src);
			const result = AppManifestSchema.safeParse(module.default);
			if(!result.success) {
				throw new Error(`Invalid app manifest: ${src}`);
			}
			if(!result.data.WebApp) {
				throw new Error(`WebApp constructor not found in manifest: ${src}`);
			}
			manifest = result.data;
			this._manifests.set(src, manifest);
		}
		return manifest;
	}

	override createWebAsset(
		src: string,
		params: any,
		duration: number,
	): WebAppAsset {
		return new WebAppAsset(src, params, duration, this);
	}

	override release(root: HTMLElement): void {
		if(this._count > 2) {
			this.renderRoot.removeChild(root);
			this._count--;
			return;
		}
		root.className = 'spare';
		root.style.opacity = '';
		root.style.visibility = '';
		this._roots.push(root);
	}

	override clear(): void {
		for(const root of this._roots) {
			this.renderRoot.removeChild(root);
		}
		this._roots = [];
		this._manifests.clear();
		this._count = 0;
	}
}

export class WebAssetManager {
	protected _renderTarget: HTMLElement | undefined;
	protected _collection: Map<string, WebCollection> = new Map();

	setAssetTarget(renderTarget: HTMLElement): void {
		this._renderTarget = renderTarget;
	}

	protected _createCollection(
		renderTarget: HTMLElement,
	): Map<string, WebCollection> {
		// TypeScript assumes iterator of first type.
		const collection = new Map([
			['HTMLImageElement', new WebImageCollection(renderTarget) as WebCollection],
			['HTMLVideoElement', new WebVideoCollection(renderTarget) as WebCollection],
			['CustomElement', new WebAppCollection(renderTarget) as WebCollection],
		]);
		return collection;
	}

	// decl: { type, href }
	// Returns: asset.
	createWebAsset(decl: MediaDecl): AbstractWebAsset {
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
		return collection.createWebAsset(
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
