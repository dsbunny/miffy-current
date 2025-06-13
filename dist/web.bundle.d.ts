import * as lit_html from 'lit-html';
import * as lit from 'lit';
import { LitElement } from 'lit';
import EventTarget from '@ungap/event-target';

interface HashDecl {
    method: string;
    hex: string;
}
interface AssetDecl {
    '@type': string;
    id: string;
    href: string;
    size?: number;
    hash?: HashDecl;
    md5?: string;
    integrity?: string;
}
interface MediaDecl extends AssetDecl {
    params?: any;
    duration: number;
    sources?: AssetDecl[];
}

interface SchedulerAssetDecl {
    decl: MediaDecl;
}
interface SchedulerAssetDeclWithRemainingTime extends SchedulerAssetDecl {
    remainingTimeMs: number | string;
}
interface SchedulerAssetTransition {
    from: SchedulerAssetDecl;
    to: SchedulerAssetDecl;
    url: string;
    percent: number;
    percentSpeed: number;
}
interface EventSeriesSummary {
    id: string;
    pct: number;
    queue: any[];
}
interface MediaListSummary {
    id: string;
    start: string;
    end: string;
}
interface SchedulerState {
    currentTime: string;
    eventSeries: EventSeriesSummary[];
    mediaList: MediaListSummary[];
    mediaCurrent: SchedulerAssetDeclWithRemainingTime | null;
    mediaNext: SchedulerAssetDeclWithRemainingTime | null;
    transition: SchedulerAssetTransition | null;
}

interface View {
    left: number;
    top: number;
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Renderer {
    get ended(): boolean;
    get error(): Error | null;
    get networkState(): number;
    get paused(): boolean;
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

interface Cluster {
    get leader(): string;
    join(): void;
    leave(): void;
    update(timestamp: DOMHighResTimeStamp): void;
    broadcast(data: string): void;
    addEventListener(type: string, listener: any): void;
    removeEventListener(type: string, listener: any): void;
}

interface Prefetch extends EventTarget {
    acquireSources(scope: string, sources: AssetDecl[]): Promise<void>;
    releaseSources(scope: string): Promise<void>;
    getCachedPath(origin: string): string | null;
}

declare class WebPlaylistElement extends LitElement {
    src: string;
    src_id: string;
    src_size: number;
    src_hash: HashDecl | undefined;
    src_integrity: string;
    src_md5: string;
    views: {
        left: number;
        top: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }[];
    width: number;
    height: number;
    autoplay: boolean;
    _main: HTMLElement;
    _section: HTMLElement;
    static styles: lit.CSSResult;
    render(): lit_html.TemplateResult<1>;
    protected _worker: Worker;
    protected _scheduler: any;
    protected _renderer: Renderer;
    protected _channel: MessageChannel;
    protected _raf_id: ReturnType<Window["requestAnimationFrame"]> | undefined;
    protected _ric_id: ReturnType<Window["requestIdleCallback"]> | undefined;
    protected _cluster: Cluster | undefined;
    constructor();
    get debugScheduler(): any;
    get debugRenderer(): Renderer;
    get debugCluster(): Cluster | undefined;
    protected _createWorker(): Worker;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected _createRenderer(prefetchFactory?: {
        new (): Prefetch;
    }): Renderer;
    firstUpdated(changedProperties: Map<string, any>): void;
    updated(changedProperties: Map<string, any>): void;
    protected _onSrc(src: string, id: string, size: number, hash: HashDecl, integrity: string, md5: string): void;
    protected _onViews(views: {
        left: number;
        top: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }[]): void;
    protected _onSize(width: number, height: number): void;
    play(): Promise<void>;
    protected _connectSchedulerToRenderer(scheduler: any, renderer: Renderer): void;
    protected _connectRaftCluster(scheduler: any, renderer: Renderer): void;
    protected _renderOneFrame(timestamp: DOMHighResTimeStamp): void;
    protected _prepareNextFrame(): void;
    protected _idle(deadline: IdleDeadline): void;
    protected _prepareIdleCallback(): void;
}

declare class WebGLPlaylistElement extends WebPlaylistElement {
    static styles: lit.CSSResult;
    protected _createRenderer(prefetchFactory?: {
        new (): Prefetch;
    }): Renderer;
}

export { WebGLPlaylistElement, WebPlaylistElement };
