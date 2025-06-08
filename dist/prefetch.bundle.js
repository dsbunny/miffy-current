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

// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.
class PrefetchServiceWorker {
    constructor() {
        self.addEventListener('install', (event) => {
            self.skipWaiting();
            event.waitUntil(this.#install());
        });
        self.addEventListener('fetch', (event) => {
            // Let the browser do its default thing
            // for non-GET requests.
            if (event.request.method !== "GET") {
                return;
            }
            event.respondWith(this.#fetch(event.request));
        });
        self.addEventListener('activate', (event) => {
            event.waitUntil(this.#activate());
        });
        //		self.addEventListener('message', (event: ExtendableMessageEvent) => {
        //			this.#onMessage(event.source, event.data);
        //		});
    }
    async #install() {
        const options = {
            method: 'GET',
            cache: 'force-cache',
        };
        const response = await fetch('./manifest.json', options);
        const hrefs = await response.json();
        const cache = await self.caches.open('miffy');
        const resources = hrefs.map(href => {
            const request = new Request(href, options);
            return request;
        });
        console.info(`PREFETCH-SERVICEWORKER: Start.`);
        const t0 = performance.now();
        try {
            await this.#cacheAddAll(cache, resources);
        }
        catch (e) {
            console.warn(`PREFETCH-SERVICEWORKER: Failed preparing resources: ${e}.`);
        }
        finally {
            const t1 = performance.now();
            console.info(`PREFETCH-SERVICEWORKER: Complete ${Math.round(t1 - t0)}ms.`);
        }
    }
    // Explicitly add one request at a time to ensure all resources
    // are settled, compare to Cache.AddAll which bails on first error.
    async #cacheAddAll(cache, resources) {
        const deferred = [];
        const networkFetch = async (request) => {
            const networkResponse = await fetch(request);
            if (networkResponse.ok
                && networkResponse.status !== 206) {
                await cache.put(request, networkResponse);
                console.log(`PREFETCH-SERVICEWORKER: Cache updated ${request.url}`, request);
                return;
            }
            console.warn(`PREFETCH-SERVICEWORKER: Failed ${request.url}`, request);
        };
        const t0 = performance.now();
        for (const request of resources) {
            try {
                const cachedResponse = await cache.match(request);
                if (!cachedResponse) {
                    await networkFetch(request);
                }
                else {
                    deferred.push(networkFetch(request));
                }
            }
            catch (ex) {
                console.warn(`PREFETCH-SERVICEWORKER: ${ex}`);
            }
        }
        const t1 = performance.now();
        console.log(`PREFETCH-SERVICEWORKER: Fetch ${Math.round(t1 - t0)}ms.`);
        if (deferred.length) {
            try {
                await Promise.allSettled(deferred);
            }
            catch (ex) {
                console.warn(`PREFETCH-SERVICEWORKER: ${ex}`);
            }
            const t2 = performance.now();
            console.log(`PREFETCH-SERVICEWORKER: Revalidate ${Math.round(t2 - t1)}ms.`);
        }
    }
    async #fetch(request) {
        // Response should include `Vary: Origin` and `Vary: Accept-Encoding`.
        const cachedResponse = await self.caches.match(request, { ignoreVary: true });
        if (cachedResponse) {
            //console.log(`PREFETCH-SERVICEWORKER: Cache hit ${request.url}.`);
            return cachedResponse;
        }
        // Default to network if unavailable in cache, i.e. SSE streams.
        console.log(`PREFETCH-SERVICEWORKER: Cache miss ${request.url}.`, request);
        return fetch(request);
    }
    async #activate() {
        await this.#upgradeCaches();
        // Take control of pages immediately, including those loaded
        // via a different service worker.
        await self.clients.claim();
    }
    // REF: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/activate_event
    // Typically delete old caches.
    async #upgradeCaches() {
        // no-op.
    }
    async setSources(scope, sources) {
        console.log(`PREFETCH-SERVICEWORKER: Cache scope ${scope}.`);
        const cache = await self.caches.open(scope);
        const options = {
            cache: 'no-cache',
            credentials: 'omit',
            keepalive: true,
            method: 'GET',
            mode: 'cors',
            //priority: 'low',
            redirect: 'follow',
            referrer: 'client',
            referrerPolicy: 'strict-origin-when-cross-origin',
        };
        await this.#cacheAddAll(cache, sources.map(source => {
            const request = new Request(source.href, {
                // FIXME: SRI crying wolf.
                //integrity: source.integrity,
                ...options,
            });
            return request;
        }));
        console.log(`PREFETCH-SERVICEWORKER: Complete scope ${scope}.`);
    }
}
console.info("PREFETCH-SERVICEWORKER: Started.");
const prefetch_service_worker = new PrefetchServiceWorker();
self.addEventListener('message', (event) => {
    if (event.data instanceof MessagePort) {
        expose({
            setSources: async (scope, sources) => {
                await prefetch_service_worker.setSources(scope, sources);
            },
        }, event.data);
        event.data.start();
    }
});
//# sourceMappingURL=prefetch.bundle.js.map
