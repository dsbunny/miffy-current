// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

window.HTMLImageElement.prototype.decode =
	window.HTMLImageElement.prototype.decode ||
	function(this: HTMLImageElement) {
		// If the image is already loaded, return a resolved promise.
		if(this.complete) {
			return Promise.resolve();
		}
		let timeout: ReturnType<typeof setTimeout> | undefined;
		const promise = new Promise<string | Event>((resolve, reject) => {
			this.onload = (event: string | Event) => {
				if(typeof timeout === "undefined") {
					return;
				}
				clearTimeout(timeout);
				timeout = undefined;
				resolve(event);
			};
			this.onerror = (event: string | Event) => {
				if(typeof timeout === "undefined") {
					return;
				}
				clearTimeout(timeout);
				timeout = undefined;
				if(typeof event === "string"
					&& event !== "timeout")
				{
					console.warn(`HTMLImageElement.decode: Image load failed with error: ${event}`);
				} else if(event instanceof Event) {
					console.warn(`HTMLImageElement.decode: Image load failed with event: ${event.type}`);
				}
				reject(event);
			};
		});
		// Reject the promise if the image fails to load or reasonable
		// time has passed.
		timeout = setTimeout(() => {
			if(typeof timeout === "undefined") {
				return;
			}
			if(this.onerror) {
				console.warn("HTMLImageElement.decode: Timeout waiting for image load.");
				this.onerror("timeout");
			}
		}, 10000);
		return promise;
	};
