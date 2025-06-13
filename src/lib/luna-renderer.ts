// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as Comlink from 'comlink';
import EventTarget from '@ungap/event-target';
import { View, Renderer } from './renderer.js';
import {
	SchedulerState,
	SchedulerAssetDecl,
	SchedulerAssetDeclWithRemainingTime,
	SchedulerAssetTransition,
} from './scheduler.js';
import { AssetDecl, MediaDecl } from './media.js';
import { LunaAssetManager } from './luna-media.js';
import { Prefetch } from '../lib/prefetch.js';
import { LunaRendererAsset } from './luna-renderer-asset.js';

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

function minimize(value: SchedulerState): any {
	const obj = {
		currentTime: value.currentTime,
		eventSeries: value.eventSeries,
		mediaList: value.mediaList,
		mediaCurrent: value.mediaCurrent && {
			href: value.mediaCurrent.decl.href,
			duration: value.mediaCurrent.decl.duration,
			remainingTimeMs: value.mediaCurrent.remainingTimeMs,
		},
		mediaNext: value.mediaNext && {
			href: value.mediaNext.decl.href,
			duration: value.mediaNext.decl.duration,
			remainingTimeMs: value.mediaNext.remainingTimeMs,
		},
		transition: value.transition && {
			percent: value.transition.percent,
		},
	};
	return obj;
}

export class LunaRenderer extends EventTarget implements Renderer {
	protected _renderTarget: HTMLElement | null = null;
	protected _mam = new LunaAssetManager();
	protected _transition_percent = 0;
	protected _transition_percent_speed = 0;
	protected _network_loading_count = 0;
	protected _current_asset: LunaRendererAsset | null = null;
	protected _next_asset: LunaRendererAsset | null = null;
	protected _map1_asset: LunaRendererAsset | null = null;
	protected _map2_asset: LunaRendererAsset | null = null;
	protected _asset_cache: Map<string, LunaRendererAsset> = new Map();
	protected _asset_trash: Map<string, LunaRendererAsset> = new Map();
	protected _set_state_hook: any;
	protected _asset_prefetch: Prefetch;
	// Per HTMLMediaElement.
	protected _ended = false;
	protected _error = null;
	protected _networkState: number = HTMLMediaElement.NETWORK_EMPTY;
	protected _paused = true;
	protected _readyState: number = HTMLMediaElement.HAVE_NOTHING;

	protected _debug = document.createElement('div');

	constructor(prefetchFactory: { new(): Prefetch }) {
		super();
		this._asset_prefetch = new prefetchFactory();
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
		console.groupCollapsed("LUNA-RENDERER: init");
		console.groupEnd();
	}

