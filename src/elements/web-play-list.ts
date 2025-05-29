// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import * as Comlink from 'comlink';
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Renderer } from '../lib/renderer.js';
import { NullRenderer } from '../lib/null-renderer.js';
import { WebRenderer } from '../lib/web-renderer.js';
import { Cluster } from '../lib/cluster.js';
import { RaftCluster } from '../lib/raft-cluster.js';
import { SchedulerState } from '../lib/scheduler.js';
import { Prefetch } from '../lib/prefetch.js';
import { HashDecl } from '../lib/media.js';
import { ServiceWorkerPrefetch } from '../lib/service-worker-prefetch.js';

import 'requestidlecallback-polyfill';

@customElement('web-play-list')
export default class WebPlaylistElement extends LitElement {

	@property({ type: String, reflect: true })
	src = "";

	@property({ attribute: 'src-id', type: String, reflect: true })
	src_id = "";

	@property({ attribute: 'src-size', type: Number, reflect: true })
	src_size = 0;

	@property({ attribute: 'src-hash', type: Object, reflect: true })
	src_hash: HashDecl | undefined = undefined;

	@property({ attribute: 'src-integrity', type: String, reflect: true })
	src_integrity = "";

	@property({ attribute: 'src-md5', type: String, reflect: true })
	src_md5 = "";

	@property({ type: Array, reflect: false })
	views: { left: number, top: number, x: number, y: number, width: number, height: number }[] = [];

	@property({ type: Number, reflect: false })
	width = 0;

	@property({ type: Number, reflect: false })
	height = 0;

	@property({ type: Boolean, reflect: true })
	autoplay = false;

	@query('main')
	_main!: HTMLElement;  // "!" to force TS compatibility.

	@query('section')
	_section!: HTMLElement;  // "!" to force TS compatibility.

	static override styles = css`
		:host {
			display: block;
			contain: strict;
			overflow: clip;
			font-size: 0;
		}
		:host > section {
			display: none;
		}
		:host > main {
			position: relative;
			margin-left: 600px;
		}
		:host > main > * {
			visibility: hidden;
			display: block;
			position: absolute;
			top: 0;
			left: 0;
		}
		:host > main > .map1 {
			visibility: visible;
			will-change: opacity;
			z-index: 2;
		}
		:host > main > .map2 {
			visibility: visible;
			z-index: 1;
		}

		:host > main > article {
			width: 100%;
			height: 100%;
		}
	`;

	override render() {
		return html`
			<style>
				:host {
					width: ${this.width}px;
					height: ${this.height}px;
				}
			</style>
			<slot></slot><main></main><section></section>
		`;
	}

	protected _worker = this._createWorker();
	protected _scheduler = Comlink.wrap(this._worker) as unknown as any;
	protected _renderer: Renderer = new NullRenderer();
	protected _channel = new MessageChannel();
	protected _raf_id: ReturnType<Window["requestAnimationFrame"]> | undefined;
	protected _ric_id: ReturnType<Window["requestIdleCallback"]> | undefined;
	protected _cluster: Cluster | undefined = undefined;

	constructor() {
		super();
	}

	// Helpers to access private fields in devtools.
	get debugScheduler() { return this._scheduler; }
	get debugRenderer() { return this._renderer; }
	get debugCluster() { return this._cluster; }

	protected _createWorker(): Worker {
		return new Worker(new URL('../dist/scheduler.bundle.mjs', import.meta.url).pathname, {
			type: 'module',
			credentials: 'omit',
			name: 'Scheduler',  // Shown in debugger.
		});
	}

	// https://lit.dev/docs/components/lifecycle/#connectedcallback
	override connectedCallback() {
		super.connectedCallback();
		console.log("PLAYLIST: connectedCallback");
	}

	// https://lit.dev/docs/components/lifecycle/#disconnectedcallback
	// Invoked when a component is removed from the document's DOM.
	// Closest ECMAScript equivalent to a destructor, however should have
	// a matching connectedCallback() if the element is added back to the
	// DOM.
	override disconnectedCallback() {
		super.disconnectedCallback();
		console.log("PLAYLIST: disconnectedCallback");
		if(typeof this._raf_id !== "undefined") {
			window.cancelAnimationFrame(this._raf_id);
			this._raf_id = undefined;
		}
		if(typeof this._ric_id !== "undefined") {
                        window.cancelIdleCallback(this._ric_id);
                        this._ric_id = undefined;
                }
		this._scheduler[Comlink.releaseProxy]();
		this._worker.terminate();
		this._renderer.close();
	}

	protected _createRenderer(
		prefetchFactory: { new(): Prefetch } = ServiceWorkerPrefetch,
	): Renderer {
		if(this._section === null) {
			throw new Error("cannot find <section> element to attach to.");
		}
		if(this._main === null) {
			throw new Error("cannot find <main> element to attach to.");
		}

		const renderer = new WebRenderer(prefetchFactory);
		renderer.init();

		this._connectSchedulerToRenderer(this._scheduler, renderer);
		this._connectRaftCluster(this._scheduler, renderer);

		renderer.setAssetTarget(this._main);
		renderer.setRenderTarget(this._main);

		return renderer;
	}

	// https://lit.dev/docs/components/lifecycle/#firstupdated
	// Called after the component's DOM has been updated the first time,
	// immediately before updated() is called.
	// Earliest opportunity to read properties and access the render root.
	override firstUpdated(changedProperties: Map<string, any>) {
		console.log("PLAYLIST: firstUpdated");
		console.log("PLAYLIST", changedProperties);
		try {
			this._renderer = this._createRenderer();
		} catch(e: any) {
			if(typeof e === "object") {
				for (const [key, value] of Object.entries(e)) {
					console.error(`PLAYLIST: e: ${key}: ${value}`);
				}
			}
			console.error(`PLAYLIST: Failed to create renderer: ${e}`);
			throw e;
		}
	}

