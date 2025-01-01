// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Prefetch interface.

import EventTarget from '@ungap/event-target';
import { AssetDecl } from './media.js';

export interface Prefetch extends EventTarget {
	acquireSources(scope: string, sources: AssetDecl[]): Promise<void>;
	releaseSources(scope: string): Promise<void>;
	getPath(origin: string): string;
}