	close() {
		console.log("LUNA-RENDERER: close");
		for(const asset of this._asset_cache.values()) {
			// Hide from view.
			asset.style.visibility = "hidden";
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
		console.log("LUNA-RENDERER: setSchedulerMessagePort", scheduler);
		Comlink.expose({
			setState: (value: SchedulerState) => this.setState(value),
			setSources: async (scope: string, decls: MediaDecl[]) => {
				return await this.setSources(scope, decls.map(decl => {
					return {
						'@type': decl['@type'],
						id: decl.id,
						href: decl.href,
						size: decl.size,
						hash: decl.hash,
						md5: decl.md5,
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
			const html = prettyPrint(minimize(value));
			if(html !== this._lastDebug) {
				this._debug.innerHTML = this._lastDebug = html;
			}
		}
		await this._onSchedulerCurrent(value.mediaCurrent);
		this._onSchedulerNext(value.mediaNext);
		await this._onSchedulerTransition(value.transition);
	}

	setAssetTarget(assetTarget: HTMLElement): void {
		console.log("LUNA-RENDERER: setAssetTarget", assetTarget);
		this._mam.setAssetTarget(assetTarget);
	}

	setRenderTarget(renderTarget: HTMLElement): void {
		console.log("LUNA-RENDERER: setRenderTarget", renderTarget);
		this._renderTarget = renderTarget;
	}

	setPixelRatio(value: number): void {
		console.log("LUNA-RENDERER: setPixelRatio", value);
		// TBD: translate to CSS.
	}

	setSize(width: number, height: number): void {
		console.log("LUNA-RENDERER: setSize", width, height);
		if(this._renderTarget !== null) {
			this._renderTarget.style.width = `${width}px`;
			this._renderTarget.style.height = `${height}px`;
		}
	}

	setViews(views: View[]): void {
		console.log("LUNA-RENDERER: setViews", views);
	}

	async setSources(scope: string, sources: AssetDecl[]): Promise<void> {
		console.log("LUNA-RENDERER: setSources", scope, sources);
		await this._asset_prefetch.acquireSources(scope, sources);
	}

	// on requestAnimationFrame() callback.
	protected _previousTimestamp = 0;
	render(timestamp: DOMHighResTimeStamp): void {
//		console.log('update', timestamp);
		const elapsed = timestamp - this._previousTimestamp;
		this._previousTimestamp = timestamp;
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
		this._interpolateTransition(elapsed);
	}

	// on requestIdleCallback() callback.
	idle(): void {
		this._emptyAssetTrash();
	}

	protected _setTransitionPercent(
		percent: number,
	): void {
		if(this._map1_asset !== null) {
			const rounded = Math.round((1 - percent + Number.EPSILON) * 100) / 100
			this._map1_asset.style.opacity = rounded.toString();
		}
		if(this._map2_asset !== null) {
			this._map2_asset.style.opacity = '1';
		}
		this._transition_percent = percent;
	}

	protected _interpolateTransition(elapsed: number): void {
		if(this._transition_percent_speed !== 0) {
			this._transition_percent += (this._transition_percent_speed * elapsed) / 1000;
			if(this._transition_percent > 1) {
				this._transition_percent = 1;
				this._transition_percent_speed = 0;
			}
			this._setTransitionPercent(this._transition_percent);
		}
	}

	protected async _fetchImage(url: string): Promise<HTMLImageElement> {
		console.log("LUNA-RENDERER: _fetchImage", url);
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
console.info("LUNA-RENDERER: loaded displacement map", img.src);
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
				this._current_asset!.end_time = (typeof current.remainingTimeMs === "number") ?
					(current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._current_asset!.ref();
				console.log("LUNA-RENDERER: current", this._current_asset!.currentSrc);
			}
			else if(current.decl.id !== this._current_asset.id)
			{
//console.info(current.decl.href, current.remainingTimeMs);
				this._closeCurrent();
				if(this._next_asset !== null
					&& current.decl.id === this._next_asset.id)
				{
					console.log("LUNA-RENDERER: current <- next");
					this._current_asset = await this._updateCurrentFromNext();
				} else {
					this._current_asset = await this._updateCurrent(current.decl);
				}
				this._current_asset!.end_time = (typeof current.remainingTimeMs === "number") ?
					(current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._current_asset!.ref();
				console.log("LUNA-RENDERER: current", this._current_asset!.currentSrc);
			}
			else if(this._current_asset !== null)
			{
				this._current_asset = await this._updateCurrent(current.decl);
				this._current_asset!.end_time = (typeof current.remainingTimeMs === "number") ?
					(current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
			}
			if(this._current_asset === null) {
				throw new Error("current asset is null.");
			}
		} else if(this._current_asset !== null) {
			this._closeCurrent();
			console.log(`LUNA-RENDERER: current null`);
		}
	}

	protected _onSchedulerNext(next: SchedulerAssetDeclWithRemainingTime | null): void {
		// Next media asset.
		if(next !== null) {
			if(this._next_asset === null) {
				this._next_asset = this._updateNext(next.decl);
				this._next_asset!.end_time = (typeof next.remainingTimeMs === "number") ?
					(next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._next_asset!.ref();
				console.log("LUNA-RENDERER: next", this._next_asset!.currentSrc);
			}
			else if(next.decl.id !== this._next_asset.id) {
				this._closeNext();
				this._next_asset = this._updateNext(next.decl);
				this._next_asset!.end_time = (typeof next.remainingTimeMs === "number") ?
					(next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
				this._next_asset!.ref();
				console.log("LUNA-RENDERER: next", this._next_asset!.currentSrc);
			}
			else if(this._next_asset !== null)
			{
				this._next_asset = this._updateNext(next.decl);
				this._next_asset!.end_time = (typeof next.remainingTimeMs === "number") ?
					(next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
			}
			if(this._next_asset === null) {
				throw new Error("next asset is null.");
			}
		} else if(this._next_asset !== null) {
			this._closeNext();
			console.log(`LUNA-RENDERER: next null`);
		}
	}

	protected async _onSchedulerTransition(transition: SchedulerAssetTransition | null): Promise<void> {
		// Resources for transitions, explicitly details textures to
		// avoid confusion when crossing boundary between two assets.
		if(transition !== null) {
			const from_asset = this._asset_cache.get(transition.from.decl.id);
			if(typeof from_asset !== "undefined"
				&& from_asset.element !== null
				&& from_asset.id !== this._map1_asset?.id)
			{
				if(this._map1_asset !== null) {
					this._map1_asset.unref();
				}
				from_asset.ref();
				this._setMap1Asset(from_asset);
			}
			const to_asset = this._asset_cache.get(transition.to.decl.id);
			if(typeof to_asset !== "undefined"
				&& to_asset.element !== null
				&& to_asset.id !== this._map2_asset?.id)
			{
				if(this._map2_asset !== null) {
					this._map2_asset.unref();
				}
				to_asset.ref();
				this._setMap2Asset(to_asset);
			}
			if(transition.percent !== this._transition_percent) {
				this._setTransitionPercent(transition.percent);
			}
			if(transition.percentSpeed !== this._transition_percent_speed) {
				this._transition_percent_speed = transition.percentSpeed;
			}
		} else {  // Transition finished, follow settings per "current".
			if(this._current_asset === null) {
				if(this._map1_asset !== null) {
					this._map1_asset.unref();
					this._setMap1Asset(null);
				}
			} else if(this._current_asset.element !== null
				&& this._current_asset.id !== this._map1_asset?.id)
			{
				if(this._map1_asset !== null) {
					this._map1_asset.unref();
				}
				this._current_asset.ref();
				this._setMap1Asset(this._current_asset);
			}
			if(this._map2_asset !== null) {
				this._map2_asset.unref();
				this._setMap2Asset(null);
			}
			if(this._transition_percent !== 0) {
				this._setTransitionPercent(0);
			}
			if(this._transition_percent_speed !== 0) {
				this._transition_percent_speed = 0;
			}
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
			console.log("LUNA-RENDERER: Destroying", id)
			this._asset_cache.delete(id);
			this._asset_trash.delete(id);
		}
	}

	protected _setMap1Asset(asset: LunaRendererAsset | null): void {
		this._map1_asset?.classList.remove('map1');
		if(asset === null) {
			this._map1_asset = null;
			return;
		}
		this._map1_asset = asset;
		this._map1_asset.className = 'map1';
	}

	protected _setMap2Asset(asset: LunaRendererAsset | null): void {
		this._map2_asset?.classList.remove('map2');
		if(asset === null) {
			this._map2_asset = null;
			return;
		}
		this._map2_asset = asset;
		this._map2_asset.className = 'map2';
	}

	// Assumes new decl.
	protected async _updateCurrent(decl: MediaDecl): Promise<LunaRendererAsset> {
		const asset = this._asset_cache.get(decl.id);
		if(typeof asset === "undefined") {
			const media_asset = this._mam.createLunaAsset(decl);
			if(typeof media_asset === "undefined") {
				throw new Error("Failed to create media asset.");
			}
			const new_asset = new LunaRendererAsset(decl.id, media_asset);
			this._asset_cache.set(new_asset.id, new_asset);
			this._networkLoadingRef();
			new_asset.is_loading = true;
			new_asset.load();
			return new_asset;  // drop frame.
		} else if(this._asset_trash.has(decl.id)) {
			this._asset_trash.delete(decl.id);
		}
		if(asset.is_loading
			&& asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA)
		{
			this._networkLoadingUnref();
			asset.is_loading = false;
		}
		if(!asset.has_element
			&& asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
		{
			asset.has_element = true;
			await asset.play();
			if(this._map1_asset !== null) {
				this._map1_asset.unref();
			}
			if(this._map2_asset !== null) {
				this._map2_asset.unref();
			}
			asset.ref();
			this._setMap1Asset(asset);
			this._setMap2Asset(null);
			this._setTransitionPercent(0);
			this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
		}
		return asset;
	}

	// Keep reference next to current.
	protected async _updateCurrentFromNext(): Promise<LunaRendererAsset> {
		if(this._current_asset !== null) {
			throw new Error("current asset must be closed before calling.");
		}
		if(this._next_asset === null) {
			throw new Error("next asset must be defined before calling.");
		}
		const asset = this._next_asset;
		this._next_asset = null;
		if(asset !== null
			&& asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
		{
			await asset.play();
			if(this._map2_asset === null) {
				if(this._map1_asset !== null) {
					this._map1_asset.unref();
				}
				this._setMap1Asset(asset);
				this._setTransitionPercent(0);
			}
			this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
		} else {
			console.warn("LUNA-RENDERER: current asset not ready.");
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

	protected _updateNext(decl: MediaDecl): LunaRendererAsset {
		const asset = this._asset_cache.get(decl.id);
		if(typeof asset === "undefined") {
			const media_asset = this._mam.createLunaAsset(decl);
			if(typeof media_asset === "undefined") {
				throw new Error("Failed to create media asset.");
			}
			const new_asset = new LunaRendererAsset(decl.id, media_asset);
			this._asset_cache.set(new_asset.id, new_asset);
			this._networkLoadingRef();
			new_asset.is_loading = true;
			new_asset.load();
			return new_asset;
		} else if(this._asset_trash.has(decl.id)) {
			this._asset_trash.delete(decl.id);
		}
		if(asset.is_loading
			&& asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA)
		{
			this._networkLoadingUnref();
			asset.is_loading = false;
		}
		if(!asset.has_element
			&& asset.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
		{
			asset.has_element = true;
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
}
