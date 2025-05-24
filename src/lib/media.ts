// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

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
	params?: any,
	duration: number,
	sources?: AssetDecl[],
}

export interface ScopedMediaDecl {
	scope: string,
	entries: MediaDecl[];
	isReady: boolean;
}
