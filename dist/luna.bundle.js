import { LitElement, css, html } from 'lit';
import { property, query, state, customElement } from 'lit/decorators.js';
import * as Comlink from 'comlink';
import EventTarget from '@ungap/event-target';
import { AppManifestSchema } from '@dsbunny/app';
import { RTCMesh } from '@dsbunny/rtcmesh';
import { Raft } from '@dsbunny/raft';
import 'requestidlecallback-polyfill';

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
function SystemAsyncImport(url) {
    return new Promise((resolve, reject) => {
        System.import(url)
            .then(resolve)
            .catch(reject);
    });
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
class AbstractLunaAsset extends EventTarget {
    constructor(src, params, duration, collection) {
        super();
        this.collection = collection;
        this.element = document.createElement('div');
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
class LunaImageAsset extends AbstractLunaAsset {
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
class LunaVideoAsset extends AbstractLunaAsset {
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
            return 0;
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
    get src() { return this._src; }
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
class LunaAppAsset extends AbstractLunaAsset {
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
                console.log(`create LunaApp ... "${this.src}"`);
                const params = {
                    ...this.params,
                    src: this.src,
                    duration: super.duration, // WARNING: `super` not `this`.
                };
                const app = this._app = manifest.LunaApp.create(renderRoot, params);
                app.addEventListener('canplay', this._redispatchEvent);
                app.addEventListener('ended', this._redispatchEvent);
                app.addEventListener('error', this._redispatchEvent);
                console.log(`init "${manifest.name}" with params:`, params);
                app.load();
            }
            catch (initError) {
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
class LunaCollection {
    constructor(renderRoot) {
        this.renderRoot = renderRoot;
    }
}
class LunaImageCollection extends LunaCollection {
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
    createLunaAsset(src, params, duration) {
        return new LunaImageAsset(src, params, duration, this);
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
class LunaVideoCollection extends LunaCollection {
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
            video.texture = true; /* ⚠️ WebOS specific */
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
    createLunaAsset(src, params, _duration) {
        return new LunaVideoAsset(src, params, NaN, this);
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
class LunaAppCollection extends LunaCollection {
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
            const module = await SystemAsyncImport(src);
            console.log(`validate app manifest ... "${src}"`);
            const result = AppManifestSchema.safeParse(module.default);
            console.log(`app manifest validation result: ${result.success} ... "${src}"`);
            if (!result.success) {
                throw new Error(`Invalid app manifest: "${src}"`);
            }
            if (!result.data.LunaApp) {
                throw new Error(`LunaApp constructor not found in manifest: ${src}`);
            }
            manifest = result.data;
            this._manifests.set(src, manifest);
        }
        return manifest;
    }
    createLunaAsset(src, params, duration) {
        return new LunaAppAsset(src, params, duration, this);
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
class LunaAssetManager {
    constructor() {
        this._collection = new Map();
    }
    setAssetTarget(renderTarget) {
        this._renderTarget = renderTarget;
    }
    _createCollection(renderTarget) {
        // TypeScript assumes iterator of first type.
        const collection = new Map([
            ['HTMLImageElement', new LunaImageCollection(renderTarget)],
            ['HTMLVideoElement', new LunaVideoCollection(renderTarget)],
            ['CustomElement', new LunaAppCollection(renderTarget)],
        ]);
        return collection;
    }
    // decl: { type, href }
    // Returns: asset.
    createLunaAsset(decl) {
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
        return collection.createLunaAsset(decl.href, decl.params, decl.duration);
    }
    clear() {
        for (const value of this._collection.values()) {
            value.clear();
        }
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
class LunaRendererAsset {
    constructor(asset_id, luna_asset) {
        this.asset_id = asset_id;
        this.luna_asset = luna_asset;
        this.is_loading = false;
        this.has_element = false;
        this.end_time = NaN;
        this._ref_count = 0;
    }
    get paused() { return this.luna_asset.paused; }
    get ended() { return this.luna_asset.ended; }
    get error() { return this.luna_asset.error; }
    get readyState() { return this.luna_asset.readyState; }
    get networkState() { return this.luna_asset.networkState; }
    get element() { return this.luna_asset.element; }
    get currentSrc() { return this.luna_asset.currentSrc; }
    get currentTime() { return this.luna_asset.currentTime; }
    get className() { return this.luna_asset.className; }
    set className(value) { this.luna_asset.className = value; }
    get classList() { return this.luna_asset.classList; }
    get style() { return this.luna_asset.style; }
    load() {
        if (this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
            return;
        }
        if (this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
            return;
        }
        try {
            this.luna_asset.load();
        }
        catch (error) {
            console.error(`LUNA-ASSET: ${error}`);
        }
    }
    async play() {
        await this.luna_asset.play();
    }
    paint(now, remaining) {
        this.luna_asset.paint(now, remaining);
    }
    pause() {
        this.luna_asset.pause();
    }
    close() {
        this.luna_asset.close();
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
class LunaRenderer extends EventTarget {
    constructor(prefetchFactory) {
        super();
        this._renderTarget = null;
        this._asset_manager = new LunaAssetManager();
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
        console.groupCollapsed("LUNA-RENDERER: init");
        console.groupEnd();
    }
    close() {
        console.log("LUNA-RENDERER: close");
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
        console.log("LUNA-RENDERER: setSchedulerMessagePort", scheduler);
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
        console.log("LUNA-RENDERER: setAssetTarget", assetTarget);
        this._asset_manager.setAssetTarget(assetTarget);
    }
    setRenderTarget(renderTarget) {
        console.log("LUNA-RENDERER: setRenderTarget", renderTarget);
        this._renderTarget = renderTarget;
    }
    setPixelRatio(value) {
        console.log("LUNA-RENDERER: setPixelRatio", value);
        // TBD: translate to CSS.
    }
    setSize(width, height) {
        console.log("LUNA-RENDERER: setSize", width, height);
        if (this._renderTarget !== null) {
            this._renderTarget.style.width = `${width}px`;
            this._renderTarget.style.height = `${height}px`;
        }
    }
    setViews(views) {
        console.log("LUNA-RENDERER: setViews", views);
    }
    async setSources(scope, sources) {
        console.log("LUNA-RENDERER: setSources", scope, sources);
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
        console.log("LUNA-RENDERER: _fetchImage", url);
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
        console.info("LUNA-RENDERER: loaded displacement map", img.src);
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
                console.log("LUNA-RENDERER: current", this._current_renderer_asset.currentSrc);
            }
            else if (current.decl.asset_id !== this._current_renderer_asset.asset_id) {
                //console.info(current.decl.href, current.remainingTimeMs);
                this._closeCurrent();
                if (this._next_renderer_asset !== null
                    && current.decl.asset_id === this._next_renderer_asset.asset_id) {
                    console.log("LUNA-RENDERER: current <- next");
                    this._current_renderer_asset = await this._updateCurrentFromNext();
                }
                else {
                    this._current_renderer_asset = await this._updateCurrent(current.decl);
                }
                this._current_renderer_asset.end_time = (typeof current.remainingTimeMs === "number") ?
                    (current.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._current_renderer_asset.ref();
                console.log("LUNA-RENDERER: current", this._current_renderer_asset.currentSrc);
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
            console.log(`LUNA-RENDERER: current null`);
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
                console.log("LUNA-RENDERER: next", this._next_renderer_asset.currentSrc);
            }
            else if (next.decl.asset_id !== this._next_renderer_asset.asset_id) {
                this._closeNext();
                this._next_renderer_asset = this._updateNext(next.decl);
                this._next_renderer_asset.end_time = (typeof next.remainingTimeMs === "number") ?
                    (next.remainingTimeMs + performance.now()) : Number.MAX_SAFE_INTEGER;
                this._next_renderer_asset.ref();
                console.log("LUNA-RENDERER: next", this._next_renderer_asset.currentSrc);
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
            console.log(`LUNA-RENDERER: next null`);
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
            console.log("LUNA-RENDERER: Destroying", id);
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
            console.warn("LUNA-RENDERER: current asset not ready.");
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
            && asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
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
        const luna_asset = this._asset_manager.createLunaAsset(resolved_decl);
        const renderer_asset = new LunaRendererAsset(decl.asset_id, luna_asset);
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
class NullRenderer extends EventTarget {
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
class AbstractWebAsset extends EventTarget {
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
class WebRenderer extends EventTarget {
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
class ServiceWorkerPrefetch extends EventTarget {
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
var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
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
__decorate$1([
    property({ type: String, reflect: true })
], WebPlaylistElement.prototype, "src", void 0);
__decorate$1([
    property({ attribute: 'src-recipe-id', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_recipe_id", void 0);
__decorate$1([
    property({ attribute: 'src-asset-id', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_asset_id", void 0);
__decorate$1([
    property({ attribute: 'src-size', type: Number, reflect: true })
], WebPlaylistElement.prototype, "src_size", void 0);
__decorate$1([
    property({ attribute: 'src-hash', type: Object, reflect: true })
], WebPlaylistElement.prototype, "src_hash", void 0);
__decorate$1([
    property({ attribute: 'src-integrity', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_integrity", void 0);
__decorate$1([
    property({ attribute: 'src-md5', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_md5", void 0);
__decorate$1([
    property({ type: Array, reflect: false })
], WebPlaylistElement.prototype, "views", void 0);
__decorate$1([
    property({ type: Number, reflect: false })
], WebPlaylistElement.prototype, "width", void 0);
__decorate$1([
    property({ type: Number, reflect: false })
], WebPlaylistElement.prototype, "height", void 0);
__decorate$1([
    property({ type: Boolean, reflect: true })
], WebPlaylistElement.prototype, "autoplay", void 0);
__decorate$1([
    query('main')
], WebPlaylistElement.prototype, "_main", void 0);
__decorate$1([
    query('section')
], WebPlaylistElement.prototype, "_section", void 0);
__decorate$1([
    state()
], WebPlaylistElement.prototype, "playing", void 0);
WebPlaylistElement = __decorate$1([
    customElement('web-play-list')
], WebPlaylistElement);

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
function statFile(options) {
    return new Promise((resolve, reject) => {
        const storage = new Storage();
        storage.statFile(resolve, reject, options);
    });
}
function removeFile(options) {
    return new Promise((resolve, reject) => {
        const storage = new Storage();
        storage.removeFile(resolve, reject, options);
    });
}
function listFiles(options) {
    return new Promise((resolve, reject) => {
        const storage = new Storage();
        storage.listFiles(resolve, reject, options);
    });
}
function mkdir(options) {
    return new Promise((resolve, reject) => {
        const storage = new Storage();
        storage.mkdir(resolve, reject, options);
    });
}
// copyFile() with progress.
async function downloadFile(options) {
    const storage = new Storage();
    const response = await new Promise((resolve, reject) => {
        storage.downloadFile(resolve, reject, options);
    });
    await new Promise((resolve, reject) => {
        const progressString = (data) => {
            if (typeof data.amountReceived === "number"
                && typeof data.amountTotal === "number") {
                const percent = (100 * data.amountReceived / data.amountTotal).toFixed(0);
                return `${data.amountReceived.toString()} of ${data.amountTotal.toString()} ${percent}%`;
            }
            return "";
        };
        const onFileStatus = (data) => {
            console.info(JSON.stringify(data));
            if (data.status === "completed") {
                resolve();
            }
            else if (data.status === "failed") {
                reject();
            }
            else if (data.status === "downloading") {
                console.log(`PREFETCH: ASSET ${options.source} progress: ${progressString(data)}`);
            }
        };
        const statusOptions = {
            ticket: response.ticket,
            subscribe: true,
        };
        console.info(`${JSON.stringify(statusOptions)}`);
        storage.getDownloadFileStatus(onFileStatus, reject, statusOptions);
    });
}
// No progress API.
// TBD: Evaluate performance internal and external.
function getMD5Hash(options) {
    return new Promise((resolve, reject) => {
        const storage = new Storage();
        storage.getMD5Hash(resolve, reject, options);
    });
}
function fsync(options) {
    return new Promise((resolve, reject) => {
        const storage = new Storage();
        storage.fsync(resolve, reject, options);
    });
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
// Local Storage: file://internal/[FILE_PATH]
// USB Flash Drive: file://usb:[INDEX]/[FILE_PATH]
// SD Card: file://sdcard:[INDEX]/[FILE_PATH]
const LG_STORAGE_PATH = "file://internal";
const LG_POOL_PATH = `p`;
const LG_HTTP_PATH = "http://127.0.0.1:9080";
// Normalize stored files to unique ID and file extension.
function filenameFromIdAndHref(id, href) {
    const url = new URL(href, location.href);
    const ext = url.pathname.split('.').pop();
    return `${id}.${ext}`;
}
function idFromFilename(filename) {
    const dot_index = filename.lastIndexOf('.');
    if (dot_index === -1) {
        return filename;
    }
    return filename.substr(0, dot_index);
}
// Convert a hex string to base64.
function hexToBase64(hex) {
    //        return Buffer.from(hex, 'hex').toString('base64');
    let base64 = "";
    for (let i = 0; i < hex.length; i++) {
        base64 += !(i - 1 & 1) ? String.fromCharCode(parseInt(hex.substring(i - 1, i + 1), 16)) : "";
    }
    return btoa(base64);
}
class EvictionEntry {
    constructor(asset_id, date) {
        this.asset_id = asset_id;
        this.date = date;
    }
}
class LunaPool {
    constructor(base_path, http_path) {
        this._url_to_asset_id_map = new Map();
        this._asset_id_to_asset_map = new Map();
        this._asset_id_to_file_map = new Map();
        // LRU queue of all assets in the pool, oldest to newest.
        this._eviction_queue = [];
        // Asset scopes that are protected from eviction.
        this._protected_scopes = new Map();
        this._protected_asset_ids = new Set();
        this._has_loaded_from_disk = false;
        // Configured maximum size of the pool.
        this._max_size = 0;
        // Current size of the pool.
        this._size = 0;
        this._base_path = base_path;
        this._http_path = http_path;
    }
    // Maximum pool size in not stored within the pool and must be set on
    // each instance.
    async reserveStorage(size) {
        this._max_size = size;
        await this.reserve(0);
    }
    has(asset_id) {
        const asset = this._asset_id_to_asset_map.get(asset_id);
        return asset && asset.href.length !== 0;
    }
    // Mark existing or upcoming assets to be protected from eviction, the
    // latter causes immediate eviction of unprotected assets.
    async protectAssets(scope, assets) {
        const now = new Date();
        const ids = new Set();
        let total_size = 0;
        for (const asset of assets) {
            // The asset behind any id is idempotent.
            if (this.has(asset.asset_id)) {
                console.info(`PREFETCH: asset #${asset.asset_id} already in pool`);
                const index = this._eviction_queue.findIndex((x) => x.asset_id === asset.asset_id);
                if (index !== -1) {
                    console.info(`PREFETCH: removing asset #${asset.asset_id} from eviction queue ...`);
                    this._eviction_queue.splice(index, 1);
                }
                continue;
            }
            console.info(`PREFETCH: asset #${asset.asset_id} adding to pool ...`);
            if (typeof asset.size === "number") {
                total_size += asset.size;
            }
            const filename = filenameFromIdAndHref(asset.asset_id, asset.href);
            const filepath = `${this._base_path}/${filename}`;
            this._url_to_asset_id_map.set(asset.href, asset.asset_id);
            this._asset_id_to_asset_map.set(asset.asset_id, asset);
            this._asset_id_to_file_map.set(asset.asset_id, filepath);
            console.info(`PREFETCH: asset #${asset.asset_id} added to pool: ${filepath}`);
            this._eviction_queue.push(new EvictionEntry(asset.asset_id, now));
            this._protected_asset_ids.add(asset.asset_id);
            ids.add(asset.asset_id);
        }
        this._protected_scopes.set(scope, ids);
        if (total_size > 0) {
            await this.reserve(total_size);
            this._size += total_size;
        }
    }
    // Remove protection from assets, so that they may be evicted to leave
    // space for new assets.
    // Does not cause immediate eviction.
    unprotectAssets(scope) {
        const ids = this._protected_scopes.get(scope);
        if (Array.isArray(ids)) {
            for (const id of ids) {
                this._protected_asset_ids.delete(id);
            }
        }
        this._protected_scopes.delete(scope);
    }
    // Return native path to asset from external URI.
    getFilePath(url) {
        const id = this._url_to_asset_id_map.get(url);
        if (typeof id === "undefined") {
            return null;
        }
        const filename = filenameFromIdAndHref(id, url);
        const filepath = `${this._base_path}/${filename}`;
        return filepath;
    }
    // Return a path usable in the DOM.
    getHttpPath(url) {
        const id = this._url_to_asset_id_map.get(url);
        if (typeof id === "undefined") {
            return "";
        }
        const filename = filenameFromIdAndHref(id, url);
        const httppath = `${this._http_path}/${filename}`;
        return httppath;
    }
    // Reserve space for new assets, performing evictions on unprotected
    // assets as necessary.
    async reserve(size) {
        if (!this._has_loaded_from_disk) {
            await this._bootstrap();
        }
        let index = 0;
        const max_size = this._max_size - size;
        while (this._size > max_size) {
            if (index >= this._eviction_queue.length) {
                return;
            }
            const entry = this._eviction_queue[index];
            if (this._protected_asset_ids.has(entry.asset_id)) {
                index++;
                continue;
            }
            const asset = this._asset_id_to_asset_map.get(entry.asset_id);
            if (typeof asset !== "undefined") {
                const filename = filenameFromIdAndHref(entry.asset_id, asset.href);
                const filepath = `${this._base_path}/${filename}`;
                const removeOptions = {
                    file: filepath,
                    recursive: false,
                };
                await removeFile(removeOptions);
                this._url_to_asset_id_map.delete(asset.href);
            }
            this._asset_id_to_asset_map.delete(entry.asset_id);
            this._asset_id_to_file_map.delete(entry.asset_id);
            this._eviction_queue.splice(index, 1);
            index++;
        }
    }
    _sortedIndex(array, value) {
        let low = 0;
        let high = array.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (array[mid] < value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    // Read pool state from disk.
    async _bootstrap() {
        const listOptions = {
            path: this._base_path,
        };
        const data = await listFiles(listOptions);
        for (const file of data.files) {
            if (!file.name)
                continue;
            const asset_id = idFromFilename(file.name);
            const placeholder = {
                '@type': 'unknown',
                asset_id,
                href: '',
            };
            this._asset_id_to_asset_map.set(asset_id, placeholder);
            const file_url = `${this._base_path}/${file.name}`;
            this._asset_id_to_file_map.set(asset_id, file_url);
            this._size += file.size || 0;
            const statOptions = {
                path: file_url,
            };
            const statData = await statFile(statOptions);
            const file_date = new Date(statData.atime);
            const index = this._sortedIndex(this._eviction_queue, file_date.getTime());
            this._eviction_queue.splice(index, 0, new EvictionEntry(asset_id, file_date));
        }
        this._has_loaded_from_disk = true;
    }
}
class LunaPrefetch extends EventTarget {
    constructor() {
        super();
        this._is_configured = false;
        this._pool = new LunaPool(`${LG_STORAGE_PATH}/${LG_POOL_PATH}`, `${LG_HTTP_PATH}/${LG_POOL_PATH}`);
    }
    // Use space as available reserving 128MB free.
    async _configurePool() {
        try {
            const options = {
                path: `${LG_STORAGE_PATH}/${LG_POOL_PATH}`,
            };
            await mkdir(options);
            console.log(`PREFETCH: Created LG asset pool (${LG_STORAGE_PATH}/${LG_POOL_PATH})`);
        }
        catch (e) {
            // Error: EEXIST: file already exists, mkdir '/storage/sd//p'
            // {"errno":-17,"syscall":"mkdir","code":"EEXIST","path":"/storage/sd//p"}
            if (e.code !== 'EEXIST') {
                console.warn(e);
                console.warn(JSON.stringify(e));
                throw e;
            }
            console.log(`PREFETCH: Using LG asset pool (${LG_STORAGE_PATH}/${LG_POOL_PATH})`);
        }
        await this._pool.reserveStorage(128 * 1024 * 1024);
        this._is_configured = true;
    }
    async _fetchAssets(pool, assets) {
        //		console.log(`PREFETCH: __fetchAssets: ${JSON.stringify(assets.map(asset => asset.name))}`);
        console.log(`PREFETCH: _fetchAssets ...`);
        let change_count = 0;
        for (const asset of assets) {
            const filepath = pool.getFilePath(asset.href);
            if (!filepath) {
                console.warn(`PREFETCH: ${asset.asset_id}: Asset not in pool.`);
                continue;
            }
            if (asset.size) {
                try {
                    const statOptions = {
                        path: filepath,
                    };
                    const fileInfo = await statFile(statOptions);
                    if (fileInfo.size !== asset.size) {
                        console.info(`PREFETCH: ${asset.asset_id}: File size mismatch, removing file ...`);
                        const removeOptions = {
                            file: filepath,
                            recursive: false,
                        };
                        await removeFile(removeOptions);
                        change_count++;
                        console.info(`PREFETCH: ${asset.asset_id}: Removed, expected size: ${asset.size}, actual size: ${fileInfo.size}`);
                    }
                }
                catch (err) {
                    console.warn(err);
                }
            }
            if (asset.md5) {
                console.info(`PREFETCH: ${asset.asset_id}: Calculating MD5 ...`);
                const md5Options = {
                    filePath: filepath,
                };
                let md5Result = undefined;
                try {
                    md5Result = await getMD5Hash(md5Options);
                    const md5hash = hexToBase64(md5Result.md5hash);
                    if (md5hash === asset.md5) {
                        console.log(`PREFETCH: ${asset.asset_id}: MD5 matches, skipping download.`);
                        continue;
                    }
                }
                catch (err) {
                    // { errorText: "No such file", errorCode: "INTERNAL_ERROR" }
                    if (typeof err === 'object'
                        && err !== null
                        && 'errorText' in err
                        && err['errorText'] === 'No such file') {
                        console.warn(`PREFETCH: ${asset.asset_id}: File not found: ${filepath}`);
                        continue;
                    }
                    console.warn(err);
                }
                console.info(`PREFETCH: ${asset.asset_id}: MD5 mismatch, removing file ...`);
                const removeOptions = {
                    file: filepath,
                    recursive: false,
                };
                await removeFile(removeOptions);
                change_count++;
                console.info(`PREFETCH: ${asset.asset_id}: Removed, expected md5: ${asset.md5}, actual md5: ${md5Result?.md5hash}`);
            }
            if (!asset.size && !asset.md5) {
                console.warn(`PREFETCH: ${asset.asset_id}: No size or md5, assuming valid asset.`);
                continue;
            }
            try {
                console.info(`PREFETCH: ${asset.asset_id}: Downloading ...`);
                const downloadOptions = {
                    action: 'start',
                    source: asset.href,
                    destination: filepath,
                    httpOption: {
                        maxRedirection: 5,
                        timeout: 300 * 1000, // milliseconds, match Chrome.
                        insecure: false,
                    },
                };
                // SCAP v1.6.4
                // webOS Signage 3.2(3.0+) and later
                // REF: https://webossignage.developer.lge.com/api/scap-api/scap18/storage/
                await downloadFile(downloadOptions);
                change_count++;
                console.info(`PREFETCH: ${asset.asset_id}: Downloaded to ${filepath}`);
            }
            catch (e) {
                console.log(`PREFETCH: Fetcher failed: ${e.message}`);
                throw (e);
            }
            console.info(`PREFETCH: ${asset.asset_id}: Calculating MD5 ...`);
            const md5Options = {
                filePath: filepath,
            };
            const md5Result = await getMD5Hash(md5Options);
            const md5hash = hexToBase64(md5Result.md5hash);
            console.info(`PREFETCH: ${asset.asset_id}: MD5: ${md5hash}`);
            if (md5hash !== asset.md5) {
                console.info(`PREFETCH: ${asset.asset_id}: Checksum mismatch, removing file ...`);
                const removeOptions = {
                    file: filepath,
                    recursive: false,
                };
                await removeFile(removeOptions);
                change_count++;
                console.info(`PREFETCH: ${asset.asset_id}: Removed, expected md5: ${asset.md5}, actual md5: ${md5hash}`);
            }
        }
        if (change_count > 0) {
            console.info(`PREFETCH: fsync ...`);
            // Only fsync schedule.
            await fsync();
        }
        console.log(`PREFETCH: _fetchAssets done, ${change_count} changes made.`);
    }
    // Protect API to limit space reclamation without time priority.
    async acquireSources(scope, sources) {
        console.log(`PREFETCH: acquireSources ${scope} ${JSON.stringify(sources)}`);
        if (!this._is_configured) {
            await this._configurePool();
        }
        console.log(`PREFETCH: Protecting assets ...`);
        await this._pool.protectAssets(scope, sources);
        console.log(`PREFETCH: Protecting assets done.`);
        await this._fetchAssets(this._pool, sources);
        console.log(`PREFETCH: acquireSources done.`);
    }
    async releaseSources(scope) {
        this._pool.unprotectAssets(scope);
    }
    getCachedPath(origin) {
        return this._pool.getHttpPath(origin);
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let LunaPlaylistElement = class LunaPlaylistElement extends WebPlaylistElement {
    // Remove "contain: strict" from the host element for LG WebOS.
    static { this.styles = css `
		:host {
			display: block;
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
	`; }
    // Cannot access absolute file:// URLs from LG WebOS.
    _createWorker() {
        return new Worker('./dist/scheduler.bundle~chrome53.js', {
            type: 'classic',
            credentials: 'omit',
            name: 'Scheduler', // Shown in debugger.
        });
    }
    // Override the renderer to use LG WebOS compatible CSS Renderer.
    _createRenderer(prefetchFactory = LunaPrefetch) {
        if (this._section === null) {
            throw new Error("cannot find <section> element to attach to.");
        }
        if (this._main === null) {
            throw new Error("cannot find <main> element to attach to.");
        }
        const renderer = new LunaRenderer(prefetchFactory);
        renderer.init();
        this._connectSchedulerToRenderer(this._scheduler, renderer);
        this._connectRaftCluster(this._scheduler, renderer);
        renderer.setAssetTarget(this._main);
        renderer.setRenderTarget(this._main);
        return renderer;
    }
};
LunaPlaylistElement = __decorate([
    customElement('luna-play-list')
], LunaPlaylistElement);

export { LunaPlaylistElement };
//# sourceMappingURL=luna.bundle.js.map
