// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Interface for a renderer.

import { SchedulerState } from '../lib/scheduler.js';
import { AssetDecl } from './media.js';

export interface View {
	left: number;
	top: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Renderer {
	// REF: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended
	get ended(): boolean;
	// REF: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/error
	get error(): Error | null;
	// REF: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/networkState
	get networkState(): number;
	// REF: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/paused
	get paused(): boolean;
	// REF: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
	get readyState(): number;

	init(): void;
	close(): void;
	setSchedulerMessagePort(scheduler: MessagePort): void;
	setAssetTarget(target: HTMLElement): void;
	setRenderTarget(target: HTMLElement): void;
	setPixelRatio(value: number): void;
	setSize(width: number, height: number): void;
	setViews(views: View[]): void;
	setSources(scope: string, sources: AssetDecl[]): Promise<void>;
	setSetStateHook(cb: any): void;
	clearSetStateHook(): void;
	render(timestamp: DOMHighResTimeStamp): void;
	idle(): void;
	setState(value: SchedulerState): void;
	setStateUnhooked(value: SchedulerState): void;
}
