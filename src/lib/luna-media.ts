// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import EventTarget from '@ungap/event-target';
import { AppManifestSchema, LunaApp, LunaAppConstructor } from '@dsbunny/app';
import { MediaDecl } from './media.js';
import { SystemAsyncImport } from './system-async-import.js';

export abstract class AbstractLunaAsset extends EventTarget {
	element: HTMLElement | undefined;

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
		public readonly collection: LunaCollection,
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
	abstract visible(): void;
	abstract hide(): void;
	abstract paint(now: DOMHighResTimeStamp, remaining: number) : void;

	get params() { return this._params; }
	// Per `HTMLElement`.
	get className() { return ''; }
	set className(_value: string) {}
	get classList() { return new DOMTokenList(); }
	get opacity() { return this._opacity; }
	set opacity(value: number) { this._opacity = value; }
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
export class LunaImageAsset extends AbstractLunaAsset {
	protected _startTime: DOMHighResTimeStamp | number = NaN;
	protected _lastTimeUpdate: DOMHighResTimeStamp = 0;
	protected _currentTime: DOMHighResTimeStamp = 0;

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: LunaImageCollection,
	) {
		super(src, params, duration, collection);
	}

	get image(): HTMLImageElement | undefined {
		return this.element as HTMLImageElement;
	}

	override close(): void {
		if(typeof this.image === "undefined") {
			return;
		}
		console.log(`unload image ... ${this.src}`);
		this.pause();
		const collection = this.collection as LunaImageCollection;
		collection.release(this.image);
		this.element = undefined;
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

	override visible(): void {
		if(typeof this.image === "undefined") {
			return;
		}
		this.image.style.visibility = '';
	}
	override hide(): void {
		if(typeof this.image === "undefined") {
			return;
		}
		this.image.style.visibility = 'hidden';
	}

	override set opacity(value: number) {
		if(typeof this.image !== "undefined") {
			const opacity = (value === 1) ? '' : value.toString();
			if(this.image.style.opacity !== opacity) {
				this.image.style.opacity = opacity;
			}
		}
		this._opacity = value;
	}

	override get params() { return super.params; }
	// Per `HTMLElement`.
	override get className() {
		if(typeof this.image === "undefined") {
			return '';
		}
		return this.image.className;
	}
	override set className(value: string) {
		if(typeof this.image !== "undefined") {
			this.image.className = value;
		}
	}
	override get classList() {
		if(typeof this.image === "undefined") {
			return new DOMTokenList();
		}
		return this.image.classList;
	}

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
			const collection = this.collection as LunaImageCollection;
			const img = collection.acquire();
			try {
				img.crossOrigin = 'anonymous';
				img.src = this.src;
				this._networkState = HTMLMediaElement.NETWORK_LOADING;
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
		if(typeof this.element === "undefined") {
			return NaN;
		}
		return (this.element as HTMLImageElement).height;
	}
	override get width() {
		if(typeof this.element === "undefined") {
			return NaN;
		}
		return (this.element as HTMLImageElement).width;
	}
}

export class LunaVideoAsset extends AbstractLunaAsset {
	protected _redispatchEvent = (event: string | Event) => {
		super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
	};

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: LunaVideoCollection,
	) {
		super(src, params, duration, collection);
	}

	get video(): LunaHTMLVideoElement | undefined {
		return this.element as LunaHTMLVideoElement;
	}

	override close(): void {
		if(typeof this.video === "undefined") {
			return;
		}
		console.log(`unload video ... ${this.src}`);
		this.pause();
		const collection = this.collection as LunaVideoCollection;
		const video = this.video;
		video.oncanplay = null;
		video.onended = null;
		video.onerror = null;
		video.onloadeddata = null;
		video.removeAttribute('src');
		collection.release(this.video);
		this.element = undefined;
	}

	override paint(_now: DOMHighResTimeStamp, _remaining: number): void {}

	override visible(): void {
		if(typeof this.video === "undefined") {
			return;
		}
		this.video.style.visibility = '';
	}
	override hide(): void {
		if(typeof this.video === "undefined") {
			return;
		}
		this.video.style.visibility = 'hidden';
	}

	override set opacity(value: number) {
		if(typeof this.video !== "undefined") {
			const opacity = (value === 1) ? '' : value.toString();
			if(this.video.style.opacity !== opacity) {
				this.video.style.opacity = opacity;
			}
		}
		this._opacity = value;
	}

