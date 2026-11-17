// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

import type {
	DownloadFileOptions,
	DownloadFileStatus,
	DownloadFileStatusSuccessCallback,
	DownloadFileSuccessCallback,
	FileList,
	FilePath,
	FileStat,
	ListFilesSuccessCallback,
	MD5FilePath,
	MD5Hash,
	MD5HashSuccessCallback,
	RemoveFileOptions,
	ScapFailureCallback,
	ScapSuccessCallback,
	StatFileSuccessCallback,
	Ticket,
} from "@dsbunny/webossignage/scap";

// SCAP's global Storage conflicts with the DOM Storage declaration.
declare class Storage {
	statFile(successCb: StatFileSuccessCallback, failureCb: ScapFailureCallback, options: FilePath): void;
	removeFile(successCb: ScapSuccessCallback, failureCb: ScapFailureCallback, options: RemoveFileOptions): void;
	listFiles(successCb: ListFilesSuccessCallback, failureCb: ScapFailureCallback, options: FilePath): void;
	mkdir(successCb: ScapSuccessCallback, failureCb: ScapFailureCallback, options: FilePath): void;
	downloadFile(successCb: DownloadFileSuccessCallback, failureCb: ScapFailureCallback, options: DownloadFileOptions): void;
	getDownloadFileStatus(successCb: DownloadFileStatusSuccessCallback, failureCb: ScapFailureCallback, options: Ticket & { subscribe?: boolean }): void;
	getMD5Hash(successCb: MD5HashSuccessCallback, failureCb: ScapFailureCallback, options: MD5FilePath): void;
	fsync(successCb: ScapSuccessCallback, failureCb: ScapFailureCallback, options?: FilePath): void;
}

export function statFile(options: FilePath) {
	return new Promise<FileStat>((resolve, reject) => {
		const storage = new Storage();
		storage.statFile(resolve, reject, options);
	});
}

export function removeFile(options: RemoveFileOptions) {
	return new Promise<void>((resolve, reject) => {
		const storage = new Storage();
		storage.removeFile(resolve, reject, options);
	});
}

export function listFiles(options: FilePath) {
	return new Promise<FileList>((resolve, reject) => {
		const storage = new Storage();
		storage.listFiles(resolve, reject, options);
	});
}

export function mkdir(options: FilePath) {
	return new Promise<void>((resolve, reject) => {
		const storage = new Storage();
		storage.mkdir(resolve, reject, options);
	});
}

// copyFile() with progress.
export async function downloadFile(options: DownloadFileOptions): Promise<void> {
	const storage = new Storage();
	const response: { ticket: number } = await new Promise((resolve, reject) => {
		storage.downloadFile(resolve, reject, options);
	});
	await new Promise<void>((resolve, reject) => {
		const progressString = (data: DownloadFileStatus) => {
			if(typeof data.amountReceived === "number"
				&& typeof data.amountTotal === "number")
			{
				const percent = (100 * data.amountReceived / data.amountTotal).toFixed(0);
				return `${data.amountReceived.toString()} of ${data.amountTotal.toString()} ${percent}%`;
			}
			return "";
		};
		const onFileStatus = (data: DownloadFileStatus) => {
console.info(JSON.stringify(data));
			if(data.status === "completed") {
				resolve();
			}
			else if(data.status === "failed") {
				reject();
			}
			else if(data.status === "downloading") {
				console.log(`PREFETCH: ASSET ${options.source} progress: ${progressString(data)}`);
			}
		};
		const statusOptions = {
			ticket: response.ticket,
			subscribe: true,
		};
console.info(`${JSON.stringify(statusOptions)}`);
		storage.getDownloadFileStatus(onFileStatus, reject, statusOptions);
        });
}

// No progress API.
// TBD: Evaluate performance internal and external.
export function getMD5Hash(options: MD5FilePath) {
	return new Promise<MD5Hash>((resolve, reject) => {
		const storage = new Storage();
		storage.getMD5Hash(resolve, reject, options);
	});
}

export function fsync(options?: FilePath) {
	return new Promise<void>((resolve, reject) => {
		const storage = new Storage();
		storage.fsync(resolve, reject, options);
	});
}
