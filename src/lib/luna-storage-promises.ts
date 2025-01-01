// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// LG Storage API wrapped with Promises.

export interface StatFileParameters {
	path: string;
}

export interface StatFileReturns {
	type: string;
	size: number;
	atime: string;
	mtime: string;
	ctime: string;
}

export function statFile(options: StatFileParameters): Promise<StatFileReturns> {
	return new Promise((resolve, reject) => {
		const storage = new Storage();
		storage.statFile(resolve, reject, options);
	});
}

export interface RemoveFileParameters {
	file: string;
	recursive?: boolean;
}

export function removeFile(options: RemoveFileParameters): Promise<void> {
	return new Promise((resolve, reject) => {
		const storage = new Storage();
		storage.removeFile(resolve, reject, options);
	});
}

export interface ListFileParameters {
	path: string;
}

export interface ListFileReturns {
	files: FileInfo[];
	totalCount: number;
}

export interface FileInfo {
	name: string;
	type: string;
	size: number;
}

export function listFiles(options: ListFileParameters): Promise<ListFileReturns> {
	return new Promise((resolve, reject) => {
		const storage = new Storage();
		storage.listFiles(resolve, reject, options);
	});
}

export interface MkdirParameters {
	path: string;
}

export function mkdir(options: MkdirParameters): Promise<void> {
	return new Promise((resolve, reject) => {
		const storage = new Storage();
		storage.mkdir(resolve, reject, options);
	});
}

export interface DownloadFileParameters {
	action: string;
	source: string;
	destination: string;
	httpOption?: HttpOptions;
}
export interface HttpOptions {
	maxRedirection?: number;
	headers?: object;
	timeout?: number;
	cacertDomain?: string;
	insecure?: boolean;
}
export interface DownloadFileStatusReturns {
	ticket: number;
	status: string;
	source?: string;
	destination?: string;
	amountReceived?: number;
	amountTotal?: number;
	reason?: string;
}

// copyFile() with progress.
export async function downloadFile(options: DownloadFileParameters): Promise<void> {
	const storage = new Storage();
	const response: { ticket: number } = await new Promise((resolve, reject) => {
		storage.downloadFile(resolve, reject, options);
	});
	await new Promise<void>((resolve, reject) => {
		const progressString = (data: DownloadFileStatusReturns) => {
			if(typeof data.amountReceived === "number"
				&& typeof data.amountTotal === "number")
			{
				const percent = (100 * data.amountReceived / data.amountTotal).toFixed(0);
				return `${data.amountReceived.toString()} of ${data.amountTotal.toString()} ${percent}%`;
			}
			return "";
		};
		const onFileStatus = (data: DownloadFileStatusReturns) => {
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

export interface GetMD5HashParameters {
	filePath: string;
}

export interface GetMD5HashReturns {
	md5hash: string;
}

// No progress API.
// TBD: Evaluate performance internal and external.
export function getMD5Hash(options: GetMD5HashParameters): Promise<GetMD5HashReturns> {
	return new Promise((resolve, reject) => {
		const storage = new Storage();
		storage.getMD5Hash(resolve, reject, options);
	});
}

export function fsync(): Promise<void> {
	return new Promise((resolve, reject) => {
		const storage = new Storage();
		storage.fsync(resolve, reject);
	});
}