	override get params() { return super.params; }
	// Per `HTMLElement`.
	override get className() {
		if(typeof this.video === "undefined") {
			return '';
		}
		return this.video.className;
	}
	override set className(value: string) {
		if(typeof this.video !== "undefined") {
			this.video.className = value;
		}
	}
	override get classList() {
		if(typeof this.video === "undefined") {
			return new DOMTokenList();
		}
		return this.video.classList;
	}

	// Per `HTMLMediaElement`.
	override get currentSrc() {
		if(typeof this.video === "undefined") {
			return super.currentSrc;
		}
		return this.video.currentSrc;
	}
	override get currentTime() {
		if(typeof this.video === "undefined") {
			return 0;
		}
		return this.video.currentTime;
	}
	override get duration() {
		if(typeof this.video === "undefined") {
			return NaN;
		}
		return this.video.duration;
	}
	override get ended() {
		if(typeof this.video === "undefined") {
			return false;
		}
		return this.video.ended;
	}
	override get error() {
		if(typeof this.video === "undefined") {
			return false;
		}
		return this.video.error;
	}
	override get networkState() {
		if(typeof this.video === "undefined") {
			return HTMLMediaElement.NETWORK_EMPTY;
		}
		return this.video.networkState;
	}
	override get paused() {
		if(typeof this.video === "undefined") {
			return true;
		}
		return this.video.paused;
	}
	override get readyState() {
		if(typeof this.video === "undefined") {
			return HTMLMediaElement.HAVE_NOTHING;
		}
		return this.video.readyState;
	}
	override get src() { return this._src; }
	override get srcObject() {
		if(typeof this.video === "undefined") {
			return null;
		}
		return this.video.srcObject;
	}

	override load(): void {
		const collection = this.collection as LunaVideoCollection;
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
		if(typeof this.video === "undefined") {
			return;
		}
		this.video.pause();
	}

	override async play(): Promise<void> {
		if(typeof this.video === "undefined") {
			return;
		}
		await this.video.play();
	}

	// Per `HTMLVideoElement`.
	override get height() {
		if(typeof this.video === "undefined") {
			return NaN;
		}
		return this.video.height;
	}
	override get width() {
		if(typeof this.video === "undefined") {
			return NaN;
		}
		return this.video.width;
	}
}

export class LunaAppAsset extends AbstractLunaAsset {
	protected _app: LunaApp | undefined;
	protected _redispatchEvent = (event: string | Event) => {
		//console.log(`redispatch event: ${event instanceof Event ? event.type : event}`);
		super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
	};

	constructor(
		src: string,
		params: any,
		duration: number,
		collection: LunaAppCollection,
	) {
		super(src, params, duration, collection);
	}

	override close(): void {
		if(typeof this.element === "undefined") {
			return
		}
		console.log(`unload app ... ${this.src}`);
		this.pause();
		const collection = this.collection as LunaAppCollection;
		if(typeof this._app !== "undefined") {
			this._app.close();
			this._app.removeEventListener('canplay', this._redispatchEvent);
			this._app.removeEventListener('ended', this._redispatchEvent);
			this._app.removeEventListener('error', this._redispatchEvent);
			this._app = undefined;
		}
		collection.release(this.element);
		this.element = undefined;
	}

	override paint(now: DOMHighResTimeStamp, remaining: number): void {
		if(this.paused || this.ended) return;
		if(typeof this._app === "undefined"){
			return;
		}
		this._app.animate(now, remaining);
	}

	override visible(): void {
		if(typeof this.element !== "undefined") {
			this.element.style.visibility = '';
		}
	}
	override hide(): void {
		if(typeof this.element !== "undefined") {
			this.element.style.visibility = 'hidden';
		}
	}

	override set opacity(value: number) {
		if(typeof this.element !== "undefined") {
			const opacity = (value === 1) ? '' : value.toString();
			if(this.element.style.opacity !== opacity) {
				this.element.style.opacity = opacity;
			}
		}
		this._opacity = value;
	}

	override get params() { return super.params; }
	// Per `HTMLElement`.
	override get className() {
		if(typeof this.element === "undefined") {
			return '';
		}
		return this.element.className;
	}
	override set className(value: string) {
		if(typeof this.element !== "undefined") {
			this.element.className = value;
		}
	}
	override get classList() {
		if(typeof this.element === "undefined") {
			return new DOMTokenList();
		}
		return this.element.classList;
	}

