// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

import { RTCMesh } from '@dsbunny/rtcmesh';
import { Raft } from '@dsbunny/raft';
import { Cluster } from './cluster.js';

const MAX_BACKOFF_TIMEOUT = 18 * 1000;
const MIN_BACKOFF_TIMEOUT = 3 * 1000;
const CONNECT_TIMEOUT = 30 * 1000;

const ELECTION_MIN_TIMEOUT = 1500;
const ELECTION_MAX_TIMEOUT = 3000;
const HEARTBEAT_INTERVAL = 500;

// a random integer between two values, inclusive
function backoff_timeout() {
        return Math.floor(Math.random() * (MAX_BACKOFF_TIMEOUT - MIN_BACKOFF_TIMEOUT + 1)) + MIN_BACKOFF_TIMEOUT;
}

class Peer {
	protected _id: string;
	protected _channel: RTCDataChannel | undefined;

	constructor(id: string) {
		this._id = id;
		this._channel = undefined;
	}

	get id() {
		return this._id;
	}
	get readyState() {
		if(typeof this._channel === "undefined") {
			return "new";
		}
		return this._channel.readyState;
	}
	set channel(channel: RTCDataChannel) {
		this._channel = channel;
	}

	send(data: string) {
		if(this.readyState !== "open") {
			return;
		}
		try {
			this._channel?.send(data);
		} catch(e) {
			console.warn(e);
		}
	}
}

export class RaftCluster implements Cluster {
	protected _ws_onmessage_bound: (event: any) => void;
	protected _ws_onerror_bound: (event: any) => void;
	protected _ws_onclose_bound: (event: any) => void;
	protected _rtc: RTCMesh;
	protected _signaling_servers: any[];
	protected _signaling_server_index = -1;
	protected _ws: WebSocket | undefined;
	protected _ws_reconnect_timeout_id: any;
	protected _ws_connect_timeout_id: any;
	protected _raft: Raft;
	protected _peers = new Map();

	constructor(readonly decl: any) {
		this._signaling_servers = decl.signalingServers;
		this._ws_onmessage_bound = (event: any) => this._ws_onmessage(event);
		this._ws_onerror_bound = (event: any) => this._ws_onerror(event);
		this._ws_onclose_bound = (event: any) => this._ws_onclose(event);
		this._rtc = new RTCMesh(decl);
		this._rtc.addEventListener('offer', (event: any) => {
			console.log(event);
			this._ws?.send(JSON.stringify({
				"cmd": "offer",
				"target": event.detail.id,
				"sdp": event.detail.sdp,
			}));
		});
		this._rtc.addEventListener('answer', (event: any) => {
			console.log(event);
			this._ws?.send(JSON.stringify({
				"cmd": "answer",
				"target": event.detail.id,
				"sdp": event.detail.sdp,
			}));
		});
		this._rtc.addEventListener('icecandidate', (event: any) => {
			console.log(event);
			this._ws?.send(JSON.stringify({
				"cmd": "icecandidate",
				"target": event.detail.id,
				"candidate": event.detail.candidate,
			}));
		});
		this._rtc.addEventListener('disconnected', (event: any) => {
			console.warn('RTC disconnected', event);
			this._ws?.send(JSON.stringify({
				"cmd": "disconnected",
				"target": event.detail.id,
				"candidate": event.detail.candidate,
			}));
		});
		this._rtc.addEventListener('failed', (event: any) => {
			console.warn('RTC failed', event);
			this._ws?.send(JSON.stringify({
				"cmd": "failed",
				"target": event.detail.id,
			}));
		});
		this._raft = new Raft({
			address: this._rtc.id,
			electionMinTimeout: ELECTION_MIN_TIMEOUT,
			electionMaxTimeout: ELECTION_MAX_TIMEOUT,
			heartbeatInterval: HEARTBEAT_INTERVAL,
		});
		for(const id of this._rtc.peers) {
			if(id === this._rtc.id) {
				continue;
			}
			const peer = new Peer(id);
			this._raft.join(id, data => peer.send(data));
			this._peers.set(id, peer);
		}
		this._rtc.addEventListener('addchannel', (event: any) => {
			console.log('RTC addchannel', event);
			const peer = this._peers.get(event.detail.id);
			if(typeof peer === "undefined") {
				return;
			}
			const channel = this._rtc.user_channel(peer.id);
			channel?.addEventListener('message', (event: any) => {
				this._raft.onRaftMessage(event.data, (data: string) => peer.send(data));
			});
			peer.channel = channel;
		});
		// §5.5: Follower and candidate crashes
		// Avoid direct failure by removing node from list, node recovery will rejoin
		// the list and update with the next hearbeat or election.
		this._rtc.addEventListener('removechannel', (event: any) => {
			console.log('RTC removechannel', event);
			const peer = this._peers.get(event.detail.id);
			if(typeof peer === "undefined") {
				return;
			}
			peer.channel = undefined;
		});
	}

