// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

export interface Cluster {
	get leader(): string;
	join(): void;
	leave(): void;
	update(timestamp: DOMHighResTimeStamp): void;
	broadcast(data: string): void;
	addEventListener(type: string, listener: any): void;
	removeEventListener(type: string, listener: any): void;
}
