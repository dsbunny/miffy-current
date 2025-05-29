// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab

declare global {
	// SystemJS type declaration
	const System: {
		import: (url: string | URL) => Promise<any>;
	};
}

export function SystemAsyncImport(url: string | URL): Promise<any> {
	return new Promise((resolve, reject) => {
		System.import(url)
			.then(resolve)
			.catch(reject);
	});
}
