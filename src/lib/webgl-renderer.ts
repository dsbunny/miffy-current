// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as Comlink from 'comlink';
import * as THREE from 'three';
import shader from '../lib/shader.js';
import { View, Renderer } from '../lib/renderer.js';
import { SchedulerState, SchedulerAssetDeclWithRemainingTime, SchedulerAssetTransition } from '../lib/scheduler.js';
import { AssetDecl, MediaDecl } from '../lib/media.js';
import { ThreeAsset, ThreeAssetManager } from '../lib/three-media.js';
import { Prefetch } from '../lib/prefetch.js';
import { ServiceWorkerPrefetch } from '../lib/service-worker-prefetch.js';

const DEBUG_SHOW_DETAIL = true;

// REF: http://jsfiddle.net/unLSJ/
function replacer(_match: any, pIndent: any, pKey: any, pVal: any, pEnd: any): any {
	const key = '<span class=json-key>';
	const val = '<span class=json-value>';
	const str = '<span class=json-string>';
	let r = pIndent || '';
	if(pKey) {
	   	r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
	}
	if(pVal) {
	 	r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
	}
	return r + (pEnd || '');
}
function prettyPrint(obj: any): string {
	const jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
	return JSON.stringify(obj, null, 3)
	   	.replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
	   	.replace(/</g, '&lt;').replace(/>/g, '&gt;')
	   	.replace(jsonLine, replacer);
}

class RendererAsset {
	is_loading = false;
	has_texture = false;
	end_time = NaN;
	protected _ref_count = 0;

	constructor(readonly id: string, public media_asset: ThreeAsset) {}

	get paused() { return this.media_asset.paused; }
	get ended() { return this.media_asset.ended; }
	get readyState() { return this.media_asset.readyState; }
	get networkState() { return this.media_asset.networkState; }
	get texture() { return this.media_asset.texture; }
	get currentSrc() { return this.media_asset.currentSrc; }
	get currentTime() { return this.media_asset.currentTime; }
	set currentTime(timestamp: number) { this.media_asset.currentTime = timestamp; }

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

export class WebGLRenderer extends EventTarget implements Renderer {

	static vertexShader = shader`
		#version 300 es
		precision mediump float;
		in vec2 uv;
		in vec4 position;
		uniform mat4 projectionMatrix;
		uniform mat4 modelViewMatrix;
		out vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * position;
		}
	`;

	static fragmentShader = shader`
		#version 300 es
		precision mediump float;
		uniform sampler2D map1;
		uniform sampler2D map2;
		uniform sampler2D displacement;
		uniform float pct;
		in vec2 vUv;
		out vec4 OutputColor;

		#define PI radians(180.0)

		void main() {
			vec4 displacementColor = texture(displacement, vUv);
			float effectFactor = 1.0;
			vec2 uv1 = vec2(vUv.x + pct * (displacementColor.r * effectFactor), vUv.y);
			vec2 uv2 = vec2(vUv.x - (1.0 - pct) * (displacementColor.r * effectFactor), vUv.y);
			OutputColor = mix(texture(map1, uv1), texture(map2, uv2), pct);
		}
	`;

	protected _mam = new ThreeAssetManager();
	protected _renderer: THREE.WebGLRenderer | undefined;
	protected _camera: THREE.OrthographicCamera | undefined;
	protected _scene = new THREE.Scene();
	protected _views: View[] = [];
	protected _displacement_url = "";
	protected _transition_percent = 0;
	protected _transition_percent_speed = 0;
	protected _displacement_texture = new THREE.Texture();
	protected _empty_texture = new THREE.Texture();
	protected _network_loading_count = 0;
	protected _current_asset: RendererAsset | null = null;
	protected _next_asset: RendererAsset | null = null;
	protected _shader = new THREE.RawShaderMaterial({
		side: THREE.DoubleSide,
		transparent: true,
		depthTest: false,
		depthWrite: false,
		uniforms: {
			map1: { value: this._empty_texture },
			map2: { value: this._empty_texture },
			displacement: { value: this._empty_texture },
			pct: { value: this._transition_percent }
		},
		vertexShader: WebGLRenderer.vertexShader,
		fragmentShader: WebGLRenderer.fragmentShader,
	});
	protected _map1_asset: RendererAsset | null = null;
	protected _map2_asset: RendererAsset | null = null;
	protected _asset_cache: Map<string, RendererAsset> = new Map();
	protected _asset_trash: Map<string, RendererAsset> = new Map();
	protected _set_state_hook: any;
	protected _asset_prefetch: Prefetch;
	// Per HTMLMediaElement.
	protected _ended = false;
	protected _error = null;
	protected _networkState: number = HTMLMediaElement.NETWORK_EMPTY;
	protected _paused = true;
	protected _readyState: number = HTMLMediaElement.HAVE_NOTHING;

