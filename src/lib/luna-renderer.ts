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
	protected _lam = new LunaAssetManager();
	protected _transition_percent = 0;
	protected _transition_percent_speed = 0;
	protected _network_loading_count = 0;
	protected _map1_asset: LunaRendererAsset | null = null;
	protected _map2_asset: LunaRendererAsset | null = null;
	protected _next_asset: LunaRendererAsset | null = null;
	protected _asset_cache: Map<string, LunaRendererAsset> = new Map();
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
		console.groupCollapsed("WEB-RENDERER: init");
		console.groupEnd();
	}

	close() {
		console.log("WEB-RENDERER: close");
		for(const asset of this._asset_cache.values()) {
			asset.hide();
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
		console.log("WEB-RENDERER: setSchedulerMessagePort", scheduler);
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

		if(value.transition) {
			await this._onSchedulerMap1(value.transition.from);
			this._onSchedulerMap2(value.transition.to);
			this._onSchedulerNext(null);
			this._updateTransitionPercent(value.transition.percent, value.transition.percentSpeed);
		} else {
			await this._onSchedulerMap1(value.mediaCurrent, { autoplay: true });
			this._onSchedulerMap2(null);
			this._onSchedulerNext(value.mediaNext);
			if(value.mediaCurrent !== null
				&& this._map1_asset !== null)
			{
				this._map1_asset.user_data.end_time = this._endTime(value.mediaCurrent);
			}
			if(value.mediaNext !== null
				&& this._next_asset !== null)
			{
				this._next_asset.user_data.end_time = this._endTime(value.mediaNext);
			}
		}

		this._interpolateTransition(this._previousTimestamp);
	}

	protected _endTime(asset: SchedulerAssetDeclWithRemainingTime): number {
		return (typeof asset.remainingTimeMs === "number")
			? (asset.remainingTimeMs + performance.now())
			: Number.MAX_SAFE_INTEGER;
	}

	setAssetTarget(assetTarget: HTMLElement): void {
		console.log("WEB-RENDERER: setAssetTarget", assetTarget);
		this._lam.setAssetTarget(assetTarget);
	}

	setRenderTarget(renderTarget: HTMLElement): void {
		console.log("WEB-RENDERER: setRenderTarget", renderTarget);
		this._renderTarget = renderTarget;
	}

	setPixelRatio(value: number): void {
		console.log("WEB-RENDERER: setPixelRatio", value);
		// TBD: translate to CSS.
	}

	setSize(width: number, height: number): void {
		console.log("WEB-RENDERER: setSize", width, height);
		if(this._renderTarget !== null) {
			this._renderTarget.style.width = `${width}px`;
			this._renderTarget.style.height = `${height}px`;
		}
	}

	setViews(views: View[]): void {
		console.log("WEB-RENDERER: setViews", views);
	}

	async setSources(scope: string, sources: AssetDecl[]): Promise<void> {
		console.log("WEB-RENDERER: setSources", scope, sources);
		await this._asset_prefetch.acquireSources(scope, sources);
	}

	// on requestAnimationFrame() callback.
	protected _previousTimestamp = 0;
	render(timestamp: DOMHighResTimeStamp): void {
//		console.log('update', timestamp);
		const elapsed = timestamp - this._previousTimestamp;
		this._previousTimestamp = timestamp;

		let has_map1_painted = false;
		if(this._map1_asset !== null) {
			if(this._canPaintAsset(this._map1_asset)) {
				const remaining = this._map1_asset.user_data.end_time - timestamp;
				try {
					this._paintAsset(this._map1_asset, timestamp, remaining);
					has_map1_painted = true;
				} catch(ex) {
					console.error(ex);
					console.error(this._map1_asset);
				}
			} else if(this._hasWaitingDuration()) {
				const remaining = this._map1_asset.user_data.end_time - timestamp;
				this._paintWaitingDuration(timestamp, remaining);
				has_map1_painted = true;
			}
		}
		if(!has_map1_painted) {
			this._paintWaiting(timestamp);
		}

		if(this._map2_asset !== null) {
			if(this._canPaintAsset(this._map2_asset)) {
				const remaining = this._map2_asset.user_data.end_time - timestamp;
				try {
					this._paintAsset(this._map2_asset, timestamp, remaining);
				} catch(ex) {
					console.error(ex);
					console.error(this._map2_asset);
				}
			}
		}

		this._interpolateTransition(elapsed);
	}

	protected _canPaintAsset(asset: LunaRendererAsset): boolean {
		return asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
	}

	protected _paintAsset(
		asset: LunaRendererAsset,
		timestamp: DOMHighResTimeStamp,
		remaining: number,
	): void {
		asset.paint(timestamp, remaining);
	}

	// on requestIdleCallback() callback.
	idle(): void {
	}

	protected _interpolateTransition(elapsed: number): void {
		if(this._transition_percent_speed === 0) {
			if(this._map1_asset !== null) {
				this._map1_asset.opacity = 1;
			}
			if(this._map2_asset !== null) {
				this._map2_asset.opacity = 0;
			}
			return;
		}
		this._transition_percent += (this._transition_percent_speed * elapsed) / 1000;
		if(this._transition_percent > 1) {
			this._transition_percent = 1;
			this._transition_percent_speed = 0;
		}
		if(this._map1_asset !== null) {
			this._map1_asset.opacity = Math.round((1 - this._transition_percent + Number.EPSILON) * 100) / 100;
		}
		if(this._map2_asset !== null) {
			this._map2_asset.opacity = 1;
		}
	}

	protected async _fetchImage(url: string): Promise<HTMLImageElement> {
		console.log("WEB-RENDERER: _fetchImage", url);
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
console.info("WEB-RENDERER: loaded displacement map", img.src);
		return img;
	}

//	protected _onSchedulerError(err: Error): void {
//		console.error(err);
//	}

	protected async _onSchedulerMap1(
		asset_decl: SchedulerAssetDecl | null,
		{ autoplay = false } = {},
	): Promise<void> {
		if(asset_decl !== null) {
			if(!this._isAssetReady(asset_decl.decl)) {
				return;
			}
			if(this._map1_asset !== null) {
				if(this._map1_asset.id === asset_decl.decl.id) {
					this._updateAsset(this._map1_asset);
					if(autoplay
						&& this._map1_asset.user_data.has_loaded
						&& !this._map1_asset.user_data.is_playing
						&& this._map1_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
					{
						this._map1_asset.user_data.is_playing = true;
						await this._map1_asset.play();
					}
					return;
				}
				this._unbindAsset(this._map1_asset);
			}
			this._map1_asset = this._fetchAsset(asset_decl.decl);
			this._map1_asset.className = "map1";
		} else if(this._map1_asset !== null) {
			this._unbindAsset(this._map1_asset);
			this._map1_asset = null;
			console.log(`WEB-RENDERER: map1 null`);
		}
	}

	// Fetch asset, create asset if needed.
	protected _fetchAsset(decl: MediaDecl): LunaRendererAsset {
		const asset = this._asset_cache.get(decl.id);
		if(typeof asset !== "undefined") {
			asset.user_data.ref_count++;
			if(!asset.user_data.has_loaded
				&& !asset.user_data.is_loading)
			{
				asset.user_data.is_loading = true;
				this._networkLoadingRef();
				asset.load();
			}
			return asset;
		}
		const new_asset = this._createRendererAsset(decl);
		this._networkLoadingRef();
		new_asset.user_data.is_loading = true;
		new_asset.load();
		return new_asset;
	}

	// Update asset state, loading resources as needed.
	protected _updateAsset(asset: LunaRendererAsset): void {
		// Test for loaded asset.
		if(!asset.user_data.has_loaded
			&& asset.user_data.is_loading
			&& asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA)
		{
			asset.user_data.is_loading = false;
			asset.user_data.has_loaded = true;
			this._networkLoadingUnref();
		}
	}

	// Unbind asset from the renderer, release resources.
	protected _unbindAsset(asset: LunaRendererAsset): void {
		asset.user_data.ref_count--;
		if(asset.user_data.ref_count !== 0) {
			return;
		}
		if(typeof asset.texture !== "undefined") {
			asset.close();
		}
		asset.user_data = {
			ref_count: 0,
			is_loading: false,
			has_loaded: false,
			is_playing: false,
			end_time: NaN,
		};
	}

	protected _onSchedulerMap2(
		asset_decl: SchedulerAssetDecl | null,
	): void {
		if(asset_decl !== null) {
			if(!this._isAssetReady(asset_decl.decl)) {
				return;
			}
			if(this._map2_asset !== null) {
				if(this._map2_asset.id === asset_decl.decl.id) {
					this._updateAsset(this._map2_asset);
					return;
				}
				this._unbindAsset(this._map2_asset);
			}
			this._map2_asset = this._fetchAsset(asset_decl.decl);
			this._map2_asset.className = "map2";
		} else if(this._map2_asset !== null) {
			this._unbindAsset(this._map2_asset);
			this._map2_asset = null;
		}
	}

	protected _onSchedulerNext(
		asset_decl: SchedulerAssetDecl | null,
	): void {
		if(asset_decl !== null) {
			if(!this._isAssetReady(asset_decl.decl)) {
				return;
			}
			if(this._next_asset !== null) {
				if(this._next_asset.id === asset_decl.decl.id) {
					this._updateAsset(this._next_asset);
					return;
				}
				this._unbindAsset(this._next_asset);
			}
			this._next_asset = this._fetchAsset(asset_decl.decl);
			this._next_asset.className = "next";
		} else if(this._next_asset !== null) {
			this._unbindAsset(this._next_asset);
			this._next_asset = null;
		}
	}

	protected _updateTransitionPercent(
		percent: number,
		percentSpeed: number,
	): void {
		this._transition_percent = percent;
		this._transition_percent_speed = percentSpeed;
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

	protected _isAssetReady(decl: MediaDecl): boolean {
		const href = this._asset_prefetch.getPath(decl.href);
		return (typeof href === "string") && href.length !== 0;
	}

	protected _resolveAsset(decl: MediaDecl): MediaDecl {
		return {
			'@type': decl['@type'],
			id: decl.id,
			href: this._asset_prefetch.getPath(decl.href),
			duration: decl.duration,
			...(Array.isArray(decl.sources) && {
				sources: decl.sources.map(source => this._asset_prefetch.getPath(source.href)),
			}),
		} as MediaDecl;
	}

	protected _hasWaitingDuration(): boolean {
		return false;
	}

	protected _paintWaiting(_timestamp: DOMHighResTimeStamp): void {}
	protected _paintWaitingDuration(_timestamp: DOMHighResTimeStamp, _remaining: number): void {}

	protected _createRendererAsset(decl: MediaDecl): LunaRendererAsset {
		const media_asset = this._lam.createLunaAsset(this._resolveAsset(decl));
		if(typeof media_asset === "undefined") {
			throw new Error("Failed to create media asset.");
		}
		const asset = new LunaRendererAsset(decl.id, media_asset);
		asset.user_data = {
			ref_count: 1,
			is_loading: false,
			has_loaded: false,
			is_playing: false,
			end_time: NaN,
		};
		this._asset_cache.set(asset.id, asset);
		return asset;
	}
}
