// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Interface for a media asset.

export interface HashDecl {
	method: string,
	hex: string,
}

export interface AssetDecl {
	'@type': string,
	id: string,
	href: string,
	size?: number,
	hash?: HashDecl,
	md5?: string,
	integrity?: string,
}

export interface MediaDecl extends AssetDecl {
	duration: number,
	sources?: AssetDecl[],
}

export interface ScopedMediaDecl {
	scope: string,
	entries: MediaDecl[];
	isReady: boolean;
}
