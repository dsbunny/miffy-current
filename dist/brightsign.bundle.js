import { property, query, state, customElement } from 'lit/decorators.js';
import * as Comlink from 'comlink';
import { LitElement, css, html } from 'lit';
import EventTarget$1 from '@ungap/event-target';
import { AppManifestSchema } from '@dsbunny/app';
import { RTCMesh } from '@dsbunny/rtcmesh';
import { Raft } from '@dsbunny/raft';
import 'requestidlecallback-polyfill';
import * as THREE from 'three';

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
class NullRenderer extends EventTarget$1 {
    constructor() {
        super();
    }
    get ended() { return false; }
    get error() { return null; }
    get networkState() { return HTMLMediaElement.NETWORK_EMPTY; }
    get paused() { return true; }
    get readyState() { return HTMLMediaElement.HAVE_NOTHING; }
    // Called after placement in DOM.
    init() {
        console.log("NULL-RENDERER: init");
    }
    close() {
        console.log("NULL-RENDERER: close");
    }
    setSetStateHook(_cb) { }
    clearSetStateHook() { }
    setSchedulerMessagePort(scheduler) {
        console.log("NULL-RENDERER: setSchedulerMessagePort", scheduler);
    }
    // Called by Scheduler or via Cluster as a follower.  This API receives
    // the near and immediate scheduling state to render the current and
    // next media asset, including the transition between the two.
    async setState(_value) { }
    async setStateUnhooked(_value) { }
    setAssetTarget(assetTarget) {
        console.log("NULL-RENDERER: setAssetTarget", assetTarget);
    }
    setRenderTarget(renderTarget) {
        console.log("NULL-RENDERER: setRenderTarget", renderTarget);
    }
    setPixelRatio(value) {
        console.log("NULL-RENDERER: setPixelRatio", value);
    }
    setSize(width, height) {
        console.log("NULL-RENDERER: setSize", width, height);
    }
    setViews(views) {
        console.log("NULL-RENDERER: setViews", views);
    }
    async setSources(_scope, _sources) {
        // no-op
    }
    // on requestAnimationFrame() callback.
    render(_timestamp) { }
    // on requestIdleCallback() callback.
    idle() { }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
window.HTMLImageElement.prototype.decode =
    window.HTMLImageElement.prototype.decode ||
        function () {
            // If the image is already loaded, return a resolved promise.
            if (this.complete) {
                return Promise.resolve();
            }
            let timeout;
            const promise = new Promise((resolve, reject) => {
                this.onload = (event) => {
                    if (typeof timeout === "undefined") {
                        return;
                    }
                    clearTimeout(timeout);
                    timeout = undefined;
                    resolve(event);
                };
                this.onerror = (event) => {
                    if (typeof timeout === "undefined") {
                        return;
                    }
                    clearTimeout(timeout);
                    timeout = undefined;
                    if (typeof event === "string"
                        && event !== "timeout") {
                        console.warn(`HTMLImageElement.decode: Image load failed with error: ${event}`);
                    }
                    else if (event instanceof Event) {
                        console.warn(`HTMLImageElement.decode: Image load failed with event: ${event.type}`);
                    }
                    reject(event);
                };
            });
            // Reject the promise if the image fails to load or reasonable
            // time has passed.
            timeout = setTimeout(() => {
                if (typeof timeout === "undefined") {
                    return;
                }
                if (this.onerror) {
                    console.warn("HTMLImageElement.decode: Timeout waiting for image load.");
                    this.onerror("timeout");
                }
            }, 10000);
            return promise;
        };

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
class AbstractWebAsset extends EventTarget$1 {
    constructor(src, params, duration, collection) {
        super();
        this.collection = collection;
        this.element = null;
        this._opacity = 1;
        this._ended = false;
        this._error = null;
        this._networkState = HTMLMediaElement.NETWORK_NO_SOURCE;
        this._paused = true;
        this._readyState = HTMLMediaElement.HAVE_NOTHING;
        const url = new URL(src, self.location.href);
        this._src = url.href;
        if (this._src.length !== 0) {
            this._networkState = HTMLMediaElement.NETWORK_EMPTY;
        }
        this._params = params;
        this._duration = duration;
    }
    get params() { return this._params; }
    // Per `HTMLElement`.
    get className() { return this.element.className; }
    set className(_value) { this.element.className = _value; }
    get classList() { return this.element.classList; }
    get style() { return this.element.style; }
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
    get srcObject() { return null; }
    // Per `HTMLVideoElement`.
    get height() { return 0; }
    get width() { return 0; }
}
// super must be used to call functions only, operation is undefined when
// accessing variables that are not hidden behind getters and setters.
class WebImageAsset extends AbstractWebAsset {
    constructor(src, params, duration, collection) {
        super(src, params, duration, collection);
        this._startTime = NaN;
        this._lastTimeUpdate = 0;
        this._currentTime = 0;
    }
    get image() {
        return this.element;
    }
    close() {
        if (this.image === null) {
            return;
        }
        console.log(`unload image ... "${this.src}"`);
        this.pause();
        const collection = this.collection;
        collection.release(this.image);
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
    paint(now, _remaining) {
        if (this.paused || this.ended)
            return;
        const elapsed = (now - this._startTime) / 1000;
        this._currentTime += elapsed;
        if (this._currentTime > this._duration) {
            this._setEndedState();
        }
        else {
            if (Math.floor(this._currentTime) > this._lastTimeUpdate) {
                this._lastTimeUpdate = this._currentTime;
                this.dispatchEvent(new Event('timeupdate'));
            }
        }
    }
    _setEndedState() {
        this._currentTime = this._duration;
        this._ended = true;
        this._startTime = NaN;
        this.dispatchEvent(new Event('ended'));
    }
    get params() { return super.params; }
    // Per `HTMLElement`.
    get className() { return super.className; }
    set className(value) { super.className = value; }
    get classList() { return super.classList; }
    get style() { return super.style; }
    // Per `HTMLMediaElement`.
    get currentSrc() { return super.currentSrc; }
    get currentTime() { return this._currentTime; }
    get duration() { return super.duration; }
    get ended() { return super.ended; }
    get error() { return super.error; }
    get networkState() { return super.networkState; }
    get paused() { return super.paused; }
    get readyState() { return super.readyState; }
    get src() { return super.src; }
    get srcObject() { return null; }
    load() {
        (async () => {
            const collection = this.collection;
            const img = this.element = collection.acquire();
            this._networkState = HTMLMediaElement.NETWORK_LOADING;
            try {
                console.log(`load image ... "${this.src}"`);
                img.crossOrigin = 'anonymous';
                img.setAttribute('src', this.src);
                await img.decode();
                this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA;
                super.dispatchEvent(new Event('canplay'));
            }
            catch (encodingError) {
                console.warn(`Failed to load image: "${this.src}" Error: ${encodingError}`);
                this._error = encodingError;
                this._networkState = HTMLMediaElement.NETWORK_IDLE;
                collection.release(img);
                super.dispatchEvent(new Event('error'));
            }
        })();
    }
    pause() {
        if (this._paused)
            return;
        this._paused = true;
    }
    async play() {
        this._paused = false;
        if (this._ended) {
            this._ended = false;
            this._currentTime = 0;
        }
        if (isNaN(this._startTime)) {
            this._startTime = performance.now() - this._currentTime;
        }
    }
    // Per `HTMLVideoElement`.
    get height() {
        if (this.image === null) {
            return NaN;
        }
        return this.image.height;
    }
    get width() {
        if (this.image === null) {
            return NaN;
        }
        return this.image.width;
    }
}
class WebVideoAsset extends AbstractWebAsset {
    constructor(src, params, duration, collection) {
        super(src, params, duration, collection);
        this._redispatchEvent = (event) => {
            super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
        };
    }
    get video() {
        return this.element;
    }
    close() {
        if (this.video === null) {
            return;
        }
        console.log(`unload video ... "${this.src}"`);
        this.pause();
        const collection = this.collection;
        const video = this.video;
        video.oncanplay = null;
        video.onended = null;
        video.onerror = null;
        video.onloadeddata = null;
        video.removeAttribute('src');
        collection.release(video);
        this.element = null;
    }
    paint(_now, _remaining) { }
    get params() { return super.params; }
    // Per `HTMLElement`.
    get className() { return super.className; }
    set className(value) { super.className = value; }
    get classList() { return super.classList; }
    get style() { return super.style; }
    // Per `HTMLMediaElement`.
    get currentSrc() {
        if (this.video === null) {
            return super.currentSrc;
        }
        return this.video.currentSrc;
    }
    get currentTime() {
        if (this.video === null) {
            return super.currentTime;
        }
        return this.video.currentTime;
    }
    get duration() {
        if (this.video === null) {
            return NaN;
        }
        return this.video.duration;
    }
    get ended() {
        if (this.video === null) {
            return false;
        }
        return this.video.ended;
    }
    get error() {
        if (this.video === null) {
            return false;
        }
        return this.video.error;
    }
    get networkState() {
        if (this.video === null) {
            return HTMLMediaElement.NETWORK_EMPTY;
        }
        return this.video.networkState;
    }
    get paused() {
        if (this.video === null) {
            return true;
        }
        return this.video.paused;
    }
    get readyState() {
        if (this.video === null) {
            return HTMLMediaElement.HAVE_NOTHING;
        }
        return this.video.readyState;
    }
    get src() { return super.src; }
    get srcObject() {
        if (this.video === null) {
            return null;
        }
        return this.video.srcObject;
    }
    load() {
        const collection = this.collection;
        const video = this.element = collection.acquire();
        video.oncanplay = this._redispatchEvent;
        video.onended = this._redispatchEvent;
        video.onerror = this._redispatchEvent;
        // Avoid "WebGL: INVALID_VALUE: texImage2D: no video".
        video.onloadeddata = this._redispatchEvent;
        try {
            console.log(`load video ... "${this.src}"`);
            video.crossOrigin = 'anonymous';
            video.setAttribute('src', this.src);
            video.load();
        }
        catch (encodingError) {
            collection.release(video);
            throw encodingError;
        }
    }
    pause() {
        if (this.video === null) {
            return;
        }
        this.video.pause();
    }
    async play() {
        if (this.video === null) {
            return;
        }
        await this.video.play();
    }
    // Per `HTMLVideoElement`.
    get height() {
        if (this.video === null) {
            return NaN;
        }
        return this.video.height;
    }
    get width() {
        if (this.video === null) {
            return NaN;
        }
        return this.video.width;
    }
}
class WebAppAsset extends AbstractWebAsset {
    constructor(src, params, duration, collection) {
        super(src, params, duration, collection);
        this._app = null;
        this._redispatchEvent = (event) => {
            //console.log(`redispatch event: ${event instanceof Event ? event.type : event}`);
            super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
        };
    }
    get container() {
        return this.element;
    }
    close() {
        if (this.element === null) {
            return;
        }
        console.log(`unload app ... "${this.src}"`);
        this.pause();
        const collection = this.collection;
        if (this._app !== null) {
            this._app.close();
            this._app.removeEventListener('canplay', this._redispatchEvent);
            this._app.removeEventListener('ended', this._redispatchEvent);
            this._app.removeEventListener('error', this._redispatchEvent);
            this._app = null;
        }
        collection.release(this.container);
        this.element = null;
    }
    paint(now, remaining) {
        if (this.paused || this.ended)
            return;
        if (this._app === null) {
            return;
        }
        this._app.animate(now, remaining);
    }
    get params() { return super.params; }
    // Per `HTMLElement`.
    get className() { return super.className; }
    set className(value) { super.className = value; }
    get classList() { return super.classList; }
    get style() { return super.style; }
    // Per HTMLMediaElement.
    get currentSrc() {
        if (this._app === null) {
            return super.currentSrc;
        }
        return this._app.currentSrc;
    }
    get currentTime() {
        if (this._app === null) {
            return super.currentTime;
        }
        return this._app.currentTime;
    }
    get duration() {
        if (this._app === null) {
            return NaN;
        }
        return this._app.duration;
    }
    get ended() {
        if (this._app === null) {
            return false;
        }
        return this._app.ended;
    }
    get error() {
        if (this._app === null) {
            return false;
        }
        return this._app.error;
    }
    get networkState() {
        if (this._app === null) {
            return HTMLMediaElement.NETWORK_EMPTY;
        }
        return this._app.networkState;
    }
    get paused() {
        if (this._app === null) {
            return true;
        }
        return this._app.paused;
    }
    get readyState() {
        if (this._app === null) {
            return HTMLMediaElement.HAVE_NOTHING;
        }
        return this._app.readyState;
    }
    get src() { return super.src; }
    get srcObject() { return super.srcObject; }
    load() {
        (async () => {
            const collection = this.collection;
            const renderRoot = this.element = collection.acquire();
            try {
                console.log(`import module ... "${this.src}"`);
                const manifest = await collection.importModule(this.src);
                console.log(`create WebApp ... "${this.src}"`);
                const params = {
                    ...this.params,
                    src: this.src,
                    duration: super.duration, // WARNING: `super` not `this`.
                };
                const app = this._app = manifest.WebApp.create(renderRoot, params);
                app.addEventListener('canplay', this._redispatchEvent);
                app.addEventListener('ended', this._redispatchEvent);
                app.addEventListener('error', this._redispatchEvent);
                console.log(`init "${manifest.name}" with params:`, params);
                app.load();
            }
            catch (initError) {
                console.warn(`Failed to load app: "${this.src}"`, initError);
                collection.release(renderRoot);
                super.dispatchEvent(new Event('error'));
            }
        })();
    }
    pause() {
        if (this._app === null) {
            return;
        }
        this._app.pause();
    }
    async play() {
        if (this._app === null) {
            return;
        }
        await this._app.play();
    }
    // Per `HTMLVideoElement`.
    get height() {
        if (this._app === null) {
            return NaN;
        }
        return this._app.height;
    }
    get width() {
        if (this._app === null) {
            return NaN;
        }
        return this._app.width;
    }
}
class WebCollection {
    constructor(renderRoot) {
        this.renderRoot = renderRoot;
    }
}
class WebImageCollection extends WebCollection {
    constructor(renderRoot) {
        super(renderRoot);
        this._images = [];
        this._count = 0;
    }
    // TSC forces pop() to return undefined even if length is checked.
    acquire() {
        let img = this._images.pop();
        if (typeof img === "undefined") {
            img = new Image();
            this._count++;
            this.renderRoot.appendChild(img);
        }
        else {
            img.className = '';
        }
        return img;
    }
    createWebAsset(src, params, duration) {
        return new WebImageAsset(src, params, duration, this);
    }
    release(img) {
        img.removeAttribute('src');
        if (this._count > 2) {
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
    clear() {
        for (const img of this._images) {
            this.renderRoot.removeChild(img);
        }
        this._images = [];
        this._count = 0;
    }
}
class WebVideoCollection extends WebCollection {
    constructor(renderRoot) {
        super(renderRoot);
        this._videos = [];
        this._count = 0;
    }
    acquire() {
        let video = this._videos.pop();
        if (typeof video === "undefined") {
            video = document.createElement('video');
            this._count++;
            video.autoplay = false;
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto'; // The video will be played soon.
            // Video must be within DOM to playback.
            this.renderRoot.appendChild(video);
        }
        else {
            video.className = '';
        }
        return video;
    }
    createWebAsset(src, params, _duration) {
        return new WebVideoAsset(src, params, NaN, this);
    }
    release(video) {
        if (!video.paused) {
            video.pause();
        }
        // Some platforms treat `video.src = ''` as loading the current
        // location, so we use `video.removeAttribute('src')` instead.
        video.removeAttribute('src');
        if (this._count > 2) {
            this.renderRoot.removeChild(video);
            this._count--;
            return;
        }
        video.className = 'spare';
        video.style.opacity = '';
        video.style.visibility = '';
        this._videos.push(video);
    }
    clear() {
        for (const video of this._videos) {
            this.renderRoot.removeChild(video);
        }
        this._videos = [];
        this._count = 0;
    }
}
class WebAppCollection extends WebCollection {
    constructor(renderRoot) {
        super(renderRoot);
        this._manifests = new Map();
        this._roots = [];
        this._count = 0;
    }
    acquire() {
        let root = this._roots.pop();
        if (typeof root === "undefined") {
            root = document.createElement('article');
            this._count++;
            this.renderRoot.appendChild(root);
        }
        else {
            root.className = '';
        }
        return root;
    }
    async importModule(src) {
        let manifest = this._manifests.get(src);
        if (typeof manifest === 'undefined') {
            console.log(`import app manifest ... "${src}"`);
            const module = await import(src);
            console.log(`validate app manifest ... "${src}"`);
            const result = AppManifestSchema.safeParse(module.default);
            console.log(`app manifest validation result: ${result.success} ... "${src}"`);
            if (!result.success) {
                throw new Error(`Invalid app manifest: "${src}"`);
            }
            if (!result.data.WebApp) {
                throw new Error(`WebApp constructor not found in manifest: ${src}`);
            }
            manifest = result.data;
            this._manifests.set(src, manifest);
        }
        return manifest;
    }
    createWebAsset(src, params, duration) {
        return new WebAppAsset(src, params, duration, this);
    }
    release(root) {
        if (this._count > 2) {
            this.renderRoot.removeChild(root);
            this._count--;
            return;
        }
        root.className = 'spare';
        root.style.opacity = '';
        root.style.visibility = '';
        this._roots.push(root);
    }
    clear() {
        for (const root of this._roots) {
            this.renderRoot.removeChild(root);
        }
        this._roots = [];
        this._manifests.clear();
        this._count = 0;
    }
}
class WebAssetManager {
    constructor() {
        this._collection = new Map();
    }
    setAssetTarget(renderTarget) {
        this._renderTarget = renderTarget;
    }
    _createCollection(renderTarget) {
        // TypeScript assumes iterator of first type.
        const collection = new Map([
            ['HTMLImageElement', new WebImageCollection(renderTarget)],
            ['HTMLVideoElement', new WebVideoCollection(renderTarget)],
            ['CustomElement', new WebAppCollection(renderTarget)],
        ]);
        return collection;
    }
    // decl: { type, href }
    // Returns: asset.
    createWebAsset(decl) {
        if (this._collection.size === 0) {
            if (typeof this._renderTarget === "undefined") {
                throw new Error("undefined render target.");
            }
            this._collection = this._createCollection(this._renderTarget);
        }
        const collection = this._collection.get(decl['@type']);
        if (typeof collection === "undefined") {
            throw new Error('Undefined collection.');
        }
        return collection.createWebAsset(decl.href, decl.params, decl.duration);
    }
    clear() {
        for (const value of this._collection.values()) {
            value.clear();
        }
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
class WebRendererAsset {
    constructor(asset_id, web_asset) {
        this.asset_id = asset_id;
        this.web_asset = web_asset;
        this.is_loading = false;
        this.has_element = false;
        this.end_time = NaN;
        this._ref_count = 0;
    }
    get paused() { return this.web_asset.paused; }
    get ended() { return this.web_asset.ended; }
    get error() { return this.web_asset.error; }
    get readyState() { return this.web_asset.readyState; }
    get networkState() { return this.web_asset.networkState; }
    get element() { return this.web_asset.element; }
    get currentSrc() { return this.web_asset.currentSrc; }
    get currentTime() { return this.web_asset.currentTime; }
    get className() { return this.web_asset.className; }
    set className(value) { this.web_asset.className = value; }
    get classList() { return this.web_asset.classList; }
    get style() { return this.web_asset.style; }
    load() {
        if (this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
            return;
        }
        if (this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
            return;
        }
        try {
            this.web_asset.load();
        }
        catch (error) {
            console.error(`WEB-ASSET: ${error}`);
        }
    }
    async play() {
        await this.web_asset.play();
    }
    paint(now, remaining) {
        this.web_asset.paint(now, remaining);
    }
    pause() {
        this.web_asset.pause();
    }
    close() {
        this.web_asset.close();
    }
    get ref_count() { return this._ref_count; }
    ref() {
        this._ref_count++;
    }
    unref() {
        this._ref_count--;
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
// REF: http://jsfiddle.net/unLSJ/
function replacer$1(_match, pIndent, pKey, pVal, pEnd) {
    const key = '<span class=json-key>';
    const val = '<span class=json-value>';
    const str = '<span class=json-string>';
    let r = pIndent || '';
    if (pKey) {
        r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
    }
    if (pVal) {
        r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
    }
    return r + (pEnd || '');
}
function prettyPrint$1(obj) {
    const jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
    return JSON.stringify(obj, null, 3)
        .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(jsonLine, replacer$1);
}
function minimize$1(value) {
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
class WebRenderer extends EventTarget$1 {
    constructor(prefetchFactory) {
        super();
        this._renderTarget = null;
        this._asset_manager = new WebAssetManager();
        this._transition_percent = 0;
        this._transition_percent_speed = 0;
        this._network_loading_count = 0;
        this._current_renderer_asset = null;
        this._next_renderer_asset = null;
        this._map1_renderer_asset = null;
        this._map2_renderer_asset = null;
        this._renderer_asset_cache = new Map();
        this._renderer_asset_trash = new Map();
        // Per HTMLMediaElement.
        this._ended = false;
        this._error = null;
        this._networkState = HTMLMediaElement.NETWORK_EMPTY;
        this._paused = true;
        this._readyState = HTMLMediaElement.HAVE_NOTHING;
        this._debug = document.createElement('div');
        this._lastDebug = "";
        // on requestAnimationFrame() callback.
        this._previousTimestamp = 0;
        this._asset_prefetch = new prefetchFactory();
        {
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
        for (const asset of this._renderer_asset_cache.values()) {
            // Hide from view.
            asset.style.visibility = "hidden";
            asset.close();
        }
        this._renderer_asset_cache.clear();
    }
    setSetStateHook(cb) {
        this._set_state_hook = cb;
    }
    clearSetStateHook() {
        this._set_state_hook = undefined;
    }
    setSchedulerMessagePort(scheduler) {
        console.log("WEB-RENDERER: setSchedulerMessagePort", scheduler);
        Comlink.expose({
            setState: (value) => this.setState(value),
            setSources: async (scope, decls) => {
                return await this.setSources(scope, decls.map(decl => {
                    return {
                        '@type': decl['@type'],
                        asset_id: decl.asset_id,
                        href: decl.href,
                        size: decl.size,
                        hash: decl.hash,
                        md5: decl.md5,
                        integrity: decl.integrity,
                    };
                }));
            },
        }, scheduler);
    }
    // Called by Scheduler or via Cluster as a follower.  This API receives
    // the near and immediate scheduling state to render the current and
    // next media asset, including the transition between the two.
    async setState(value) {
        // In a cluster we need to forward the state to all nodes
        // before we can process.
        if (typeof this._set_state_hook !== "undefined") {
            this._set_state_hook(value);
            return;
        }
        await this.setStateUnhooked(value);
    }
    async setStateUnhooked(value) {
        {
            const html = prettyPrint$1(minimize$1(value));
            if (html !== this._lastDebug) {
                this._debug.innerHTML = this._lastDebug = html;
            }
        }
        await this._onSchedulerCurrent(value.mediaCurrent);
        this._onSchedulerNext(value.mediaNext);
        await this._onSchedulerTransition(value.transition);
    }
    setAssetTarget(assetTarget) {
        console.log("WEB-RENDERER: setAssetTarget", assetTarget);
        this._asset_manager.setAssetTarget(assetTarget);
    }
    setRenderTarget(renderTarget) {
        console.log("WEB-RENDERER: setRenderTarget", renderTarget);
        this._renderTarget = renderTarget;
    }
    setPixelRatio(value) {
        console.log("WEB-RENDERER: setPixelRatio", value);
        // TBD: translate to CSS.
    }
    setSize(width, height) {
        console.log("WEB-RENDERER: setSize", width, height);
        if (this._renderTarget !== null) {
            this._renderTarget.style.width = `${width}px`;
            this._renderTarget.style.height = `${height}px`;
        }
    }
    setViews(views) {
        console.log("WEB-RENDERER: setViews", views);
    }
    async setSources(scope, sources) {
        console.log("WEB-RENDERER: setSources", scope, sources);
        await this._asset_prefetch.acquireSources(scope, sources);
    }
    render(timestamp) {
        //		console.log('update', timestamp);
        const elapsed = timestamp - this._previousTimestamp;
        this._previousTimestamp = timestamp;
        if (this._canPaintCurrent()) {
            if (this._current_renderer_asset === null) {
                throw new Error("current asset is null.");
            }
            const remaining = this._current_renderer_asset.end_time - timestamp;
            try {
                this._paintCurrent(timestamp, remaining);
            }
            catch (ex) {
                console.error(ex);
                console.error(this._current_renderer_asset);
            }
        }
        else if (this._hasWaitingDuration()) {
            if (this._current_renderer_asset === null) {
                throw new Error("current asset is null.");
            }
            const remaining = this._current_renderer_asset.end_time - timestamp;
            this._paintWaitingDuration(timestamp, remaining);
        }
        else {
            this._paintWaiting(timestamp);
        }
        if (this._canPaintNext()) {
            if (this._next_renderer_asset === null) {
                throw new Error("next asset is null.");
            }
            const remaining = this._next_renderer_asset.end_time - timestamp;
            try {
                this._paintNext(timestamp, remaining);
            }
            catch (ex) {
                console.error(ex);
                console.error(this._next_renderer_asset);
            }
        }
        this._interpolateTransition(elapsed);
    }
    // on requestIdleCallback() callback.
    idle() {
        this._emptyAssetTrash();
    }
    _setTransitionPercent(percent) {
        if (this._map1_renderer_asset !== null) {
            const rounded = Math.round((1 - percent + Number.EPSILON) * 100) / 100;
            this._map1_renderer_asset.style.opacity = rounded.toString();
        }
        if (this._map2_renderer_asset !== null) {
            this._map2_renderer_asset.style.opacity = '1';
        }
        this._transition_percent = percent;
    }
    _interpolateTransition(elapsed) {
        if (this._transition_percent_speed !== 0) {
            this._transition_percent += (this._transition_percent_speed * elapsed) / 1000;
            if (this._transition_percent > 1) {
                this._transition_percent = 1;
                this._transition_percent_speed = 0;
            }
            this._setTransitionPercent(this._transition_percent);
        }
    }
    async _fetchImage(url) {
        console.log("WEB-RENDERER: _fetchImage", url);
        const img = await new Promise((resolve, reject) => {
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
    // This media asset.
    async _onSchedulerCurrent(current) {
        if (current !== null) {
            if (!this._isMediaReady(current.decl)) {
                return;
            }
            if (this._current_renderer_asset === null) {
                //console.info(current.decl.href, current.remainingTimeMs);
                this._current_renderer_asset = await this._updateCurrent(current.decl);
                this._current_renderer_asset.end_time = (typeof current.remainingTimeMs === "number") ?
                    (current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._current_renderer_asset.ref();
                console.log("WEB-RENDERER: current", this._current_renderer_asset.currentSrc);
            }
            else if (current.decl.asset_id !== this._current_renderer_asset.asset_id) {
                //console.info(current.decl.href, current.remainingTimeMs);
                this._closeCurrent();
                if (this._next_renderer_asset !== null
                    && current.decl.asset_id === this._next_renderer_asset.asset_id) {
                    console.log("WEB-RENDERER: current <- next");
                    this._current_renderer_asset = await this._updateCurrentFromNext();
                }
                else {
                    this._current_renderer_asset = await this._updateCurrent(current.decl);
                }
                this._current_renderer_asset.end_time = (typeof current.remainingTimeMs === "number") ?
                    (current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._current_renderer_asset.ref();
                console.log("WEB-RENDERER: current", this._current_renderer_asset.currentSrc);
            }
            else if (this._current_renderer_asset !== null) {
                this._current_renderer_asset = await this._updateCurrent(current.decl);
                this._current_renderer_asset.end_time = (typeof current.remainingTimeMs === "number") ?
                    (current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
            }
            if (this._current_renderer_asset === null) {
                throw new Error("current asset is null.");
            }
        }
        else if (this._current_renderer_asset !== null) {
            this._closeCurrent();
            console.log(`WEB-RENDERER: current null`);
        }
    }
    _onSchedulerNext(next) {
        // Next media asset.
        if (next !== null) {
            if (!this._isMediaReady(next.decl)) {
                return;
            }
            if (this._next_renderer_asset === null) {
                this._next_renderer_asset = this._updateNext(next.decl);
                this._next_renderer_asset.end_time = (typeof next.remainingTimeMs === "number") ?
                    (next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._next_renderer_asset.ref();
                console.log("WEB-RENDERER: next", this._next_renderer_asset.currentSrc);
            }
            else if (next.decl.asset_id !== this._next_renderer_asset.asset_id) {
                this._closeNext();
                this._next_renderer_asset = this._updateNext(next.decl);
                this._next_renderer_asset.end_time = (typeof next.remainingTimeMs === "number") ?
                    (next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._next_renderer_asset.ref();
                console.log("WEB-RENDERER: next", this._next_renderer_asset.currentSrc);
            }
            else if (this._next_renderer_asset !== null) {
                this._next_renderer_asset = this._updateNext(next.decl);
                this._next_renderer_asset.end_time = (typeof next.remainingTimeMs === "number") ?
                    (next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
            }
            if (this._next_renderer_asset === null) {
                throw new Error("next asset is null.");
            }
        }
        else if (this._next_renderer_asset !== null) {
            this._closeNext();
            console.log(`WEB-RENDERER: next null`);
        }
    }
    async _onSchedulerTransition(transition) {
        // Resources for transitions, explicitly details textures to
        // avoid confusion when crossing boundary between two assets.
        if (transition !== null) {
            const from_asset = this._renderer_asset_cache.get(transition.from.decl.asset_id);
            if (typeof from_asset !== "undefined"
                && from_asset.element !== null
                && from_asset.asset_id !== this._map1_renderer_asset?.asset_id) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                }
                from_asset.ref();
                this._setMap1Asset(from_asset);
            }
            const to_asset = this._renderer_asset_cache.get(transition.to.decl.asset_id);
            if (typeof to_asset !== "undefined"
                && to_asset.element !== null
                && to_asset.asset_id !== this._map2_renderer_asset?.asset_id) {
                if (this._map2_renderer_asset !== null) {
                    this._map2_renderer_asset.unref();
                }
                to_asset.ref();
                this._setMap2Asset(to_asset);
            }
            if (transition.percent !== this._transition_percent) {
                this._setTransitionPercent(transition.percent);
            }
            if (transition.percentSpeed !== this._transition_percent_speed) {
                this._transition_percent_speed = transition.percentSpeed;
            }
        }
        else { // Transition finished, follow settings per "current".
            if (this._current_renderer_asset === null) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                    this._setMap1Asset(null);
                }
            }
            else if (this._current_renderer_asset.element !== null
                && this._current_renderer_asset.asset_id !== this._map1_renderer_asset?.asset_id) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                }
                this._current_renderer_asset.ref();
                this._setMap1Asset(this._current_renderer_asset);
            }
            if (this._map2_renderer_asset !== null) {
                this._map2_renderer_asset.unref();
                this._setMap2Asset(null);
            }
            if (this._transition_percent !== 0) {
                this._setTransitionPercent(0);
            }
            if (this._transition_percent_speed !== 0) {
                this._transition_percent_speed = 0;
            }
        }
    }
    _networkLoadingRef() {
        if (this._network_loading_count === 0) {
            this._networkState = HTMLMediaElement.NETWORK_LOADING;
        }
        this._network_loading_count++;
    }
    _networkLoadingUnref() {
        this._network_loading_count--;
        if (this._network_loading_count === 0) {
            this._networkState = HTMLMediaElement.NETWORK_IDLE;
        }
    }
    _emptyAssetTrash() {
        const remove_list = [];
        for (const [id, asset] of this._renderer_asset_trash) {
            if (asset.ref_count !== 0) {
                continue;
            }
            asset.close();
            remove_list.push(id);
        }
        for (const id of remove_list) {
            console.log("WEB-RENDERER: Destroying", id);
            this._renderer_asset_cache.delete(id);
            this._renderer_asset_trash.delete(id);
        }
    }
    _setMap1Asset(asset) {
        this._map1_renderer_asset?.classList.remove('map1');
        if (asset === null) {
            this._map1_renderer_asset = null;
            return;
        }
        this._map1_renderer_asset = asset;
        this._map1_renderer_asset.className = 'map1';
    }
    _setMap2Asset(asset) {
        this._map2_renderer_asset?.classList.remove('map2');
        if (asset === null) {
            this._map2_renderer_asset = null;
            return;
        }
        this._map2_renderer_asset = asset;
        this._map2_renderer_asset.className = 'map2';
    }
    // Assumes new decl.
    async _updateCurrent(decl) {
        const asset = this._resolveMediaAsset(decl);
        if (!asset.has_element
            && asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            asset.has_element = true;
            await asset.play();
            if (this._map1_renderer_asset !== null) {
                this._map1_renderer_asset.unref();
            }
            if (this._map2_renderer_asset !== null) {
                this._map2_renderer_asset.unref();
            }
            asset.ref();
            this._setMap1Asset(asset);
            this._setMap2Asset(null);
            this._setTransitionPercent(0);
            if (this.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
            }
        }
        return asset;
    }
    // Keep reference next to current.
    async _updateCurrentFromNext() {
        if (this._current_renderer_asset !== null) {
            throw new Error("current asset must be closed before calling.");
        }
        if (this._next_renderer_asset === null) {
            throw new Error("next asset must be defined before calling.");
        }
        const asset = this._next_renderer_asset;
        this._next_renderer_asset = null;
        if (asset !== null
            && asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            await asset.play();
            if (this._map2_renderer_asset === null) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                }
                this._setMap1Asset(asset);
                this._setTransitionPercent(0);
            }
            this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
        }
        else {
            console.warn("WEB-RENDERER: current asset not ready.");
            this._readyState = HTMLMediaElement.HAVE_METADATA;
        }
        return asset;
    }
    _canPaintCurrent() {
        return this._current_renderer_asset !== null
            && this._current_renderer_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    }
    _paintCurrent(timestamp, remaining) {
        if (this._current_renderer_asset === null) {
            throw new Error("undefined current asset.");
        }
        this._current_renderer_asset.paint(timestamp, remaining);
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
    _closeCurrent() {
        if (this._current_renderer_asset === null) {
            return;
        }
        this._current_renderer_asset.pause();
        this._current_renderer_asset.unref();
        this._renderer_asset_trash.set(this._current_renderer_asset.asset_id, this._current_renderer_asset);
        this._current_renderer_asset = null;
    }
    _hasWaitingDuration() {
        return false;
    }
    _paintWaiting(_timestamp) { }
    _paintWaitingDuration(_timestamp, _remaining) { }
    _updateNext(decl) {
        const asset = this._resolveMediaAsset(decl);
        if (!asset.has_element
            && asset.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            asset.has_element = true;
            if (this.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
                this._readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
            }
        }
        return asset;
    }
    _isMediaReady(decl) {
        const path = this._asset_prefetch.getCachedPath(decl.href);
        return path !== null;
    }
    _resolveMediaAsset(decl) {
        const existing_asset = this._renderer_asset_cache.get(decl.asset_id);
        if (typeof existing_asset !== "undefined") {
            if (this._renderer_asset_trash.has(decl.asset_id)) {
                this._renderer_asset_trash.delete(decl.asset_id);
            }
            if (existing_asset.is_loading
                && existing_asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
                this._networkLoadingUnref();
                existing_asset.is_loading = false;
            }
            return existing_asset;
        }
        const cached_path = this._asset_prefetch.getCachedPath(decl.href);
        if (cached_path === null) {
            throw new Error(`Media asset not cached: ${decl.href}`);
        }
        const resolved_decl = {
            ...decl,
            href: cached_path,
        };
        const web_asset = this._asset_manager.createWebAsset(resolved_decl);
        const renderer_asset = new WebRendererAsset(decl.asset_id, web_asset);
        this._renderer_asset_cache.set(renderer_asset.asset_id, renderer_asset);
        this._networkLoadingRef();
        renderer_asset.is_loading = true;
        renderer_asset.load();
        return renderer_asset;
    }
    _canPaintNext() {
        return this._next_renderer_asset !== null
            && this._next_renderer_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    }
    _paintNext(timestamp, remaining) {
        if (this._next_renderer_asset === null) {
            throw new Error("undefined next asset.");
        }
        this._next_renderer_asset.paint(timestamp, remaining);
    }
    _closeNext() {
        if (this._next_renderer_asset === null) {
            throw new Error("undefined next asset.");
        }
        this._next_renderer_asset.unref();
        this._renderer_asset_trash.set(this._next_renderer_asset.asset_id, this._next_renderer_asset);
        this._next_renderer_asset = null;
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
const MAX_BACKOFF_TIMEOUT = 18 * 1000;
const MIN_BACKOFF_TIMEOUT = 3 * 1000;
const CONNECT_TIMEOUT = 30 * 1000;
const ELECTION_MIN_TIMEOUT = 1500;
const ELECTION_MAX_TIMEOUT = 3000;
const HEARTBEAT_INTERVAL = 500;
// a random integer between two values, inclusive
function backoff_timeout() {
    return Math.floor(Math.random() * (MAX_BACKOFF_TIMEOUT - MIN_BACKOFF_TIMEOUT + 1)) + MIN_BACKOFF_TIMEOUT;
}
class Peer {
    constructor(id) {
        this._id = id;
        this._channel = undefined;
    }
    get id() {
        return this._id;
    }
    get readyState() {
        if (typeof this._channel === "undefined") {
            return "new";
        }
        return this._channel.readyState;
    }
    set channel(channel) {
        this._channel = channel;
    }
    send(data) {
        if (this.readyState !== "open") {
            return;
        }
        try {
            this._channel?.send(data);
        }
        catch (e) {
            console.warn(e);
        }
    }
}
class RaftCluster {
    constructor(decl) {
        this.decl = decl;
        this._signaling_server_index = -1;
        this._peers = new Map();
        this._signaling_servers = decl.signalingServers;
        this._ws_onmessage_bound = (event) => this._ws_onmessage(event);
        this._ws_onerror_bound = (event) => this._ws_onerror(event);
        this._ws_onclose_bound = (event) => this._ws_onclose(event);
        this._rtc = new RTCMesh(decl);
        this._rtc.addEventListener('offer', (event) => {
            console.log(event);
            this._ws?.send(JSON.stringify({
                "cmd": "offer",
                "target": event.detail.id,
                "sdp": event.detail.sdp,
            }));
        });
        this._rtc.addEventListener('answer', (event) => {
            console.log(event);
            this._ws?.send(JSON.stringify({
                "cmd": "answer",
                "target": event.detail.id,
                "sdp": event.detail.sdp,
            }));
        });
        this._rtc.addEventListener('icecandidate', (event) => {
            console.log(event);
            this._ws?.send(JSON.stringify({
                "cmd": "icecandidate",
                "target": event.detail.id,
                "candidate": event.detail.candidate,
            }));
        });
        this._rtc.addEventListener('disconnected', (event) => {
            console.warn('RTC disconnected', event);
            this._ws?.send(JSON.stringify({
                "cmd": "disconnected",
                "target": event.detail.id,
                "candidate": event.detail.candidate,
            }));
        });
        this._rtc.addEventListener('failed', (event) => {
            console.warn('RTC failed', event);
            this._ws?.send(JSON.stringify({
                "cmd": "failed",
                "target": event.detail.id,
            }));
        });
        this._raft = new Raft({
            address: this._rtc.id,
            electionMinTimeout: ELECTION_MIN_TIMEOUT,
            electionMaxTimeout: ELECTION_MAX_TIMEOUT,
            heartbeatInterval: HEARTBEAT_INTERVAL,
        });
        for (const id of this._rtc.peers) {
            if (id === this._rtc.id) {
                continue;
            }
            const peer = new Peer(id);
            this._raft.join(id, data => peer.send(data));
            this._peers.set(id, peer);
        }
        this._rtc.addEventListener('addchannel', (event) => {
            console.log('RTC addchannel', event);
            const peer = this._peers.get(event.detail.id);
            if (typeof peer === "undefined") {
                return;
            }
            const channel = this._rtc.user_channel(peer.id);
            channel?.addEventListener('message', (event) => {
                this._raft.onRaftMessage(event.data, (data) => peer.send(data));
            });
            peer.channel = channel;
        });
        // §5.5: Follower and candidate crashes
        // Avoid direct failure by removing node from list, node recovery will rejoin
        // the list and update with the next hearbeat or election.
        this._rtc.addEventListener('removechannel', (event) => {
            console.log('RTC removechannel', event);
            const peer = this._peers.get(event.detail.id);
            if (typeof peer === "undefined") {
                return;
            }
            peer.channel = undefined;
        });
    }
    get leader() { return this._raft.leader; }
    join() {
        console.log('Raft Cluster: join');
        this._try_connect();
    }
    leave() {
        console.log('Raft Cluster: leave');
    }
    update(timestamp) {
        this._raft.update(timestamp);
    }
    broadcast(data) {
        if (this._raft.leader) {
            this._rtc.broadcast(data);
        }
    }
    addEventListener(type, listener) {
        this._rtc.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
        this._rtc.removeEventListener(type, listener);
    }
    _ws_close() {
        if (typeof this._ws_connect_timeout_id !== "undefined") {
            clearTimeout(this._ws_connect_timeout_id);
            this._ws_connect_timeout_id = undefined;
        }
        this._ws?.removeEventListener('message', this._ws_onmessage_bound);
        this._ws?.removeEventListener('error', this._ws_onerror_bound);
        this._ws?.removeEventListener('close', this._ws_onclose_bound);
        if (this._ws?.readyState !== WebSocket.CLOSED) {
            this._ws?.close(); // can raise onerror
        }
        this._ws = undefined;
    }
    _ws_onclose(event) {
        console.log('WS closed.', event);
        this._ws_close();
        this._schedule_reconnect();
    }
    // The error event is fired when a connection with a WebSocket has been closed due to an error.
    _ws_onerror(event) {
        console.log('WS error.', event);
        this._ws_close();
        this._schedule_reconnect();
    }
    _abort_connect() {
        console.warn("WS connect timeout, aborting.");
        this._ws_close();
        this._schedule_reconnect();
    }
    _ws_onmessage(event) {
        console.log(event);
        const json = JSON.parse(event.data);
        switch (json.cmd) {
            case 'offer':
                this._rtc.createAnswer(json.id, json.sdp);
                break;
            case 'negotiationneeded':
                this._rtc.createOffer(json.id);
                break;
            case 'answer':
                this._rtc.addAnswer(json.id, json.sdp);
                break;
            case 'disconnected':
            case 'failed':
                this._rtc.close(json.id)
                    .catch((e) => {
                    console.warn(e);
                })
                    .finally(() => {
                    this._ws?.send(JSON.stringify({
                        "cmd": "negotiationneeded",
                        "target": json.id,
                    }));
                });
                break;
            case 'icecandidate':
                this._rtc.addIceCandidate(json.id, json.candidate);
                break;
        }
    }
    _signaling_server() {
        this._signaling_server_index = (this._signaling_server_index + 1) % this._signaling_servers.length;
        return this._signaling_servers[this._signaling_server_index];
    }
    _try_connect() {
        if (typeof this._ws_reconnect_timeout_id !== "undefined") {
            clearTimeout(this._ws_reconnect_timeout_id);
            this._ws_reconnect_timeout_id = undefined;
        }
        try {
            const signaling_server = this._signaling_server();
            console.log(`WS connecting to ${signaling_server.url}`);
            this._ws = new WebSocket(`${signaling_server.url}?group=${this._rtc.label}&id=${this._rtc.id}`);
        }
        catch (e) {
            console.warn(e);
            this._ws = undefined;
            return;
        }
        this._ws_connect_timeout_id = setTimeout(this._abort_connect, CONNECT_TIMEOUT);
        this._ws.addEventListener('open', () => {
            console.log("WS connected.");
            if (typeof this._ws_connect_timeout_id !== "undefined") {
                clearTimeout(this._ws_connect_timeout_id);
                this._ws_connect_timeout_id = undefined;
            }
            for (const peer of this._rtc.peers) {
                if (peer === this._rtc.id) {
                    continue;
                }
                const readyState = this._rtc.readyState(peer);
                switch (readyState) {
                    case "open":
                        break;
                    case "connecting":
                    case "closing":
                        console.log(`WEBRTC ${peer} readyState ${readyState}`);
                        this._rtc.close(peer)
                            .catch((e) => {
                            console.warn(e);
                        })
                            .finally(() => {
                            this._ws?.send(JSON.stringify({
                                "cmd": "negotiationneeded",
                                "target": peer,
                            }));
                        });
                        break;
                    default:
                        console.log(`WEBRTC ${peer} readyState ${readyState}`);
                        this._ws?.send(JSON.stringify({
                            "cmd": "negotiationneeded",
                            "target": peer,
                        }));
                        break;
                }
            }
        });
        this._ws.addEventListener('message', this._ws_onmessage_bound);
        this._ws.addEventListener('error', this._ws_onerror_bound);
        this._ws.addEventListener('close', this._ws_onclose_bound);
    }
    _schedule_reconnect() {
        const delay = backoff_timeout();
        console.warn("WS reconnection in", delay / 1000, "s");
        this._ws_reconnect_timeout_id = setTimeout(() => {
            this._try_connect();
        }, delay);
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
class ServiceWorkerPrefetch extends EventTarget$1 {
    constructor() {
        super();
        this._activated = false;
        if ('serviceWorker' in navigator) {
            (async () => {
                await this._registerServiceWorker();
            })();
        }
        else {
            console.error("PREFETCH: ServiceWorker not supported.");
        }
    }
    async _registerServiceWorker() {
        console.log("PREFETCH: Registering service worker ...");
        if (navigator.serviceWorker.controller) {
            console.log(`PREFETCH: Currently controlled by:`, navigator.serviceWorker.controller);
        }
        else {
            console.log('PREFETCH: Not currently controlled by a service worker.');
        }
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log(`PREFETCH: Now controlled by:`, navigator.serviceWorker.controller);
        });
        // Note href not URL.
        const href = new URL('./prefetch.bundle.js', import.meta.url).href;
        const serviceWorkerOptions = {
            scope: '/',
            type: 'module',
        };
        const registration = await navigator.serviceWorker.register(href, serviceWorkerOptions);
        console.log(`PREFETCH: Service worker registration successful with scope: ${registration.scope}.`);
        registration.addEventListener('updatefound', () => {
            console.log("PREFETCH: Service worker updating ...");
        });
        if (registration.installing) {
            this._serviceWorker = registration.installing;
            console.log("PREFETCH: Service worker installing ...");
        }
        else if (registration.waiting) {
            this._serviceWorker = registration.waiting;
            console.log("PREFETCH: Service worker waiting ...");
        }
        else if (registration.active) {
            this._serviceWorker = registration.active;
            console.log("PREFETCH: Service worker active.");
            console.log(navigator.serviceWorker);
            this._onActivatedWorker();
        }
        if (typeof this._serviceWorker !== "undefined") {
            this._serviceWorker.addEventListener('statechange', (e) => {
                console.log(e);
                if (e.target === null) {
                    return;
                }
                if (!(e.target instanceof ServiceWorker)) {
                    return;
                }
                console.log(`PREFETCH: Service worker state change: ${e.target.state}.`);
            });
            navigator.serviceWorker.startMessages();
        }
    }
    async acquireSources(scope, sources) {
        console.log(`PREFETCH: setSources ${scope} ${JSON.stringify(sources)}`);
        if (!this._activated) {
            console.warn(`PREFETCH: Not activated.`);
            return;
        }
        if (typeof this._prefetch === "undefined") {
            console.warn(`PREFETCH: Comlink not available.`);
            return;
        }
        await this._prefetch.setSources(scope, sources);
    }
    async releaseSources(_scope) {
        // No-op, browser engine manages expiration LRU or similar.
    }
    // Simple pass-through.
    getCachedPath(origin) {
        return origin;
    }
    _onActivatedWorker() {
        console.log(`PREFETCH: _onActivatedWorker`);
        if (this._activated) {
            return;
        }
        if (typeof this._serviceWorker === "undefined") {
            return;
        }
        this._activated = true;
        console.log("PREFETCH: Service worker activated.");
        const channel = new MessageChannel();
        this._serviceWorker.postMessage(channel.port2, [channel.port2]);
        this._prefetch = Comlink.wrap(channel.port1);
        channel.port1.start();
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WebPlaylistElement = class WebPlaylistElement extends LitElement {
    static { this.styles = css `
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
			position: absolute;
			width: inherit;
			height: inherit;
		}
		:host > main > * {
			visibility: hidden;
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			object-fit: contain;
			object-position: center;
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
	`; }
    render() {
        return html `
			<style>
				:host {
					width: ${this.width}px;
					height: ${this.height}px;
				}
			</style>
			<slot></slot><main></main><section></section>
		`;
    }
    constructor() {
        super();
        this.src = "";
        this.src_recipe_id = "";
        this.src_asset_id = "";
        this.src_size = 0;
        this.src_hash = undefined;
        this.src_integrity = "";
        this.src_md5 = "";
        this.views = [];
        this.width = 0;
        this.height = 0;
        this.autoplay = false;
        this.playing = false;
        this._worker = this._createWorker();
        this._scheduler = Comlink.wrap(this._worker);
        this._renderer = new NullRenderer();
        this._channel = new MessageChannel();
        this._cluster = undefined;
    }
    // Helpers to access private fields in devtools.
    get debugScheduler() { return this._scheduler; }
    get debugRenderer() { return this._renderer; }
    get debugCluster() { return this._cluster; }
    _createWorker() {
        return new Worker(new URL('../dist/scheduler.bundle.js', import.meta.url).pathname, {
            type: 'module',
            credentials: 'omit',
            name: 'Scheduler', // Shown in debugger.
        });
    }
    // https://lit.dev/docs/components/lifecycle/#connectedcallback
    connectedCallback() {
        super.connectedCallback();
        console.log("PLAYLIST: connectedCallback");
    }
    // https://lit.dev/docs/components/lifecycle/#disconnectedcallback
    // Invoked when a component is removed from the document's DOM.
    // Closest ECMAScript equivalent to a destructor, however should have
    // a matching connectedCallback() if the element is added back to the
    // DOM.
    disconnectedCallback() {
        super.disconnectedCallback();
        console.log("PLAYLIST: disconnectedCallback");
        if (typeof this._raf_id !== "undefined") {
            window.cancelAnimationFrame(this._raf_id);
            this._raf_id = undefined;
        }
        if (typeof this._ric_id !== "undefined") {
            window.cancelIdleCallback(this._ric_id);
            this._ric_id = undefined;
        }
        this._scheduler[Comlink.releaseProxy]();
        this._worker.terminate();
        this._renderer.close();
    }
    _createRenderer(prefetchFactory = ServiceWorkerPrefetch) {
        if (this._section === null) {
            throw new Error("cannot find <section> element to attach to.");
        }
        if (this._main === null) {
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
    firstUpdated(changedProperties) {
        console.log("PLAYLIST: firstUpdated");
        console.log("PLAYLIST", changedProperties);
        try {
            this._renderer = this._createRenderer();
        }
        catch (e) {
            if (typeof e === "object") {
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
    updated(changedProperties) {
        console.log("PLAYLIST: updated");
        console.log(changedProperties);
        if (changedProperties.has('src')) {
            if (this.src.length !== 0
                && this.src_asset_id.length !== 0
                && this.src_size !== 0
                && typeof this.src_hash !== "undefined"
                && this.src_integrity.length !== 0
                && this.src_md5.length !== 0) {
                this._onSrc(this.src, this.src_asset_id, this.src_size, this.src_hash, this.src_integrity, this.src_md5);
                if (this.autoplay
                    && !this.playing
                    && this.width !== 0
                    && this.height !== 0) {
                    console.log(`PLAYLIST: Auto-playing ${this.src} (${this.src_asset_id})`);
                    this.play();
                }
            }
        }
        if (changedProperties.has('views')) {
            this._onViews(this.views);
        }
        if (changedProperties.has('width')
            || changedProperties.has('height')) {
            this._onSize(this.width, this.height);
        }
    }
    _onSrc(src, asset_id, size, hash, integrity, md5) {
        console.log(`PLAYLIST: onSrc: ${src} (${asset_id})`);
        (async () => {
            const url = new URL(this.src, window.location.href);
            await this._scheduler.setSource(url.toString(), asset_id, size, hash, integrity, md5);
        })();
    }
    _onViews(views) {
        console.log(`PLAYLIST: onViews: ${JSON.stringify(views)}`);
        this._renderer.setViews(views);
    }
    _onSize(width, height) {
        console.log(`PLAYLIST: onSize: ${width} ${height}`);
        this._renderer.setSize(width, height);
    }
    // Explicitly start playback if autoplay is false.
    async play() {
        if (this.playing) {
            return;
        }
        this._prepareNextFrame();
        this._prepareIdleCallback();
        await this._scheduler.play();
        this.playing = true;
    }
    // Connect the scheduler to the renderer.
    _connectSchedulerToRenderer(scheduler, renderer) {
        (async () => {
            await scheduler.setStatePort(Comlink.transfer(this._channel.port2, [this._channel.port2]));
            renderer.setSchedulerMessagePort(this._channel.port1);
        })();
    }
    // Connect the scheduler to the cluster.
    _connectRaftCluster(scheduler, renderer) {
        (async () => {
            const message_listener = (event) => {
                if (this._cluster?.leader) {
                    return;
                }
                const value = JSON.parse(event.detail);
                renderer.setStateUnhooked(value);
            };
            const set_state = (state) => {
                if (!this._cluster?.leader) {
                    return;
                }
                this._cluster?.broadcast(JSON.stringify(state));
                renderer.setStateUnhooked(state);
            };
            const join = (decl) => {
                this._cluster = new RaftCluster(decl);
                this._cluster.join();
                this._cluster.addEventListener('message', message_listener);
                renderer.setSetStateHook(set_state);
            };
            const leave = () => {
                if (this._cluster instanceof RaftCluster) {
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
    _renderOneFrame(timestamp) {
        this._raf_id = undefined;
        this._renderer.render(timestamp);
        this._prepareNextFrame();
    }
    _prepareNextFrame() {
        if (typeof this._raf_id !== "undefined") {
            window.cancelAnimationFrame(this._raf_id);
            this._raf_id = undefined;
        }
        this._raf_id = window.requestAnimationFrame((timestamp) => this._renderOneFrame(timestamp));
    }
    // REF: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
    // Called during a browser's idle periods, i.e. background or low
    // priority work.
    _idle(deadline) {
        this._ric_id = undefined;
        if (deadline.timeRemaining() > 0) {
            this._renderer.idle();
            // Step the cluster state engine, if enabled.
            if (this._cluster instanceof RaftCluster) {
                const timestamp = performance.now();
                this._cluster.update(timestamp);
            }
        }
        this._prepareIdleCallback();
    }
    // REF: https://en.wikipedia.org/wiki/Nyquist_frequency
    // Maximum interval set to half the Raft heartbeat.
    _prepareIdleCallback() {
        if (typeof this._ric_id !== "undefined") {
            window.cancelIdleCallback(this._ric_id);
            this._ric_id = undefined;
        }
        this._ric_id = window.requestIdleCallback((deadline) => this._idle(deadline), { timeout: 250 });
    }
};
__decorate$3([
    property({ type: String, reflect: true })
], WebPlaylistElement.prototype, "src", void 0);
__decorate$3([
    property({ attribute: 'src-recipe-id', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_recipe_id", void 0);
__decorate$3([
    property({ attribute: 'src-asset-id', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_asset_id", void 0);
__decorate$3([
    property({ attribute: 'src-size', type: Number, reflect: true })
], WebPlaylistElement.prototype, "src_size", void 0);
__decorate$3([
    property({ attribute: 'src-hash', type: Object, reflect: true })
], WebPlaylistElement.prototype, "src_hash", void 0);
__decorate$3([
    property({ attribute: 'src-integrity', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_integrity", void 0);
__decorate$3([
    property({ attribute: 'src-md5', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_md5", void 0);
__decorate$3([
    property({ type: Array, reflect: false })
], WebPlaylistElement.prototype, "views", void 0);
__decorate$3([
    property({ type: Number, reflect: false })
], WebPlaylistElement.prototype, "width", void 0);
__decorate$3([
    property({ type: Number, reflect: false })
], WebPlaylistElement.prototype, "height", void 0);
__decorate$3([
    property({ type: Boolean, reflect: true })
], WebPlaylistElement.prototype, "autoplay", void 0);
__decorate$3([
    query('main')
], WebPlaylistElement.prototype, "_main", void 0);
__decorate$3([
    query('section')
], WebPlaylistElement.prototype, "_section", void 0);
__decorate$3([
    state()
], WebPlaylistElement.prototype, "playing", void 0);
WebPlaylistElement = __decorate$3([
    customElement('web-play-list')
], WebPlaylistElement);

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
const fs = require('fs');
const AssetPool = require("@brightsign/assetpool");
const AssetPoolFiles = require("@brightsign/assetpoolfiles");
const AssetFetcher = require("@brightsign/assetfetcher");
const BRIGHTSIGN_STORAGE_PATH = "/storage/sd/";
const BRIGHTSIGN_POOL_PATH = `${BRIGHTSIGN_STORAGE_PATH}/p`;
class BrightSignPrefetch extends EventTarget {
    #map = new Map();
    #pool;
    #files;
    #is_configured = false;
    constructor() {
        super();
        try {
            fs.mkdirSync(BRIGHTSIGN_POOL_PATH);
            console.log(`PREFETCH: Created BrightSign AssetPool(${BRIGHTSIGN_POOL_PATH})`);
        }
        catch (e) {
            // Error: EEXIST: file already exists, mkdir '/storage/sd//p'
            // {"errno":-17,"syscall":"mkdir","code":"EEXIST","path":"/storage/sd//p"}
            if (e.code !== 'EEXIST') {
                console.warn(e);
                console.warn(JSON.stringify(e));
                throw e;
            }
            console.log(`PREFETCH: Using BrightSign AssetPool(${BRIGHTSIGN_POOL_PATH})`);
        }
        this.#pool = new AssetPool(BRIGHTSIGN_POOL_PATH);
    }
    // Use space as available reserving 128MB free.
    async #configurePool() {
        await this.#pool.reserveStorage(128 * 1024 * 1024);
        this.#is_configured = true;
    }
    async #fetchAssets(pool, assets) {
        //		console.log(`PREFETCH: #fetchAssets: ${JSON.stringify(assets.map(asset => asset.name))}`);
        console.log(`PREFETCH: #fetchAssets ...`);
        const fetcher = new AssetFetcher(pool);
        fetcher.addEventListener("fileevent", (event) => {
            // This is called each time the fetcher has finished trying to
            // download an asset, whether successful or not. It is not
            // called for any assets that are already in the pool.
            console.log(`PREFETCH: ${event.fileName}: complete: ${event.responseCode.toString()} ${event.error}`);
        });
        function progressString(event) {
            if (typeof event.currentFileTotal === "undefined") {
                // If the size of the asset was not specified in the asset collection, then the total size may not be reported
                // during the fetch.
                return `${event.currentFileTransferred.toString()} of unknown`;
            }
            else {
                const percent = (100 * event.currentFileTransferred / event.currentFileTotal).toFixed(0);
                return `${event.currentFileTransferred.toString()} of ${event.currentFileTotal.toString()} ${percent}%`;
            }
        }
        fetcher.addEventListener("progressevent", (event) => {
            // This is called at approximately the progress interval
            // specified in the options to indicate how far through the
            // download
            console.log(`PREFETCH: ${event.fileName}: progress: ${progressString(event)}`);
        });
        const fetchOptions = {
            // receive asset progress events about every five seconds.
            progressInterval: 5,
            // try to download each asset three times before giving up.
            fileRetryCount: 3,
            // Give up if we fail to download at least 1024 bytes in each
            // ten second period.
            minimumTransferRate: { bytesPerSecond: 1024, periodInSeconds: 10 },
        };
        try {
            await fetcher.start(assets, fetchOptions);
        }
        catch (e) {
            console.log(`PREFETCH: Fetcher failed: ${e.message}`);
            throw (e);
        }
        console.log(`PREFETCH: #fetchAssets done.`);
    }
    // Protect API to limit space reclamation without time priority.
    async acquireSources(scope, sources) {
        console.log(`PREFETCH: acquireSources ${scope} ${JSON.stringify(sources)}`);
        if (!this.#is_configured) {
            await this.#configurePool();
        }
        const assets = sources.map(source => {
            return {
                name: source.asset_id,
                size: source.size,
                hash: source.hash,
                link: source.href,
                change_hint: source.integrity,
            };
        });
        console.log(`PREFETCH: Protecting assets ...`);
        await this.#pool.protectAssets(scope, assets);
        console.log(`PREFETCH: Protecting assets done.`);
        await this.#fetchAssets(this.#pool, assets);
        if (!await this.#pool.areAssetsReady(assets)) {
            throw new Error("Assets not ready");
        }
        this.#files = new AssetPoolFiles(this.#pool, assets);
        for (const asset of assets) {
            const local = await this.#getPath(asset.name);
            this.#map.set(asset.link, local);
            console.info(`${local} -> ${asset.link}`);
        }
        console.log(`PREFETCH: acquireSources done.`);
    }
    async releaseSources(scope) {
        await this.#pool.unprotectAssets(scope);
    }
    // Translate origin URLs to local assets on persistent storage.
    async #getPath(origin) {
        const file_path = await this.#files.getPath(origin);
        return file_path.replace(BRIGHTSIGN_STORAGE_PATH, "file:///sd:/");
    }
    getCachedPath(origin) {
        return this.#map.get(origin) || "";
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let BrightSignPlaylistElement = class BrightSignPlaylistElement extends WebPlaylistElement {
    // Override the renderer to use BrightSign compatible asset prefetcher.
    _createRenderer() {
        return super._createRenderer(BrightSignPrefetch);
    }
};
BrightSignPlaylistElement = __decorate$2([
    customElement('brightsign-play-list')
], BrightSignPlaylistElement);

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
const shader = (strings, ...values) => {
    const shaderText = values.reduce((acc, v, idx) => acc + v + strings[idx + 1], strings[0]);
    return shaderText?.replace(/^\s+#/, '#');
};

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
class AbstractThreeAsset extends EventTarget {
    constructor(src, params, duration, collection) {
        super();
        this.collection = collection;
        this.texture = null;
        this._ended = false;
        this._error = null;
        this._networkState = HTMLMediaElement.NETWORK_NO_SOURCE;
        this._paused = true;
        this._readyState = HTMLMediaElement.HAVE_NOTHING;
        const url = new URL(src, self.location.href);
        this._src = url.href;
        if (this._src.length !== 0) {
            this._networkState = HTMLMediaElement.NETWORK_EMPTY;
        }
        this._params = params;
        this._duration = duration;
    }
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
    get srcObject() { return null; }
    // Per `HTMLVideoElement`.
    get height() { return 0; }
    get width() { return 0; }
}
// super must be used to call functions only, operation is undefined when
// accessing variables that are not hidden behind getters and setters.
class ThreeImageAsset extends AbstractThreeAsset {
    constructor(src, params, duration, collection) {
        super(src, params, duration, collection);
        this._startTime = NaN;
        this._lastTimeUpdate = 0;
        this._currentTime = 0;
    }
    get image() {
        return this.texture?.image || null;
    }
    close() {
        if (this.texture === null || this.image === null) {
            return;
        }
        console.log(`unload image ... "${this.src}"`);
        this.pause();
        const collection = this.collection;
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
    paint(now, _remaining) {
        if (this.paused || this.ended)
            return;
        const elapsed = (now - this._startTime) / 1000;
        this._currentTime += elapsed;
        if (this._currentTime > this._duration) {
            this._setEndedState();
        }
        else {
            if (Math.floor(this._currentTime) > this._lastTimeUpdate) {
                this._lastTimeUpdate = this._currentTime;
                this.dispatchEvent(new Event('timeupdate'));
            }
        }
    }
    _setEndedState() {
        this._currentTime = this._duration;
        this._ended = true;
        this._startTime = NaN;
        this.dispatchEvent(new Event('ended'));
    }
    get params() { return super.params; }
    // Per HTMLMediaElement.
    get currentSrc() { return super.currentSrc; }
    get currentTime() { return this._currentTime; }
    get duration() { return super.duration; }
    get ended() { return super.ended; }
    get error() { return super.error; }
    get networkState() { return super.networkState; }
    get paused() { return super.paused; }
    get readyState() { return super.readyState; }
    get src() { return super.src; }
    get srcObject() { return null; }
    load() {
        (async () => {
            const collection = this.collection;
            const img = collection.acquire();
            this._networkState = HTMLMediaElement.NETWORK_LOADING;
            try {
                console.log(`load image ... "${this.src}"`);
                img.crossOrigin = 'anonymous';
                img.setAttribute('src', this.src);
                await img.decode();
                this.texture = new THREE.Texture(img);
                this.texture.needsUpdate = true;
                this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA;
                super.dispatchEvent(new Event('canplay'));
            }
            catch (encodingError) {
                console.warn(`Failed to load image: "${this.src}" Error: ${encodingError}`);
                this._error = encodingError;
                this._networkState = HTMLMediaElement.NETWORK_IDLE;
                collection.release(img);
                super.dispatchEvent(new Event('error'));
            }
        })();
    }
    pause() {
        if (this._paused)
            return;
        this._paused = true;
    }
    async play() {
        this._paused = false;
        if (this._ended) {
            this._ended = false;
            this._currentTime = 0;
        }
        if (isNaN(this._startTime)) {
            this._startTime = performance.now() - this._currentTime;
        }
    }
    // Per `HTMLVideoElement`.
    get height() {
        if (this.image === null) {
            return NaN;
        }
        return this.image.height;
    }
    get width() {
        if (this.image === null) {
            return NaN;
        }
        return this.image.width;
    }
}
class ThreeVideoAsset extends AbstractThreeAsset {
    constructor(src, params, duration, collection) {
        super(src, params, duration, collection);
        this._redispatchEvent = (event) => {
            super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
        };
    }
    get video() {
        return this.texture?.image || null;
    }
    close() {
        if (this.texture === null || this.video === null) {
            return;
        }
        console.log(`unload video ... "${this.src}"`);
        this.pause();
        const collection = this.collection;
        const video = this.video;
        video.oncanplay = null;
        video.onended = null;
        video.onerror = null;
        video.onloadeddata = null;
        video.removeAttribute('src');
        collection.release(video);
        this.texture.dispose();
        this.texture = null;
    }
    paint(_now, _remaining) { }
    get params() { return super.params; }
    // Per `HTMLMediaElement`.
    get currentSrc() {
        if (this.video === null) {
            return super.currentSrc;
        }
        return this.video.currentSrc;
    }
    get currentTime() {
        if (this.video === null) {
            return super.currentTime;
        }
        return this.video.currentTime;
    }
    get duration() {
        if (this.video === null) {
            return NaN;
        }
        return this.video.duration;
    }
    get ended() {
        if (this.video === null) {
            return false;
        }
        return this.video.ended;
    }
    get error() {
        if (this.video === null) {
            return false;
        }
        return this.video.error;
    }
    get networkState() {
        if (this.video === null) {
            return HTMLMediaElement.NETWORK_EMPTY;
        }
        return this.video.networkState;
    }
    get paused() {
        if (this.video === null) {
            return true;
        }
        return this.video.paused;
    }
    get readyState() {
        if (this.video === null) {
            return HTMLMediaElement.HAVE_NOTHING;
        }
        return this.video.readyState;
    }
    get src() { return super.src; }
    get srcObject() {
        if (this.video === null) {
            return null;
        }
        return this.video.srcObject;
    }
    load() {
        const collection = this.collection;
        const video = collection.acquire();
        video.oncanplay = this._redispatchEvent;
        video.onended = this._redispatchEvent;
        video.onerror = this._redispatchEvent;
        // Avoid "WebGL: INVALID_VALUE: texImage2D: no video".
        video.onloadeddata = (event) => {
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
        }
        catch (encodingError) {
            collection.release(video);
            throw encodingError;
        }
    }
    pause() {
        if (this.video === null) {
            return;
        }
        this.video.pause();
    }
    async play() {
        if (this.video === null) {
            return;
        }
        await this.video.play();
    }
    // Per `HTMLVideoElement`.
    get height() {
        if (this.video === null) {
            return NaN;
        }
        return this.video.height;
    }
    get width() {
        if (this.video === null) {
            return NaN;
        }
        return this.video.width;
    }
}
class ThreeAppAsset extends AbstractThreeAsset {
    constructor(src, params, duration, collection) {
        super(src, params, duration, collection);
        this._app = null;
        this._fbo = null;
        this._redispatchEvent = (event) => {
            super.dispatchEvent(new Event(event instanceof Event ? event.type : event));
        };
    }
    close() {
        if (this.texture === null) {
            return;
        }
        console.log(`unload app ... "${this.src}"`);
        this.pause();
        const collection = this.collection;
        if (this._app !== null) {
            this._app.close();
            this._app.removeEventListener('canplay', this._redispatchEvent);
            this._app.removeEventListener('ended', this._redispatchEvent);
            this._app.removeEventListener('error', this._redispatchEvent);
            this._app = null;
        }
        if (this._fbo !== null) {
            collection.release(this._fbo);
            this._fbo = null;
        }
        this.texture.dispose();
        this.texture = null;
    }
    paint(now, remaining) {
        if (this.paused || this.ended)
            return;
        if (this._app === null) {
            return;
        }
        this._app.animate(now, remaining);
    }
    get params() { return super.params; }
    // Per `HTMLMediaElement`.
    get currentSrc() {
        if (this._app === null) {
            return super.currentSrc;
        }
        return this._app.currentSrc;
    }
    get currentTime() {
        if (this._app === null) {
            return super.currentTime;
        }
        return this._app.currentTime;
    }
    get duration() {
        if (this._app === null) {
            return NaN;
        }
        return this._app.duration;
    }
    get ended() {
        if (this._app === null) {
            return false;
        }
        return this._app.ended;
    }
    get error() {
        if (this._app === null) {
            return false;
        }
        return this._app.error;
    }
    get networkState() {
        if (this._app === null) {
            return HTMLMediaElement.NETWORK_EMPTY;
        }
        return this._app.networkState;
    }
    get paused() {
        if (this._app === null) {
            return true;
        }
        return this._app.paused;
    }
    get readyState() {
        if (this._app === null) {
            return HTMLMediaElement.HAVE_NOTHING;
        }
        return this._app.readyState;
    }
    get src() { return super.src; }
    get srcObject() { return super.srcObject; }
    load() {
        (async () => {
            const collection = this.collection;
            const fbo = this._fbo = collection.acquire();
            try {
                console.log(`import module ... "${this.src}"`);
                const manifest = await collection.importModule(this.src);
                console.log(`create WebGLApp ... "${this.src}"`);
                const params = {
                    ...this.params,
                    src: this.src,
                    duration: super.duration, // WARNING: `super` not `this`.
                };
                const app = this._app = manifest.WebGLApp.create(fbo, collection.renderer, params);
                app.addEventListener('canplay', this._redispatchEvent);
                app.addEventListener('ended', this._redispatchEvent);
                app.addEventListener('error', this._redispatchEvent);
                this.texture = fbo.texture;
                console.log(`init "${manifest.name}" with params:`, params);
                app.load();
            }
            catch (initError) {
                console.warn(`Failed to load app: "${this.src}"`, initError);
                collection.release(fbo);
                super.dispatchEvent(new Event('error'));
            }
        })();
    }
    pause() {
        if (this._app === null) {
            return;
        }
        this._app.pause();
    }
    async play() {
        if (this._app === null) {
            return;
        }
        await this._app.play();
    }
    // Per `HTMLVideoElement`.
    get height() {
        if (this._app === null) {
            return NaN;
        }
        return this._app.height;
    }
    get width() {
        if (this._app === null) {
            return NaN;
        }
        return this._app.width;
    }
}
class ThreeCollection {
    constructor(renderRoot) {
        this.renderRoot = renderRoot;
    }
}
class ThreeImageCollection extends ThreeCollection {
    constructor(renderRoot) {
        super(renderRoot);
        this._images = [];
    }
    // TSC forces pop() to return undefined even if length is checked.
    acquire() {
        let img = this._images.pop();
        if (typeof img === "undefined") {
            img = new Image();
        }
        return img;
    }
    createThreeAsset(src, params, duration) {
        return new ThreeImageAsset(src, params, duration, this);
    }
    release(img) {
        img.removeAttribute('src');
        this._images.push(img);
    }
    clear() {
        this._images = [];
    }
}
class ThreeVideoCollection extends ThreeCollection {
    constructor(renderRoot) {
        super(renderRoot);
        this._videos = [];
    }
    acquire() {
        let video = this._videos.pop();
        if (typeof video === "undefined") {
            video = document.createElement('video');
            video.autoplay = false;
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto'; // The video will be played soon.
            // Video must be within DOM to playback.
            this.renderRoot.appendChild(video);
        }
        return video;
    }
    createThreeAsset(src, params, _duration) {
        return new ThreeVideoAsset(src, params, NaN, this);
    }
    release(video) {
        if (!video.paused) {
            video.pause();
        }
        video.removeAttribute('src');
        this._videos.push(video);
    }
    clear() {
        for (const video of this._videos) {
            this.renderRoot.removeChild(video);
        }
        this._videos = [];
    }
}
class ThreeAppCollection extends ThreeCollection {
    constructor(renderRoot, renderer) {
        super(renderRoot);
        this.renderer = renderer;
        this._manifests = new Map();
        this._fbos = [];
    }
    acquire() {
        let fbo = this._fbos.pop();
        if (typeof fbo === "undefined") {
            const width = 1024; // * this.renderer.getPixelRatio();
            const height = 1024; // * this.renderer.getPixelRatio();
            fbo = new THREE.WebGLRenderTarget(width, height, {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                depthBuffer: false,
                stencilBuffer: false,
            });
        }
        return fbo;
    }
    async importModule(src) {
        let manifest = this._manifests.get(src);
        if (typeof manifest === 'undefined') {
            console.log(`import app manifest ... "${src}"`);
            const module = await import(src);
            console.log(`validate app manifest ... "${src}"`);
            const result = AppManifestSchema.safeParse(module.default);
            console.log(`app manifest validation result: ${result.success} ... "${src}"`);
            if (!result.success) {
                throw new Error(`Invalid app manifest: "${src}"`);
            }
            if (!result.data.WebGLApp) {
                throw new Error(`WebGLApp constructor not found in manifest: "${src}"`);
            }
            manifest = result.data;
            this._manifests.set(src, manifest);
        }
        return manifest;
    }
    createThreeAsset(src, params, duration) {
        return new ThreeAppAsset(src, params, duration, this);
    }
    release(fbo) {
        this._fbos.push(fbo);
    }
    clear() {
        for (const fbo of this._fbos) {
            fbo.dispose();
        }
        this._fbos = [];
        this._manifests.clear();
    }
}
class ThreeAssetManager {
    constructor() {
        this._collection = new Map();
    }
    setAssetTarget(renderTarget) {
        this._renderTarget = renderTarget;
    }
    setRenderer(renderer) {
        this._renderer = renderer;
    }
    _createCollection(renderTarget, renderer) {
        // TypeScript assumes iterator of first type.
        const collection = new Map([
            ['HTMLImageElement', new ThreeImageCollection(renderTarget)],
            ['HTMLVideoElement', new ThreeVideoCollection(renderTarget)],
            ['CustomElement', new ThreeAppCollection(renderTarget, renderer)],
        ]);
        return collection;
    }
    // decl: { type, href }
    // Returns: asset.
    createThreeAsset(decl) {
        console.log(`createThreeAsset: ${decl['@type']} ${decl.href} (${decl.duration}s)`);
        if (this._collection.size === 0) {
            if (typeof this._renderTarget === "undefined") {
                throw new Error("undefined render target.");
            }
            if (typeof this._renderer === "undefined") {
                throw new Error("undefined renderer.");
            }
            this._collection = this._createCollection(this._renderTarget, this._renderer);
        }
        const collection = this._collection.get(decl['@type']);
        if (typeof collection === "undefined") {
            throw new Error('Undefined collection.');
        }
        return collection.createThreeAsset(decl.href, decl.params, decl.duration);
    }
    clear() {
        for (const value of this._collection.values()) {
            value.clear();
        }
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
class WebGLRendererAsset {
    constructor(asset_id, webgl_asset) {
        this.asset_id = asset_id;
        this.webgl_asset = webgl_asset;
        this.is_loading = false;
        this.has_texture = false;
        this.end_time = NaN;
        this._ref_count = 0;
    }
    get paused() { return this.webgl_asset.paused; }
    get ended() { return this.webgl_asset.ended; }
    get error() { return this.webgl_asset.error; }
    get readyState() { return this.webgl_asset.readyState; }
    get networkState() { return this.webgl_asset.networkState; }
    get texture() { return this.webgl_asset.texture; }
    get currentSrc() { return this.webgl_asset.currentSrc; }
    get currentTime() { return this.webgl_asset.currentTime; }
    load() {
        if (this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
            return;
        }
        if (this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
            return;
        }
        try {
            this.webgl_asset.load();
        }
        catch (error) {
            console.error(`WEGBL-ASSET: ${error}`);
        }
    }
    async play() {
        await this.webgl_asset.play();
    }
    paint(now, remaining) {
        this.webgl_asset.paint(now, remaining);
    }
    pause() {
        this.webgl_asset.pause();
    }
    close() {
        this.webgl_asset.close();
    }
    get ref_count() { return this._ref_count; }
    ref() {
        this._ref_count++;
    }
    unref() {
        this._ref_count--;
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
// REF: http://jsfiddle.net/unLSJ/
function replacer(_match, pIndent, pKey, pVal, pEnd) {
    const key = '<span class=json-key>';
    const val = '<span class=json-value>';
    const str = '<span class=json-string>';
    let r = pIndent || '';
    if (pKey) {
        r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
    }
    if (pVal) {
        r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
    }
    return r + (pEnd || '');
}
function prettyPrint(obj) {
    const jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
    return JSON.stringify(obj, null, 3)
        .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(jsonLine, replacer);
}
function minimize(value) {
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
class WebGLRenderer extends EventTarget {
    static { this.vertexShader = shader `
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
	`; }
    static { this.fragmentShader = shader `
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
	`; }
    constructor(prefetchFactory) {
        super();
        this._asset_manager = new ThreeAssetManager();
        this._scene = new THREE.Scene();
        this._views = [];
        this._displacement_url = "";
        this._transition_percent = 0;
        this._transition_percent_speed = 0;
        this._displacement_texture = new THREE.Texture();
        this._empty_texture = new THREE.Texture();
        this._network_loading_count = 0;
        this._current_renderer_asset = null;
        this._next_renderer_asset = null;
        this._shader = new THREE.RawShaderMaterial({
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
            glslVersion: THREE.GLSL3,
        });
        this._map1_renderer_asset = null;
        this._map2_renderer_asset = null;
        this._renderer_asset_cache = new Map();
        this._renderer_asset_trash = new Map();
        // Per HTMLMediaElement.
        this._ended = false;
        this._error = null;
        this._networkState = HTMLMediaElement.NETWORK_EMPTY;
        this._paused = true;
        this._readyState = HTMLMediaElement.HAVE_NOTHING;
        this._debug = document.createElement('div');
        this._lastDebug = "";
        // on requestAnimationFrame() callback.
        this._previousTimestamp = 0;
        this._asset_prefetch = new prefetchFactory();
        {
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
        if (typeof this._renderer === "undefined") {
            throw new Error("undefined renderer.");
        }
        this._asset_manager.setRenderer(this._renderer);
        console.groupEnd();
    }
    close() {
        console.log("WEBGL-RENDERER: close");
        for (const asset of this._renderer_asset_cache.values()) {
            asset.pause();
            asset.close();
        }
        this._renderer_asset_cache.clear();
    }
    setSetStateHook(cb) {
        this._set_state_hook = cb;
    }
    clearSetStateHook() {
        this._set_state_hook = undefined;
    }
    setSchedulerMessagePort(scheduler) {
        console.log("WEBGL-RENDERER: setSchedulerMessagePort", scheduler);
        Comlink.expose({
            setState: (value) => this.setState(value),
            setSources: async (scope, decls) => {
                return await this.setSources(scope, decls.map(decl => {
                    return {
                        '@type': decl['@type'],
                        asset_id: decl.asset_id,
                        href: decl.href,
                        size: decl.size,
                        hash: decl.hash,
                        md5: decl.md5,
                        integrity: decl.integrity,
                    };
                }));
            },
        }, scheduler);
    }
    // Called by Scheduler or via Cluster as a follower.  This API receives
    // the near and immediate scheduling state to render the current and
    // next media asset, including the transition between the two.
    async setState(value) {
        // In a cluster we need to forward the state to all nodes
        // before we can process.
        if (typeof this._set_state_hook !== "undefined") {
            this._set_state_hook(value);
            return;
        }
        await this.setStateUnhooked(value);
    }
    async setStateUnhooked(value) {
        {
            const html = prettyPrint(minimize(value));
            if (html !== this._lastDebug) {
                this._debug.innerHTML = this._lastDebug = html;
            }
        }
        await this._onSchedulerCurrent(value.mediaCurrent);
        this._onSchedulerNext(value.mediaNext);
        await this._onSchedulerTransition(value.transition);
    }
    setAssetTarget(assetTarget) {
        console.log("WEBGL-RENDERER: setAssetTarget", assetTarget);
        this._asset_manager.setAssetTarget(assetTarget);
    }
    setRenderTarget(renderTarget) {
        console.log("WEBGL-RENDERER: setRenderTarget", renderTarget);
        if (typeof this._renderer === "undefined") {
            throw new Error("ThreeJS renderer not defined.");
        }
        renderTarget.appendChild(this._renderer.domElement);
    }
    setPixelRatio(value) {
        console.log("WEBGL-RENDERER: setPixelRatio", value);
        if (typeof this._renderer === "undefined") {
            throw new Error("ThreeJS renderer not defined.");
        }
        this._renderer.setPixelRatio(value);
    }
    setSize(width, height) {
        console.log("WEBGL-RENDERER: setSize", width, height);
        if (typeof this._renderer === "undefined") {
            throw new Error("ThreeJS renderer not defined.");
        }
        this._renderer.setSize(width, height);
        const near = 0.1;
        const far = 10000;
        const z = 2000;
        this._camera = this._createThreeJSCamera(1, 1, near, far, z);
    }
    setViews(views) {
        console.log("WEBGL-RENDERER: setViews", views);
        this._views = views;
    }
    async setSources(scope, sources) {
        console.log("WEBGL-RENDERER: setSources", scope, sources);
        await this._asset_prefetch.acquireSources(scope, sources);
    }
    _createMesh(material, displacement_texture) {
        console.log("WEBGL-RENDERER: _createMesh", material, displacement_texture);
        const mesh = this._meshFrom(material, 0, 1, 0, 1, 1, 1);
        this._shader.uniforms.displacement.value = displacement_texture;
        console.log('WEBGL-RENDERER: Created new mesh', mesh);
        return mesh;
    }
    _initTexture(texture) {
        console.log("WEBGL-RENDERER: _initTexture", texture);
        if (texture instanceof THREE.Texture) {
            // Force GPU upload.
            this._renderer?.initTexture(texture);
        }
    }
    _isEmptyTexture(texture) {
        return texture.uuid === this._empty_texture.uuid;
    }
    render(timestamp) {
        //		console.log('update', timestamp);
        const elapsed = timestamp - this._previousTimestamp;
        this._previousTimestamp = timestamp;
        if (typeof this._renderer === "undefined") {
            throw new Error("ThreeJS renderer not defined.");
        }
        if (typeof this._camera === "undefined") {
            throw new Error("ThreeJS camera not defined.");
        }
        if (this._canPaintCurrent()) {
            if (this._current_renderer_asset === null) {
                throw new Error("current asset is null.");
            }
            const remaining = this._current_renderer_asset.end_time - timestamp;
            try {
                this._paintCurrent(timestamp, remaining);
            }
            catch (ex) {
                console.error(ex);
                console.error(this._current_renderer_asset);
            }
        }
        else if (this._hasWaitingDuration()) {
            if (this._current_renderer_asset === null) {
                throw new Error("current asset is null.");
            }
            const remaining = this._current_renderer_asset.end_time - timestamp;
            this._paintWaitingDuration(timestamp, remaining);
        }
        else {
            this._paintWaiting(timestamp);
        }
        if (this._canPaintNext()) {
            if (this._next_renderer_asset === null) {
                throw new Error("next asset is null.");
            }
            const remaining = this._next_renderer_asset.end_time - timestamp;
            try {
                this._paintNext(timestamp, remaining);
            }
            catch (ex) {
                console.error(ex);
                console.error(this._next_renderer_asset);
            }
        }
        this._interpolateTransition(elapsed);
        this._renderer.setScissorTest(true);
        const size = this._renderer.getSize(new THREE.Vector2());
        for (const view of this._views) {
            this._renderer.setViewport(view.x, view.y, view.width, view.height);
            this._renderer.setScissor(view.x, view.y, view.width, view.height);
            this._camera.setViewOffset(size.width, size.height, view.left, view.top, view.width, view.height);
            this._renderer.render(this._scene, this._camera);
        }
        this._renderer.setScissorTest(false);
    }
    // on requestIdleCallback() callback.
    idle() {
        this._emptyAssetTrash();
    }
    _setTransitionPercent(percent) {
        this._shader.uniforms.pct.value = this._transition_percent = percent;
    }
    _interpolateTransition(elapsed) {
        let needs_update = false;
        if (this._transition_percent_speed !== 0) {
            this._transition_percent += (this._transition_percent_speed * elapsed) / 1000;
            if (this._transition_percent > 1) {
                this._transition_percent = 1;
                this._transition_percent_speed = 0;
            }
            this._setTransitionPercent(this._transition_percent);
            needs_update = true;
        }
        if (needs_update) {
            this._shader.uniformsNeedUpdate = true;
        }
    }
    _initThreeJSRenderer() {
        console.log("WEBGL-RENDERER: _initThreeJSRenderer");
        this._renderer = this._createThreeJSRenderer();
    }
    _createThreeJSRenderer() {
        console.log("WEBGL-RENDERER: _createThreeJSRenderer");
        const canvas = document.createElement('canvas');
        const context = canvas.getContext("webgl2", {
            alpha: true,
            antialias: true, // Significant performance cost with WebGLRenderTarget.
            desynchronized: false,
            powerPreference: 'high-performance',
        });
        if (context === null) {
            throw new Error('Failed to obtain canvas context.');
        }
        const renderer = new THREE.WebGLRenderer({ canvas, context });
        return renderer;
    }
    _createThreeJSCamera(width, height, near, far, z) {
        console.log("WEBGL-RENDERER: _createThreeJSCamera", width, height, near, far, z);
        const camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, near, far);
        camera.position.z = z;
        return camera;
    }
    async _fetchImage(url) {
        console.log("WEBGL-RENDERER: _fetchImage", url);
        const img = await new Promise((resolve, reject) => {
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
    async _onSchedulerCurrent(current) {
        if (current !== null) {
            if (!this._isMediaReady(current.decl)) {
                return;
            }
            if (this._current_renderer_asset === null) {
                //console.info(current.decl.href, current.remainingTimeMs);
                this._current_renderer_asset = await this._updateCurrent(current.decl);
                this._current_renderer_asset.end_time = (typeof current.remainingTimeMs === "number") ?
                    (current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._current_renderer_asset.ref();
                console.log("WEBGL-RENDERER: current", this._current_renderer_asset.currentSrc);
            }
            else if (current.decl.asset_id !== this._current_renderer_asset.asset_id) {
                //console.info(current.decl.href, current.remainingTimeMs);
                this._closeCurrent();
                if (this._next_renderer_asset !== null
                    && current.decl.asset_id === this._next_renderer_asset.asset_id) {
                    console.log("WEBGL-RENDERER: current <- next");
                    this._current_renderer_asset = await this._updateCurrentFromNext();
                }
                else {
                    this._current_renderer_asset = await this._updateCurrent(current.decl);
                }
                this._current_renderer_asset.end_time = (typeof current.remainingTimeMs === "number") ?
                    (current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._current_renderer_asset.ref();
                console.log("WEBGL-RENDERER: current", this._current_renderer_asset.currentSrc);
            }
            else if (this._current_renderer_asset !== null) {
                this._current_renderer_asset = await this._updateCurrent(current.decl);
                this._current_renderer_asset.end_time = (typeof current.remainingTimeMs === "number") ?
                    (current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
            }
            if (this._current_renderer_asset === null) {
                throw new Error("current asset is null.");
            }
        }
        else if (this._current_renderer_asset !== null) {
            this._closeCurrent();
            console.log(`WEBGL-RENDERER: current null`);
        }
    }
    _onSchedulerNext(next) {
        // Next media asset.
        if (next !== null) {
            if (!this._isMediaReady(next.decl)) {
                return;
            }
            if (this._next_renderer_asset === null) {
                this._next_renderer_asset = this._updateNext(next.decl);
                this._next_renderer_asset.end_time = (typeof next.remainingTimeMs === "number") ?
                    (next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._next_renderer_asset.ref();
                console.log("WEBGL-RENDERER: next", this._next_renderer_asset.currentSrc);
            }
            else if (next.decl.asset_id !== this._next_renderer_asset.asset_id) {
                this._closeNext();
                this._next_renderer_asset = this._updateNext(next.decl);
                this._next_renderer_asset.end_time = (typeof next.remainingTimeMs === "number") ?
                    (next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._next_renderer_asset.ref();
                console.log("WEBGL-RENDERER: next", this._next_renderer_asset.currentSrc);
            }
            else if (this._next_renderer_asset !== null) {
                this._next_renderer_asset = this._updateNext(next.decl);
                this._next_renderer_asset.end_time = (typeof next.remainingTimeMs === "number") ?
                    (next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
            }
            if (this._next_renderer_asset === null) {
                throw new Error("next asset is null.");
            }
        }
        else if (this._next_renderer_asset !== null) {
            this._closeNext();
            console.log(`WEBGL-RENDERER: next null`);
        }
    }
    async _onSchedulerTransition(transition) {
        // Resources for transitions, explicitly details textures to
        // avoid confusion when crossing boundary between two assets.
        let needs_update = false;
        if (transition !== null) {
            const from_asset = this._renderer_asset_cache.get(transition.from.decl.asset_id);
            if (typeof from_asset !== "undefined"
                && from_asset.texture !== null
                && from_asset.texture.uuid !== this._map1_renderer_asset?.texture?.uuid) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                }
                this._shader.uniforms.map1.value = from_asset.texture;
                //				console.log('set map1', transition.from.decl.href);
                from_asset.ref();
                this._setMap1Asset(from_asset);
                needs_update = true;
            }
            const to_asset = this._renderer_asset_cache.get(transition.to.decl.asset_id);
            if (typeof to_asset !== "undefined"
                && to_asset.texture !== null
                && to_asset.texture.uuid !== this._map2_renderer_asset?.texture?.uuid) {
                if (this._map2_renderer_asset instanceof WebGLRendererAsset) {
                    this._map2_renderer_asset.unref();
                }
                this._shader.uniforms.map2.value = to_asset.texture;
                //				console.log('set map2', transition.to.decl.href);
                to_asset.ref();
                this._setMap2Asset(to_asset);
                needs_update = true;
            }
            if (transition.url !== this._displacement_url) {
                this._displacement_url = transition.url;
                //				console.log('set displacement', this.#displacement_url);
                await this._updateDisplacementMap(transition.url);
                this._shader.uniforms.displacement.value = this._displacement_texture;
                needs_update = true;
            }
            if (transition.percent !== this._transition_percent) {
                this._setTransitionPercent(transition.percent);
                //				console.log('set pct', transition.percent);
                needs_update = true;
            }
            if (transition.percentSpeed !== this._transition_percent_speed) {
                this._transition_percent_speed = transition.percentSpeed;
            }
        }
        else { // Transition finished, follow settings per "current".
            if (this._current_renderer_asset === null) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                    this._setMap1Asset(null);
                    needs_update = true;
                }
            }
            else if (this._current_renderer_asset.texture !== null
                && this._current_renderer_asset.texture.uuid !== this._map1_renderer_asset?.texture?.uuid) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                }
                this._shader.uniforms.map1.value = this._current_renderer_asset.texture;
                //				console.log('set map1', this.#current_asset.currentSrc);
                this._current_renderer_asset.ref();
                this._setMap1Asset(this._current_renderer_asset);
                needs_update = true;
            }
            if (this._map2_renderer_asset !== null) {
                this._map2_renderer_asset.unref();
                this._setMap2Asset(null);
                needs_update = true;
            }
            if (this._transition_percent !== 0) {
                this._setTransitionPercent(0);
                needs_update = true;
            }
            if (this._transition_percent_speed !== 0) {
                this._transition_percent_speed = 0;
            }
        }
        if (needs_update) {
            this._shader.uniformsNeedUpdate = true;
        }
    }
    _networkLoadingRef() {
        if (this._network_loading_count === 0) {
            this._networkState = HTMLMediaElement.NETWORK_LOADING;
        }
        this._network_loading_count++;
    }
    _networkLoadingUnref() {
        this._network_loading_count--;
        if (this._network_loading_count === 0) {
            this._networkState = HTMLMediaElement.NETWORK_IDLE;
        }
    }
    _emptyAssetTrash() {
        const remove_list = [];
        for (const [id, asset] of this._renderer_asset_trash) {
            if (asset.ref_count !== 0) {
                continue;
            }
            asset.close();
            remove_list.push(id);
        }
        for (const id of remove_list) {
            console.log("WEBGL-RENDERER: Destroying", id);
            this._renderer_asset_cache.delete(id);
            this._renderer_asset_trash.delete(id);
        }
    }
    _setMap1Asset(asset) {
        this._map1_renderer_asset = asset;
        this._shader.uniforms.map1.value = !!asset ? asset.texture : this._empty_texture;
    }
    _setMap2Asset(asset) {
        this._map2_renderer_asset = asset;
        this._shader.uniforms.map2.value = !!asset ? asset.texture : this._empty_texture;
    }
    // Assumes new decl.
    async _updateCurrent(decl) {
        const asset = this._resolveMediaAsset(decl);
        if (!asset.has_texture
            && asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            this._initTexture(asset.texture);
            asset.has_texture = true;
            await asset.play();
            if (this._map1_renderer_asset !== null) {
                this._map1_renderer_asset.unref();
            }
            if (this._map2_renderer_asset !== null) {
                this._map2_renderer_asset.unref();
            }
            asset.ref();
            this._setMap1Asset(asset);
            this._setMap2Asset(null);
            this._setTransitionPercent(0);
            this._shader.uniformsNeedUpdate = true;
            this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
        }
        return asset;
    }
    // Keep reference next to current.
    async _updateCurrentFromNext() {
        if (this._current_renderer_asset !== null) {
            throw new Error("current asset must be closed before calling.");
        }
        if (this._next_renderer_asset === null) {
            throw new Error("next asset must be defined before calling.");
        }
        const asset = this._next_renderer_asset;
        this._next_renderer_asset = null;
        if (asset !== null
            && asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            await asset.play();
            if (this._map2_renderer_asset === null) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                }
                this._setMap1Asset(asset);
                this._setTransitionPercent(0);
                this._shader.uniformsNeedUpdate = true;
            }
            this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
        }
        else {
            console.warn("WEBGL-RENDERER: current asset not ready.");
            this._readyState = HTMLMediaElement.HAVE_METADATA;
        }
        return asset;
    }
    _canPaintCurrent() {
        return this._current_renderer_asset !== null
            && this._current_renderer_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    }
    _paintCurrent(timestamp, remaining) {
        if (this._current_renderer_asset === null) {
            throw new Error("undefined current asset.");
        }
        this._current_renderer_asset.paint(timestamp, remaining);
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
    _closeCurrent() {
        if (this._current_renderer_asset === null) {
            return;
        }
        this._current_renderer_asset.pause();
        this._current_renderer_asset.unref();
        this._renderer_asset_trash.set(this._current_renderer_asset.asset_id, this._current_renderer_asset);
        this._current_renderer_asset = null;
    }
    _hasWaitingDuration() {
        return false;
    }
    _paintWaiting(_timestamp) { }
    _paintWaitingDuration(_timestamp, _remaining) { }
    _updateNext(decl) {
        const asset = this._resolveMediaAsset(decl);
        if (!asset.has_texture
            && asset.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            this._initTexture(asset.texture);
            asset.has_texture = true;
            if (this.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
                this._readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
            }
        }
        return asset;
    }
    _isMediaReady(decl) {
        const path = this._asset_prefetch.getCachedPath(decl.href);
        return path !== null;
    }
    _resolveMediaAsset(decl) {
        const existing_asset = this._renderer_asset_cache.get(decl.asset_id);
        if (typeof existing_asset !== "undefined") {
            if (this._renderer_asset_trash.has(decl.asset_id)) {
                this._renderer_asset_trash.delete(decl.asset_id);
            }
            if (existing_asset.is_loading
                && existing_asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
                this._networkLoadingUnref();
                existing_asset.is_loading = false;
            }
            return existing_asset;
        }
        const cached_path = this._asset_prefetch.getCachedPath(decl.href);
        if (cached_path === null) {
            throw new Error(`Media asset not cached: ${decl.href}`);
        }
        const resolved_decl = {
            ...decl,
            href: cached_path,
        };
        const three_asset = this._asset_manager.createThreeAsset(resolved_decl);
        const renderer_asset = new WebGLRendererAsset(decl.asset_id, three_asset);
        this._renderer_asset_cache.set(renderer_asset.asset_id, renderer_asset);
        this._networkLoadingRef();
        renderer_asset.is_loading = true;
        renderer_asset.load();
        return renderer_asset;
    }
    _canPaintNext() {
        return this._next_renderer_asset !== null
            && this._next_renderer_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    }
    _paintNext(timestamp, remaining) {
        if (this._next_renderer_asset === null) {
            throw new Error("undefined next asset.");
        }
        this._next_renderer_asset.paint(timestamp, remaining);
    }
    _closeNext() {
        if (this._next_renderer_asset === null) {
            throw new Error("undefined next asset.");
        }
        this._next_renderer_asset.unref();
        this._renderer_asset_trash.set(this._next_renderer_asset.asset_id, this._next_renderer_asset);
        this._next_renderer_asset = null;
    }
    // Assumes new URL.
    async _updateDisplacementMap(url) {
        this._networkLoadingRef();
        const img = await this._fetchImage(url);
        this._displacement_texture.image = img;
        this._displacement_texture.needsUpdate = true;
        this._initTexture(this._displacement_texture);
        this._networkLoadingUnref();
    }
    _meshFrom(material, left, right, top, bottom, width, height) {
        const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([
            left / width, 1 - (top / height),
            right / width, 1 - (top / height),
            left / width, 1 - (bottom / height),
            right / width, 1 - (bottom / height),
            0, 0,
            0, 0
        ]), 2));
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(width, height, 1);
        return mesh;
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WebGLPlaylistElement = class WebGLPlaylistElement extends WebPlaylistElement {
    static { this.styles = css `
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
			position: absolute;
			width: inherit;
			height: inherit;
		}
		:host > main > * {
			display: block;
			position: absolute;
			top: 0;
			left: 0;
		}
	`; }
    // Override the renderer to use WebGL.
    _createRenderer(prefetchFactory = ServiceWorkerPrefetch) {
        if (this._section === null) {
            throw new Error("cannot find <section> element to attach to.");
        }
        if (this._main === null) {
            throw new Error("cannot find <main> element to attach to.");
        }
        const renderer = new WebGLRenderer(prefetchFactory);
        renderer.init();
        this._connectSchedulerToRenderer(this._scheduler, renderer);
        this._connectRaftCluster(this._scheduler, renderer);
        renderer.setAssetTarget(this._section);
        renderer.setRenderTarget(this._main);
        // Override for performance testing.
        renderer.setPixelRatio(window.devicePixelRatio);
        return renderer;
    }
};
WebGLPlaylistElement = __decorate$1([
    customElement('webgl-play-list')
], WebGLPlaylistElement);

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let BrightSignWebGLPlaylistElement = class BrightSignWebGLPlaylistElement extends WebGLPlaylistElement {
    // Override the renderer to use BrightSign compatible asset prefetcher.
    _createRenderer() {
        return super._createRenderer(BrightSignPrefetch);
    }
};
BrightSignWebGLPlaylistElement = __decorate([
    customElement('brightsign-webgl-play-list')
], BrightSignWebGLPlaylistElement);

export { BrightSignPlaylistElement, BrightSignWebGLPlaylistElement };
//# sourceMappingURL=brightsign.bundle.js.map
