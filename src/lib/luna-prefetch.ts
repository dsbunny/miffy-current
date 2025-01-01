// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Asset prefetch for LG WebOS platform.
// Note all APIs are asynchronous and can fail.

import EventTarget from '@ungap/event-target';
import { Prefetch } from './prefetch.js';
import { AssetDecl } from './media.js';
import * as storagePromises from './luna-storage-promises.js';

// Local Storage: file://internal/[FILE_PATH]
// USB Flash Drive: file://usb:[INDEX]/[FILE_PATH]
// SD Card: file://sdcard:[INDEX]/[FILE_PATH]
const LG_STORAGE_PATH = "file://internal";
const LG_POOL_PATH = `p`;
const LG_HTTP_PATH = "http://127.0.0.1:9080";

// Normalize stored files to unique ID and file extension.
function filenameFromIdAndHref(id: string, href: string): string {
	const url = new URL(href, location.href);
	const ext = url.pathname.split('.').pop();
	return `${id}.${ext}`;
}

// Convert a hex string to base64.
function hexToBase64(hex: string): string {
//        return Buffer.from(hex, 'hex').toString('base64');
	let base64 = "";
	for(let i = 0; i < hex.length; i++) {
		base64 += !(i - 1 & 1) ? String.fromCharCode(parseInt(hex.substring(i - 1, i + 1), 16)) : ""
	}
	return btoa(base64);
}

class EvictionEntry {
	constructor(public id: string, public date: Date) {}
}

class LunaPool {
	protected _url_to_id_map = new Map<string, string>();
	protected _id_to_asset_map = new Map<string, AssetDecl>();
	protected _id_to_file_map = new Map<string, string>();

	// LRU queue of all assets in the pool, oldest to newest.
	protected _eviction_queue: EvictionEntry[] = [];

	// Asset scopes that are protected from eviction.
	protected _protected_scopes = new Map<string, Set<string>>();
	protected _protected_ids = new Set<string>();

	// Path to the folder containing the pool.
	protected _base_path: string;
	protected _has_loaded_from_disk = false;

	// __base_path translated into HTTP access.
	protected _http_path: string;

	// Configured maximum size of the pool.
	protected _max_size = 0;

	// Current size of the pool.
	protected _size = 0;

	constructor(base_path: string, http_path: string) {
		this._base_path = base_path;
		this._http_path = http_path;
	}

	// Maximum pool size in not stored within the pool and must be set on
	// each instance.
	async reserveStorage(size: number): Promise<void> {
		this._max_size = size;
		await this.reserve(0);
	}

	has(id: string) {
		const asset = this._id_to_asset_map.get(id);
		return asset && asset.href.length !== 0;
	}

	// Mark existing or upcoming assets to be protected from eviction, the
	// latter causes immediate eviction of unprotected assets.
	async protectAssets(scope: string, assets: AssetDecl[]): Promise<void> {
		const now = new Date();
		const ids = new Set<string>();
		let total_size = 0;
		for(const asset of assets) {
			// The asset behind any id is idempotent.
			if(this.has(asset.id)) {
console.info(`asset #${asset.id} already in pool`);
				const index = this._eviction_queue.findIndex((x: EvictionEntry) => x.id === asset.id);
				if(index !== -1) {
console.info(`removing asset #${asset.id} from eviction queue ...`);
					this._eviction_queue.splice(index, 1);
				}
				continue;
			}
console	.info(`asset #${asset.id} adding to pool ...`);
			if(typeof asset.size === "number") {
				total_size += asset.size;
			}
			const filename = filenameFromIdAndHref(asset.id, asset.href);
			const filepath = `${this._base_path}/${filename}`;
			this._url_to_id_map.set(asset.href, asset.id);
			this._id_to_asset_map.set(asset.id, asset);
			this._id_to_file_map.set(asset.id, filepath);
console.info(`added.`);
			this._eviction_queue.push(new EvictionEntry(asset.id, now));
			this._protected_ids.add(asset.id);
			ids.add(asset.id);
		}
		this._protected_scopes.set(scope, ids);
		if(total_size > 0) {
			await this.reserve(total_size);
			this._size += total_size;
		}
	}

	// Remove protection from assets, so that they may be evicted to leave
	// space for new assets.
	// Does not cause immediate eviction.
	unprotectAssets(scope: string) {
		const ids = this._protected_scopes.get(scope);
		if(Array.isArray(ids)) {
			for(const id of ids) {
				this._protected_ids.delete(id);
			}
		}
		this._protected_scopes.delete(scope);
	}

