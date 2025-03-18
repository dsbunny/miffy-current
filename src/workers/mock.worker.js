// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

global.Worker = class Worker extends EventTarget {
	constructor(url, _options) {
		super();
		this.url = url;
		this.addEventListener('message', (event) => {
			if(typeof this.onmessage === 'function') {
				this.onmessage(event);
			}
		});
	}
	postMessage(message, _transfer) {
		const event = new MessageEvent('message', {
			data: message,
		});
		this.dispatchEvent(event);
	}
}