	protected _debug = document.createElement('div');

	constructor() {
		super();
		this._asset_prefetch = new ServiceWorkerPrefetch();
		if(DEBUG_SHOW_DETAIL) {
			this._debug.className = 'debug';
			document.body.appendChild(this._debug);
		}
	}

	get ended() { return this._ended; }
	get error() { return this._error; }
	get networkState() { return this._networkState; }
	get paused() { return this._paused; }
	get readyState() { return this._readyState; }

	// Called after placement in DOM.
	init() {
		console.groupCollapsed("WEBGL-RENDERER: init");
		this._initThreeJSRenderer();
		const mesh = this._createMesh(this._shader, this._empty_texture);
		this._scene.add(mesh);
		if(typeof this._renderer === "undefined") {
			throw new Error("undefined renderer.");
		}
		this._mam.setRenderer(this._renderer);
		console.groupEnd();
	}

	close() {
		console.log("WEBGL-RENDERER: close");
		for(const asset of this._asset_cache.values()) {
			asset.pause();
			asset.close();
		}
		this._asset_cache.clear();
	}

	setSetStateHook(cb: any): void {
		this._set_state_hook = cb;
	}

	clearSetStateHook(): void {
		this._set_state_hook = undefined;
	}

	setSchedulerMessagePort(scheduler: MessagePort): void {
		console.log("WEBGL-RENDERER: setSchedulerMessagePort", scheduler);
		Comlink.expose({
			setState: (value: SchedulerState) => this.setState(value),
			setSources: async (scope: string, decls: MediaDecl[]) => {
				await this.setSources(scope, decls.map(decl => {
					return {
						'@type': decl['@type'],
						id: decl.id,
						href: decl.href,
						size: decl.size,
						hash: decl.hash,
						integrity: decl.integrity,
					} as AssetDecl;
				}));
			},
		}, scheduler);
	}

	// Called by Scheduler or via Cluster as a follower.  This API receives
	// the near and immediate scheduling state to render the current and
	// next media asset, including the transition between the two.
	async setState(value: SchedulerState): Promise<void> {
		// In a cluster we need to forward the state to all nodes
		// before we can process.
		if(typeof this._set_state_hook !== "undefined") {
			this._set_state_hook(value);
			return;
		}
		await this.setStateUnhooked(value);
	}

	protected _lastDebug = "";
	async setStateUnhooked(value: SchedulerState): Promise<void> {
		if(DEBUG_SHOW_DETAIL) {
			const html = prettyPrint(value);
			if(html !== this._lastDebug) {
				this._debug.innerHTML = this._lastDebug = html;
			}
		}
		await this._onSchedulerCurrent(value.mediaCurrent);
		this._onSchedulerNext(value.mediaNext);
		await this._onSchedulerTransition(value.transition);
	}

	setAssetTarget(assetTarget: HTMLElement): void {
		console.log("WEBGL-RENDERER: setAssetTarget", assetTarget);
		this._mam.setAssetTarget(assetTarget);
	}

	setRenderTarget(renderTarget: HTMLElement): void {
		console.log("WEBGL-RENDERER: setRenderTarget", renderTarget);
		if(typeof this._renderer === "undefined") {
			throw new Error("ThreeJS renderer not defined.");
		}
		renderTarget.appendChild(this._renderer.domElement);
	}

