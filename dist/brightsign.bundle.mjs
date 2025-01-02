/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$4=e=>n=>"function"==typeof n?((e,n)=>(customElements.define(e,n),n))(e,n):((e,n)=>{const{kind:t,elements:s}=n;return {kind:t,elements:s,finisher(n){customElements.define(e,n);}}})(e,n);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const i$3=(i,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(n){n.createProperty(e.key,i);}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this));},finisher(n){n.createProperty(e.key,i);}},e$3=(i,e,n)=>{e.constructor.createProperty(n,i);};function n$5(n){return (t,o)=>void 0!==o?e$3(n,t,o):i$3(n,t)}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const o$4=({finisher:e,descriptor:t})=>(o,n)=>{var r;if(void 0===n){const n=null!==(r=o.originalKey)&&void 0!==r?r:o.key,i=null!=t?{kind:"method",placement:"prototype",key:n,descriptor:t(o.key)}:{...o,key:n};return null!=e&&(i.finisher=function(t){e(t,n);}),i}{const r=o.constructor;void 0!==t&&Object.defineProperty(o,n,t(n)),null==e||e(r,n);}};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function i$2(i,n){return o$4({descriptor:o=>{const t={get(){var o,n;return null!==(n=null===(o=this.renderRoot)||void 0===o?void 0:o.querySelector(i))&&void 0!==n?n:null},enumerable:!0,configurable:!0};if(n){const n="symbol"==typeof o?Symbol():"__"+o;t.get=function(){var o,t;return void 0===this[n]&&(this[n]=null!==(t=null===(o=this.renderRoot)||void 0===o?void 0:o.querySelector(i))&&void 0!==t?t:null),this[n]};}return t}})}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var n$4;null!=(null===(n$4=window.HTMLSlotElement)||void 0===n$4?void 0:n$4.prototype.assignedElements)?(o,n)=>o.assignedElements(n):(o,n)=>o.assignedNodes(n).filter((o=>o.nodeType===Node.ELEMENT_NODE));

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
    return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}