	// https://lit.dev/docs/components/lifecycle/#updated
	// Called whenever the component’s update finishes and the element's
	// DOM has been updated and rendered.
	override updated(changedProperties: Map<string, any>) {
		console.log("PLAYLIST: updated");
		console.log(changedProperties);
		if(changedProperties.has('src')) {
			if(this.src.length !== 0
				&& this.src_id.length !== 0
				&& this.src_size !== 0
				&& typeof this.src_hash !== "undefined"
				&& this.src_integrity.length !== 0
				&& this.src_md5.length !== 0)
			{
				this._onSrc(
					this.src,
					this.src_id,
					this.src_size,
					this.src_hash,
					this.src_integrity,
					this.src_md5,
				);
				if(this.autoplay
					&& this.width !== 0
					&& this.height !== 0)
				{
					console.log(`PLAYLIST: Auto-playing ${this.src} (${this.src_id})`);
					this.play();
				}
			}
		}
		if(changedProperties.has('views')) {
			this._onViews(this.views);
		}
		if(changedProperties.has('width')
			|| changedProperties.has('height'))
		{
			this._onSize(this.width, this.height);
		}
	}

	protected _onSrc(
		src: string,
		id: string,
		size: number,
		hash: HashDecl,
		integrity: string,
		md5: string,
	): void {
		console.log(`PLAYLIST: onSrc: ${src} (${id})`);
		(async () => {
			const url = new URL(this.src, window.location.href);
			await this._scheduler.setSource(
				url.toString(),
				id,
				size,
				hash,
				integrity,
				md5,
			);
		})();
	}

	protected _onViews(
		views: { left: number, top: number, x: number, y: number, width: number, height: number }[],
	): void {
		console.log(`PLAYLIST: onViews: ${JSON.stringify(views)}`);
		this._renderer.setViews(views);
	}

	protected _onSize(
		width: number,
		height: number,
	): void {
		console.log(`PLAYLIST: onSize: ${width} ${height}`);
		this._renderer.setSize(width, height);
	}

	// Explicitly start playback if autoplay is false.
	async play(): Promise<void> {
		this._prepareNextFrame();
		this._prepareIdleCallback();
		await this._scheduler.play();
	}

	// Connect the scheduler to the renderer.
	protected _connectSchedulerToRenderer(
		scheduler: any,
		renderer: Renderer,
	): void {
		(async () => {
			await scheduler.setStatePort(
				Comlink.transfer(this._channel.port2, [this._channel.port2])
			);
			renderer.setSchedulerMessagePort(this._channel.port1);
		})();
	}

	// Connect the scheduler to the cluster.
	protected _connectRaftCluster(
		scheduler: any,
		renderer: Renderer,
	): void {
		(async () => {
			const message_listener = (event: any) => {
				if(this._cluster?.leader) {
					return;
				}
				const value = JSON.parse(event.detail);
				renderer.setStateUnhooked(value);
			};
			const set_state = (state: SchedulerState) => {
				if(!this._cluster?.leader) {
					return;
				}
				this._cluster?.broadcast(JSON.stringify(state));
				renderer.setStateUnhooked(state);
			};
			const join = (decl: any) => {
				this._cluster = new RaftCluster(decl);
				this._cluster.join();
				this._cluster.addEventListener('message', message_listener);
				renderer.setSetStateHook(set_state);
			};
			const leave = () => {
				if(this._cluster instanceof RaftCluster) {
					renderer.clearSetStateHook();
					this._cluster.removeEventListener('message', message_listener);
					this._cluster.leave();
				}
				this._cluster = undefined;
			};
			await scheduler.exposeNetwork(Comlink.proxy(join), Comlink.proxy(leave));
		})();
	}

	// REF: https://en.wikipedia.org/wiki/FreeSync
	// Render at native frame rate, which may be variable, e.g. NVIDIA
	// G-SYNC, or FreeSync.
	protected _renderOneFrame(timestamp: DOMHighResTimeStamp): void {
		this._raf_id = undefined;
		this._renderer.render(timestamp);
		this._prepareNextFrame();
	}

	protected _prepareNextFrame(): void {
		if(typeof this._raf_id !== "undefined") {
			window.cancelAnimationFrame(this._raf_id);
			this._raf_id = undefined;
		}
		this._raf_id = window.requestAnimationFrame((timestamp: DOMHighResTimeStamp) => this._renderOneFrame(timestamp));
	}

	// REF: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
	// Called during a browser's idle periods, i.e. background or low
	// priority work.
	protected _idle(deadline: IdleDeadline): void {
		this._ric_id = undefined;
		if(deadline.timeRemaining() > 0) {
			this._renderer.idle();

			// Step the cluster state engine, if enabled.
			if(this._cluster instanceof RaftCluster) {
				const timestamp = performance.now();
				this._cluster.update(timestamp);
			}
		}
		this._prepareIdleCallback();
	}

	// REF: https://en.wikipedia.org/wiki/Nyquist_frequency
	// Maximum interval set to half the Raft heartbeat.
	protected _prepareIdleCallback(): void {
		if(typeof this._ric_id !== "undefined") {
			window.cancelIdleCallback(this._ric_id);
			this._ric_id = undefined;
		}
		this._ric_id = window.requestIdleCallback((deadline: IdleDeadline) => this._idle(deadline),
			{ timeout: 250 });
	}
}
