import { LitElement, css, html } from 'lit';
import { z } from 'zod/v4';
import * as THREE from 'three';

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=t=>(e,o)=>{ void 0!==o?o.addInitializer((()=>{customElements.define(t,e);})):customElements.define(t,e);};

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e$3=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o$2=new WeakMap;let n$2 = class n{constructor(t,e,o){if(this._$cssResult$=true,o!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$3&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$2.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$2.set(s,t));}return t}toString(){return this.cssText}};const r$2=t=>new n$2("string"==typeof t?t:t+"",void 0,s),S=(s,o)=>{if(e$3)s.adoptedStyleSheets=o.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of o){const o=document.createElement("style"),n=t.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$1=e$3?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$2(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i,defineProperty:e$2,getOwnPropertyDescriptor:h,getOwnPropertyNames:r$1,getOwnPropertySymbols:o$1,getPrototypeOf:n$1}=Object,a=globalThis,c=a.trustedTypes,l=c?c.emptyScript:"",p=a.reactiveElementPolyfillSupport,d=(t,s)=>t,u={toAttribute(t,s){switch(s){case Boolean:t=t?l:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f=(t,s)=>!i(t,s),b={attribute:true,type:String,converter:u,reflect:false,useDefault:false,hasChanged:f};Symbol.metadata??=Symbol("metadata"),a.litPropertyMetadata??=new WeakMap;class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b){if(s.state&&(s.attribute=false),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=true),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$2(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(d("elementProperties")))return;const t=n$1(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d("finalized")))return;if(this.finalized=true,this._$Ei(),this.hasOwnProperty(d("properties"))){const t=this.properties,s=[...r$1(t),...o$1(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$1(s));}else void 0!==s&&i.push(c$1(s));return i}static _$Eu(t,s){const i=s.attribute;return  false===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=false,this.hasUpdated=false,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(true),this._$EO?.forEach((t=>t.hostConnected?.()));}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()));}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&true===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u;this._$Em=e;const r=h.fromAttribute(s,t.type);this[e]=r??this._$Ej?.get(e)??r,this._$Em=null;}}requestUpdate(t,s,i){if(void 0!==t){const e=this.constructor,h=this[t];if(i??=e.getPropertyOptions(t),!((i.hasChanged??f)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(e._$Eu(t,i))))return;this.C(t,s,i);} false===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),true!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),true===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=true;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];true!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=false;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(s)):this._$EM();}catch(s){throw t=false,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return  true}update(t){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM();}updated(t){}firstUpdated(t){}}y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[d("elementProperties")]=new Map,y[d("finalized")]=new Map,p?.({ReactiveElement:y}),(a.reactiveElementVersions??=[]).push("2.1.1");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o={attribute:true,type:String,converter:u,reflect:false,hasChanged:f},r=(t=o,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===n&&((t=Object.create(t)).wrapped=true),s.set(r.name,t),"accessor"===n){const{name:o}=r;return {set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t);},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t);}}throw Error("Unsupported decorator location: "+n)};function n(t){return (e,o)=>"object"==typeof o?r(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$1=(e,t,c)=>(c.configurable=true,c.enumerable=true,c);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function e(e,r){return (n,s,i)=>{const o=t=>t.renderRoot?.querySelector(e)??null;return e$1(n,s,{get(){return o(this)}})}}

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const finalizer = Symbol("Comlink.finalizer");
const throwMarker = Symbol("Comlink.thrown");
const isObject = (val) => (typeof val === "object" && val !== null) || typeof val === "function";
/**
 * Internal transfer handle to handle objects marked to proxy.
 */
const proxyTransferHandler = {
    canHandle: (val) => isObject(val) && val[proxyMarker],
    serialize(obj) {
        const { port1, port2 } = new MessageChannel();
        expose(obj, port1);
        return [port2, [port2]];
    },
    deserialize(port) {
        port.start();
        return wrap(port);
    },
};
/**
 * Internal transfer handler to handle thrown exceptions.
 */
const throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
        let serialized;
        if (value instanceof Error) {
            serialized = {
                isError: true,
                value: {
                    message: value.message,
                    name: value.name,
                    stack: value.stack,
                },
            };
        }
        else {
            serialized = { isError: false, value };
        }
        return [serialized, []];
    },
    deserialize(serialized) {
        if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
        }
        throw serialized.value;
    },
};
/**
 * Allows customizing the serialization of certain values.
 */
const transferHandlers = new Map([
    ["proxy", proxyTransferHandler],
    ["throw", throwTransferHandler],
]);
function isAllowedOrigin(allowedOrigins, origin) {
    for (const allowedOrigin of allowedOrigins) {
        if (origin === allowedOrigin || allowedOrigin === "*") {
            return true;
        }
        if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
            return true;
        }
    }
    return false;
}
function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
    ep.addEventListener("message", function callback(ev) {
        if (!ev || !ev.data) {
            return;
        }
        if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
            console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
            return;
        }
        const { id, type, path } = Object.assign({ path: [] }, ev.data);
        const argumentList = (ev.data.argumentList || []).map(fromWireValue);
        let returnValue;
        try {
            const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
            const rawValue = path.reduce((obj, prop) => obj[prop], obj);
            switch (type) {
                case "GET" /* MessageType.GET */:
                    {
                        returnValue = rawValue;
                    }
                    break;
                case "SET" /* MessageType.SET */:
                    {
                        parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                        returnValue = true;
                    }
                    break;
                case "APPLY" /* MessageType.APPLY */:
                    {
                        returnValue = rawValue.apply(parent, argumentList);
                    }
                    break;
                case "CONSTRUCT" /* MessageType.CONSTRUCT */:
                    {
                        const value = new rawValue(...argumentList);
                        returnValue = proxy(value);
                    }
                    break;
                case "ENDPOINT" /* MessageType.ENDPOINT */:
                    {
                        const { port1, port2 } = new MessageChannel();
                        expose(obj, port2);
                        returnValue = transfer(port1, [port1]);
                    }
                    break;
                case "RELEASE" /* MessageType.RELEASE */:
                    {
                        returnValue = undefined;
                    }
                    break;
                default:
                    return;
            }
        }
        catch (value) {
            returnValue = { value, [throwMarker]: 0 };
        }
        Promise.resolve(returnValue)
            .catch((value) => {
            return { value, [throwMarker]: 0 };
        })
            .then((returnValue) => {
            const [wireValue, transferables] = toWireValue(returnValue);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
            if (type === "RELEASE" /* MessageType.RELEASE */) {
                // detach and deactive after sending release response above.
                ep.removeEventListener("message", callback);
                closeEndPoint(ep);
                if (finalizer in obj && typeof obj[finalizer] === "function") {
                    obj[finalizer]();
                }
            }
        })
            .catch((error) => {
            // Send Serialization Error To Caller
            const [wireValue, transferables] = toWireValue({
                value: new TypeError("Unserializable return value"),
                [throwMarker]: 0,
            });
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
        });
    });
    if (ep.start) {
        ep.start();
    }
}
function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
        endpoint.close();
}
function wrap(ep, target) {
    const pendingListeners = new Map();
    ep.addEventListener("message", function handleMessage(ev) {
        const { data } = ev;
        if (!data || !data.id) {
            return;
        }
        const resolver = pendingListeners.get(data.id);
        if (!resolver) {
            return;
        }
        try {
            resolver(data);
        }
        finally {
            pendingListeners.delete(data.id);
        }
    });
    return createProxy(ep, pendingListeners, [], target);
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}
function releaseEndpoint(ep) {
    return requestResponseMessage(ep, new Map(), {
        type: "RELEASE" /* MessageType.RELEASE */,
    }).then(() => {
        closeEndPoint(ep);
    });
}
const proxyCounter = new WeakMap();
const proxyFinalizers = "FinalizationRegistry" in globalThis &&
    new FinalizationRegistry((ep) => {
        const newCount = (proxyCounter.get(ep) || 0) - 1;
        proxyCounter.set(ep, newCount);
        if (newCount === 0) {
            releaseEndpoint(ep);
        }
    });
function registerProxy(proxy, ep) {
    const newCount = (proxyCounter.get(ep) || 0) + 1;
    proxyCounter.set(ep, newCount);
    if (proxyFinalizers) {
        proxyFinalizers.register(proxy, ep, proxy);
    }
}
function unregisterProxy(proxy) {
    if (proxyFinalizers) {
        proxyFinalizers.unregister(proxy);
    }
}
function createProxy(ep, pendingListeners, path = [], target = function () { }) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    unregisterProxy(proxy);
                    releaseEndpoint(ep);
                    pendingListeners.clear();
                    isProxyReleased = true;
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(ep, pendingListeners, {
                    type: "GET" /* MessageType.GET */,
                    path: path.map((p) => p.toString()),
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, pendingListeners, [...path, prop]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, pendingListeners, {
                type: "SET" /* MessageType.SET */,
                path: [...path, prop].map((p) => p.toString()),
                value,
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, pendingListeners, {
                    type: "ENDPOINT" /* MessageType.ENDPOINT */,
                }).then(fromWireValue);
            }
            // We just pretend that `bind()` didn’t happen.
            if (last === "bind") {
                return createProxy(ep, pendingListeners, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, pendingListeners, {
                type: "APPLY" /* MessageType.APPLY */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, pendingListeners, {
                type: "CONSTRUCT" /* MessageType.CONSTRUCT */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
    });
    registerProxy(proxy, ep);
    return proxy;
}
function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
const transferCache = new WeakMap();
function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}
function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
}
function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [
                {
                    type: "HANDLER" /* WireValueType.HANDLER */,
                    name,
                    value: serializedValue,
                },
                transferables,
            ];
        }
    }
    return [
        {
            type: "RAW" /* WireValueType.RAW */,
            value,
        },
        transferCache.get(value) || [],
    ];
}
function fromWireValue(value) {
    switch (value.type) {
        case "HANDLER" /* WireValueType.HANDLER */:
            return transferHandlers.get(value.name).deserialize(value.value);
        case "RAW" /* WireValueType.RAW */:
            return value.value;
    }
}
function requestResponseMessage(ep, pendingListeners, msg, transfers) {
    return new Promise((resolve) => {
        const id = generateUUID();
        pendingListeners.set(id, resolve);
        if (ep.start) {
            ep.start();
        }
        ep.postMessage(Object.assign({ id }, msg), transfers);
    });
}
function generateUUID() {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
        .join("-");
}