function releaseEndpoint(ep) {
    return requestResponseMessage(ep, {
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
function createProxy(ep, path = [], target = function () { }) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    unregisterProxy(proxy);
                    releaseEndpoint(ep);
                    isProxyReleased = true;
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(ep, {
                    type: "GET" /* MessageType.GET */,
                    path: path.map((p) => p.toString()),
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, [...path, prop]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, {
                type: "SET" /* MessageType.SET */,
                path: [...path, prop].map((p) => p.toString()),
                value,
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, {
                    type: "ENDPOINT" /* MessageType.ENDPOINT */,
                }).then(fromWireValue);
            }
            // We just pretend that `bind()` didn’t happen.
            if (last === "bind") {
                return createProxy(ep, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: "APPLY" /* MessageType.APPLY */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
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
function requestResponseMessage(ep, msg, transfers) {
    return new Promise((resolve) => {
        const id = generateUUID();
        ep.addEventListener("message", function l(ev) {
            if (!ev.data || !ev.data.id || ev.data.id !== id) {
                return;
            }
            ep.removeEventListener("message", l);
            resolve(ev.data);
        });
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

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=window,e$2=t$1.ShadowRoot&&(void 0===t$1.ShadyCSS||t$1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$3=Symbol(),n$3=new WeakMap;class o$3{constructor(t,e,n){if(this._$cssResult$=!0,n!==s$3)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$2&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=n$3.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&n$3.set(s,t));}return t}toString(){return this.cssText}}const r$2=t=>new o$3("string"==typeof t?t:t+"",void 0,s$3),i$1=(t,...e)=>{const n=1===t.length?t[0]:e.reduce(((e,s,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[n+1]),t[0]);return new o$3(n,t,s$3)},S$1=(s,n)=>{e$2?s.adoptedStyleSheets=n.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):n.forEach((e=>{const n=document.createElement("style"),o=t$1.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=e.cssText,s.appendChild(n);}));},c$1=e$2?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$2(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var s$2;const e$1=window,r$1=e$1.trustedTypes,h$1=r$1?r$1.emptyScript:"",o$2=e$1.reactiveElementPolyfillSupport,n$2={toAttribute(t,i){switch(i){case Boolean:t=t?h$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,i){let s=t;switch(i){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t);}catch(t){s=null;}}return s}},a$1=(t,i)=>i!==t&&(i==i||t==t),l$2={attribute:!0,type:String,converter:n$2,reflect:!1,hasChanged:a$1},d$1="finalized";class u$1 extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu();}static addInitializer(t){var i;this.finalize(),(null!==(i=this.h)&&void 0!==i?i:this.h=[]).push(t);}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((i,s)=>{const e=this._$Ep(s,i);void 0!==e&&(this._$Ev.set(e,s),t.push(e));})),t}static createProperty(t,i=l$2){if(i.state&&(i.attribute=!1),this.finalize(),this.elementProperties.set(t,i),!i.noAccessor&&!this.prototype.hasOwnProperty(t)){const s="symbol"==typeof t?Symbol():"__"+t,e=this.getPropertyDescriptor(t,s,i);void 0!==e&&Object.defineProperty(this.prototype,t,e);}}static getPropertyDescriptor(t,i,s){return {get(){return this[i]},set(e){const r=this[t];this[i]=e,this.requestUpdate(t,r,s);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||l$2}static finalize(){if(this.hasOwnProperty(d$1))return !1;this[d$1]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,i=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const s of i)this.createProperty(s,t[s]);}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(i){const s=[];if(Array.isArray(i)){const e=new Set(i.flat(1/0).reverse());for(const i of e)s.unshift(c$1(i));}else void 0!==i&&s.push(c$1(i));return s}static _$Ep(t,i){const s=i.attribute;return !1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach((t=>t(this)));}addController(t){var i,s;(null!==(i=this._$ES)&&void 0!==i?i:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(s=t.hostConnected)||void 0===s||s.call(t));}removeController(t){var i;null===(i=this._$ES)||void 0===i||i.splice(this._$ES.indexOf(t)>>>0,1);}_$Eg(){this.constructor.elementProperties.forEach(((t,i)=>{this.hasOwnProperty(i)&&(this._$Ei.set(i,this[i]),delete this[i]);}));}createRenderRoot(){var t;const s=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return S$1(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostConnected)||void 0===i?void 0:i.call(t)}));}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostDisconnected)||void 0===i?void 0:i.call(t)}));}attributeChangedCallback(t,i,s){this._$AK(t,s);}_$EO(t,i,s=l$2){var e;const r=this.constructor._$Ep(t,s);if(void 0!==r&&!0===s.reflect){const h=(void 0!==(null===(e=s.converter)||void 0===e?void 0:e.toAttribute)?s.converter:n$2).toAttribute(i,s.type);this._$El=t,null==h?this.removeAttribute(r):this.setAttribute(r,h),this._$El=null;}}_$AK(t,i){var s;const e=this.constructor,r=e._$Ev.get(t);if(void 0!==r&&this._$El!==r){const t=e.getPropertyOptions(r),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(s=t.converter)||void 0===s?void 0:s.fromAttribute)?t.converter:n$2;this._$El=r,this[r]=h.fromAttribute(i,t.type),this._$El=null;}}requestUpdate(t,i,s){let e=!0;void 0!==t&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||a$1)(this[t],i)?(this._$AL.has(t)||this._$AL.set(t,i),!0===s.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,s))):e=!1),!this.isUpdatePending&&e&&(this._$E_=this._$Ej());}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach(((t,i)=>this[i]=t)),this._$Ei=void 0);let i=!1;const s=this._$AL;try{i=this.shouldUpdate(s),i?(this.willUpdate(s),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostUpdate)||void 0===i?void 0:i.call(t)})),this.update(s)):this._$Ek();}catch(t){throw i=!1,this._$Ek(),t}i&&this._$AE(s);}willUpdate(t){}_$AE(t){var i;null===(i=this._$ES)||void 0===i||i.forEach((t=>{var i;return null===(i=t.hostUpdated)||void 0===i?void 0:i.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return !0}update(t){void 0!==this._$EC&&(this._$EC.forEach(((t,i)=>this._$EO(i,this[i],t))),this._$EC=void 0),this._$Ek();}updated(t){}firstUpdated(t){}}u$1[d$1]=!0,u$1.elementProperties=new Map,u$1.elementStyles=[],u$1.shadowRootOptions={mode:"open"},null==o$2||o$2({ReactiveElement:u$1}),(null!==(s$2=e$1.reactiveElementVersions)&&void 0!==s$2?s$2:e$1.reactiveElementVersions=[]).push("1.6.3");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var t;const i=window,s$1=i.trustedTypes,e=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,o$1="$lit$",n$1=`lit$${(Math.random()+"").slice(9)}$`,l$1="?"+n$1,h=`<${l$1}>`,r=document,u=()=>r.createComment(""),d=t=>null===t||"object"!=typeof t&&"function"!=typeof t,c=Array.isArray,v=t=>c(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]),a="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,p=RegExp(`>|${a}(?:([^\\s"'>=/]+)(${a}*=${a}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),g=/'/g,$=/"/g,y=/^(?:script|style|textarea|title)$/i,w=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=w(1),T=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),E=new WeakMap,C=r.createTreeWalker(r,129,null,!1);function P(t,i){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==e?e.createHTML(i):i}const V=(t,i)=>{const s=t.length-1,e=[];let l,r=2===i?"<svg>":"",u=f;for(let i=0;i<s;i++){const s=t[i];let d,c,v=-1,a=0;for(;a<s.length&&(u.lastIndex=a,c=u.exec(s),null!==c);)a=u.lastIndex,u===f?"!--"===c[1]?u=_:void 0!==c[1]?u=m:void 0!==c[2]?(y.test(c[2])&&(l=RegExp("</"+c[2],"g")),u=p):void 0!==c[3]&&(u=p):u===p?">"===c[0]?(u=null!=l?l:f,v=-1):void 0===c[1]?v=-2:(v=u.lastIndex-c[2].length,d=c[1],u=void 0===c[3]?p:'"'===c[3]?$:g):u===$||u===g?u=p:u===_||u===m?u=f:(u=p,l=void 0);const w=u===p&&t[i+1].startsWith("/>")?" ":"";r+=u===f?s+h:v>=0?(e.push(d),s.slice(0,v)+o$1+s.slice(v)+n$1+w):s+n$1+(-2===v?(e.push(void 0),i):w);}return [P(t,r+(t[s]||"<?>")+(2===i?"</svg>":"")),e]};class N{constructor({strings:t,_$litType$:i},e){let h;this.parts=[];let r=0,d=0;const c=t.length-1,v=this.parts,[a,f]=V(t,i);if(this.el=N.createElement(a,e),C.currentNode=this.el.content,2===i){const t=this.el.content,i=t.firstChild;i.remove(),t.append(...i.childNodes);}for(;null!==(h=C.nextNode())&&v.length<c;){if(1===h.nodeType){if(h.hasAttributes()){const t=[];for(const i of h.getAttributeNames())if(i.endsWith(o$1)||i.startsWith(n$1)){const s=f[d++];if(t.push(i),void 0!==s){const t=h.getAttribute(s.toLowerCase()+o$1).split(n$1),i=/([.?@])?(.*)/.exec(s);v.push({type:1,index:r,name:i[2],strings:t,ctor:"."===i[1]?H:"?"===i[1]?L:"@"===i[1]?z:k});}else v.push({type:6,index:r});}for(const i of t)h.removeAttribute(i);}if(y.test(h.tagName)){const t=h.textContent.split(n$1),i=t.length-1;if(i>0){h.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)h.append(t[s],u()),C.nextNode(),v.push({type:2,index:++r});h.append(t[i],u());}}}else if(8===h.nodeType)if(h.data===l$1)v.push({type:2,index:r});else {let t=-1;for(;-1!==(t=h.data.indexOf(n$1,t+1));)v.push({type:7,index:r}),t+=n$1.length-1;}r++;}}static createElement(t,i){const s=r.createElement("template");return s.innerHTML=t,s}}function S(t,i,s=t,e){var o,n,l,h;if(i===T)return i;let r=void 0!==e?null===(o=s._$Co)||void 0===o?void 0:o[e]:s._$Cl;const u=d(i)?void 0:i._$litDirective$;return (null==r?void 0:r.constructor)!==u&&(null===(n=null==r?void 0:r._$AO)||void 0===n||n.call(r,!1),void 0===u?r=void 0:(r=new u(t),r._$AT(t,s,e)),void 0!==e?(null!==(l=(h=s)._$Co)&&void 0!==l?l:h._$Co=[])[e]=r:s._$Cl=r),void 0!==r&&(i=S(t,r._$AS(t,i.values),r,e)),i}class M{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var i;const{el:{content:s},parts:e}=this._$AD,o=(null!==(i=null==t?void 0:t.creationScope)&&void 0!==i?i:r).importNode(s,!0);C.currentNode=o;let n=C.nextNode(),l=0,h=0,u=e[0];for(;void 0!==u;){if(l===u.index){let i;2===u.type?i=new R(n,n.nextSibling,this,t):1===u.type?i=new u.ctor(n,u.name,u.strings,this,t):6===u.type&&(i=new Z(n,this,t)),this._$AV.push(i),u=e[++h];}l!==(null==u?void 0:u.index)&&(n=C.nextNode(),l++);}return C.currentNode=r,o}v(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class R{constructor(t,i,s,e){var o;this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cp=null===(o=null==e?void 0:e.isConnected)||void 0===o||o;}get _$AU(){var t,i;return null!==(i=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==i?i:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===(null==t?void 0:t.nodeType)&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=S(this,t,i),d(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==T&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):v(t)?this.T(t):this._(t);}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t));}_(t){this._$AH!==A&&d(this._$AH)?this._$AA.nextSibling.data=t:this.$(r.createTextNode(t)),this._$AH=t;}g(t){var i;const{values:s,_$litType$:e}=t,o="number"==typeof e?this._$AC(t):(void 0===e.el&&(e.el=N.createElement(P(e.h,e.h[0]),this.options)),e);if((null===(i=this._$AH)||void 0===i?void 0:i._$AD)===o)this._$AH.v(s);else {const t=new M(o,this),i=t.u(this.options);t.v(s),this.$(i),this._$AH=t;}}_$AC(t){let i=E.get(t.strings);return void 0===i&&E.set(t.strings,i=new N(t)),i}T(t){c(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const o of t)e===i.length?i.push(s=new R(this.k(u()),this.k(u()),this,this.options)):s=i[e],s._$AI(o),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){var s;for(null===(s=this._$AP)||void 0===s||s.call(this,!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){var i;void 0===this._$AM&&(this._$Cp=t,null===(i=this._$AP)||void 0===i||i.call(this,t));}}class k{constructor(t,i,s,e,o){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=A;}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,i=this,s,e){const o=this.strings;let n=!1;if(void 0===o)t=S(this,t,i,0),n=!d(t)||t!==this._$AH&&t!==T,n&&(this._$AH=t);else {const e=t;let l,h;for(t=o[0],l=0;l<o.length-1;l++)h=S(this,e[s+l],i,l),h===T&&(h=this._$AH[l]),n||(n=!d(h)||h!==this._$AH[l]),h===A?t=A:t!==A&&(t+=(null!=h?h:"")+o[l+1]),this._$AH[l]=h;}n&&!e&&this.j(t);}j(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"");}}class H extends k{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===A?void 0:t;}}const I=s$1?s$1.emptyScript:"";class L extends k{constructor(){super(...arguments),this.type=4;}j(t){t&&t!==A?this.element.setAttribute(this.name,I):this.element.removeAttribute(this.name);}}class z extends k{constructor(t,i,s,e,o){super(t,i,s,e,o),this.type=5;}_$AI(t,i=this){var s;if((t=null!==(s=S(this,t,i,0))&&void 0!==s?s:A)===T)return;const e=this._$AH,o=t===A&&e!==A||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,n=t!==A&&(e===A||o);o&&this.element.removeEventListener(this.name,this,e),n&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){var i,s;"function"==typeof this._$AH?this._$AH.call(null!==(s=null===(i=this.options)||void 0===i?void 0:i.host)&&void 0!==s?s:this.element,t):this._$AH.handleEvent(t);}}class Z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t);}}const B=i.litHtmlPolyfillSupport;null==B||B(N,R),(null!==(t=i.litHtmlVersions)&&void 0!==t?t:i.litHtmlVersions=[]).push("2.8.0");const D=(t,i,s)=>{var e,o;const n=null!==(e=null==s?void 0:s.renderBefore)&&void 0!==e?e:i;let l=n._$litPart$;if(void 0===l){const t=null!==(o=null==s?void 0:s.renderBefore)&&void 0!==o?o:null;n._$litPart$=l=new R(i.insertBefore(u(),t),t,void 0,null!=s?s:{});}return l._$AI(t),l};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var l,o;class s extends u$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=D(i,this.renderRoot,this.renderOptions);}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0);}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1);}render(){return T}}s.finalized=!0,s._$litElement$=!0,null===(l=globalThis.litElementHydrateSupport)||void 0===l||l.call(globalThis,{LitElement:s});const n=globalThis.litElementPolyfillSupport;null==n||n({LitElement:s});(null!==(o=globalThis.litElementVersions)&&void 0!==o?o:globalThis.litElementVersions=[]).push("3.3.3");

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
                    this.onerror("timeout");
                }
            }, 10000);
            return promise;
        };

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// TBD: Audio.
// TBD: Seeking, within CMS UI.
// TBD: Poster.
class CssAsset extends EventTarget$1 {
    constructor(src, duration, collection) {
        super();
        this.collection = collection;
        this.autoplay = true;
        this.loop = false;
        this._opacity = 1;
        this._ended = false;
        this._error = null;
        this._networkState = HTMLMediaElement.NETWORK_NO_SOURCE;
        this._paused = true;
        this._readyState = HTMLMediaElement.HAVE_NOTHING;
        this._url = new URL(src, self.location.href);
        this._src = src;
        if (this._src.length !== 0) {
            this._networkState = HTMLMediaElement.NETWORK_EMPTY;
        }
        this._duration = duration;
    }
    // Per HTMLMediaElement.
    get src() { return this._src; }
    get currentSrc() { return this._url.href; }
    get currentTime() { return 0; }
    set currentTime(_timestamp) { }
    get duration() { return this._duration; }
    get ended() { return this._ended; }
    get error() { return this._error; }
    get networkState() { return this._networkState; }
    get paused() { return this._paused; }
    get readyState() { return this._readyState; }
    // Per HTMLVideoElement.
    get className() { return ''; }
    set className(_value) { }
    get classList() { return new DOMTokenList(); }
    get height() { return 0; }
    get width() { return 0; }
    get opacity() { return this._opacity; }
    set opacity(value) { this._opacity = value; }
    get debugUrl() { return this._url; }
}
// super must be used to call functions only, operation is undefined when
// accessing variables that are not hidden behind getters and setters.
class CssImage extends CssAsset {
    constructor(src, duration, collection) {
        super(src, duration, collection);
        this._startTime = NaN;
        this._lastTimeUpdate = 0;
        this._currentTime = 0;
    }
    // Per HTMLMediaElement.
    get src() { return this._src; }
    get currentSrc() { return this._url.href; }
    get currentTime() { return this._currentTime; }
    set currentTime(timestamp) {
        this._currentTime = timestamp;
        this._startTime = NaN;
    }
    get duration() { return this._duration; }
    set duration(duration) { this._duration = duration; }
    get ended() { return this._ended; }
    get error() { return this._error; }
    get networkState() { return this._networkState; }
    get paused() { return this._paused; }
    get readyState() { return this._readyState; }
    // Per HTMLVideoElement.
    get className() {
        if (typeof this._image === "undefined") {
            return '';
        }
        return this._image.className;
    }
    set className(value) {
        if (typeof this._image !== "undefined") {
            this._image.className = value;
        }
    }
    get classList() {
        if (typeof this._image === "undefined") {
            return new DOMTokenList();
        }
        return this._image.classList;
    }
    get height() {
        if (typeof this.texture === "undefined") {
            return NaN;
        }
        return this.texture.height;
    }
    get width() {
        if (typeof this.texture === "undefined") {
            return NaN;
        }
        return this.texture.width;
    }
    set opacity(value) {
        if (typeof this._image !== "undefined") {
            const opacity = (value === 1) ? '' : value.toString();
            if (this._image.style.opacity !== opacity) {
                this._image.style.opacity = opacity;
            }
        }
        this._opacity = value;
    }
    visible() {
        if (typeof this._image !== "undefined") {
            this._image.style.visibility = '';
        }
    }
    hide() {
        if (typeof this._image !== "undefined") {
            this._image.style.visibility = 'hidden';
        }
    }
    load() {
        console.log(`load image ... ${this.src}`);
        this.dispatchEvent(new Event('loadstart'));
        const image = this.texture = this._image = this.collection.acquire();
        image.crossOrigin = 'anonymous';
        image.src = this.src;
        this._networkState = HTMLMediaElement.NETWORK_LOADING;
        image.decode()
            .then(() => {
            this._networkState = HTMLMediaElement.NETWORK_IDLE;
            this.dispatchEvent(new Event('durationchange'));
            this._readyState = HTMLMediaElement.HAVE_METADATA;
            this.dispatchEvent(new Event('loadedmetadata'));
            this._readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
            this.dispatchEvent(new Event('loadeddata'));
            this._readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
            this.dispatchEvent(new Event('canplay'));
            this._readyState = HTMLMediaElement.HAVE_ENOUGH_DATA;
            this.dispatchEvent(new Event('canplaythrough'));
        })
            .catch((encodingError) => {
            console.error(`MEDIA: ${this.src}`, image, encodingError);
            this._networkState = HTMLMediaElement.NETWORK_EMPTY;
            this._readyState = HTMLMediaElement.HAVE_NOTHING;
            if (typeof image !== "undefined") {
                this.collection.release(image);
                this.texture = this._image = undefined;
            }
            this.dispatchEvent(new Event('error'));
        });
    }
    unload() {
        console.log(`unload image ... ${this.src}`);
        this.dispatchEvent(new Event('beforeunload'));
        this.pause();
        if (typeof this._image !== "undefined") {
            this.collection.release(this._image);
            this.texture = this._image = undefined;
        }
        this._readyState = HTMLMediaElement.HAVE_NOTHING;
        this._networkState = HTMLMediaElement.NETWORK_EMPTY;
        this._currentTime = 0;
        this._startTime = NaN;
        this._lastTimeUpdate = 0;
        this._ended = false;
        this.dispatchEvent(new Event('unload'));
    }
    pause() {
        if (this._paused)
            return;
        this._paused = true;
        this.dispatchEvent(new Event('pause'));
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
        this.dispatchEvent(new Event('play'));
        this.dispatchEvent(new Event('playing'));
    }
    // FIXME: delta for paused.
    paint(now, _remaining) {
        if (this.paused || this.ended)
            return;
        const elapsed = (now - this._startTime) / 1000;
        this._currentTime += elapsed;
        if (this._currentTime > this.duration) {
            this.#ended();
        }
        else {
            if (Math.floor(this._currentTime) > this._lastTimeUpdate) {
                this._lastTimeUpdate = this._currentTime;
                this.dispatchEvent(new Event('timeupdate'));
            }
        }
    }
    #ended() {
        this._currentTime = this.duration;
        this._ended = true;
        this._startTime = NaN;
        this.dispatchEvent(new Event('ended'));
    }
}
class CssVideo extends CssAsset {
    constructor(src, duration, collection) {
        super(src, duration, collection);
        this._redispatchEvent = (event) => {
            this.dispatchEvent(new Event(event instanceof Event ? event.type : event));
        };
    }
    // Per HTMLMediaElement.
    get src() { return this._src; }
    get currentSrc() {
        if (typeof this._video === "undefined") {
            return this._url.href;
        }
        return this._video.currentSrc;
    }
    get currentTime() {
        if (typeof this._video === "undefined") {
            return 0;
        }
        return this._video.currentTime;
    }
    set currentTime(timestamp) {
        if (typeof this._video === "undefined") {
            return;
        }
        this._video.currentTime = timestamp;
    }
    get duration() {
        if (typeof this._video === "undefined") {
            return NaN;
        }
        return this._video.duration;
    }
    get ended() {
        if (typeof this._video === "undefined") {
            return false;
        }
        return this._video.ended;
    }
    get error() {
        if (typeof this._video === "undefined") {
            return false;
        }
        return this._video.error;
    }
    get networkState() {
        if (typeof this._video === "undefined") {
            return HTMLMediaElement.NETWORK_EMPTY;
        }
        return this._video.networkState;
    }
    get paused() {
        if (typeof this._video === "undefined") {
            return true;
        }
        return this._video.paused;
    }
    get readyState() {
        if (typeof this._video === "undefined") {
            return HTMLMediaElement.HAVE_NOTHING;
        }
        return this._video.readyState;
    }
    // Per HTMLVideoElement.
    get className() {
        if (typeof this._video === "undefined") {
            return '';
        }
        return this._video.className;
    }
    set className(value) {
        if (typeof this._video !== "undefined") {
            this._video.className = value;
        }
    }
    get classList() {
        if (typeof this._video === "undefined") {
            return new DOMTokenList();
        }
        return this._video.classList;
    }
    get height() {
        if (typeof this._video === "undefined") {
            return NaN;
        }
        return this._video.height;
    }
    get width() {
        if (typeof this._video === "undefined") {
            return NaN;
        }
        return this._video.width;
    }
    set opacity(value) {
        if (typeof this._video !== "undefined") {
            const opacity = (value === 1) ? '' : value.toString();
            if (this._video.style.opacity !== opacity) {
                this._video.style.opacity = opacity;
            }
        }
        this._opacity = value;
    }
    visible() {
        if (typeof this._video !== "undefined") {
            this._video.style.visibility = '';
        }
    }
    hide() {
        if (typeof this._video !== "undefined") {
            this._video.style.visibility = 'hidden';
        }
    }
    load() {
        console.log(`load video ... ${this.src}`);
        const video = this.texture = this._video = this.collection.acquire();
        video.onabort = this._redispatchEvent;
        video.oncanplay = this._redispatchEvent;
        video.oncanplaythrough = this._redispatchEvent;
        video.ondurationchange = this._redispatchEvent;
        video.onemptied = this._redispatchEvent;
        video.onended = this._redispatchEvent;
        video.onerror = this._redispatchEvent;
        video.onloadedmetadata = this._redispatchEvent;
        video.onloadstart = this._redispatchEvent;
        video.onpause = this._redispatchEvent;
        video.onplay = this._redispatchEvent;
        video.onplaying = this._redispatchEvent;
        video.onprogress = this._redispatchEvent;
        video.onstalled = this._redispatchEvent;
        video.onsuspend = this._redispatchEvent;
        video.ontimeupdate = this._redispatchEvent;
        video.onwaiting = this._redispatchEvent;
        video.src = this.src;
        // Avoid "WebGL: INVALID_VALUE: texImage2D: no video".
        video.onloadeddata = (event) => {
            this._redispatchEvent(event);
        };
        try {
            video.load();
        }
        catch (encodingError) {
            this.collection.release(video);
            this.texture = this._video = undefined;
            throw encodingError;
        }
    }
    unload() {
        console.log(`unload video ... ${this.src}`);
        this.dispatchEvent(new Event('beforeunload'));
        this.pause();
        if (typeof this._video !== "undefined") {
            this.collection.release(this._video);
            this.texture = this._video = undefined;
        }
        this.dispatchEvent(new Event('unload'));
    }
    pause() {
        if (typeof this._video === "undefined") {
            return;
        }
        this._video.pause();
    }
    async play() {
        if (typeof this._video === "undefined") {
            return;
        }
        await this._video.play();
    }
    paint(_now, _remaining) { }
}
class CssCollection {
    constructor(renderRoot) {
        this.renderRoot = renderRoot;
    }
}
class ImageCollection extends CssCollection {
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
    createCssAsset(src, duration) {
        return new CssImage(src, duration, this);
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
    }
}
class VideoCollection extends CssCollection {
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
    createCssAsset(src, _duration) {
        return new CssVideo(src, NaN, this);
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
    }
}
class CssAssetManager {
    constructor() {
        this._collection = new Map();
    }
    setAssetTarget(renderTarget) {
        this._renderTarget = renderTarget;
    }
    setRenderer(_renderer) { }
    _createCollection(renderTarget) {
        // TypeScript assumes iterator of first type.
        const collection = new Map([
            ['HTMLImageElement', new ImageCollection(renderTarget)],
            ['HTMLVideoElement', new VideoCollection(renderTarget)],
        ]);
        return collection;
    }
    // decl: { type, href }
    // Returns: asset.
    createCssAsset(decl) {
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
        return collection.createCssAsset(decl.href, decl.duration);
    }
    clear() {
        for (const value of this._collection.values()) {
            value.clear();
        }
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
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
class RendererAsset {
    constructor(id, media_asset) {
        this.id = id;
        this.media_asset = media_asset;
        this.user_data = {};
    }
    get paused() { return this.media_asset.paused; }
    get ended() { return this.media_asset.ended; }
    get error() { return this.media_asset.error; }
    get readyState() { return this.media_asset.readyState; }
    get networkState() { return this.media_asset.networkState; }
    get texture() { return this.media_asset.texture; }
    get currentSrc() { return this.media_asset.currentSrc; }
    get currentTime() { return this.media_asset.currentTime; }
    set currentTime(timestamp) { this.media_asset.currentTime = timestamp; }
    get className() { return this.media_asset.className; }
    set className(value) { this.media_asset.className = value; }
    get classList() { return this.media_asset.classList; }
    get opacity() { return this.media_asset.opacity; }
    set opacity(value) { this.media_asset.opacity = value; }
    load() {
        if (this.readyState !== HTMLMediaElement.HAVE_NOTHING) {
            return;
        }
        if (this.networkState !== HTMLMediaElement.NETWORK_EMPTY) {
            return;
        }
        try {
            this.media_asset.load();
        }
        catch (error) {
            console.error(`RENDERER: ${error}`);
        }
    }
    unload() {
        this.media_asset.unload();
    }
    visible() {
        this.media_asset.visible();
    }
    hide() {
        this.media_asset.hide();
    }
    async play() {
        await this.media_asset.play();
    }
    paint(now, remaining) {
        this.media_asset.paint(now, remaining);
    }
}
class CSSRenderer extends EventTarget$1 {
    constructor(prefetchFactory) {
        super();
        this._renderTarget = null;
        this._mam = new CssAssetManager();
        this._transition_percent = 0;
        this._transition_percent_speed = 0;
        this._network_loading_count = 0;
        this._map1_asset = null;
        this._map2_asset = null;
        this._next_asset = null;
        this._asset_cache = new Map();
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
        console.groupCollapsed("CSS-RENDERER: init");
        console.groupEnd();
    }
    close() {
        console.log("CSS-RENDERER: close");
        for (const asset of this._asset_cache.values()) {
            asset.hide();
            asset.unload();
        }
        this._asset_cache.clear();
    }
    setSetStateHook(cb) {
        this._set_state_hook = cb;
    }
    clearSetStateHook() {
        this._set_state_hook = undefined;
    }
    setSchedulerMessagePort(scheduler) {
        console.log("CSS-RENDERER: setSchedulerMessagePort", scheduler);
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
        if (value.transition) {
            await this._onSchedulerMap1(value.transition.from);
            this._onSchedulerMap2(value.transition.to);
            this._onSchedulerNext(null);
            this._updateTransitionPercent(value.transition.percent, value.transition.percentSpeed);
        }
        else {
            await this._onSchedulerMap1(value.mediaCurrent, { autoplay: true });
            this._onSchedulerMap2(null);
            this._onSchedulerNext(value.mediaNext);
            if (value.mediaCurrent !== null
                && this._map1_asset !== null) {
                this._map1_asset.user_data.end_time = this._endTime(value.mediaCurrent);
            }
            if (value.mediaNext !== null
                && this._next_asset !== null) {
                this._next_asset.user_data.end_time = this._endTime(value.mediaNext);
            }
        }
        this._interpolateTransition(this._previousTimestamp);
    }
    _endTime(asset) {
        return (typeof asset.remainingTimeMs === "number")
            ? (asset.remainingTimeMs + performance.now())
            : Number.MAX_SAFE_INTEGER;
    }
    setAssetTarget(assetTarget) {
        console.log("CSS-RENDERER: setAssetTarget", assetTarget);
        this._mam.setAssetTarget(assetTarget);
    }
    setRenderTarget(renderTarget) {
        console.log("CSS-RENDERER: setRenderTarget", renderTarget);
        this._renderTarget = renderTarget;
    }
    setPixelRatio(value) {
        console.log("CSS-RENDERER: setPixelRatio", value);
        // TBD: translate to CSS.
    }
    setSize(width, height) {
        console.log("CSS-RENDERER: setSize", width, height);
        if (this._renderTarget !== null) {
            this._renderTarget.style.width = `${width}px`;
            this._renderTarget.style.height = `${height}px`;
        }
    }
    setViews(views) {
        console.log("CSS-RENDERER: setViews", views);
    }
    async setSources(scope, sources) {
        console.log("CSS-RENDERER: setSources", scope, sources);
        await this._asset_prefetch.acquireSources(scope, sources);
    }
    render(timestamp) {
        //		console.log('update', timestamp);
        const elapsed = timestamp - this._previousTimestamp;
        this._previousTimestamp = timestamp;
        let has_map1_painted = false;
        if (this._map1_asset !== null) {
            if (this._canPaintAsset(this._map1_asset)) {
                const remaining = this._map1_asset.user_data.end_time - timestamp;
                try {
                    this._paintAsset(this._map1_asset, timestamp, remaining);
                    has_map1_painted = true;
                }
                catch (ex) {
                    console.error(ex);
                    console.error(this._map1_asset);
                }
            }
            else if (this._hasWaitingDuration()) {
                const remaining = this._map1_asset.user_data.end_time - timestamp;
                this._paintWaitingDuration(timestamp, remaining);
                has_map1_painted = true;
            }
        }
        if (!has_map1_painted) {
            this._paintWaiting(timestamp);
        }
        if (this._map2_asset !== null) {
            if (this._canPaintAsset(this._map2_asset)) {
                const remaining = this._map2_asset.user_data.end_time - timestamp;
                try {
                    this._paintAsset(this._map2_asset, timestamp, remaining);
                }
                catch (ex) {
                    console.error(ex);
                    console.error(this._map2_asset);
                }
            }
        }
        this._interpolateTransition(elapsed);
    }
    _canPaintAsset(asset) {
        return asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    }
    _paintAsset(asset, timestamp, remaining) {
        asset.paint(timestamp, remaining);
    }
    // on requestIdleCallback() callback.
    idle() {
    }
    _interpolateTransition(elapsed) {
        if (this._transition_percent_speed === 0) {
            if (this._map1_asset !== null) {
                this._map1_asset.opacity = 1;
            }
            if (this._map2_asset !== null) {
                this._map2_asset.opacity = 0;
            }
            return;
        }
        this._transition_percent += (this._transition_percent_speed * elapsed) / 1000;
        if (this._transition_percent > 1) {
            this._transition_percent = 1;
            this._transition_percent_speed = 0;
        }
        if (this._map1_asset !== null) {
            this._map1_asset.opacity = Math.round((1 - this._transition_percent + Number.EPSILON) * 100) / 100;
        }
        if (this._map2_asset !== null) {
            this._map2_asset.opacity = 1;
        }
    }
    async _fetchImage(url) {
        console.log("CSS-RENDERER: _fetchImage", url);
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
        console.info("CSS-RENDERER: loaded displacement map", img.src);
        return img;
    }
    //	protected _onSchedulerError(err: Error): void {
    //		console.error(err);
    //	}
    async _onSchedulerMap1(asset_decl, { autoplay = false } = {}) {
        if (asset_decl !== null) {
            if (!this._isAssetReady(asset_decl.decl)) {
                return;
            }
            if (this._map1_asset !== null) {
                if (this._map1_asset.id === asset_decl.decl.id) {
                    this._updateAsset(this._map1_asset);
                    if (autoplay
                        && this._map1_asset.user_data.has_loaded
                        && !this._map1_asset.user_data.is_playing
                        && this._map1_asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                        this._map1_asset.user_data.is_playing = true;
                        await this._map1_asset.play();
                    }
                    return;
                }
                this._unbindAsset(this._map1_asset);
            }
            this._map1_asset = this._fetchAsset(asset_decl.decl);
            this._map1_asset.className = "map1";
        }
        else if (this._map1_asset !== null) {
            this._unbindAsset(this._map1_asset);
            this._map1_asset = null;
            console.log(`CSS-RENDERER: map1 null`);
        }
    }
    // Fetch asset, create asset if needed.
    _fetchAsset(decl) {
        const asset = this._asset_cache.get(decl.id);
        if (typeof asset !== "undefined") {
            asset.user_data.ref_count++;
            if (!asset.user_data.has_loaded
                && !asset.user_data.is_loading) {
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
    _updateAsset(asset) {
        // Test for loaded asset.
        if (!asset.user_data.has_loaded
            && asset.user_data.is_loading
            && asset.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
            asset.user_data.is_loading = false;
            asset.user_data.has_loaded = true;
            this._networkLoadingUnref();
        }
    }
    // Unbind asset from the renderer, release resources.
    _unbindAsset(asset) {
        asset.user_data.ref_count--;
        if (asset.user_data.ref_count !== 0) {
            return;
        }
        if (typeof asset.texture !== "undefined") {
            asset.unload();
        }
        asset.user_data = {
            ref_count: 0,
            is_loading: false,
            has_loaded: false,
            is_playing: false,
            end_time: NaN,
        };
    }
    _onSchedulerMap2(asset_decl) {
        if (asset_decl !== null) {
            if (!this._isAssetReady(asset_decl.decl)) {
                return;
            }
            if (this._map2_asset !== null) {
                if (this._map2_asset.id === asset_decl.decl.id) {
                    this._updateAsset(this._map2_asset);
                    return;
                }
                this._unbindAsset(this._map2_asset);
            }
            this._map2_asset = this._fetchAsset(asset_decl.decl);
            this._map2_asset.className = "map2";
        }
        else if (this._map2_asset !== null) {
            this._unbindAsset(this._map2_asset);
            this._map2_asset = null;
        }
    }
    _onSchedulerNext(asset_decl) {
        if (asset_decl !== null) {
            if (!this._isAssetReady(asset_decl.decl)) {
                return;
            }
            if (this._next_asset !== null) {
                if (this._next_asset.id === asset_decl.decl.id) {
                    this._updateAsset(this._next_asset);
                    return;
                }
                this._unbindAsset(this._next_asset);
            }
            this._next_asset = this._fetchAsset(asset_decl.decl);
            this._next_asset.className = "next";
        }
        else if (this._next_asset !== null) {
            this._unbindAsset(this._next_asset);
            this._next_asset = null;
        }
    }
    _updateTransitionPercent(percent, percentSpeed) {
        this._transition_percent = percent;
        this._transition_percent_speed = percentSpeed;
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
    _isAssetReady(decl) {
        const href = this._asset_prefetch.getPath(decl.href);
        return (typeof href === "string") && href.length !== 0;
    }
    _resolveAsset(decl) {
        return {
            '@type': decl['@type'],
            id: decl.id,
            href: this._asset_prefetch.getPath(decl.href),
            duration: decl.duration,
            ...(Array.isArray(decl.sources) && {
                sources: decl.sources.map(source => this._asset_prefetch.getPath(source.href)),
            }),
        };
    }
    _hasWaitingDuration() {
        return false;
    }
    _paintWaiting(_timestamp) { }
    _paintWaitingDuration(_timestamp, _remaining) { }
    _createRendererAsset(decl) {
        const media_asset = this._mam.createCssAsset(this._resolveAsset(decl));
        if (typeof media_asset === "undefined") {
            throw new Error("Failed to create media asset.");
        }
        const asset = new RendererAsset(decl.id, media_asset);
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
                if (object >= -0x20) {
                    // negative fixint
                    this.writeU8(0xe0 | (object + 0x20));
                }
                else if (object >= -0x80) {
                    // int 8
                    this.writeU8(0xd0);
                    this.writeI8(object);
                }
                else if (object >= -0x8000) {
                    // int 16
                    this.writeU8(0xd1);
                    this.writeI16(object);
                }
                else if (object >= -0x80000000) {
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
        const registration = await navigator.serviceWorker.register(new URL('dist/prefetch.bundle.mjs', location.href), {
            scope: '/',
            type: 'module',
        });
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
            if (navigator.serviceWorker.controller) {
                this._onActivatedWorker();
            }
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
                if (e.target.state === "activated") {
                    this._onActivatedWorker();
                }
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
    getPath(origin) {
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
// Simple image and video playlist with transition.
var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof undefined === "function") r = undefined(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let CssPlaylistElement = class CssPlaylistElement extends s {
    static { this.styles = i$1 `
		:host {
			display: block;
			contain: strict;
			overflow: clip;
			font-size: 0;
		}
		section {
			display: none;
		}
		main {
			position: relative;
			margin-left: 600px;
		}
		main * {
			visibility: hidden;
			display: block;
			position: absolute;
			top: 0;
			left: 0;
		}
		main .map1 {
			visibility: visible;
			will-change: opacity;
			z-index: 2;
		}
		main .map2 {
			visibility: visible;
			z-index: 1;
		}
	`; }
    render() {
        return x `
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
        return new Worker(new URL('../dist/scheduler.bundle.mjs', location.href).pathname, {
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
        const renderer = new CSSRenderer(prefetchFactory);
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
        this._renderer.render(timestamp);
        this._prepareNextFrame();
    }
    _prepareNextFrame() {
        this._raf_id = window.requestAnimationFrame((timestamp) => this._renderOneFrame(timestamp));
    }
    // REF: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
    // Called during a browser's idle periods, i.e. background or low
    // priority work.
    _idle(deadline) {
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
        this._ric_id = window.requestIdleCallback((deadline) => this._idle(deadline), { timeout: 250 });
    }
};
__decorate$1([
    n$5({ type: String, reflect: true })
], CssPlaylistElement.prototype, "src", void 0);
__decorate$1([
    n$5({ attribute: 'src-id', type: String, reflect: true })
], CssPlaylistElement.prototype, "src_id", void 0);
__decorate$1([
    n$5({ attribute: 'src-size', type: Number, reflect: true })
], CssPlaylistElement.prototype, "src_size", void 0);
__decorate$1([
    n$5({ attribute: 'src-hash', type: Object, reflect: true })
], CssPlaylistElement.prototype, "src_hash", void 0);
__decorate$1([
    n$5({ attribute: 'src-integrity', type: String, reflect: true })
], CssPlaylistElement.prototype, "src_integrity", void 0);
__decorate$1([
    n$5({ attribute: 'src-md5', type: String, reflect: true })
], CssPlaylistElement.prototype, "src_md5", void 0);
__decorate$1([
    n$5({ type: Array, reflect: false })
], CssPlaylistElement.prototype, "views", void 0);
__decorate$1([
    n$5({ type: Number, reflect: false })
], CssPlaylistElement.prototype, "width", void 0);
__decorate$1([
    n$5({ type: Number, reflect: false })
], CssPlaylistElement.prototype, "height", void 0);
__decorate$1([
    n$5({ type: Boolean, reflect: true })
], CssPlaylistElement.prototype, "autoplay", void 0);
__decorate$1([
    i$2('main')
], CssPlaylistElement.prototype, "_main", void 0);
__decorate$1([
    i$2('section')
], CssPlaylistElement.prototype, "_section", void 0);
CssPlaylistElement = __decorate$1([
    e$4('css-play-list')
], CssPlaylistElement);
var CssPlaylistElement$1 = CssPlaylistElement;

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Asset prefetch for BrightSign platform.
const fs = require('fs');
const AssetPool = require("@brightsign/assetpool");
const AssetPoolFiles = require("@brightsign/assetpoolfiles");
const AssetFetcher = require("@brightsign/assetfetcher");
const BRIGHTSIGN_STORAGE_PATH = "/storage/sd/";
const BRIGHTSIGN_POOL_PATH = `${BRIGHTSIGN_STORAGE_PATH}/p`;
class BrightSignPrefetch extends EventTarget {
    #map;
    #pool;
    #files;
    #is_configured;
    constructor() {
        super();
        this.#map = new Map();
        this.#is_configured = false;
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
        console.log(`PREFETCH: #fetchAssets: ${JSON.stringify(assets)}`);
        const fetcher = new AssetFetcher(pool);
        fetcher.addEventListener("fileevent", (event) => {
            // This is called each time the fetcher has finished trying to
            // download an asset, whether successful or not. It is not
            // called for any assets that are already in the pool.
            console.log(`PREFETCH: ASSET ${event.fileName} complete: ${event.responseCode.toString()} ${event.error}`);
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
            console.log(`PREFETCH: ASSET ${event.fileName} progress: ${progressString(event)}`);
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
        console.log(`PREFETCH: Fetcher complete ${JSON.stringify(assets)}.`);
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
        await this.#pool.protectAssets(scope, assets);
        console.log(`PREFETCH: Protected assets.`);
        await this.#fetchAssets(this.#pool, assets);
        console.log(`PREFETCH: Fetched assets.`);
        if (!await this.#pool.areAssetsReady(assets)) {
            throw new Error("Assets not ready");
        }
        console.log(`PREFETCH: Assets are ready.`);
        this.#files = new AssetPoolFiles(this.#pool, assets);
        console.log(`PREFETCH: Mapping assets to local storage.`);
        for (const asset of assets) {
            const local = await this.#getPath(asset.name);
            this.#map.set(asset.link, local);
            console.info(`${local} -> ${asset.link}`);
        }
        console.log(`PREFETCH: Mapping complete.`);
    }
    async releaseSources(scope) {
        await this.#pool.unprotectAssets(scope);
    }
    // Translate origin URLs to local assets on persistent storage.
    async #getPath(origin) {
        const file_path = await this.#files.getPath(origin);
        return file_path.replace(BRIGHTSIGN_STORAGE_PATH, "file:///sd:/");
    }
    getPath(origin) {
        return this.#map.get(origin) || "";
    }
}

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Extend the CssPlayListElement for BrightSign players.
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof undefined === "function") r = undefined(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let BrightSignPlaylistElement = class BrightSignPlaylistElement extends CssPlaylistElement$1 {
    // Override the renderer to use BrightSign compatible asset prefetcher.
    _createRenderer() {
        return super._createRenderer(BrightSignPrefetch);
    }
};
BrightSignPlaylistElement = __decorate([
    e$4('brightsign-play-list')
], BrightSignPlaylistElement);
var BrightSignPlaylistElement$1 = BrightSignPlaylistElement;

export { BrightSignPlaylistElement$1 as default };
//# sourceMappingURL=brightsign.bundle.mjs.map
