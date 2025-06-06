# Changelog
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