/*! (c) Andrea Giammarchi - ISC */
var self$1 = {};
try {
  self$1.EventTarget = (new EventTarget).constructor;
} catch(EventTarget) {
  (function (Object, wm) {
    var create = Object.create;
    var defineProperty = Object.defineProperty;
    var proto = EventTarget.prototype;
    define(proto, 'addEventListener', function (type, listener, options) {
      for (var
        secret = wm.get(this),
        listeners = secret[type] || (secret[type] = []),
        i = 0, length = listeners.length; i < length; i++
      ) {
        if (listeners[i].listener === listener)
          return;
      }
      listeners.push({target: this, listener: listener, options: options});
    });
    define(proto, 'dispatchEvent', function (event) {
      var secret = wm.get(this);
      var listeners = secret[event.type];
      if (listeners) {
        define(event, 'target', this);
        define(event, 'currentTarget', this);
        listeners.slice(0).some(dispatch, event);
        delete event.currentTarget;
        delete event.target;
      }
      return true;
    });
    define(proto, 'removeEventListener', function (type, listener) {
      for (var
        secret = wm.get(this),
        /* istanbul ignore next */
        listeners = secret[type] || (secret[type] = []),
        i = 0, length = listeners.length; i < length; i++
      ) {
        if (listeners[i].listener === listener) {
          listeners.splice(i, 1);
          return;
        }
      }
    });
    self$1.EventTarget = EventTarget;
    function EventTarget() {      wm.set(this, create(null));
    }
    function define(target, name, value) {
      defineProperty(
        target,
        name,
        {
          configurable: true,
          writable: true,
          value: value
        }
      );
    }
    function dispatch(info) {
      var options = info.options;
      if (options && options.once)
        info.target.removeEventListener(this.type, info.listener);
      if (typeof info.listener === 'function')
        info.listener.call(info.target, this);
      else
        info.listener.handleEvent(this);
      return this._stopImmediatePropagationFlag;
    }
  }(Object, new WeakMap));
}
var EventTarget$1 = self$1.EventTarget;

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
const AppManifestSchema = z.object({
    name: z.string(),
    description: z.string(),
    version: z.string(),
    author: z.string(),
    license: z.string(),
    showModal: z.custom().optional(),
    ConfigSchema: z.any().optional(),
    LunaApp: z.custom().optional(),
    WebApp: z.custom().optional(),
    WebGLApp: z.custom().optional(),
});

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
    constructor(id, web_asset) {
        this.id = id;
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
        expose({
            setState: (value) => this.setState(value),
            setSources: async (scope, decls) => {
                return await this.setSources(scope, decls.map(decl => {
                    return {
                        '@type': decl['@type'],
                        id: decl.id,
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
            else if (current.decl.id !== this._current_renderer_asset.id) {
                //console.info(current.decl.href, current.remainingTimeMs);
                this._closeCurrent();
                if (this._next_renderer_asset !== null
                    && current.decl.id === this._next_renderer_asset.id) {
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
            else if (next.decl.id !== this._next_renderer_asset.id) {
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
            const from_asset = this._renderer_asset_cache.get(transition.from.decl.id);
            if (typeof from_asset !== "undefined"
                && from_asset.element !== null
                && from_asset.id !== this._map1_renderer_asset?.id) {
                if (this._map1_renderer_asset !== null) {
                    this._map1_renderer_asset.unref();
                }
                from_asset.ref();
                this._setMap1Asset(from_asset);
            }
            const to_asset = this._renderer_asset_cache.get(transition.to.decl.id);
            if (typeof to_asset !== "undefined"
                && to_asset.element !== null
                && to_asset.id !== this._map2_renderer_asset?.id) {
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
                && this._current_renderer_asset.id !== this._map1_renderer_asset?.id) {
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
        this._renderer_asset_trash.set(this._current_renderer_asset.id, this._current_renderer_asset);
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
        const existing_asset = this._renderer_asset_cache.get(decl.id);
        if (typeof existing_asset !== "undefined") {
            if (this._renderer_asset_trash.has(decl.id)) {
                this._renderer_asset_trash.delete(decl.id);
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
        const renderer_asset = new WebRendererAsset(decl.id, web_asset);
        this._renderer_asset_cache.set(renderer_asset.id, renderer_asset);
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
        this._renderer_asset_trash.set(this._next_renderer_asset.id, this._next_renderer_asset);
        this._next_renderer_asset = null;
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
class RTCMesh extends EventTarget {
    label;
    id;
    configuration;
    peers;
    enable_loopback;
    channels;
    user_channels;
    connections;
    loopback1;
    loopback2;
    loopback_send_channel;
    loopback_receive_channel;
    constructor(settings) {
        super();
        this.label = settings.label;
        this.id = settings.id;
        this.configuration = {
            bundlePolicy: "max-compat",
            iceServers: settings.iceServers,
        };
        this.peers = settings.peers;
        this.enable_loopback = settings.enableLoopback;
        this.channels = new Map();
        this.user_channels = new Map();
        this.connections = new Map();
        for (const peer of this.peers) {
            if (peer === this.id) {
                continue;
            }
            this.#createRTCPeerConnection(peer);
        }
        if (this.enable_loopback) {
            (async () => {
                await this.#createLoopback();
            })();
        }
    }
    async #createLoopback() {
        try {
            this.loopback1 = new RTCPeerConnection();
            if (typeof this.loopback1 === "undefined") {
                console.error("Failed to create loopback#1 RTCPeerConnection.");
                return;
            }
            this.loopback2 = new RTCPeerConnection();
            if (typeof this.loopback2 === "undefined") {
                console.error("Failed to create loopback#2 RTCPeerConnection.");
                return;
            }
            this.loopback1.onicecandidate = (event) => {
                if (typeof this.loopback2 === "undefined") {
                    return;
                }
                // Ignore null candidate, which indicates that ICE gathering has finished.
                if (!event.candidate) {
                    return;
                }
                try {
                    this.loopback2.addIceCandidate(event.candidate);
                }
                catch (e) {
                    console.error(e);
                }
            };
            this.loopback2.onicecandidate = (event) => {
                if (typeof this.loopback1 === "undefined") {
                    return;
                }
                // Ignore null candidate, which indicates that ICE gathering has finished.
                if (!event.candidate) {
                    return;
                }
                try {
                    this.loopback1.addIceCandidate(event.candidate);
                }
                catch (e) {
                    console.error(e);
                }
            };
            this.loopback2.ondatachannel = (event) => {
                console.info('LOOPBACK', event);
                this.loopback_receive_channel = event.channel;
                this.loopback_receive_channel.onmessage = (event) => {
                    this.dispatchEvent(new CustomEvent("message", {
                        detail: event.data,
                    }));
                };
            };
            this.loopback_send_channel = this.loopback1.createDataChannel("loopback");
            const offer = await this.loopback1.createOffer();
            await this.loopback1.setLocalDescription(offer);
            await this.loopback2.setRemoteDescription(offer);
            const answer = await this.loopback2.createAnswer();
            await this.loopback2.setLocalDescription(answer);
            await this.loopback1.setRemoteDescription(answer);
        }
        catch (e) {
            console.error(e);
        }
    }
    user_channel(peer) {
        return this.user_channels.get(peer);
    }
    readyState(peer) {
        const channel = this.channels.get(peer);
        if (typeof channel === "undefined") {
            return "new";
        }
        return channel.readyState;
    }
    #createRTCPeerConnection(peer) {
        const new_connection = new RTCPeerConnection(this.configuration);
        this.connections.set(peer, new_connection);
        console.log("new connection", peer, new_connection);
    }
    #createRTCDataChannels(peer, connection) {
        console.log(`#createRTCDataChannels(${peer})`);
        this.#createPrimaryDataChannel(peer, connection);
        this.#createUserDataChannel(peer, connection);
    }
    #createPrimaryDataChannel(peer, connection) {
        const new_channel = connection.createDataChannel(this.label, {
            ordered: true,
            maxPacketLifeTime: 1000,
            negotiated: true,
            id: 0,
        });
        //		new_channel.addEventListener("bufferedamountlow", (event) => {
        //			console.log(event);
        //		});
        // Cannot re-open data channel with same id.
        new_channel.addEventListener("close", (event) => {
            console.log(event);
            //			queueMicrotask(() => this.close(peer));
        });
        new_channel.addEventListener("closing", (event) => {
            console.log(event);
        });
        new_channel.addEventListener("error", (event) => {
            console.log(event);
        });
        new_channel.addEventListener("message", (event) => {
            //			console.log(event);
            this.dispatchEvent(new CustomEvent("message", {
                detail: event.data,
            }));
        });
        new_channel.addEventListener("open", (event) => {
            console.log(event);
        });
        this.channels.set(peer, new_channel);
        console.log("new channel", peer, new_channel);
    }
    #createUserDataChannel(peer, connection) {
        const new_channel = connection.createDataChannel(this.label, {
            ordered: false,
            maxPacketLifeTime: 6000,
            negotiated: true,
            id: 1,
        });
        // Cannot re-open data channel with same id.
        new_channel.addEventListener("close", (event) => {
            console.log(event);
            this.dispatchEvent(new CustomEvent('removechannel', {
                detail: {
                    id: peer,
                }
            }));
        });
        new_channel.addEventListener("open", (event) => {
            console.log(event);
            this.dispatchEvent(new CustomEvent('addchannel', {
                detail: {
                    id: peer,
                }
            }));
        });
        this.user_channels.set(peer, new_channel);
        console.log("new user channel", peer, new_channel);
    }
    async #destroy(id) {
        console.log(`#destroy(${id})`);
        const channel = this.channels.get(id);
        if (channel instanceof RTCDataChannel) {
            if (channel.readyState !== "closed") {
                await new Promise(resolve => {
                    channel.addEventListener('close', (event) => {
                        resolve();
                    });
                });
                channel.close();
            }
            this.channels.delete(id);
        }
        const user_channel = this.user_channels.get(id);
        if (user_channel instanceof RTCDataChannel) {
            if (user_channel.readyState !== "closed") {
                await new Promise(resolve => {
                    user_channel.addEventListener('close', (event) => {
                        resolve();
                    });
                });
                user_channel.close();
            }
            this.user_channels.delete(id);
        }
        const connection = this.connections.get(id);
        if (connection instanceof RTCPeerConnection) {
            if (connection.connectionState !== "closed") {
                //				await new Promise(resolve => {
                //					connection.addEventListener('connectionstatechange', (event) => {
                //						if(connection.connectionState === "closed") {
                //							resolve();
                //							return;
                //						}
                //						connection.close();
                //					});
                //				});
                connection.close();
            }
            this.connections.delete(id);
        }
    }
    async close(id) {
        console.log(`close(${id})`);
        await this.#destroy(id);
        // REF: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/close
        // Make sure that you delete all references to the previous
        // RTCPeerConnection before attempting to create a new one that
        // connects to the same remote peer.
        queueMicrotask(() => this.#createRTCPeerConnection(id));
    }
    addIceCandidate(id, candidate) {
        console.log(`addIceCandidate(${id}, ${candidate})`);
        const connection = this.connections.get(id);
        if (typeof connection === "undefined") {
            return;
        }
        if (candidate === null) {
            return;
        }
        connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    // Origin side:
    createOffer(id) {
        console.log(`createOffer(${id})`);
        (async () => {
            const connection = this.connections.get(id);
            if (typeof connection === "undefined") {
                console.error("no connection");
                return;
            }
            connection.onconnectionstatechange = event => {
                console.log(event);
                this.#webrtc_onconnectionstatechange(connection, id);
            };
            connection.onicecandidate = event => {
                console.log(event);
                this.#webrtc_onicecandidate(connection, id, event.candidate);
            };
            try {
                this.#createRTCDataChannels(id, connection);
            }
            catch (e) {
                console.warn(e);
                try {
                    await this.close(id);
                    console.log("RTC connection closed.");
                }
                catch (e) {
                    console.warn(e);
                }
                finally {
                    const event = new CustomEvent('failed', {
                        detail: {
                            id,
                        }
                    });
                    this.dispatchEvent(event);
                }
                return;
            }
            const offer = await connection.createOffer({
                iceRestart: false,
                offerToReceiveAudio: false,
                offerToReceiveVideo: false,
            });
            // Triggering ICE candidate generation.
            await connection.setLocalDescription(offer);
            const event = new CustomEvent('offer', {
                detail: {
                    id,
                    sdp: offer.sdp,
                },
            });
            this.dispatchEvent(event);
        })();
    }
    addAnswer(id, sdp) {
        console.log(`addAnswer(${id}, ${sdp})`);
        const connection = this.connections.get(id);
        if (typeof connection === "undefined") {
            return;
        }
        const desc = new RTCSessionDescription({ type: "answer", sdp });
        connection.setRemoteDescription(desc);
    }
    broadcast(data) {
        for (const channel of this.channels.values()) {
            if (channel.readyState !== "open") {
                continue;
            }
            try {
                //				console.log("send ->", channel.label, data);
                channel.send(data);
            }
            catch (e) {
                console.warn(e);
            }
        }
        if (this.loopback_send_channel instanceof RTCDataChannel
            && this.loopback_send_channel.readyState === "open") {
            try {
                this.loopback_send_channel.send(data);
            }
            catch (e) {
                console.warn(e);
            }
        }
    }
    // Receiver side:
    createAnswer(id, sdp) {
        console.log(`createAnswer(${id}, ${sdp})`);
        (async () => {
            const connection = this.connections.get(id);
            if (typeof connection === "undefined") {
                return;
            }
            connection.onconnectionstatechange = event => {
                console.log(event);
                this.#webrtc_onconnectionstatechange(connection, id);
            };
            connection.onicecandidate = event => {
                console.log(event);
                this.#webrtc_onicecandidate(connection, id, event.candidate);
            };
            try {
                this.#createRTCDataChannels(id, connection);
            }
            catch (e) {
                console.warn(e);
                this.close(id)
                    .then(() => {
                    console.log("RTC connection closed.");
                })
                    .catch(e => {
                    console.warn(e);
                })
                    .finally(() => {
                    const event = new CustomEvent('failed', {
                        detail: {
                            id,
                        }
                    });
                    this.dispatchEvent(event);
                });
                return;
            }
            const desc = new RTCSessionDescription({ type: "offer", sdp });
            await connection.setRemoteDescription(desc);
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            const event = new CustomEvent('answer', {
                detail: {
                    id,
                    sdp: answer.sdp,
                },
            });
            this.dispatchEvent(event);
        })();
    }
    #webrtc_onconnectionstatechange(connection, id) {
        switch (connection.connectionState) {
            case 'disconnected':
                this.#webrtc_ondisconnected(connection, id);
                break;
        }
    }
    #webrtc_ondisconnected(connection, id) {
        const event = new CustomEvent('disconnected', {
            detail: {
                id,
            },
        });
        this.dispatchEvent(event);
    }
    #webrtc_onicecandidate(connection, id, candidate) {
        const event = new CustomEvent('icecandidate', {
            detail: {
                id,
                candidate,
            },
        });
        this.dispatchEvent(event);
    }
}

// Integer Utility
var UINT32_MAX = 4294967295;
// DataView extension to handle int64 / uint64,
// where the actual range is 53-bits integer (a.k.a. safe integer)
function setUint64(view, offset, value) {
    var high = value / 4294967296;
    var low = value; // high bits are truncated by DataView
    view.setUint32(offset, high);
    view.setUint32(offset + 4, low);
}
function setInt64(view, offset, value) {
    var high = Math.floor(value / 4294967296);
    var low = value; // high bits are truncated by DataView
    view.setUint32(offset, high);
    view.setUint32(offset + 4, low);
}
function getInt64(view, offset) {
    var high = view.getInt32(offset);
    var low = view.getUint32(offset + 4);
    return high * 4294967296 + low;
}
function getUint64(view, offset) {
    var high = view.getUint32(offset);
    var low = view.getUint32(offset + 4);
    return high * 4294967296 + low;
}

var _a, _b, _c;
var TEXT_ENCODING_AVAILABLE = (typeof process === "undefined" || ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a["TEXT_ENCODING"]) !== "never") &&
    typeof TextEncoder !== "undefined" &&
    typeof TextDecoder !== "undefined";
function utf8Count(str) {
    var strLength = str.length;
    var byteLength = 0;
    var pos = 0;
    while (pos < strLength) {
        var value = str.charCodeAt(pos++);
        if ((value & 0xffffff80) === 0) {
            // 1-byte
            byteLength++;
            continue;
        }
        else if ((value & 0xfffff800) === 0) {
            // 2-bytes
            byteLength += 2;
        }
        else {
            // handle surrogate pair
            if (value >= 0xd800 && value <= 0xdbff) {
                // high surrogate
                if (pos < strLength) {
                    var extra = str.charCodeAt(pos);
                    if ((extra & 0xfc00) === 0xdc00) {
                        ++pos;
                        value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                    }
                }
            }
            if ((value & 0xffff0000) === 0) {
                // 3-byte
                byteLength += 3;
            }
            else {
                // 4-byte
                byteLength += 4;
            }
        }
    }
    return byteLength;
}
function utf8EncodeJs(str, output, outputOffset) {
    var strLength = str.length;
    var offset = outputOffset;
    var pos = 0;
    while (pos < strLength) {
        var value = str.charCodeAt(pos++);
        if ((value & 0xffffff80) === 0) {
            // 1-byte
            output[offset++] = value;
            continue;
        }
        else if ((value & 0xfffff800) === 0) {
            // 2-bytes
            output[offset++] = ((value >> 6) & 0x1f) | 0xc0;
        }
        else {
            // handle surrogate pair
            if (value >= 0xd800 && value <= 0xdbff) {
                // high surrogate
                if (pos < strLength) {
                    var extra = str.charCodeAt(pos);
                    if ((extra & 0xfc00) === 0xdc00) {
                        ++pos;
                        value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                    }
                }
            }
            if ((value & 0xffff0000) === 0) {
                // 3-byte
                output[offset++] = ((value >> 12) & 0x0f) | 0xe0;
                output[offset++] = ((value >> 6) & 0x3f) | 0x80;
            }
            else {
                // 4-byte
                output[offset++] = ((value >> 18) & 0x07) | 0xf0;
                output[offset++] = ((value >> 12) & 0x3f) | 0x80;
                output[offset++] = ((value >> 6) & 0x3f) | 0x80;
            }
        }
        output[offset++] = (value & 0x3f) | 0x80;
    }
}
var sharedTextEncoder = TEXT_ENCODING_AVAILABLE ? new TextEncoder() : undefined;
var TEXT_ENCODER_THRESHOLD = !TEXT_ENCODING_AVAILABLE
    ? UINT32_MAX
    : typeof process !== "undefined" && ((_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b["TEXT_ENCODING"]) !== "force"
        ? 200
        : 0;
function utf8EncodeTEencode(str, output, outputOffset) {
    output.set(sharedTextEncoder.encode(str), outputOffset);
}
function utf8EncodeTEencodeInto(str, output, outputOffset) {
    sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
}
var utf8EncodeTE = (sharedTextEncoder === null || sharedTextEncoder === void 0 ? void 0 : sharedTextEncoder.encodeInto) ? utf8EncodeTEencodeInto : utf8EncodeTEencode;
var CHUNK_SIZE = 4096;
function utf8DecodeJs(bytes, inputOffset, byteLength) {
    var offset = inputOffset;
    var end = offset + byteLength;
    var units = [];
    var result = "";
    while (offset < end) {
        var byte1 = bytes[offset++];
        if ((byte1 & 0x80) === 0) {
            // 1 byte
            units.push(byte1);
        }
        else if ((byte1 & 0xe0) === 0xc0) {
            // 2 bytes
            var byte2 = bytes[offset++] & 0x3f;
            units.push(((byte1 & 0x1f) << 6) | byte2);
        }
        else if ((byte1 & 0xf0) === 0xe0) {
            // 3 bytes
            var byte2 = bytes[offset++] & 0x3f;
            var byte3 = bytes[offset++] & 0x3f;
            units.push(((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3);
        }
        else if ((byte1 & 0xf8) === 0xf0) {
            // 4 bytes
            var byte2 = bytes[offset++] & 0x3f;
            var byte3 = bytes[offset++] & 0x3f;
            var byte4 = bytes[offset++] & 0x3f;
            var unit = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
            if (unit > 0xffff) {
                unit -= 0x10000;
                units.push(((unit >>> 10) & 0x3ff) | 0xd800);
                unit = 0xdc00 | (unit & 0x3ff);
            }
            units.push(unit);
        }
        else {
            units.push(byte1);
        }
        if (units.length >= CHUNK_SIZE) {
            result += String.fromCharCode.apply(String, units);
            units.length = 0;
        }
    }
    if (units.length > 0) {
        result += String.fromCharCode.apply(String, units);
    }
    return result;
}
var sharedTextDecoder = TEXT_ENCODING_AVAILABLE ? new TextDecoder() : null;
var TEXT_DECODER_THRESHOLD = !TEXT_ENCODING_AVAILABLE
    ? UINT32_MAX
    : typeof process !== "undefined" && ((_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c["TEXT_DECODER"]) !== "force"
        ? 200
        : 0;
function utf8DecodeTD(bytes, inputOffset, byteLength) {
    var stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
    return sharedTextDecoder.decode(stringBytes);
}

/**
 * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
 */
var ExtData = /** @class */ (function () {
    function ExtData(type, data) {
        this.type = type;
        this.data = data;
    }
    return ExtData;
}());

var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var DecodeError = /** @class */ (function (_super) {
    __extends(DecodeError, _super);
    function DecodeError(message) {
        var _this = _super.call(this, message) || this;
        // fix the prototype chain in a cross-platform way
        var proto = Object.create(DecodeError.prototype);
        Object.setPrototypeOf(_this, proto);
        Object.defineProperty(_this, "name", {
            configurable: true,
            enumerable: false,
            value: DecodeError.name,
        });
        return _this;
    }
    return DecodeError;
}(Error));

// https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
var EXT_TIMESTAMP = -1;
var TIMESTAMP32_MAX_SEC = 0x100000000 - 1; // 32-bit unsigned int
var TIMESTAMP64_MAX_SEC = 0x400000000 - 1; // 34-bit unsigned int
function encodeTimeSpecToTimestamp(_a) {
    var sec = _a.sec, nsec = _a.nsec;
    if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
        // Here sec >= 0 && nsec >= 0
        if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
            // timestamp 32 = { sec32 (unsigned) }
            var rv = new Uint8Array(4);
            var view = new DataView(rv.buffer);
            view.setUint32(0, sec);
            return rv;
        }
        else {
            // timestamp 64 = { nsec30 (unsigned), sec34 (unsigned) }
            var secHigh = sec / 0x100000000;
            var secLow = sec & 0xffffffff;
            var rv = new Uint8Array(8);
            var view = new DataView(rv.buffer);
            // nsec30 | secHigh2
            view.setUint32(0, (nsec << 2) | (secHigh & 0x3));
            // secLow32
            view.setUint32(4, secLow);
            return rv;
        }
    }
    else {
        // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }
        var rv = new Uint8Array(12);
        var view = new DataView(rv.buffer);
        view.setUint32(0, nsec);
        setInt64(view, 4, sec);
        return rv;
    }
}
function encodeDateToTimeSpec(date) {
    var msec = date.getTime();
    var sec = Math.floor(msec / 1e3);
    var nsec = (msec - sec * 1e3) * 1e6;
    // Normalizes { sec, nsec } to ensure nsec is unsigned.
    var nsecInSec = Math.floor(nsec / 1e9);
    return {
        sec: sec + nsecInSec,
        nsec: nsec - nsecInSec * 1e9,
    };
}
function encodeTimestampExtension(object) {
    if (object instanceof Date) {
        var timeSpec = encodeDateToTimeSpec(object);
        return encodeTimeSpecToTimestamp(timeSpec);
    }
    else {
        return null;
    }
}
function decodeTimestampToTimeSpec(data) {
    var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    // data may be 32, 64, or 96 bits
    switch (data.byteLength) {
        case 4: {
            // timestamp 32 = { sec32 }
            var sec = view.getUint32(0);
            var nsec = 0;
            return { sec: sec, nsec: nsec };
        }
        case 8: {
            // timestamp 64 = { nsec30, sec34 }
            var nsec30AndSecHigh2 = view.getUint32(0);
            var secLow32 = view.getUint32(4);
            var sec = (nsec30AndSecHigh2 & 0x3) * 0x100000000 + secLow32;
            var nsec = nsec30AndSecHigh2 >>> 2;
            return { sec: sec, nsec: nsec };
        }
        case 12: {
            // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }
            var sec = getInt64(view, 4);
            var nsec = view.getUint32(0);
            return { sec: sec, nsec: nsec };
        }
        default:
            throw new DecodeError("Unrecognized data size for timestamp (expected 4, 8, or 12): ".concat(data.length));
    }
}
function decodeTimestampExtension(data) {
    var timeSpec = decodeTimestampToTimeSpec(data);
    return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
}
var timestampExtension = {
    type: EXT_TIMESTAMP,
    encode: encodeTimestampExtension,
    decode: decodeTimestampExtension,
};

// ExtensionCodec to handle MessagePack extensions
var ExtensionCodec = /** @class */ (function () {
    function ExtensionCodec() {
        // built-in extensions
        this.builtInEncoders = [];
        this.builtInDecoders = [];
        // custom extensions
        this.encoders = [];
        this.decoders = [];
        this.register(timestampExtension);
    }
    ExtensionCodec.prototype.register = function (_a) {
        var type = _a.type, encode = _a.encode, decode = _a.decode;
        if (type >= 0) {
            // custom extensions
            this.encoders[type] = encode;
            this.decoders[type] = decode;
        }
        else {
            // built-in extensions
            var index = 1 + type;
            this.builtInEncoders[index] = encode;
            this.builtInDecoders[index] = decode;
        }
    };
    ExtensionCodec.prototype.tryToEncode = function (object, context) {
        // built-in extensions
        for (var i = 0; i < this.builtInEncoders.length; i++) {
            var encodeExt = this.builtInEncoders[i];
            if (encodeExt != null) {
                var data = encodeExt(object, context);
                if (data != null) {
                    var type = -1 - i;
                    return new ExtData(type, data);
                }
            }
        }
        // custom extensions
        for (var i = 0; i < this.encoders.length; i++) {
            var encodeExt = this.encoders[i];
            if (encodeExt != null) {
                var data = encodeExt(object, context);
                if (data != null) {
                    var type = i;
                    return new ExtData(type, data);
                }
            }
        }
        if (object instanceof ExtData) {
            // to keep ExtData as is
            return object;
        }
        return null;
    };
    ExtensionCodec.prototype.decode = function (data, type, context) {
        var decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
        if (decodeExt) {
            return decodeExt(data, type, context);
        }
        else {
            // decode() does not fail, returns ExtData instead.
            return new ExtData(type, data);
        }
    };
    ExtensionCodec.defaultCodec = new ExtensionCodec();
    return ExtensionCodec;
}());

function ensureUint8Array(buffer) {
    if (buffer instanceof Uint8Array) {
        return buffer;
    }
    else if (ArrayBuffer.isView(buffer)) {
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }
    else if (buffer instanceof ArrayBuffer) {
        return new Uint8Array(buffer);
    }
    else {
        // ArrayLike<number>
        return Uint8Array.from(buffer);
    }
}
function createDataView(buffer) {
    if (buffer instanceof ArrayBuffer) {
        return new DataView(buffer);
    }
    var bufferView = ensureUint8Array(buffer);
    return new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
}

var DEFAULT_MAX_DEPTH = 100;
var DEFAULT_INITIAL_BUFFER_SIZE = 2048;
var Encoder = /** @class */ (function () {
    function Encoder(extensionCodec, context, maxDepth, initialBufferSize, sortKeys, forceFloat32, ignoreUndefined, forceIntegerToFloat) {
        if (extensionCodec === void 0) { extensionCodec = ExtensionCodec.defaultCodec; }
        if (context === void 0) { context = undefined; }
        if (maxDepth === void 0) { maxDepth = DEFAULT_MAX_DEPTH; }
        if (initialBufferSize === void 0) { initialBufferSize = DEFAULT_INITIAL_BUFFER_SIZE; }
        if (sortKeys === void 0) { sortKeys = false; }
        if (forceFloat32 === void 0) { forceFloat32 = false; }
        if (ignoreUndefined === void 0) { ignoreUndefined = false; }
        if (forceIntegerToFloat === void 0) { forceIntegerToFloat = false; }
        this.extensionCodec = extensionCodec;
        this.context = context;
        this.maxDepth = maxDepth;
        this.initialBufferSize = initialBufferSize;
        this.sortKeys = sortKeys;
        this.forceFloat32 = forceFloat32;
        this.ignoreUndefined = ignoreUndefined;
        this.forceIntegerToFloat = forceIntegerToFloat;
        this.pos = 0;
        this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
        this.bytes = new Uint8Array(this.view.buffer);
    }
    Encoder.prototype.reinitializeState = function () {
        this.pos = 0;
    };
    /**
     * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
     *
     * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
     */
    Encoder.prototype.encodeSharedRef = function (object) {
        this.reinitializeState();
        this.doEncode(object, 1);
        return this.bytes.subarray(0, this.pos);
    };
    /**
     * @returns Encodes the object and returns a copy of the encoder's internal buffer.
     */
    Encoder.prototype.encode = function (object) {
        this.reinitializeState();
        this.doEncode(object, 1);
        return this.bytes.slice(0, this.pos);
    };
    Encoder.prototype.doEncode = function (object, depth) {
        if (depth > this.maxDepth) {
            throw new Error("Too deep objects in depth ".concat(depth));
        }
        if (object == null) {
            this.encodeNil();
        }
        else if (typeof object === "boolean") {
            this.encodeBoolean(object);
        }
        else if (typeof object === "number") {
            this.encodeNumber(object);
        }
        else if (typeof object === "string") {
            this.encodeString(object);
        }
        else {
            this.encodeObject(object, depth);
        }
    };
    Encoder.prototype.ensureBufferSizeToWrite = function (sizeToWrite) {
        var requiredSize = this.pos + sizeToWrite;
        if (this.view.byteLength < requiredSize) {
            this.resizeBuffer(requiredSize * 2);
        }
    };
    Encoder.prototype.resizeBuffer = function (newSize) {
        var newBuffer = new ArrayBuffer(newSize);
        var newBytes = new Uint8Array(newBuffer);
        var newView = new DataView(newBuffer);
        newBytes.set(this.bytes);
        this.view = newView;
        this.bytes = newBytes;
    };
    Encoder.prototype.encodeNil = function () {
        this.writeU8(0xc0);
    };
    Encoder.prototype.encodeBoolean = function (object) {
        if (object === false) {
            this.writeU8(0xc2);
        }
        else {
            this.writeU8(0xc3);
        }
    };
    Encoder.prototype.encodeNumber = function (object) {
        if (Number.isSafeInteger(object) && !this.forceIntegerToFloat) {
            if (object >= 0) {
                if (object < 0x80) {
                    // positive fixint
                    this.writeU8(object);
                }
                else if (object < 0x100) {
                    // uint 8
                    this.writeU8(0xcc);
                    this.writeU8(object);
                }
                else if (object < 0x10000) {
                    // uint 16
                    this.writeU8(0xcd);
                    this.writeU16(object);
                }
                else if (object < 0x100000000) {
                    // uint 32
                    this.writeU8(0xce);
                    this.writeU32(object);
                }
                else {
                    // uint 64
                    this.writeU8(0xcf);
                    this.writeU64(object);
                }
            }
            else {
                if (object >= -32) {
                    // negative fixint
                    this.writeU8(0xe0 | (object + 0x20));
                }
                else if (object >= -128) {
                    // int 8
                    this.writeU8(0xd0);
                    this.writeI8(object);
                }
                else if (object >= -32768) {
                    // int 16
                    this.writeU8(0xd1);
                    this.writeI16(object);
                }
                else if (object >= -2147483648) {
                    // int 32
                    this.writeU8(0xd2);
                    this.writeI32(object);
                }
                else {
                    // int 64
                    this.writeU8(0xd3);
                    this.writeI64(object);
                }
            }
        }
        else {
            // non-integer numbers
            if (this.forceFloat32) {
                // float 32
                this.writeU8(0xca);
                this.writeF32(object);
            }
            else {
                // float 64
                this.writeU8(0xcb);
                this.writeF64(object);
            }
        }
    };
    Encoder.prototype.writeStringHeader = function (byteLength) {
        if (byteLength < 32) {
            // fixstr
            this.writeU8(0xa0 + byteLength);
        }
        else if (byteLength < 0x100) {
            // str 8
            this.writeU8(0xd9);
            this.writeU8(byteLength);
        }
        else if (byteLength < 0x10000) {
            // str 16
            this.writeU8(0xda);
            this.writeU16(byteLength);
        }
        else if (byteLength < 0x100000000) {
            // str 32
            this.writeU8(0xdb);
            this.writeU32(byteLength);
        }
        else {
            throw new Error("Too long string: ".concat(byteLength, " bytes in UTF-8"));
        }
    };
    Encoder.prototype.encodeString = function (object) {
        var maxHeaderSize = 1 + 4;
        var strLength = object.length;
        if (strLength > TEXT_ENCODER_THRESHOLD) {
            var byteLength = utf8Count(object);
            this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
            this.writeStringHeader(byteLength);
            utf8EncodeTE(object, this.bytes, this.pos);
            this.pos += byteLength;
        }
        else {
            var byteLength = utf8Count(object);
            this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
            this.writeStringHeader(byteLength);
            utf8EncodeJs(object, this.bytes, this.pos);
            this.pos += byteLength;
        }
    };
    Encoder.prototype.encodeObject = function (object, depth) {
        // try to encode objects with custom codec first of non-primitives
        var ext = this.extensionCodec.tryToEncode(object, this.context);
        if (ext != null) {
            this.encodeExtension(ext);
        }
        else if (Array.isArray(object)) {
            this.encodeArray(object, depth);
        }
        else if (ArrayBuffer.isView(object)) {
            this.encodeBinary(object);
        }
        else if (typeof object === "object") {
            this.encodeMap(object, depth);
        }
        else {
            // symbol, function and other special object come here unless extensionCodec handles them.
            throw new Error("Unrecognized object: ".concat(Object.prototype.toString.apply(object)));
        }
    };
    Encoder.prototype.encodeBinary = function (object) {
        var size = object.byteLength;
        if (size < 0x100) {
            // bin 8
            this.writeU8(0xc4);
            this.writeU8(size);
        }
        else if (size < 0x10000) {
            // bin 16
            this.writeU8(0xc5);
            this.writeU16(size);
        }
        else if (size < 0x100000000) {
            // bin 32
            this.writeU8(0xc6);
            this.writeU32(size);
        }
        else {
            throw new Error("Too large binary: ".concat(size));
        }
        var bytes = ensureUint8Array(object);
        this.writeU8a(bytes);
    };
    Encoder.prototype.encodeArray = function (object, depth) {
        var size = object.length;
        if (size < 16) {
            // fixarray
            this.writeU8(0x90 + size);
        }
        else if (size < 0x10000) {
            // array 16
            this.writeU8(0xdc);
            this.writeU16(size);
        }
        else if (size < 0x100000000) {
            // array 32
            this.writeU8(0xdd);
            this.writeU32(size);
        }
        else {
            throw new Error("Too large array: ".concat(size));
        }
        for (var _i = 0, object_1 = object; _i < object_1.length; _i++) {
            var item = object_1[_i];
            this.doEncode(item, depth + 1);
        }
    };
    Encoder.prototype.countWithoutUndefined = function (object, keys) {
        var count = 0;
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            if (object[key] !== undefined) {
                count++;
            }
        }
        return count;
    };
    Encoder.prototype.encodeMap = function (object, depth) {
        var keys = Object.keys(object);
        if (this.sortKeys) {
            keys.sort();
        }
        var size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
        if (size < 16) {
            // fixmap
            this.writeU8(0x80 + size);
        }
        else if (size < 0x10000) {
            // map 16
            this.writeU8(0xde);
            this.writeU16(size);
        }
        else if (size < 0x100000000) {
            // map 32
            this.writeU8(0xdf);
            this.writeU32(size);
        }
        else {
            throw new Error("Too large map object: ".concat(size));
        }
        for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
            var key = keys_2[_i];
            var value = object[key];
            if (!(this.ignoreUndefined && value === undefined)) {
                this.encodeString(key);
                this.doEncode(value, depth + 1);
            }
        }
    };
    Encoder.prototype.encodeExtension = function (ext) {
        var size = ext.data.length;
        if (size === 1) {
            // fixext 1
            this.writeU8(0xd4);
        }
        else if (size === 2) {
            // fixext 2
            this.writeU8(0xd5);
        }
        else if (size === 4) {
            // fixext 4
            this.writeU8(0xd6);
        }
        else if (size === 8) {
            // fixext 8
            this.writeU8(0xd7);
        }
        else if (size === 16) {
            // fixext 16
            this.writeU8(0xd8);
        }
        else if (size < 0x100) {
            // ext 8
            this.writeU8(0xc7);
            this.writeU8(size);
        }
        else if (size < 0x10000) {
            // ext 16
            this.writeU8(0xc8);
            this.writeU16(size);
        }
        else if (size < 0x100000000) {
            // ext 32
            this.writeU8(0xc9);
            this.writeU32(size);
        }
        else {
            throw new Error("Too large extension object: ".concat(size));
        }
        this.writeI8(ext.type);
        this.writeU8a(ext.data);
    };
    Encoder.prototype.writeU8 = function (value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setUint8(this.pos, value);
        this.pos++;
    };
    Encoder.prototype.writeU8a = function (values) {
        var size = values.length;
        this.ensureBufferSizeToWrite(size);
        this.bytes.set(values, this.pos);
        this.pos += size;
    };
    Encoder.prototype.writeI8 = function (value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setInt8(this.pos, value);
        this.pos++;
    };
    Encoder.prototype.writeU16 = function (value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setUint16(this.pos, value);
        this.pos += 2;
    };
    Encoder.prototype.writeI16 = function (value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setInt16(this.pos, value);
        this.pos += 2;
    };
    Encoder.prototype.writeU32 = function (value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setUint32(this.pos, value);
        this.pos += 4;
    };
    Encoder.prototype.writeI32 = function (value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setInt32(this.pos, value);
        this.pos += 4;
    };
    Encoder.prototype.writeF32 = function (value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setFloat32(this.pos, value);
        this.pos += 4;
    };
    Encoder.prototype.writeF64 = function (value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setFloat64(this.pos, value);
        this.pos += 8;
    };
    Encoder.prototype.writeU64 = function (value) {
        this.ensureBufferSizeToWrite(8);
        setUint64(this.view, this.pos, value);
        this.pos += 8;
    };
    Encoder.prototype.writeI64 = function (value) {
        this.ensureBufferSizeToWrite(8);
        setInt64(this.view, this.pos, value);
        this.pos += 8;
    };
    return Encoder;
}());

var defaultEncodeOptions = {};
/**
 * It encodes `value` in the MessagePack format and
 * returns a byte buffer.
 *
 * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset` and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
 */
function encode(value, options) {
    if (options === void 0) { options = defaultEncodeOptions; }
    var encoder = new Encoder(options.extensionCodec, options.context, options.maxDepth, options.initialBufferSize, options.sortKeys, options.forceFloat32, options.ignoreUndefined, options.forceIntegerToFloat);
    return encoder.encodeSharedRef(value);
}

function prettyByte(byte) {
    return "".concat(byte < 0 ? "-" : "", "0x").concat(Math.abs(byte).toString(16).padStart(2, "0"));
}

var DEFAULT_MAX_KEY_LENGTH = 16;
var DEFAULT_MAX_LENGTH_PER_KEY = 16;
var CachedKeyDecoder = /** @class */ (function () {
    function CachedKeyDecoder(maxKeyLength, maxLengthPerKey) {
        if (maxKeyLength === void 0) { maxKeyLength = DEFAULT_MAX_KEY_LENGTH; }
        if (maxLengthPerKey === void 0) { maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY; }
        this.maxKeyLength = maxKeyLength;
        this.maxLengthPerKey = maxLengthPerKey;
        this.hit = 0;
        this.miss = 0;
        // avoid `new Array(N)`, which makes a sparse array,
        // because a sparse array is typically slower than a non-sparse array.
        this.caches = [];
        for (var i = 0; i < this.maxKeyLength; i++) {
            this.caches.push([]);
        }
    }
    CachedKeyDecoder.prototype.canBeCached = function (byteLength) {
        return byteLength > 0 && byteLength <= this.maxKeyLength;
    };
    CachedKeyDecoder.prototype.find = function (bytes, inputOffset, byteLength) {
        var records = this.caches[byteLength - 1];
        FIND_CHUNK: for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
            var record = records_1[_i];
            var recordBytes = record.bytes;
            for (var j = 0; j < byteLength; j++) {
                if (recordBytes[j] !== bytes[inputOffset + j]) {
                    continue FIND_CHUNK;
                }
            }
            return record.str;
        }
        return null;
    };
    CachedKeyDecoder.prototype.store = function (bytes, value) {
        var records = this.caches[bytes.length - 1];
        var record = { bytes: bytes, str: value };
        if (records.length >= this.maxLengthPerKey) {
            // `records` are full!
            // Set `record` to an arbitrary position.
            records[(Math.random() * records.length) | 0] = record;
        }
        else {
            records.push(record);
        }
    };
    CachedKeyDecoder.prototype.decode = function (bytes, inputOffset, byteLength) {
        var cachedValue = this.find(bytes, inputOffset, byteLength);
        if (cachedValue != null) {
            this.hit++;
            return cachedValue;
        }
        this.miss++;
        var str = utf8DecodeJs(bytes, inputOffset, byteLength);
        // Ensure to copy a slice of bytes because the byte may be NodeJS Buffer and Buffer#slice() returns a reference to its internal ArrayBuffer.
        var slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
        this.store(slicedCopyOfBytes, str);
        return str;
    };
    return CachedKeyDecoder;
}());

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (undefined && undefined.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); };
var __asyncGenerator = (undefined && undefined.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var isValidMapKeyType = function (key) {
    var keyType = typeof key;
    return keyType === "string" || keyType === "number";
};
var HEAD_BYTE_REQUIRED = -1;
var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
// IE11: Hack to support IE11.
// IE11: Drop this hack and just use RangeError when IE11 is obsolete.
var DataViewIndexOutOfBoundsError = (function () {
    try {
        // IE11: The spec says it should throw RangeError,
        // IE11: but in IE11 it throws TypeError.
        EMPTY_VIEW.getInt8(0);
    }
    catch (e) {
        return e.constructor;
    }
    throw new Error("never reached");
})();
var MORE_DATA = new DataViewIndexOutOfBoundsError("Insufficient data");
var sharedCachedKeyDecoder = new CachedKeyDecoder();
var Decoder = /** @class */ (function () {
    function Decoder(extensionCodec, context, maxStrLength, maxBinLength, maxArrayLength, maxMapLength, maxExtLength, keyDecoder) {
        if (extensionCodec === void 0) { extensionCodec = ExtensionCodec.defaultCodec; }
        if (context === void 0) { context = undefined; }
        if (maxStrLength === void 0) { maxStrLength = UINT32_MAX; }
        if (maxBinLength === void 0) { maxBinLength = UINT32_MAX; }
        if (maxArrayLength === void 0) { maxArrayLength = UINT32_MAX; }
        if (maxMapLength === void 0) { maxMapLength = UINT32_MAX; }
        if (maxExtLength === void 0) { maxExtLength = UINT32_MAX; }
        if (keyDecoder === void 0) { keyDecoder = sharedCachedKeyDecoder; }
        this.extensionCodec = extensionCodec;
        this.context = context;
        this.maxStrLength = maxStrLength;
        this.maxBinLength = maxBinLength;
        this.maxArrayLength = maxArrayLength;
        this.maxMapLength = maxMapLength;
        this.maxExtLength = maxExtLength;
        this.keyDecoder = keyDecoder;
        this.totalPos = 0;
        this.pos = 0;
        this.view = EMPTY_VIEW;
        this.bytes = EMPTY_BYTES;
        this.headByte = HEAD_BYTE_REQUIRED;
        this.stack = [];
    }
    Decoder.prototype.reinitializeState = function () {
        this.totalPos = 0;
        this.headByte = HEAD_BYTE_REQUIRED;
        this.stack.length = 0;
        // view, bytes, and pos will be re-initialized in setBuffer()
    };
    Decoder.prototype.setBuffer = function (buffer) {
        this.bytes = ensureUint8Array(buffer);
        this.view = createDataView(this.bytes);
        this.pos = 0;
    };
    Decoder.prototype.appendBuffer = function (buffer) {
        if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
            this.setBuffer(buffer);
        }
        else {
            var remainingData = this.bytes.subarray(this.pos);
            var newData = ensureUint8Array(buffer);
            // concat remainingData + newData
            var newBuffer = new Uint8Array(remainingData.length + newData.length);
            newBuffer.set(remainingData);
            newBuffer.set(newData, remainingData.length);
            this.setBuffer(newBuffer);
        }
    };
    Decoder.prototype.hasRemaining = function (size) {
        return this.view.byteLength - this.pos >= size;
    };
    Decoder.prototype.createExtraByteError = function (posToShow) {
        var _a = this, view = _a.view, pos = _a.pos;
        return new RangeError("Extra ".concat(view.byteLength - pos, " of ").concat(view.byteLength, " byte(s) found at buffer[").concat(posToShow, "]"));
    };
    /**
     * @throws {@link DecodeError}
     * @throws {@link RangeError}
     */
    Decoder.prototype.decode = function (buffer) {
        this.reinitializeState();
        this.setBuffer(buffer);
        var object = this.doDecodeSync();
        if (this.hasRemaining(1)) {
            throw this.createExtraByteError(this.pos);
        }
        return object;
    };
    Decoder.prototype.decodeMulti = function (buffer) {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    this.reinitializeState();
                    this.setBuffer(buffer);
                    _a.label = 1;
                case 1:
                    if (!this.hasRemaining(1)) return [3 /*break*/, 3];
                    return [4 /*yield*/, this.doDecodeSync()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
    Decoder.prototype.decodeAsync = function (stream) {
        var stream_1, stream_1_1;
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var decoded, object, buffer, e_1_1, _b, headByte, pos, totalPos;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        decoded = false;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, 7, 12]);
                        stream_1 = __asyncValues(stream);
                        _c.label = 2;
                    case 2: return [4 /*yield*/, stream_1.next()];
                    case 3:
                        if (!(stream_1_1 = _c.sent(), !stream_1_1.done)) return [3 /*break*/, 5];
                        buffer = stream_1_1.value;
                        if (decoded) {
                            throw this.createExtraByteError(this.totalPos);
                        }
                        this.appendBuffer(buffer);
                        try {
                            object = this.doDecodeSync();
                            decoded = true;
                        }
                        catch (e) {
                            if (!(e instanceof DataViewIndexOutOfBoundsError)) {
                                throw e; // rethrow
                            }
                            // fallthrough
                        }
                        this.totalPos += this.pos;
                        _c.label = 4;
                    case 4: return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_1_1 = _c.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _c.trys.push([7, , 10, 11]);
                        if (!(stream_1_1 && !stream_1_1.done && (_a = stream_1.return))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _a.call(stream_1)];
                    case 8:
                        _c.sent();
                        _c.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12:
                        if (decoded) {
                            if (this.hasRemaining(1)) {
                                throw this.createExtraByteError(this.totalPos);
                            }
                            return [2 /*return*/, object];
                        }
                        _b = this, headByte = _b.headByte, pos = _b.pos, totalPos = _b.totalPos;
                        throw new RangeError("Insufficient data in parsing ".concat(prettyByte(headByte), " at ").concat(totalPos, " (").concat(pos, " in the current buffer)"));
                }
            });
        });
    };
    Decoder.prototype.decodeArrayStream = function (stream) {
        return this.decodeMultiAsync(stream, true);
    };
    Decoder.prototype.decodeStream = function (stream) {
        return this.decodeMultiAsync(stream, false);
    };
    Decoder.prototype.decodeMultiAsync = function (stream, isArray) {
        return __asyncGenerator(this, arguments, function decodeMultiAsync_1() {
            var isArrayHeaderRequired, arrayItemsLeft, stream_2, stream_2_1, buffer, e_2, e_3_1;
            var e_3, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        isArrayHeaderRequired = isArray;
                        arrayItemsLeft = -1;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, 14, 19]);
                        stream_2 = __asyncValues(stream);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, __await(stream_2.next())];
                    case 3:
                        if (!(stream_2_1 = _b.sent(), !stream_2_1.done)) return [3 /*break*/, 12];
                        buffer = stream_2_1.value;
                        if (isArray && arrayItemsLeft === 0) {
                            throw this.createExtraByteError(this.totalPos);
                        }
                        this.appendBuffer(buffer);
                        if (isArrayHeaderRequired) {
                            arrayItemsLeft = this.readArraySize();
                            isArrayHeaderRequired = false;
                            this.complete();
                        }
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 9, , 10]);
                        _b.label = 5;
                    case 5:
                        return [4 /*yield*/, __await(this.doDecodeSync())];
                    case 6: return [4 /*yield*/, _b.sent()];
                    case 7:
                        _b.sent();
                        if (--arrayItemsLeft === 0) {
                            return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_2 = _b.sent();
                        if (!(e_2 instanceof DataViewIndexOutOfBoundsError)) {
                            throw e_2; // rethrow
                        }
                        return [3 /*break*/, 10];
                    case 10:
                        this.totalPos += this.pos;
                        _b.label = 11;
                    case 11: return [3 /*break*/, 2];
                    case 12: return [3 /*break*/, 19];
                    case 13:
                        e_3_1 = _b.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 19];
                    case 14:
                        _b.trys.push([14, , 17, 18]);
                        if (!(stream_2_1 && !stream_2_1.done && (_a = stream_2.return))) return [3 /*break*/, 16];
                        return [4 /*yield*/, __await(_a.call(stream_2))];
                    case 15:
                        _b.sent();
                        _b.label = 16;
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        if (e_3) throw e_3.error;
                        return [7 /*endfinally*/];
                    case 18: return [7 /*endfinally*/];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    Decoder.prototype.doDecodeSync = function () {
        DECODE: while (true) {
            var headByte = this.readHeadByte();
            var object = void 0;
            if (headByte >= 0xe0) {
                // negative fixint (111x xxxx) 0xe0 - 0xff
                object = headByte - 0x100;
            }
            else if (headByte < 0xc0) {
                if (headByte < 0x80) {
                    // positive fixint (0xxx xxxx) 0x00 - 0x7f
                    object = headByte;
                }
                else if (headByte < 0x90) {
                    // fixmap (1000 xxxx) 0x80 - 0x8f
                    var size = headByte - 0x80;
                    if (size !== 0) {
                        this.pushMapState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = {};
                    }
                }
                else if (headByte < 0xa0) {
                    // fixarray (1001 xxxx) 0x90 - 0x9f
                    var size = headByte - 0x90;
                    if (size !== 0) {
                        this.pushArrayState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = [];
                    }
                }
                else {
                    // fixstr (101x xxxx) 0xa0 - 0xbf
                    var byteLength = headByte - 0xa0;
                    object = this.decodeUtf8String(byteLength, 0);
                }
            }
            else if (headByte === 0xc0) {
                // nil
                object = null;
            }
            else if (headByte === 0xc2) {
                // false
                object = false;
            }
            else if (headByte === 0xc3) {
                // true
                object = true;
            }
            else if (headByte === 0xca) {
                // float 32
                object = this.readF32();
            }
            else if (headByte === 0xcb) {
                // float 64
                object = this.readF64();
            }
            else if (headByte === 0xcc) {
                // uint 8
                object = this.readU8();
            }
            else if (headByte === 0xcd) {
                // uint 16
                object = this.readU16();
            }
            else if (headByte === 0xce) {
                // uint 32
                object = this.readU32();
            }
            else if (headByte === 0xcf) {
                // uint 64
                object = this.readU64();
            }
            else if (headByte === 0xd0) {
                // int 8
                object = this.readI8();
            }
            else if (headByte === 0xd1) {
                // int 16
                object = this.readI16();
            }
            else if (headByte === 0xd2) {
                // int 32
                object = this.readI32();
            }
            else if (headByte === 0xd3) {
                // int 64
                object = this.readI64();
            }
            else if (headByte === 0xd9) {
                // str 8
                var byteLength = this.lookU8();
                object = this.decodeUtf8String(byteLength, 1);
            }
            else if (headByte === 0xda) {
                // str 16
                var byteLength = this.lookU16();
                object = this.decodeUtf8String(byteLength, 2);
            }
            else if (headByte === 0xdb) {
                // str 32
                var byteLength = this.lookU32();
                object = this.decodeUtf8String(byteLength, 4);
            }
            else if (headByte === 0xdc) {
                // array 16
                var size = this.readU16();
                if (size !== 0) {
                    this.pushArrayState(size);
                    this.complete();
                    continue DECODE;
                }
                else {
                    object = [];
                }
            }
            else if (headByte === 0xdd) {
                // array 32
                var size = this.readU32();
                if (size !== 0) {
                    this.pushArrayState(size);
                    this.complete();
                    continue DECODE;
                }
                else {
                    object = [];
                }
            }
            else if (headByte === 0xde) {
                // map 16
                var size = this.readU16();
                if (size !== 0) {
                    this.pushMapState(size);
                    this.complete();
                    continue DECODE;
                }
                else {
                    object = {};
                }
            }
            else if (headByte === 0xdf) {
                // map 32
                var size = this.readU32();
                if (size !== 0) {
                    this.pushMapState(size);
                    this.complete();
                    continue DECODE;
                }
                else {
                    object = {};
                }
            }
            else if (headByte === 0xc4) {
                // bin 8
                var size = this.lookU8();
                object = this.decodeBinary(size, 1);
            }
            else if (headByte === 0xc5) {
                // bin 16
                var size = this.lookU16();
                object = this.decodeBinary(size, 2);
            }
            else if (headByte === 0xc6) {
                // bin 32
                var size = this.lookU32();
                object = this.decodeBinary(size, 4);
            }
            else if (headByte === 0xd4) {
                // fixext 1
                object = this.decodeExtension(1, 0);
            }
            else if (headByte === 0xd5) {
                // fixext 2
                object = this.decodeExtension(2, 0);
            }
            else if (headByte === 0xd6) {
                // fixext 4
                object = this.decodeExtension(4, 0);
            }
            else if (headByte === 0xd7) {
                // fixext 8
                object = this.decodeExtension(8, 0);
            }
            else if (headByte === 0xd8) {
                // fixext 16
                object = this.decodeExtension(16, 0);
            }
            else if (headByte === 0xc7) {
                // ext 8
                var size = this.lookU8();
                object = this.decodeExtension(size, 1);
            }
            else if (headByte === 0xc8) {
                // ext 16
                var size = this.lookU16();
                object = this.decodeExtension(size, 2);
            }
            else if (headByte === 0xc9) {
                // ext 32
                var size = this.lookU32();
                object = this.decodeExtension(size, 4);
            }
            else {
                throw new DecodeError("Unrecognized type byte: ".concat(prettyByte(headByte)));
            }
            this.complete();
            var stack = this.stack;
            while (stack.length > 0) {
                // arrays and maps
                var state = stack[stack.length - 1];
                if (state.type === 0 /* State.ARRAY */) {
                    state.array[state.position] = object;
                    state.position++;
                    if (state.position === state.size) {
                        stack.pop();
                        object = state.array;
                    }
                    else {
                        continue DECODE;
                    }
                }
                else if (state.type === 1 /* State.MAP_KEY */) {
                    if (!isValidMapKeyType(object)) {
                        throw new DecodeError("The type of key must be string or number but " + typeof object);
                    }
                    if (object === "__proto__") {
                        throw new DecodeError("The key __proto__ is not allowed");
                    }
                    state.key = object;
                    state.type = 2 /* State.MAP_VALUE */;
                    continue DECODE;
                }
                else {
                    // it must be `state.type === State.MAP_VALUE` here
                    state.map[state.key] = object;
                    state.readCount++;
                    if (state.readCount === state.size) {
                        stack.pop();
                        object = state.map;
                    }
                    else {
                        state.key = null;
                        state.type = 1 /* State.MAP_KEY */;
                        continue DECODE;
                    }
                }
            }
            return object;
        }
    };
    Decoder.prototype.readHeadByte = function () {
        if (this.headByte === HEAD_BYTE_REQUIRED) {
            this.headByte = this.readU8();
            // console.log("headByte", prettyByte(this.headByte));
        }
        return this.headByte;
    };
    Decoder.prototype.complete = function () {
        this.headByte = HEAD_BYTE_REQUIRED;
    };
    Decoder.prototype.readArraySize = function () {
        var headByte = this.readHeadByte();
        switch (headByte) {
            case 0xdc:
                return this.readU16();
            case 0xdd:
                return this.readU32();
            default: {
                if (headByte < 0xa0) {
                    return headByte - 0x90;
                }
                else {
                    throw new DecodeError("Unrecognized array type byte: ".concat(prettyByte(headByte)));
                }
            }
        }
    };
    Decoder.prototype.pushMapState = function (size) {
        if (size > this.maxMapLength) {
            throw new DecodeError("Max length exceeded: map length (".concat(size, ") > maxMapLengthLength (").concat(this.maxMapLength, ")"));
        }
        this.stack.push({
            type: 1 /* State.MAP_KEY */,
            size: size,
            key: null,
            readCount: 0,
            map: {},
        });
    };
    Decoder.prototype.pushArrayState = function (size) {
        if (size > this.maxArrayLength) {
            throw new DecodeError("Max length exceeded: array length (".concat(size, ") > maxArrayLength (").concat(this.maxArrayLength, ")"));
        }
        this.stack.push({
            type: 0 /* State.ARRAY */,
            size: size,
            array: new Array(size),
            position: 0,
        });
    };
    Decoder.prototype.decodeUtf8String = function (byteLength, headerOffset) {
        var _a;
        if (byteLength > this.maxStrLength) {
            throw new DecodeError("Max length exceeded: UTF-8 byte length (".concat(byteLength, ") > maxStrLength (").concat(this.maxStrLength, ")"));
        }
        if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
            throw MORE_DATA;
        }
        var offset = this.pos + headerOffset;
        var object;
        if (this.stateIsMapKey() && ((_a = this.keyDecoder) === null || _a === void 0 ? void 0 : _a.canBeCached(byteLength))) {
            object = this.keyDecoder.decode(this.bytes, offset, byteLength);
        }
        else if (byteLength > TEXT_DECODER_THRESHOLD) {
            object = utf8DecodeTD(this.bytes, offset, byteLength);
        }
        else {
            object = utf8DecodeJs(this.bytes, offset, byteLength);
        }
        this.pos += headerOffset + byteLength;
        return object;
    };
    Decoder.prototype.stateIsMapKey = function () {
        if (this.stack.length > 0) {
            var state = this.stack[this.stack.length - 1];
            return state.type === 1 /* State.MAP_KEY */;
        }
        return false;
    };
    Decoder.prototype.decodeBinary = function (byteLength, headOffset) {
        if (byteLength > this.maxBinLength) {
            throw new DecodeError("Max length exceeded: bin length (".concat(byteLength, ") > maxBinLength (").concat(this.maxBinLength, ")"));
        }
        if (!this.hasRemaining(byteLength + headOffset)) {
            throw MORE_DATA;
        }
        var offset = this.pos + headOffset;
        var object = this.bytes.subarray(offset, offset + byteLength);
        this.pos += headOffset + byteLength;
        return object;
    };
    Decoder.prototype.decodeExtension = function (size, headOffset) {
        if (size > this.maxExtLength) {
            throw new DecodeError("Max length exceeded: ext length (".concat(size, ") > maxExtLength (").concat(this.maxExtLength, ")"));
        }
        var extType = this.view.getInt8(this.pos + headOffset);
        var data = this.decodeBinary(size, headOffset + 1 /* extType */);
        return this.extensionCodec.decode(data, extType, this.context);
    };
    Decoder.prototype.lookU8 = function () {
        return this.view.getUint8(this.pos);
    };
    Decoder.prototype.lookU16 = function () {
        return this.view.getUint16(this.pos);
    };
    Decoder.prototype.lookU32 = function () {
        return this.view.getUint32(this.pos);
    };
    Decoder.prototype.readU8 = function () {
        var value = this.view.getUint8(this.pos);
        this.pos++;
        return value;
    };
    Decoder.prototype.readI8 = function () {
        var value = this.view.getInt8(this.pos);
        this.pos++;
        return value;
    };
    Decoder.prototype.readU16 = function () {
        var value = this.view.getUint16(this.pos);
        this.pos += 2;
        return value;
    };
    Decoder.prototype.readI16 = function () {
        var value = this.view.getInt16(this.pos);
        this.pos += 2;
        return value;
    };
    Decoder.prototype.readU32 = function () {
        var value = this.view.getUint32(this.pos);
        this.pos += 4;
        return value;
    };
    Decoder.prototype.readI32 = function () {
        var value = this.view.getInt32(this.pos);
        this.pos += 4;
        return value;
    };
    Decoder.prototype.readU64 = function () {
        var value = getUint64(this.view, this.pos);
        this.pos += 8;
        return value;
    };
    Decoder.prototype.readI64 = function () {
        var value = getInt64(this.view, this.pos);
        this.pos += 8;
        return value;
    };
    Decoder.prototype.readF32 = function () {
        var value = this.view.getFloat32(this.pos);
        this.pos += 4;
        return value;
    };
    Decoder.prototype.readF64 = function () {
        var value = this.view.getFloat64(this.pos);
        this.pos += 8;
        return value;
    };
    return Decoder;
}());