	// Return native path to asset from external URI.
	getFilePath(url: string): string {
		const id = this._url_to_id_map.get(url);
		if(typeof id === "undefined") {
			return "";
		}
		const filename = filenameFromIdAndHref(id, url);
		const filepath = `${this._base_path}/${filename}`;
		return filepath;
	}

	// Return a path usable in the DOM.
	getHttpPath(url: string): string {
		const id = this._url_to_id_map.get(url);
		if(typeof id === "undefined") {
			return "";
		}
		const filename = filenameFromIdAndHref(id, url);
		const httppath = `${this._http_path}/${filename}`;
		return httppath;
	}

	// Reserve space for new assets, performing evictions on unprotected
	// assets as necessary.
	async reserve(size: number): Promise<void> {
		if(!this._has_loaded_from_disk) {
			await this._bootstrap();
		}
		let index = 0;
		const max_size = this._max_size - size;
		while(this._size > max_size) {
			if(index >= this._eviction_queue.length) {
				return;
			}
			const entry = this._eviction_queue[index];
			if(this._protected_ids.has(entry.id)) {
				index++;
				continue;
			}
			const asset = this._id_to_asset_map.get(entry.id);
			if(typeof asset !== "undefined") {
				const filename = filenameFromIdAndHref(entry.id, asset.href);
				const filepath = `${this._base_path}/${filename}`;
				const removeOptions: storagePromises.RemoveFileParameters = {
					file: filepath,
					recursive: false,
				};
				await storagePromises.removeFile(removeOptions);
				this._url_to_id_map.delete(asset.href);
			}
			this._id_to_asset_map.delete(entry.id);
			this._id_to_file_map.delete(entry.id);
			this._eviction_queue.splice(index, 1);
			index++;
		}
	}

	protected _sortedIndex(array: any[], value: number): number {
		let low = 0;
		let high = array.length;
		while(low < high) {
			const mid = (low + high) >>> 1;
			if(array[mid] < value) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		return low;
	}

	// Read pool state from disk.
	protected async _bootstrap(): Promise<void> {
		const listOptions = {
			path: this._base_path,
		};
		const data = await storagePromises.listFiles(listOptions);
		for(const file of data.files) {
			const id = file.name.substr(0, file.name.lastIndexOf('.'));
			const placeholder: AssetDecl = {
				'@type': 'unknown',
				id,
				href: '',
			};
			this._id_to_asset_map.set(id, placeholder);
			const file_url = `${this._base_path}/${file.name}`;
			this._id_to_file_map.set(id, file_url);
			this._size += file.size;
			const statOptions: storagePromises.StatFileParameters = {
				path: file_url,
			};
			const statData = await storagePromises.statFile(statOptions);
			const file_date = new Date(statData.atime);
			const index = this._sortedIndex(this._eviction_queue, file_date.getTime());
			this._eviction_queue.splice(index, 0, new EvictionEntry(id, file_date));
		}
		this._has_loaded_from_disk = true;
	}
}

export class LunaPrefetch extends EventTarget implements Prefetch {
	protected _is_configured = false;
	protected _pool: LunaPool;

	constructor() {
		super();
		this._pool = new LunaPool(`${LG_STORAGE_PATH}/${LG_POOL_PATH}`, `${LG_HTTP_PATH}/${LG_POOL_PATH}`);
	}

	// Use space as available reserving 128MB free.
	protected async _configurePool(): Promise<void> {
		try {
			const options: storagePromises.MkdirParameters = {
				path: `${LG_STORAGE_PATH}/${LG_POOL_PATH}`,
			};
			await storagePromises.mkdir(options);
			console.log(`PREFETCH: Created LG asset pool (${LG_STORAGE_PATH}/${LG_POOL_PATH})`);
		} catch(e: any) {
			// Error: EEXIST: file already exists, mkdir '/storage/sd//p'
			// {"errno":-17,"syscall":"mkdir","code":"EEXIST","path":"/storage/sd//p"}
			if(e.code !== 'EEXIST') {
				console.warn(e);
				console.warn(JSON.stringify(e));
				throw e;
			}
			console.log(`PREFETCH: Using LG asset pool (${LG_STORAGE_PATH}/${LG_POOL_PATH})`);
		}
		await this._pool.reserveStorage(128 * 1024 * 1024);
		this._is_configured = true;
	}