	setPixelRatio(value: number): void {
		console.log("WEBGL-RENDERER: setPixelRatio", value);
		if(typeof this._renderer === "undefined") {
			throw new Error("ThreeJS renderer not defined.");
		}
		this._renderer.setPixelRatio(value);
	}

	setSize(width: number, height: number): void {
		console.log("WEBGL-RENDERER: setSize", width, height);
		if(typeof this._renderer === "undefined") {
			throw new Error("ThreeJS renderer not defined.");
		}
		this._renderer.setSize(width, height);
		const near = 0.1;
		const far = 10000;
		const z = 2000;
		this._camera = this._createThreeJSCamera(width, height, near, far, z);
	}

	setViews(views: View[]): void {
		console.log("WEBGL-RENDERER: setViews", views);
		this._views = views;
	}

	async setSources(scope: string, sources: AssetDecl[]): Promise<void> {
		console.log("WEBGL-RENDERER: setSources", scope, sources);
		await this._asset_prefetch.acquireSources(scope, sources);
	}

	protected _createMesh(material: THREE.Material, displacement_texture: THREE.Texture): THREE.Mesh {
		console.log("WEBGL-RENDERER: _createMesh", material, displacement_texture);
		// FIXME: Tied to image resolution.
		const media_width = 1000;
		const media_height = 1000;
		const mesh = this._meshFrom(
			material,
			0, media_width,
			0, media_height,
			media_width, media_height
		);
		this._shader.uniforms.displacement.value = displacement_texture;
		console.log('WEBGL-RENDERER: Created new mesh', mesh);
		return mesh;
	}

	protected _initTexture(texture: THREE.Texture | undefined): void {
		console.log("WEBGL-RENDERER: _initTexture", texture);
		if(texture instanceof THREE.Texture) {
			// Force GPU upload.
			this._renderer?.initTexture(texture);
		}
	}

	protected _isEmptyTexture(texture: THREE.Texture): boolean {
		return texture.uuid === this._empty_texture.uuid;
	}

	// on requestAnimationFrame() callback.
	protected _previousTimestamp = 0;
	render(timestamp: DOMHighResTimeStamp): void {
//		console.log('update', timestamp);
		const elapsed = timestamp - this._previousTimestamp;
		this._previousTimestamp = timestamp;
		if(typeof this._renderer === "undefined") {
			throw new Error("ThreeJS renderer not defined.");
		}
		if(typeof this._camera === "undefined") {
			throw new Error("ThreeJS camera not defined.");
		}
		if(this._canPaintCurrent()) {
			if(this._current_asset === null) {
				throw new Error("current asset is null.");
			}
			const remaining = this._current_asset.end_time - timestamp;
			try {
				this._paintCurrent(timestamp, remaining);
			} catch(ex) {
				console.error(ex);
				console.error(this._current_asset);
			}
		} else if(this._hasWaitingDuration()) {
			if(this._current_asset === null) {
				throw new Error("current asset is null.");
			}
			const remaining = this._current_asset.end_time - timestamp;
			this._paintWaitingDuration(timestamp, remaining);
		} else {
			this._paintWaiting(timestamp);
		}
		if(this._canPaintNext()) {
			if(this._next_asset === null) {
				throw new Error("next asset is null.");
			}
			const remaining = this._next_asset.end_time - timestamp;
			try {
				this._paintNext(timestamp, remaining);
			} catch(ex) {
				console.error(ex);
				console.error(this._next_asset);
			}
		}
		this._updateState(elapsed);
		this._renderer.setScissorTest(true);
		const size = this._renderer.getSize(new THREE.Vector2());
		for(const view of this._views) {
			this._renderer.setViewport(view.x, view.y, view.width, view.height);
			this._renderer.setScissor(view.x, view.y, view.width, view.height);
			this._camera.setViewOffset(size.width, size.height,
				view.left, view.top, view.width, view.height);
			this._renderer.render(this._scene, this._camera);
		}
		this._renderer.setScissorTest(false);
	}