var defaultDecodeOptions = {};
/**
 * It decodes a single MessagePack object in a buffer.
 *
 * This is a synchronous decoding function.
 * See other variants for asynchronous decoding: {@link decodeAsync()}, {@link decodeStream()}, or {@link decodeArrayStream()}.
 *
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
function decode(buffer, options) {
    if (options === void 0) { options = defaultDecodeOptions; }
    var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
    return decoder.decode(buffer);
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// REF: https://raft.github.io/raft.pdf


// Encapsulation of a node address and a function to send a message to it.
class RaftNode {
	#address;
	#send;
	constructor(address, send) {
		this.#address = address;
		this.#send = send;
	}
	get address() { return this.#address; }
	send(data) { this.#send(data); }
}

// Encapsulation of a message used in the Raft protocol.  This implementation
// provides two serialization options: JSON object, and JSON array.
class RaftMessage {
	#state;
	#leader;
	#term;
	#address;
	#type;
	#granted;
	constructor(state, leader, term, address, type, granted) {
		this.#state = state;
		this.#leader = leader;
		this.#term = term;
		this.#address = address;
		this.#type = type;
		this.#granted = granted;
	}
	get state() { return this.#state; }
	get leader() { return this.#leader; }
	get term() { return this.#term; }
	get address() { return this.#address; }
	get type() { return this.#type; }
	get granted() { return this.#granted; }
	toJSON() {
		return {
			state: this.#state,
			leader: this.#leader,
			term: this.#term,
			address: this.#address,
			type: this.#type,
			granted: this.#granted,
		};
	}
	static fromJSON(json) {
		const msg = new RaftMessage(json.state, json.leader, json.term, json.address, json.type, json.granted);
		return msg;
	}
	toArray() {
		return [
			this.#state,
			this.#leader,
			this.#term,
			this.#address,
			this.#type,
			this.#granted,
		]
	}
	static from(array) {
		return new RaftMessage(array[0], array[1], array[2], array[3], array[4], array[5]);
	}
	toBuffer() {
		return encode(this.toArray());
	}
	static fromBuffer(buffer) {
		const array = decode(buffer);
		return RaftMessage.from(array);
	}
}

class Raft extends EventTarget {
	// §5.1: At any given time, in one of three states: leader, follower,
	// or candidate.
	static LEADER = 1;
	static CANDIDATE = 2;
	static FOLLOWER = 3;
	static states = {
		1: "LEADER",
		2: "CANDIDATE",
		3: "FOLLOWER",
	};

	static RPC_REQUEST_VOTE = "poll";  // Initiated by candidates during elections.
	static RPC_VOTE = "vote";
	static RPC_APPEND_ENTRY = "append";  // Initiated by leaders as heartbeat.

	#address;
	#electionMinTimeout;
	#electionMaxTimeout;
	#heatbeatInterval;

	#heartbeatExpiration = undefined;
	#electionExpiration = undefined;

	#votesFor = undefined;
	#votesGranted = 0;

	#nodes = [];

	// §5.2: When nodes start up, they begin as followers.
	#state = Raft.FOLLOWER;
	#leader = undefined;
	#currentTerm = 0;

	constructor(settings) {
		super();
		this.#address = settings.address;
		this.#electionMinTimeout = settings.electionMinTimeout;
		this.#electionMaxTimeout = settings.electionMaxTimeout;
		this.#heatbeatInterval = settings.heartbeatInterval;

		// §5.2: If a follower receives no communication over a period of time
		// called the election timeout, then it assumes there is no viable
		// leader and begins an election to choose a new leader.
		this.#electionExpiration = performance.now() + this.#electionTimeout();
	}

	get leader() { return this.#state === Raft.LEADER; }

	// §5.2: A candidate wins an election if it receives votes from a
	// majority of the servers in the full cluster for the same term.
	#resetVotes() {
		this.#votesFor = undefined;
		this.#votesGranted = 0;
	}

	onRaftMessage(data, sendReply) {
//		console.log(`RAFT: onRaftMessage(${data})`);
		const msg = RaftMessage.fromBuffer(data);
		// §5.1:  Current terms are exchanged whenever servers
		// communicate
		if(msg.term > this.#currentTerm) {
			// §5.1: If a candidate or leader discovers that its
			// term is out of date, it immediately reverts to
			// follower state.
			if(this.#state !== Raft.FOLLOWER) {
				this.#state = Raft.FOLLOWER;
			}
			this.#heartbeatExpiration = undefined;
			this.#electionExpiration = performance.now() + this.#electionTimeout();
			if(this.#leader !== msg.leader) {
				this.#leader = msg.leader;
			}
			this.#currentTerm = msg.term;
			this.#resetVotes();
		} else if(msg.term < this.#currentTerm) {
			// §5.1: If a server receives a request with a stale
			// term number, it rejects the request
			return;
		}

		switch(this.#state) {
		case Raft.FOLLOWER:
			switch(msg.type) {
			case Raft.RPC_REQUEST_VOTE:
				this.#onRequestVote(msg, sendReply);
				break;
			case Raft.RPC_APPEND_ENTRY:
				// §5.2: Leaders send periodic heartbeats to
				// all followers in order to maintain their
				// authority.
				this.#electionExpiration = performance.now() + this.#electionTimeout();
				break;
			}
			break;
		case Raft.CANDIDATE:
			switch(msg.type) {
			case Raft.RPC_VOTE:
				this.#onVote(msg);
				break;
			case Raft.RPC_APPEND_ENTRY:
				// §5.2: If the leader’s term is at least
				// as large as the candidate’s current term,
				// then the candidate recognizes the leader as
				// legitimate and returns to follower state.
				this.#leader = msg.leader;
				this.#state = Raft.FOLLOWER;
				this.#heartbeatExpiration = undefined;
				this.#electionExpiration = performance.now() + this.#electionTimeout();
				break;
			}
			break;
		}
	}

	// §5.2: Each node will vote for at most one candidate in a
	// given term, on a first-come-first-served basis.
	#onRequestVote(msg, sendReply) {
		if(typeof this.#votesFor !== "undefined"
			&& msg.address !== this.#votesFor)
		{
			const msg = new RaftMessage(this.#state, this.#leader, this.#currentTerm, this.#address, Raft.RPC_VOTE, false);
			sendReply(msg.toBuffer());
			return;
		}

		this.#leader = msg.address;
		if(this.#currentTerm !== msg.term) {
			this.#currentTerm = msg.term;
			this.#resetVotes();
		}
		const reply = new RaftMessage(this.#state, this.#leader, this.#currentTerm, this.#address, Raft.RPC_VOTE, true);
		sendReply(reply.toBuffer());
		this.#electionExpiration = performance.now() + this.#electionTimeout();
	}

	#onVote(msg) {
		if(this.#state !== Raft.CANDIDATE) {
			return;
		}
		if(msg.granted) {
			this.#votesGranted++;
		}
		// §5.2: A candidate wins an election if it receives votes from
		// a majority of the servers in the full cluster for the same
		// term.
		if(this.#hasQuorum(this.#votesGranted)) {
			// §5.2: Once a candidate wins an election, it becomes
			// leader.
			this.#becomeLeader();
		}
	}

	#becomeLeader() {
		this.#state = Raft.LEADER;
		this.#leader = this.#address;
		this.#heartbeatExpiration = performance.now() + this.#heatbeatInterval;
		this.#electionExpiration = undefined;
		// §5.2: Send heartbeat messages to all of the other servers to
		// establish its authority and prevent new elections.
		const reply = new RaftMessage(this.#state, this.#leader, this.#currentTerm, this.#address, Raft.RPC_APPEND_ENTRY);
		this.#sendRaftMessage(Raft.FOLLOWER, reply);
	}

	#hasQuorum(vote_count) {
		return vote_count >= this.#majorityCount();
	}

	#majorityCount() {
		return Math.ceil(this.#nodes.length / 2) + 1;
	}

	update(timestamp) {
		if(timestamp >= this.#heartbeatExpiration) {
			this.#onHeartbeatExpiration();
		}
		if(timestamp >= this.#electionExpiration) {
			this.#onElectionExpiration();
		}
	}

	// §5.2: Leaders send periodic heartbeats to all followers in
	// order to maintain their authority.
	#onHeartbeatExpiration() {
		if(this.#state !== Raft.LEADER) {
			this.#heartbeatExpiration = undefined;
			return;
		}
		const msg = new RaftMessage(this.#state, this.#leader, this.#currentTerm, this.#address, Raft.RPC_APPEND_ENTRY);
		this.#sendRaftMessage(Raft.FOLLOWER, msg);
		this.#heartbeatExpiration = performance.now() + this.#heatbeatInterval;
	}

	// §5.2: If a follower receives no communication over a period of time
	// called the election timeout, then it assumes there is no viable
	// leader and begins an election to choose a new leader.
	#onElectionExpiration() {
		if(this.#state === Raft.LEADER) {
			this.#electionExpiration = undefined;
			return;
		}
		this.#startElection();
	}

	#sendRaftMessage(target, msg) {
//		console.log(`#sendRaftMessage(${Raft.states[target]}, ${msg.toString()})`);
		const data = msg.toBuffer();
		switch(target) {
		case Raft.FOLLOWER:
			for(const node of this.#nodes) {
				if(node.address === this.#leader) {
					continue;
				}
				node.send(data);
			}
			break;
		}
	}

	// §5.2: Raft uses randomized election timeouts to ensure that
	// split votes are rare and that they are resolved quickly.
	#electionTimeout() {
		return Math.random() * (this.#electionMaxTimeout - this.#electionMinTimeout + 1) + this.#electionMinTimeout;
	}

	// §5.2: To begin an election, a follower increments its current
	// term and transitions to candidate state.
	#startElection() {
//		console.log("#startElection");
		if(this.#state !== Raft.CANDIDATE) {
			this.#state = Raft.CANDIDATE;
		}
		this.#heartbeatExpiration = undefined;
		this.#electionExpiration = performance.now() + this.#electionTimeout();
		this.#leader = undefined;
		this.#currentTerm++;

		// §5.2: Vote for self.
		this.#votesFor = this.#address;
		this.#votesGranted = 1;

		// §5.2: Issues RequestVote RPCs in parallel to each of
		// the other nodes in the cluster.
		const msg = new RaftMessage(this.#state, this.#leader, this.#currentTerm, this.#address, Raft.RPC_REQUEST_VOTE);
		this.#sendRaftMessage(Raft.FOLLOWER, msg);
	}

	join(address, send) {
		console.log(`RAFT: join(${address})`);
		if(address === this.#address) {
			return;
		}
		const pos = this.#nodes.findIndex(node => node.address === address);
		if(pos !== -1) {
			return;
		}
		this.#nodes.push(new RaftNode(address, send));
		this.dispatchEvent(new CustomEvent('join', {
			detail: {
				address,
			}
		}));
	}

	leave(address) {
		console.log(`RAFT: leave(${address})`);
		const pos = this.#nodes.findIndex(node => node.address === address);
		if(pos === -1) {
			return;
		}
		this.#nodes.splice(pos, 1);
		this.dispatchEvent(new CustomEvent('leave', {
			detail: {
				address,
			}
		}));
	}

	close() {
		console.log(`RAFT: close)`);
		if(this.#state === 0) {
			return;
		}
		this.#state = 0;
		this.dispatchEvent(new CustomEvent('closing'));
		for(const node of this.#nodes) {
			this.leave(node.address);
		}
		this.dispatchEvent(new CustomEvent('closed'));
		this.#heartbeatExpiration = undefined;
		this.#electionExpiration = undefined;
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
        this._prefetch = wrap(channel.port1);
        channel.port1.start();
    }
}

window.requestIdleCallback =
    window.requestIdleCallback ||
    function(cb) {
        var start = Date.now();
        return setTimeout(function() {
            cb({
                didTimeout: false,
                timeRemaining: function() {
                    return Math.max(0, 50 - (Date.now() - start));
                },
            });
        }, 1);
    };

window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function(id) {
        clearTimeout(id);
    };

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
        this.src_id = "";
        this.src_size = 0;
        this.src_hash = undefined;
        this.src_integrity = "";
        this.src_md5 = "";
        this.views = [];
        this.width = 0;
        this.height = 0;
        this.autoplay = false;
        this._worker = this._createWorker();
        this._scheduler = wrap(this._worker);
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
        this._scheduler[releaseProxy]();
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
                && this.src_id.length !== 0
                && this.src_size !== 0
                && typeof this.src_hash !== "undefined"
                && this.src_integrity.length !== 0
                && this.src_md5.length !== 0) {
                this._onSrc(this.src, this.src_id, this.src_size, this.src_hash, this.src_integrity, this.src_md5);
                if (this.autoplay
                    && this.width !== 0
                    && this.height !== 0) {
                    console.log(`PLAYLIST: Auto-playing ${this.src} (${this.src_id})`);
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
    _onSrc(src, id, size, hash, integrity, md5) {
        console.log(`PLAYLIST: onSrc: ${src} (${id})`);
        (async () => {
            const url = new URL(this.src, window.location.href);
            await this._scheduler.setSource(url.toString(), id, size, hash, integrity, md5);
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
        this._prepareNextFrame();
        this._prepareIdleCallback();
        await this._scheduler.play();
    }
    // Connect the scheduler to the renderer.
    _connectSchedulerToRenderer(scheduler, renderer) {
        (async () => {
            await scheduler.setStatePort(transfer(this._channel.port2, [this._channel.port2]));
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
            await scheduler.exposeNetwork(proxy(join), proxy(leave));
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
    n({ type: String, reflect: true })
], WebPlaylistElement.prototype, "src", void 0);
__decorate$3([
    n({ attribute: 'src-id', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_id", void 0);
__decorate$3([
    n({ attribute: 'src-size', type: Number, reflect: true })
], WebPlaylistElement.prototype, "src_size", void 0);
__decorate$3([
    n({ attribute: 'src-hash', type: Object, reflect: true })
], WebPlaylistElement.prototype, "src_hash", void 0);
__decorate$3([
    n({ attribute: 'src-integrity', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_integrity", void 0);
__decorate$3([
    n({ attribute: 'src-md5', type: String, reflect: true })
], WebPlaylistElement.prototype, "src_md5", void 0);
__decorate$3([
    n({ type: Array, reflect: false })
], WebPlaylistElement.prototype, "views", void 0);
__decorate$3([
    n({ type: Number, reflect: false })
], WebPlaylistElement.prototype, "width", void 0);
__decorate$3([
    n({ type: Number, reflect: false })
], WebPlaylistElement.prototype, "height", void 0);
__decorate$3([
    n({ type: Boolean, reflect: true })
], WebPlaylistElement.prototype, "autoplay", void 0);
__decorate$3([
    e('main')
], WebPlaylistElement.prototype, "_main", void 0);
__decorate$3([
    e('section')
], WebPlaylistElement.prototype, "_section", void 0);
WebPlaylistElement = __decorate$3([
    t$1('web-play-list')
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
                name: source.id,
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
    t$1('brightsign-play-list')
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
    constructor(id, webgl_asset) {
        this.id = id;
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
        expose({
            setState: (value) => this.setState(value),
            setSources: async (scope, decls) => {
                return await this.setSources(scope, decls.map(decl => {
                    return {
                        '@type': decl['@type'],
                        id: decl.id,
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
        this._camera = this._createThreeJSCamera(width, height, near, far, z);
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
        // FIXME: Tied to image resolution.
        const media_width = 1000;
        const media_height = 1000;
        const mesh = this._meshFrom(material, 0, media_width, 0, media_height, media_width, media_height);
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
            else if (current.decl.id !== this._current_renderer_asset.id) {
                //console.info(current.decl.href, current.remainingTimeMs);
                this._closeCurrent();
                if (this._next_renderer_asset !== null
                    && current.decl.id === this._next_renderer_asset.id) {
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
            else if (next.decl.id !== this._next_renderer_asset.id) {
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
            const from_asset = this._renderer_asset_cache.get(transition.from.decl.id);
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
            const to_asset = this._renderer_asset_cache.get(transition.to.decl.id);
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
        this._renderer_asset_trash.set(this._current_renderer_asset.id, this._current_renderer_asset);
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
        const existing_asset = this._renderer_asset_cache.get(decl.id);
        if (typeof existing_asset !== "undefined") {
            if (this._renderer_asset_trash.has(decl.id)) {
                this._renderer_asset_trash.delete(decl.id);
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
        const renderer_asset = new WebGLRendererAsset(decl.id, three_asset);
        this._renderer_asset_cache.set(renderer_asset.id, renderer_asset);
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
        this._renderer_asset_trash.set(this._next_renderer_asset.id, this._next_renderer_asset);
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
			position: relative;
			margin-left: 600px;
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
    t$1('webgl-play-list')
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
    t$1('brightsign-webgl-play-list')
], BrightSignWebGLPlaylistElement);

export { BrightSignPlaylistElement, BrightSignWebGLPlaylistElement };
//# sourceMappingURL=brightsign.bundle.js.map