	// Per HTMLMediaElement.
	override get currentSrc() {
		if(typeof this._app === "undefined") {
			return super.currentSrc;
		}
		return this._app.currentSrc;
	}
	override get currentTime() {
		if(typeof this._app === "undefined") {
			return super.currentTime;
		}
		return this._app.currentTime;
	}
	override get duration() {
		if(typeof this._app === "undefined") {
			return NaN;
		}
		return this._app.duration;
	}
	override get ended() {
		if(typeof this._app === "undefined") {
			return false;
		}
		return this._app.ended;
	}
	override get error() {
		if(typeof this._app === "undefined") {
			return false;
		}
		return this._app.error;
	}
	override get networkState() {
		if(typeof this._app === "undefined") {
			return HTMLMediaElement.NETWORK_EMPTY;
		}
		return this._app.networkState;
	}
	override get paused() {
		if(typeof this._app === "undefined") {
			return true;
		}
		return this._app.paused;
	}
	override get readyState() {
		if(typeof this._app === "undefined") {
			return HTMLMediaElement.HAVE_NOTHING;
		}
		return this._app.readyState;
	}
	override get src() { return super.src; }
	override get srcObject() {
		return null;
	}

	override load(): void {
		(async () => {
			const collection = this.collection as LunaAppCollection;
			const renderRoot = this.element = collection.acquire();
			try {
				console.log(`import module ... ${this.src}`);
				const manifest = await collection.importModule(this.src);
				console.log(`create LunaApp ... ${this.src}`);
				const params = {
					...((typeof this.params === "undefined") ? {} : this.params),
					src: this.src,
					duration: super.duration,  // WARNING: `super` not `this`.
				}
				const app = this._app = manifest.LunaApp!.create(
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
		if(typeof this._app === "undefined") {
			return;
		}
		this._app.pause();
	}

	override async play(): Promise<void> {
		if(typeof this._app === "undefined") {
			return;
		}
		await this._app.play();
	}

	// Per `HTMLVideoElement`.
	override get height() {
		if(typeof this._app === "undefined") {
			return NaN;
		}
		return this._app.height;
	}
	override get width() {
		if(typeof this._app === "undefined") {
			return NaN;
		}
		return this._app.width;
	}
}

// REF: https://webossignage-docs.developer.lge.com/guides/developer-guides/media-playback/audio-video-attribute/texture-attribute
type LunaHTMLVideoElement = HTMLVideoElement & { texture: boolean };

export abstract class LunaCollection {
	constructor(readonly renderRoot: (HTMLElement | ShadowRoot)) {}
	abstract acquire(): HTMLImageElement | LunaHTMLVideoElement | HTMLElement;
	abstract createLunaAsset(src: string, params: any, duration: number): LunaImageAsset | LunaVideoAsset | LunaAppAsset;
	abstract release(asset: HTMLImageElement | LunaHTMLVideoElement | HTMLElement): void;
	abstract clear(): void;
}

export class LunaImageCollection extends LunaCollection {
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

	override createLunaAsset(
		src: string,
		params: any,
		duration: number,
	): LunaImageAsset {
		return new LunaImageAsset(src, params, duration, this);
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

export class LunaVideoCollection extends LunaCollection {
	protected _videos: LunaHTMLVideoElement[] = [];
	protected _count = 0;

	constructor(renderRoot: (HTMLElement | ShadowRoot)) {
		super(renderRoot);
	}

	override acquire(): LunaHTMLVideoElement {
		let video = this._videos.pop();
		if(typeof video === "undefined") {
			video = document.createElement('video') as LunaHTMLVideoElement;
			this._count++;
			video.texture = true;
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

	override createLunaAsset(
		src: string,
		params: any,
		_duration: number,
	): LunaVideoAsset {
		return new LunaVideoAsset(src, params, NaN, this);
	}

	override release(video: LunaHTMLVideoElement): void {
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

export class LunaAppCollection extends LunaCollection {
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
			const module = await SystemAsyncImport(src);
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

	override createLunaAsset(
		src: string,
		params: any,
		duration: number,
	): LunaAppAsset {
		return new LunaAppAsset(src, params, duration, this);
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

export class LunaAssetManager {
	protected _renderTarget: HTMLElement | undefined;
	protected _collection: Map<string, LunaCollection> = new Map();

	setAssetTarget(renderTarget: HTMLElement): void {
		this._renderTarget = renderTarget;
	}

	protected _createCollection(renderTarget: HTMLElement): Map<string, LunaCollection> {
		// TypeScript assumes iterator of first type.
		const collection = new Map([
			['HTMLImageElement', new LunaImageCollection(renderTarget) as LunaCollection],
			['HTMLVideoElement', new LunaVideoCollection(renderTarget) as LunaCollection],
			['CustomElement', new LunaAppCollection(renderTarget) as LunaCollection],
		]);
		return collection;
	}

	// decl: { type, href }
	// Returns: asset.
	createLunaAsset(decl: MediaDecl): AbstractLunaAsset {
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
		return collection.createLunaAsset(
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
