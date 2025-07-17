# Changelog
## v19.4.16
- Update `@dsbunny/webossignage` and `@dsbunny/publisher-schema`.

## v19.4.15
- Move to `@dsbunny/webossignage` for LG WebOS typings.

## v19.3.14
- Update _apps_ with `AppBaseParams`.
- Normalize on using `Node.setAttribute()` when modifying `src` for compatibility with WebOS.
- Add `HTMLImageElement.decode()` polyfill for _Luna_.
- Test `readyState` before modifying to stop flapping between _current_ and _next_ asset states.
- Re-add media resolution stage for non-_Service Worker_ prefetch support.
- Normalize on using `null` for _renderer_ implementations.
- Update _WebGL_ renderer with _image_ and _video_ getters matching other implementations.
- Add `anonymous` cross-origin for _video_ assets.

## v19.2.13
- Add local copy of _ZOD_ to make dynamic code-generation compliant to Chome 53.
- Bump `@dsbunny/app` for _ZOD_ version 4.

## v19.1.12
- Add polyfills from _CoreJS_.

## v19.1.11
- Add _Luna_ bundles for downstream bundlers.

## v19.0.10
- Drop `.mjs` extension in preference of `.js`.
- Merge _Web_ and _WebGL_ bundles, and merge _BrightSign_ and _BrightSign WebGL_.
- Add `manifest.json` for seeding the _service worker_ cache.

## v18.3.9
- Add _BrightSign_ detail including WebGL implementation.

## v18.2.8
- Scope CSS to immediate descendants of `:host` to remove infection of app content.
- Duplicate `web-media.ts` into `luna-media.ts` and eliminate extensions causing typing conflicts.
- Resync _Web_ implementation with _WebGL_ eliminating duplicate logic.
- Add _SystemJS_ imports for _LG Luna_.
- Fix _Service Workers_ not started on hard reset, i.e. no `navigator.serviceWorker.controller`.
- Add module manifest validation on app imports.

## v18.1.7
- Bump `@msgpack/msgpack`, `jsonref`, `lit`, and `three`.
- Correct typings for improved TypeScript checking.
- Add _app_ parameters for runtime configuration of _THREE_ application assets.
- Rename `css` to `web` as tiered support abandoned.
