// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Asset prefetch Service Worker interface.

import { AssetDecl } from '../lib/media.js';

export interface PrefetchWorker {
	setSources(scope: string, sources: AssetDecl[]): void;
}