	// on requestIdleCallback() callback.
	idle(): void {
		this._emptyAssetTrash();
	}

	protected _updateState(elapsed: number): void {
		let needs_update = false;
		if(this._transition_percent_speed !== 0) {
			this._transition_percent += (this._transition_percent_speed * elapsed) / 1000;
			if(this._transition_percent > 1) {
				this._transition_percent = 1;
				this._transition_percent_speed = 0;
			}
			this._shader.uniforms.pct.value = this._transition_percent;
			needs_update = true;
		}
		if(needs_update) {
			this._shader.uniformsNeedUpdate = true;
		}
	}

	protected _initThreeJSRenderer() {
		console.log("WEBGL-RENDERER: _initThreeJSRenderer");
		this._renderer = this._createThreeJSRenderer();
	}

	protected _createThreeJSRenderer() {
		console.log("WEBGL-RENDERER: _createThreeJSRenderer");
		const canvas = document.createElement('canvas');
		const context = canvas.getContext("webgl2", {
			alpha: true,
			antialias: true,  // Significant performance cost with WebGLRenderTarget.
			desynchronized: false,
			powerPreference: 'high-performance',
		});
		if(context === null) {
			throw new Error('Failed to obtain canvas context.');
		}
		const renderer = new THREE.WebGLRenderer({ canvas, context });
		return renderer;
	}

	protected _createThreeJSCamera(width: number, height: number, near: number, far: number, z: number): THREE.OrthographicCamera {
		console.log("WEBGL-RENDERER: _createThreeJSCamera", width, height, near, far, z);
		const camera = new THREE.OrthographicCamera(
			width / -2, width / 2,
			height / 2, height / -2, near, far
		);
		camera.position.z = z;
		return camera;
	}

	protected async _fetchImage(url: string): Promise<HTMLImageElement> {
		console.log("WEBGL-RENDERER: _fetchImage", url);
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.src = url;
			img.decode()
			.then(() => {
				resolve(img);
			})
			.catch(encodingError => {
				reject(encodingError);
			});
		});
console.info("WEBGL-RENDERER: loaded displacement map", img.src);
		return img;
	}

