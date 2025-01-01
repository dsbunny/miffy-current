// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Interface for a cluster.

export interface Cluster {
	get leader(): string;
	join(): void;
	leave(): void;
	update(timestamp: DOMHighResTimeStamp): void;
	broadcast(data: string): void;
	addEventListener(type: string, listener: any): void;
	removeEventListener(type: string, listener: any): void;
}
