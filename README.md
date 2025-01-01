# miffy-current
## Notes
* Depends on `rtcmesh` signaling server for WebRTC.

## Building Instructions
To build:
```
npm run build
```

## Testing Instructions
To test:
```
npm test
```

Via the Scheduler context, enable the "digit1-playlist":
```
self.dispatchEvent(new CustomEvent('keyup', {detail: {code: 'Digit1'}}))
```
To disable:
```
self.dispatchEvent(new CustomEvent('keyup', {detail: {code: 'Digit2'}}))
```

## VS Code Settings
Disable Jest auto-run due to OOM issues in VS Code agent.
```
{
    "workbench.colorTheme": "Default Dark+",
    "remote.SSH.remotePlatform": {
        "miffy.dsbunny.com": "linux"
    },
    "editor.tabSize": 8,
    "jest.autoRun": "off",
    "editor.insertSpaces": false,
    "files.trimTrailingWhitespace": true,
    "files.trimFinalNewlines": true,
    "files.insertFinalNewline": true
}
```
