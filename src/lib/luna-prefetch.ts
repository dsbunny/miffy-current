// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import EventTarget from '@ungap/event-target';
import { DownloadFileOptions, FilePath, MD5FilePath, MD5Hash, RemoveFileOptions } from '@dsbunny/webossignage/scap';
import { Prefetch } from './prefetch.js';
import { AssetDecl } from './media.js';
import { downloadFile, fsync, getMD5Hash, listFiles, mkdir, removeFile, statFile } from './luna-file.js';

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
console.info(`PREFETCH: asset #${asset.id} already in pool`);
				const index = this._eviction_queue.findIndex((x: EvictionEntry) => x.id === asset.id);
				if(index !== -1) {
console.info(`PREFETCH: removing asset #${asset.id} from eviction queue ...`);
					this._eviction_queue.splice(index, 1);
				}
				continue;
			}
console	.info(`PREFETCH: asset #${asset.id} adding to pool ...`);
			if(typeof asset.size === "number") {
				total_size += asset.size;
			}
			const filename = filenameFromIdAndHref(asset.id, asset.href);
			const filepath = `${this._base_path}/${filename}`;
			this._url_to_id_map.set(asset.href, asset.id);
			this._id_to_asset_map.set(asset.id, asset);
			this._id_to_file_map.set(asset.id, filepath);
console.info(`PREFETCH: asset #${asset.id} added to pool: ${filepath}`);
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
	getFilePath(url: string): string | null {
		const id = this._url_to_id_map.get(url);
		if(typeof id === "undefined") {
			return null;
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
				const removeOptions: RemoveFileOptions = {
					file: filepath,
					recursive: false,
				};
				await removeFile(removeOptions);
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
		const listOptions: FilePath = {
			path: this._base_path,
		};
		const data = await listFiles(listOptions);
		for(const file of data.files) {
			if(!file.name) continue;
			const id = file.name.substr(0, file.name.lastIndexOf('.'));
			const placeholder: AssetDecl = {
				'@type': 'unknown',
				id,
				href: '',
			};
			this._id_to_asset_map.set(id, placeholder);
			const file_url = `${this._base_path}/${file.name}`;
			this._id_to_file_map.set(id, file_url);
			this._size += file.size || 0;
			const statOptions: FilePath = {
				path: file_url,
			};
			const statData = await statFile(statOptions);
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
			const options: FilePath = {
				path: `${LG_STORAGE_PATH}/${LG_POOL_PATH}`,
			};
			await mkdir(options);
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
		console.log(`PREFETCH: _fetchAssets ...`);
		let change_count = 0;
		for(const asset of assets) {
			const filepath = pool.getFilePath(asset.href);
			if(!filepath) {
				console.warn(`PREFETCH: ${asset.id}: Asset not in pool.`);
				continue;
			}
			if(asset.size) {
				try {
					const statOptions: FilePath = {
						path: filepath,
					};
					const fileInfo = await statFile(statOptions);
					if(fileInfo.size !== asset.size) {
	console.info(`PREFETCH: ${asset.id}: File size mismatch, removing file ...`);
						const removeOptions: RemoveFileOptions = {
							file: filepath,
							recursive: false,
						};
						await removeFile(removeOptions);
						change_count++;
	console.info(`PREFETCH: ${asset.id}: Removed, expected size: ${asset.size}, actual size: ${fileInfo.size}`);
					}
				} catch(err: any) {
					console.warn(err);
				}
			}
			if(asset.md5) {
				console.info(`PREFETCH: ${asset.id}: Calculating MD5 ...`);
				const md5Options: MD5FilePath = {
					filePath: filepath,
				};
				let md5Result: MD5Hash | undefined = undefined;
				try {
					md5Result = await getMD5Hash(md5Options);
					const md5hash = hexToBase64(md5Result.md5hash);
					if(md5hash === asset.md5) {
						console.log(`PREFETCH: ${asset.id}: MD5 matches, skipping download.`);
						continue;
					}
				} catch(err: unknown) {
					// { errorText: "No such file", errorCode: "INTERNAL_ERROR" }
					if(typeof err === 'object'
						&& err !== null
						&& 'errorText' in err
						&& err['errorText'] === 'No such file')
					{
						console.warn(`PREFETCH: ${asset.id}: File not found: ${filepath}`);
						continue;
					}
					console.warn(err);
				}
	console.info(`PREFETCH: ${asset.id}: MD5 mismatch, removing file ...`);
				const removeOptions: RemoveFileOptions = {
					file: filepath,
					recursive: false,
				};
				await removeFile(removeOptions);
				change_count++;
	console.info(`PREFETCH: ${asset.id}: Removed, expected md5: ${asset.md5}, actual md5: ${md5Result?.md5hash}`);
			}
			if(!asset.size && !asset.md5) {
				console.warn(`PREFETCH: ${asset.id}: No size or md5, assuming valid asset.`);
				continue;
			}
			try {
console.info(`PREFETCH: ${asset.id}: Downloading ...`);
				const downloadOptions: DownloadFileOptions = {
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
				await downloadFile(downloadOptions);
				change_count++;
console.info(`PREFETCH: ${asset.id}: Downloaded to ${filepath}`);
			} catch(e: any) {
				console.log(`PREFETCH: Fetcher failed: ${e.message}`);
				throw(e);
			}
console.info(`PREFETCH: ${asset.id}: Calculating MD5 ...`);
			const md5Options: MD5FilePath = {
				filePath: filepath,
			};
			const md5Result = await getMD5Hash(md5Options);
			const md5hash = hexToBase64(md5Result.md5hash);
console.info(`PREFETCH: ${asset.id}: MD5: ${md5hash}`);
			if(md5hash !== asset.md5) {
console.info(`PREFETCH: ${asset.id}: Checksum mismatch, removing file ...`);
				const removeOptions: RemoveFileOptions = {
					file: filepath,
					recursive: false,
				};
				await removeFile(removeOptions);
				change_count++;
console.info(`PREFETCH: ${asset.id}: Removed, expected md5: ${asset.md5}, actual md5: ${md5hash}`);
			}
		}
		if(change_count > 0) {
console.info(`PREFETCH: fsync ...`);
			// Only fsync schedule.
			await fsync();
		}
		console.log(`PREFETCH: _fetchAssets done, ${change_count} changes made.`);
	}

	// Protect API to limit space reclamation without time priority.
	async acquireSources(scope: string, sources: AssetDecl[]) {
		console.log(`PREFETCH: acquireSources ${scope} ${JSON.stringify(sources)}`);
		if(!this._is_configured) {
			await this._configurePool();
		}
		console.log(`PREFETCH: Protecting assets ...`);
		await this._pool.protectAssets(scope, sources);
		console.log(`PREFETCH: Protecting assets done.`);
		await this._fetchAssets(this._pool, sources);
		console.log(`PREFETCH: acquireSources done.`);
	}

	async releaseSources(scope: string) {
		this._pool.unprotectAssets(scope);
	}

	getCachedPath(origin: string): string | null {
		return this._pool.getHttpPath(origin);
	}
}