//	protected _onSchedulerError(err: Error): void {
//		console.error(err);
//	}

	// This media asset.
	protected async _onSchedulerCurrent(current: SchedulerAssetDeclWithRemainingTime | null): Promise<void> {
		if(current !== null) {
			if(this._current_asset === null)
			{
//console.info(current.decl.href, current.remainingTimeMs);
				this._current_asset = await this._updateCurrent(current.decl);
				this._current_asset.end_time = (typeof current.remainingTimeMs === "number") ?
					(current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._current_asset.ref();
				console.log("WEBGL-RENDERER: current", this._current_asset.currentSrc);
			}
			else if(current.decl.id !== this._current_asset.id)
			{
//console.info(current.decl.href, current.remainingTimeMs);
				this._closeCurrent();
				if(this._next_asset !== null
					&& current.decl.id === this._next_asset.id)
				{
					console.log("WEBGL-RENDERER: current <- next");
					this._current_asset = await this._updateCurrentFromNext();
				} else {
					this._current_asset = await this._updateCurrent(current.decl);
				}
				this._current_asset.end_time = (typeof current.remainingTimeMs === "number") ?
					(current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._current_asset.ref();
				console.log("WEBGL-RENDERER: current", this._current_asset.currentSrc);
			}
			else if(this._current_asset instanceof RendererAsset)
			{
				this._current_asset = await this._updateCurrent(current.decl);
				this._current_asset.end_time = (typeof current.remainingTimeMs === "number") ?
					(current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
			}
			if(this._current_asset === null) {
				throw new Error("current asset is null.");
			}
		} else if(this._current_asset !== null) {
			this._closeCurrent();
			console.log(`WEBGL-RENDERER: current null`);
		}
	}

	protected _onSchedulerNext(next: SchedulerAssetDeclWithRemainingTime | null): void {
		// Next media asset.
		if(next !== null) {
			if(this._next_asset === null) {
				this._next_asset = this._updateNext(next.decl);
				this._next_asset.end_time = (typeof next.remainingTimeMs === "number") ?
					(next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._next_asset.ref();
				console.log("WEBGL-RENDERER: next", this._next_asset.currentSrc);
			}
			else if(next.decl.id !== this._next_asset.id) {
				this._closeNext();
				this._next_asset = this._updateNext(next.decl);
				this._next_asset.end_time = (typeof next.remainingTimeMs === "number") ?
					(next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._next_asset.ref();
				console.log("WEBGL-RENDERER: next", this._next_asset.currentSrc);
			}
			else if(this._next_asset instanceof RendererAsset)
			{
				this._next_asset = this._updateNext(next.decl);
				this._next_asset.end_time = (typeof next.remainingTimeMs === "number") ?
					(next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
			}
			if(this._next_asset === null) {
				throw new Error("next asset is null.");
			}
		} else if(this._next_asset !== null) {
			this._closeNext();
			console.log(`WEBGL-RENDERER: next null`);
		}
	}

	protected async _onSchedulerTransition(transition: SchedulerAssetTransition | null): Promise<void> {
		// Resources for transitions, explicitly details textures to
		// avoid confusion when crossing boundary between two assets.
		let needs_update = false;
		if(transition !== null) {
			const from_asset = this._asset_cache.get(transition.from.decl.id);
			if(typeof from_asset !== "undefined"
				&& typeof from_asset.texture !== "undefined"
				&& from_asset.texture.uuid !== this._shader.uniforms.map1.value.uuid)
			{
				if(this._map1_asset instanceof RendererAsset) {
					this._map1_asset.unref();
				}
				this._shader.uniforms.map1.value = from_asset.texture;
//				console.log('set map1', transition.from.decl.href);
				from_asset.ref();
				this._map1_asset = from_asset;  // Keep reference to later free.
				needs_update = true;
			}
			const to_asset = this._asset_cache.get(transition.to.decl.id);
			if(typeof to_asset !== "undefined"
				&& typeof to_asset.texture !== "undefined"
				&& to_asset.texture.uuid !== this._shader.uniforms.map2.value.uuid)
			{
				if(this._map2_asset instanceof RendererAsset) {
					this._map2_asset.unref();
				}
				this._shader.uniforms.map2.value = to_asset.texture;
//				console.log('set map2', transition.to.decl.href);
				to_asset.ref();
				this._map2_asset = to_asset;
				needs_update = true;
			}
			if(transition.url !== this._displacement_url) {
				this._displacement_url = transition.url;
//				console.log('set displacement', this.#displacement_url);
				await this._updateDisplacementMap(transition.url);
				this._shader.uniforms.displacement.value = this._displacement_texture;
				needs_update = true;
			}
			if(transition.percent !== this._transition_percent) {
				this._shader.uniforms.pct.value = this._transition_percent = transition.percent;
//				console.log('set pct', transition.percent);
				needs_update = true;
			}
			if(transition.percentSpeed !== this._transition_percent_speed) {
				this._transition_percent_speed = transition.percentSpeed;
			}
		} else {  // Transition finished, follow settings per "current".
			if(this._current_asset === null) {
				if(!this._isEmptyTexture(this._shader.uniforms.map1.value)) {
					if(this._map1_asset instanceof RendererAsset) {
						this._map1_asset.unref();
					}
					this._map1_asset = null;
					this._shader.uniforms.map1.value = this._empty_texture;
//					console.log('set map1', "empty");
					needs_update = true;
				}
			} else if(typeof this._current_asset.texture !== "undefined"
				&& this._current_asset.texture.uuid !== this._shader.uniforms.map1.value.uuid)
			{
				if(this._map1_asset instanceof RendererAsset) {
					this._map1_asset.unref();
				}
				this._shader.uniforms.map1.value = this._current_asset.texture;
//				console.log('set map1', this.#current_asset.currentSrc);
				this._current_asset.ref();
				this._map1_asset = this._current_asset;
				needs_update = true;
			}
			if(!this._isEmptyTexture(this._shader.uniforms.map2.value)) {
				if(this._map2_asset instanceof RendererAsset) {
					this._map2_asset.unref();
				}
				this._map2_asset = null;
				this._shader.uniforms.map2.value = this._empty_texture;
//				console.log('set map2', "empty");
				needs_update = true;
			}
			if(this._transition_percent !== 0) {
				this._shader.uniforms.pct.value = this._transition_percent = 0;
//				console.log('set pct', 0);
				needs_update = true;
			}
			if(this._transition_percent_speed !== 0) {
				this._transition_percent_speed = 0;
			}
		}
		if(needs_update) {
			this._shader.uniformsNeedUpdate = true;
		}
	}

	protected _networkLoadingRef(): void {
		if(this._network_loading_count === 0) {
			this._networkState = HTMLMediaElement.NETWORK_LOADING;
		}
		this._network_loading_count++;
	}

	protected _networkLoadingUnref(): void {
		this._network_loading_count--;
		if(this._network_loading_count === 0) {
			this._networkState = HTMLMediaElement.NETWORK_IDLE;
		}
	}

	protected _emptyAssetTrash(): void {
		const remove_list: string[] = [];
		for(const [id, asset] of this._asset_trash) {
			if(asset.ref_count !== 0) {
				continue;
			}
			asset.close();
			remove_list.push(id);
		}
		for(const id of remove_list) {
			console.log("WEBGL-RENDERER: Destroying", id)
			this._asset_cache.delete(id);
			this._asset_trash.delete(id);
		}
	}

	// Assumes new decl.
	protected async _updateCurrent(decl: MediaDecl): Promise<RendererAsset> {
		const asset = this._asset_cache.get(decl.id);
		if(typeof asset === "undefined") {
			const media_asset = this._mam.createThreeAsset(decl);
			if(typeof media_asset === "undefined") {
				throw new Error("Failed to create media asset.");
			}
			const new_asset = new RendererAsset(decl.id, media_asset);
///			media_asset.texture.userData = new_asset;
			this._asset_cache.set(new_asset.id, new_asset);
			this._networkLoadingRef();
			new_asset.is_loading = true;
			new_asset.load();
			return new_asset;  // drop frame.
		} else if(this._asset_trash.has(decl.id)) {
			this._asset_trash.delete(decl.id);
			// Ensure cached asset is reset to start.
			asset.currentTime = 0;
		}
		if(asset.is_loading
			&& asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA)
		{
			this._networkLoadingUnref();
			asset.is_loading = false;
		}
		if(!asset.has_texture
			&& asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
		{
			this._initTexture(asset.texture);
			asset.has_texture = true;
			await asset.play();
			if(this._map1_asset !== null) {
				if(this._map1_asset instanceof RendererAsset) {
					this._map1_asset.unref();
				}
			}
			if(this._map2_asset !== null) {
				if(this._map2_asset instanceof RendererAsset) {
					this._map2_asset.unref();
				}
			}
			asset.ref();
			this._map1_asset = asset;
			this._map2_asset = null;
			this._shader.uniforms.map1.value = asset.texture;
			this._shader.uniforms.map2.value = this._empty_texture;
			this._shader.uniforms.pct.value = this._transition_percent = 0;
			this._shader.uniformsNeedUpdate = true;
			this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
		}
		return asset;
	}

	// Keep reference next to current.
	protected async _updateCurrentFromNext(): Promise<RendererAsset> {
		if(this._current_asset !== null) {
			throw new Error("current asset must be closed before calling.");
		}
		if(this._next_asset === null) {
			throw new Error("next asset must be defined before calling.");
		}
		const asset = this._next_asset;
		this._next_asset = null;
		if(asset instanceof RendererAsset
			&& asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
		{
			await asset.play();
			if(this._isEmptyTexture(this._shader.uniforms.map2.value)) {
				if(this._map1_asset !== null) {
					if(this._map1_asset instanceof RendererAsset) {
						this._map1_asset.unref();
					}
				}
				this._map1_asset = asset;
				this._shader.uniforms.map1.value = asset.texture;
				this._shader.uniforms.pct.value = this._transition_percent = 0;
				this._shader.uniformsNeedUpdate = true;
			}
			this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
		} else {
			console.warn("WEBGL-RENDERER: current asset not ready.");
			this._readyState = HTMLMediaElement.HAVE_METADATA;
		}
		return asset;
	}

	protected _canPaintCurrent(): boolean {
		return this._current_asset !== null
			&& this._current_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
	}

	protected _paintCurrent(timestamp: DOMHighResTimeStamp, remaining: number): void {
		if(this._current_asset === null) {
			throw new Error("undefined current asset.");
		}
		this._current_asset.paint(timestamp, remaining);
		// Very slow loading asset, force playback, avoid seeking as already broken.
//		if(this.#current_asset.paused) {
//			(async() => {
//				if(this.#current_asset !== null
//					&& this.#current_asset.paused
//					&& !this.#current_asset.ended
//					&& this.#current_asset.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
//				{
//					await this.#current_asset.play();
//				}
//			})();
//		}
	}

	protected _closeCurrent(): void {
		if(this._current_asset === null) {
			return;
		}
		this._current_asset.pause();
		this._current_asset.unref();
		this._asset_trash.set(this._current_asset.id, this._current_asset);
		this._current_asset = null;
	}

	protected _hasWaitingDuration(): boolean {
		return false;
	}

	protected _paintWaiting(_timestamp: DOMHighResTimeStamp): void {}
	_paintWaitingDuration(_timestamp: DOMHighResTimeStamp, _remaining: number): void {}

	protected _updateNext(decl: MediaDecl): RendererAsset {
		const asset = this._asset_cache.get(decl.id);
		if(typeof asset === "undefined") {
			const media_asset = this._mam.createThreeAsset(decl);
			if(typeof media_asset === "undefined") {
				throw new Error("Failed to create media asset.");
			}
			const new_asset = new RendererAsset(decl.id, media_asset);
			this._asset_cache.set(new_asset.id, new_asset);
			this._networkLoadingRef();
			new_asset.is_loading = true;
			new_asset.load();
			return new_asset;
		} else if(this._asset_trash.has(decl.id)) {
			this._asset_trash.delete(decl.id);
			// Ensure cached asset is reset to start.
			asset.currentTime = 0;
		}
		if(asset.is_loading
			&& asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA)
		{
			this._networkLoadingUnref();
			asset.is_loading = false;
		}
		if(!asset.has_texture
			&& asset.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
		{
			this._initTexture(asset.texture);
			asset.has_texture = true;
			this._readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
		}
		return asset;
	}

	protected _canPaintNext(): boolean {
		return this._next_asset !== null
			&& this._next_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
	}

	protected _paintNext(timestamp: DOMHighResTimeStamp, remaining: number): void {
		if(this._next_asset === null) {
			throw new Error("undefined next asset.");
		}
		this._next_asset.paint(timestamp, remaining);
	}

	protected _closeNext(): void {
		if(this._next_asset === null) {
			throw new Error("undefined next asset.");
		}
		this._next_asset.unref();
		this._asset_trash.set(this._next_asset.id, this._next_asset);
		this._next_asset = null;
	}

	// Assumes new URL.
	protected async _updateDisplacementMap(url: string): Promise<void> {
		this._networkLoadingRef();
		const img = await this._fetchImage(url);
		this._displacement_texture.image = img;
		this._displacement_texture.needsUpdate = true;
		this._initTexture(this._displacement_texture);
		this._networkLoadingUnref();
	}

	protected _meshFrom(material: THREE.Material, left: number, right: number, top: number, bottom: number, width: number, height: number): THREE.Mesh {
		const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
		geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([
			left/width, 1-(top/height),
			right/width, 1-(top/height),
			left/width, 1-(bottom/height),
			right/width, 1-(bottom/height),
			0, 0,
			0, 0
		]), 2));
		const mesh = new THREE.Mesh(geometry, material);
		mesh.scale.set(width, height, 1);
		return mesh;
	}
}