	protected async _fetchAssets(pool: LunaPool, assets: AssetDecl[]): Promise<void> {
//		console.log(`PREFETCH: __fetchAssets: ${JSON.stringify(assets.map(asset => asset.name))}`);
		console.log(`PREFETCH: _fetchAssets: ${JSON.stringify(assets)}`);
		let change_count = 0;
		for(const asset of assets) {
			const filepath = pool.getFilePath(asset.href);
console.info(`${asset.href} -> ${filepath}`);
			if(!filepath) {
				console.warn(`asset #${asset.id} not in pool`);
				continue;
			}
			if(asset.size) {
				try {
					const statOptions: storagePromises.StatFileParameters = {
						path: filepath,
					};
					const fileInfo = await storagePromises.statFile(statOptions);
	console.info(`info: ${JSON.stringify(fileInfo)}`);
					if(fileInfo.size === asset.size) {
						continue;
					}
	console.info(`size mismatch, removing file ...`);
					const removeOptions: storagePromises.RemoveFileParameters = {
						file: filepath,
						recursive: false,
					};
					await storagePromises.removeFile(removeOptions);
					change_count++;
	console.info(`removed.`);
				} catch(err: any) {
					console.warn(err);
				}
			} else if(asset.md5) {
				console.info(`calculating md5 ...`);
				const md5Options: storagePromises.GetMD5HashParameters = {
					filePath: filepath,
				};
				let md5Result: storagePromises.GetMD5HashReturns | undefined = undefined;
				try {
					md5Result = await storagePromises.getMD5Hash(md5Options);
					const md5hash = hexToBase64(md5Result.md5hash);
					console.info(`md5: ${md5hash}`);
					if(md5hash === asset.md5) {
						continue;
					}
				} catch(err: unknown) {
					// { errorText: "No such file", errorCode: "INTERNAL_ERROR" }
					if(typeof err === 'object'
						&& err !== null
						&& 'errorText' in err
						&& err['errorText'] === 'No such file')
					{
						console.warn(`file not found: ${filepath}`);
						continue;
					}
					console.warn(err);
				}
	console.info(`checksum mismatch, removing file ...`);
				const removeOptions: storagePromises.RemoveFileParameters = {
					file: filepath,
					recursive: false,
				};
				await storagePromises.removeFile(removeOptions);
				change_count++;
	console.info(`removed`);
			} else {
				console.warn("no size or md5, assuming valid asset.");
				continue;
			}
			try {
console.info(`downloading ...`);
				const downloadOptions: storagePromises.DownloadFileParameters = {
					action: 'start',
					source: asset.href,
					destination: filepath,
					httpOption: {
						maxRedirection: 5,
						timeout: 300 * 1000, // milliseconds, match Chrome.
						insecure: false,
					},
				};
				// SCAP v1.6.4
				// webOS Signage 3.2(3.0+) and later
				// REF: https://webossignage.developer.lge.com/api/scap-api/scap18/storage/
				await storagePromises.downloadFile(downloadOptions);
				change_count++;
console.info(`downloaded.`);
			} catch(e: any) {
				console.log(`PREFETCH: Fetcher failed: ${e.message}`);
				throw(e);
			}
console.info(`calculating md5 ...`);
			const md5Options: storagePromises.GetMD5HashParameters = {
				filePath: filepath,
			};
			const md5Result = await storagePromises.getMD5Hash(md5Options);
			const md5hash = hexToBase64(md5Result.md5hash);
console.info(`md5: ${md5hash}`);
			if(md5hash !== asset.md5) {
console.info(`checksum mismatch, removing file ...`);
				const removeOptions: storagePromises.RemoveFileParameters = {
					file: filepath,
					recursive: false,
				};
				await storagePromises.removeFile(removeOptions);
				change_count++;
console.info(`removed`);
			}
		}
		if(change_count > 0) {
console.info(`fsync ...`);
			// Only fsync schedule.
			await storagePromises.fsync();
		}
		console.log(`PREFETCH: Fetcher complete ${JSON.stringify(assets)}.`);
	}

	// Protect API to limit space reclamation without time priority.
	async acquireSources(scope: string, sources: AssetDecl[]) {
		console.log(`PREFETCH: acquireSources ${scope} ${JSON.stringify(sources)}`);
		if(!this._is_configured) {
			await this._configurePool();
		}
		console.log(`PREFETCH: Protecting assets ...`);
		await this._pool.protectAssets(scope, sources);
		console.log(`PREFETCH: Protected assets.`);
		await this._fetchAssets(this._pool, sources);
		console.log(`PREFETCH: Fetched assets.`);
	}

	async releaseSources(scope: string) {
		this._pool.unprotectAssets(scope);
	}

	getPath(origin: string): string {
		return this._pool.getHttpPath(origin);
	}
}
