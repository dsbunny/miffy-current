# miffy-current
## Notes
* Depends on `rtcmesh` signaling server for WebRTC.
* `@__PURE__` comment raises `rollup` warning: https://github.com/rollup/rollup/issues/5324

## Building Instructions
To build:
```
npm run build
```

## Testing Instructions
To test:
```
npx playwright install chromium
npm test
```
The tests use Node 24, `node:test`, `tsx`, and Playwright. They mock upstream
services and device APIs; the browser fixture requests are fulfilled locally.
To enforce loopback-only networking on Linux with user namespaces enabled:
```
unshare --user --map-root-user --net sh -c 'ip link set lo up && npm test'
```

Other commands:
```
npm run test:watch
npm run test:e2e
npm run test:typecheck
npm run test:coverage
```

Coverage writes HTML, LCOV, and JSON to `coverage/`. The coverage command
currently fails its planned gates: 90% statements and branches overall and
100% for the scheduling-critical files. Tests use requirement IDs in their
`describe` comments; see the test names for behaviors still marked TODO.

Via the Scheduler context, enable the "digit1-playlist":
```
self.dispatchEvent(new CustomEvent('keyup', {detail: {code: 'Digit1'}}))
```
To disable:
```
self.dispatchEvent(new CustomEvent('keyup', {detail: {code: 'Digit2'}}))
```

## VS Code Settings
```
{
    "workbench.colorTheme": "Default Dark+",
    "remote.SSH.remotePlatform": {
        "miffy.dsbunny.com": "linux"
    },
    "editor.tabSize": 8,
    "editor.insertSpaces": false,
    "files.trimTrailingWhitespace": true,
    "files.trimFinalNewlines": true,
    "files.insertFinalNewline": true
}
```
