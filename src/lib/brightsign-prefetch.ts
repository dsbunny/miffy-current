// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import { Prefetch } from './prefetch';
import { AssetDecl } from './media';

const fs = require('fs');
const AssetPool = require("@brightsign/assetpool");
const AssetPoolFiles = require("@brightsign/assetpoolfiles");
const AssetFetcher = require("@brightsign/assetfetcher");

const BRIGHTSIGN_STORAGE_PATH = "/storage/sd/";
const BRIGHTSIGN_POOL_PATH = `${BRIGHTSIGN_STORAGE_PATH}/p`;

interface BrightSignAsset {
	name: string;
	link: string;
}

export class BrightSignPrefetch extends EventTarget implements Prefetch {
	#map = new Map<string, string>();
	#pool: typeof AssetPool;
	#files: typeof AssetPoolFiles | undefined;
	#is_configured = false;

	constructor() {
		super();
		try {
			fs.mkdirSync(BRIGHTSIGN_POOL_PATH);
			console.log(`PREFETCH: Created BrightSign AssetPool(${BRIGHTSIGN_POOL_PATH})`);
		} catch(e: any) {
			// Error: EEXIST: file already exists, mkdir '/storage/sd//p'
			// {"errno":-17,"syscall":"mkdir","code":"EEXIST","path":"/storage/sd//p"}
			if(e.code !== 'EEXIST') {
				console.warn(e);
				console.warn(JSON.stringify(e));
				throw e;
			}
			console.log(`PREFETCH: Using BrightSign AssetPool(${BRIGHTSIGN_POOL_PATH})`);
		}
		this.#pool = new AssetPool(BRIGHTSIGN_POOL_PATH);
	}

	// Use space as available reserving 128MB free.
	async #configurePool() {
		await this.#pool.reserveStorage(128 * 1024 * 1024);
		this.#is_configured = true;
	}

	async #fetchAssets(pool: typeof AssetPool, assets: any[]) {
//		console.log(`PREFETCH: #fetchAssets: ${JSON.stringify(assets.map(asset => asset.name))}`);
		console.log(`PREFETCH: #fetchAssets: ${JSON.stringify(assets)}`);
                const fetcher = new AssetFetcher(pool);
                fetcher.addEventListener("fileevent", (event: any) => {
                        // This is called each time the fetcher has finished trying to
                        // download an asset, whether successful or not. It is not
                        // called for any assets that are already in the pool.
                        console.log(`PREFETCH: ASSET ${event.fileName} complete: ${event.responseCode.toString()} ${event.error}`);
                });
                function progressString(event: any) {
                        if (typeof event.currentFileTotal === "undefined") {
                                // If the size of the asset was not specified in the asset collection, then the total size may not be reported
                                // during the fetch.
                                return `${event.currentFileTransferred.toString()} of unknown`;
                        } else {
				const percent = (100 * event.currentFileTransferred / event.currentFileTotal).toFixed(0);
                                return `${event.currentFileTransferred.toString()} of ${event.currentFileTotal.toString()} ${percent}%`;
                        }
                }
                fetcher.addEventListener("progressevent", (event: any) => {
                        // This is called at approximately the progress interval
                        // specified in the options to indicate how far through the
                        // download
                        console.log(`PREFETCH: ASSET ${event.fileName} progress: ${progressString(event)}`);
                });
                const fetchOptions = {
                        // receive asset progress events about every five seconds.
                        progressInterval: 5,
                        // try to download each asset three times before giving up.
                        fileRetryCount: 3,
                        // Give up if we fail to download at least 1024 bytes in each
                        // ten second period.
                        minimumTransferRate: { bytesPerSecond: 1024, periodInSeconds: 10 },
                };
                try {
                        await fetcher.start(assets, fetchOptions);
                } catch(e: any) {
                        console.log(`PREFETCH: Fetcher failed: ${e.message}`);
                        throw(e);
                }
		console.log(`PREFETCH: Fetcher complete ${JSON.stringify(assets)}.`);
	}

	// Protect API to limit space reclamation without time priority.
	async acquireSources(scope: string, sources: AssetDecl[]) {
		console.log(`PREFETCH: acquireSources ${scope} ${JSON.stringify(sources)}`);
		if(!this.#is_configured) {
			await this.#configurePool();
		}
		const assets = sources.map(source => {
			return {
				name: source.id,
				size: source.size,
				hash: source.hash,
				link: source.href,
				change_hint: source.integrity,
			} as BrightSignAsset;
		});
		await this.#pool.protectAssets(scope, assets);
		console.log(`PREFETCH: Protected assets.`);
		await this.#fetchAssets(this.#pool, assets);
		console.log(`PREFETCH: Fetched assets.`);
		if(!await this.#pool.areAssetsReady(assets)) {
                        throw new Error("Assets not ready");
                }
		console.log(`PREFETCH: Assets are ready.`);
                this.#files = new AssetPoolFiles(this.#pool, assets);
		console.log(`PREFETCH: Mapping assets to local storage.`);
		for(const asset of assets) {
			const local = await this.#getPath(asset.name);
			this.#map.set(asset.link, local);
			console.info(`${local} -> ${asset.link}`);
		}
		console.log(`PREFETCH: Mapping complete.`);
	}

	async releaseSources(scope: string) {
		await this.#pool.unprotectAssets(scope);
	}

	// Translate origin URLs to local assets on persistent storage.
	async #getPath(origin: string): Promise<string> {
		const file_path = await this.#files.getPath(origin);
		return file_path.replace(BRIGHTSIGN_STORAGE_PATH, "file:///sd:/");
	}

	getPath(origin: string): string {
		return this.#map.get(origin) || "";
	}
}