	get leader() { return this._raft.leader; }

	join() {
		console.log('Raft Cluster: join');
		this._try_connect();
	}

	leave() {
		console.log('Raft Cluster: leave');
	}

	update(timestamp: number) {
		this._raft.update(timestamp);
	}

	broadcast(data: string) {
		if(this._raft.leader) {
			this._rtc.broadcast(data);
		}
	}

	addEventListener(type: string, listener: any) {
		this._rtc.addEventListener(type, listener);
	}

	removeEventListener(type: string, listener: any) {
		this._rtc.removeEventListener(type, listener);
	}

	protected _ws_close() {
		if(typeof this._ws_connect_timeout_id !== "undefined") {
			clearTimeout(this._ws_connect_timeout_id);
			this._ws_connect_timeout_id = undefined;
		}
		this._ws?.removeEventListener('message', this._ws_onmessage_bound);
		this._ws?.removeEventListener('error', this._ws_onerror_bound);
		this._ws?.removeEventListener('close', this._ws_onclose_bound);
		if(this._ws?.readyState !== WebSocket.CLOSED) {
			this._ws?.close(); // can raise onerror
		}
		this._ws = undefined;
	}

	protected _ws_onclose(event: Event) {
		console.log('WS closed.', event);
		this._ws_close();
		this._schedule_reconnect();
	}

	// The error event is fired when a connection with a WebSocket has been closed due to an error.
	protected _ws_onerror(event: Event) {
		console.log('WS error.', event);
		this._ws_close();
		this._schedule_reconnect();
	}

	protected _abort_connect() {
		console.warn("WS connect timeout, aborting.");
		this._ws_close();
		this._schedule_reconnect();
	}

	protected _ws_onmessage(event: any) {
		console.log(event);
		const json = JSON.parse(event.data);
		switch(json.cmd) {
		case 'offer':
			this._rtc.createAnswer(json.id, json.sdp);
			break;
		case 'negotiationneeded':
			this._rtc.createOffer(json.id);
			break;
		case 'answer':
			this._rtc.addAnswer(json.id, json.sdp);
			break;
		case 'disconnected':
		case 'failed':
			this._rtc.close(json.id)
				.catch((e: any) => {
					console.warn(e);
				})
				.finally(() => {
					this._ws?.send(JSON.stringify({
						"cmd": "negotiationneeded",
						"target": json.id,
					}));
				});
			break;
		case 'icecandidate':
			this._rtc.addIceCandidate(json.id, json.candidate);
			break;
		default:
			break;
		};
	}

	protected _signaling_server() {
		this._signaling_server_index = (this._signaling_server_index + 1) % this._signaling_servers.length;
		return this._signaling_servers[this._signaling_server_index];
	}

	protected _try_connect() {
		if(typeof this._ws_reconnect_timeout_id !== "undefined") {
			clearTimeout(this._ws_reconnect_timeout_id);
			this._ws_reconnect_timeout_id = undefined;
		}
		try {
			const signaling_server = this._signaling_server();
			console.log(`WS connecting to ${signaling_server.url}`);
			this._ws = new WebSocket(`${signaling_server.url}?group=${this._rtc.label}&id=${this._rtc.id}`);
		} catch(e: any) {
			console.warn(e);
			this._ws = undefined;
			return;
		}
		this._ws_connect_timeout_id = setTimeout(this._abort_connect, CONNECT_TIMEOUT);
		this._ws.addEventListener('open', () => {
			console.log("WS connected.");
			if(typeof this._ws_connect_timeout_id !== "undefined") {
				clearTimeout(this._ws_connect_timeout_id);
				this._ws_connect_timeout_id = undefined;
			}
			for(const peer of this._rtc.peers) {
				if(peer === this._rtc.id) {
					continue;
				}
				const readyState = this._rtc.readyState(peer);
				switch(readyState) {
				case "open":
					break;
				case "connecting":
				case "closing":
					console.log(`WEBRTC ${peer} readyState ${readyState}`);
					this._rtc.close(peer)
						.catch((e: any) => {
							console.warn(e);
						})
						.finally(() => {
							this._ws?.send(JSON.stringify({
								"cmd": "negotiationneeded",
								"target": peer,
							}));
						});
					break;
				default:
					console.log(`WEBRTC ${peer} readyState ${readyState}`);
					this._ws?.send(JSON.stringify({
						"cmd": "negotiationneeded",
						"target": peer,
					}));
					break;
				}
			}
		});
		this._ws.addEventListener('message', this._ws_onmessage_bound);
		this._ws.addEventListener('error', this._ws_onerror_bound);
		this._ws.addEventListener('close', this._ws_onclose_bound);
	}

	protected _schedule_reconnect() {
		const delay = backoff_timeout();
		console.warn("WS reconnection in", delay/1000, "s");
		this._ws_reconnect_timeout_id = setTimeout(() => {
			this._try_connect();
		}, delay);
	}
}
