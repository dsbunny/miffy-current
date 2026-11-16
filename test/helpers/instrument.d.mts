export function transformTypeScript(path: string, instrument?: boolean): Promise<{
	code: string;
	coverage?: unknown;
}>;
