# CustomElement
Compared to HTML elements.

| HTMLElement| HTMLMediaElement | HTMLVideoElement | CustomElement |
| --- | --- | --- | --- |
| _Events_ ||||
| `error` ||| Fired when a resource failed to load, or can't be used. |
| `load` ||| n/a |
|| _Instance properties_ |||
|| `audioTracks` || n/a |
|| `autoplay` || Plays on first `animate()` call. |
|| `buffered` || n/a |
|| `controller` || Non-standard, Deprecated |
|| `controls` || n/a |
|| `controlsList` || n/a |
|| `crossOrigin` || Declared resources downloaded by the _renderer_. |
|| `currentSrc` || Returns a string with the absolute URL of the chosen media resource. |
|| `currentTime` || A double-precision floating-point value indicating the current playback time in seconds. The time is specified relative to the media's timeline. |
|| `defaultMuted` || n/a |
|| `defaultPlaybackRate` || TBD<sup>[[1]](#note-1)</sup> |
|| `disableRemotePlayback` || n/a |
|| `duration` || A read-only double-precision floating-point value indicating the total duration of the media in seconds. If the media is of indefinite length (such as streamed live media, a WebRTC call's media, or similar), the value is `+Infinity`. |
|| `ended` || Returns a boolean that indicates whether the media element has finished playing. |
|| `error` || Returns an `Error` object for the most recent error, or `null` if there has not been an error. |
|| `loop` || n/a |
|| `mediaGroup` || Non-standard, Deprecated |
|| `mediaKeys` || n/a<sup>[[2]](#note-2)</sup> |
|| `muted` || n/a |
|| `networkState` || Returns a `unsigned short` (enumeration) indicating the current state of fetching the media over the network. |
|| `paused` || Returns a boolean that indicates whether the media element is paused. |
|| `playbackRate` || TBD<sup>[[1]](#note-1)</sup> |
|| `played` || n/a |
|| `preload` || Declared resources downloaded by the _renderer_. |
|| `preservesPitch` || n/a |
|| `readyState` || Returns a `unsigned short` (enumeration) indicating the readiness state of the media. |
|| `remote` || n/a |
|| `seekable` || TBD<sup>[[3]](#note-3)</sup> |
|| `seeking` || TBD<sup>[[3]](#note-3)</sup> |
|| `sinkId` || n/a |
|| `src` || A string that reflects the `src` HTML attribute, which contains the URL of a media resource to use. |
|| `srcObject` || An object which serves as the source of the media associated with the `HTMLMediaElement`, or `null` if not assigned. |
|| `textTracks` || n/a |
|| `videoTracks` || n/a |
|| `volume` || n/a |
|| _Instance methods_ |||
|| `addTextTrack()` || n/a |
|| `canPlayType()` || n/a |
|| `captureStream()` || n/a |
|| `fastSeek()` || TBD<sup>[[3]](#note-3)</sup> |
|| `load()` || Resets the media to the beginning and selects the best available source from the sources provided using the `src` attribute or the `<source>` element. |
|| `pause()` || Pauses the media playback. |
|| `play()` || Pauses the media playback. |
|| `seekToNextFrame()` || Non-standard, Deprecated |
|| `setMediaKeys()` || n/a<sup>[[2]](#note-2)</sup> |
|| `setSinkId()` || n/a |
|| _Events_ |||
|| `abort` || n/a |
|| `canplay` || Fired when the user agent can play the media. |
|| `canplaythrough` || Not available on mobile. |
|| `durationchange` || n/a |
|| `emptied` || n/a |
|| `encrypted` || n/a<sup>[[2]](#note-2)</sup> |
|| `ended` || Fired when playback stops when end of the media is reached or because no further data is available. |
|| `loadeddata` || Fired when the first frame of the media has finished loading. |
|| `loadedmetadata` || n/a |
|| `loadstart` || n/a |
|| `pause` || n/a |
|| `play` || n/a |
|| `playing` || n/a |
|| `progress` || n/a |
|| `ratechange` || n/a |
|| `seeked` || TBD<sup>[[3]](#note-3)</sup> |
|| `seeking` || TBD<sup>[[3]](#note-3)</sup> |
|| `stalled` || n/a |
|| `suspend` || n/a |
|| `timeupdate` || n/a |
|| `volumechange` || n/a |
|| `waiting` || n/a |
|| `waitingforkey` || n/a<sup>[[2]](#note-2)</sup> |
||| _Instance properties_ ||
||| `disablePictureInPicture` | n/a |
||| `height` | The height of the display area, in CSS pixels. |
||| `poster` | Asset is skipped if data is not available. |
||| `videoHeight` | n/a<sup>[[4]](#note-4)</sup> |
||| `videoWidth` | n/a<sup>[[4]](#note-4)</sup> |
||| `width` | The width of the display area, in CSS pixels. |
||| _Instance methods_ ||
||| `cancelVideoFrameCallback()` | n/a |
||| `getVideoPlaybackQuality()` | n/a |
||| `requestPictureInPicture()` | n/a |
||| `requestVideoFrameCallback()` | n/a |
||| _Events_ ||
||| `enterpictureinpicture` | n/a |
||| `leavepictureinpicture` | n/a |
||| `resize` | n/a |

Footnotes:

<a name="note-1">1.</a> Playback rate could be adjusted for preview playback.

<a name="note-2">2.</a> Media is displayed to the public, thus encrypted media is pointless.

<a name="note-3">3.</a> Seeking could be support for preview playback.

<a name="note-4">4.</a> Content must be matched on publish.
