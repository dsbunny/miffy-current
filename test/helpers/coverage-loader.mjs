import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformTypeScript } from './instrument.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const sourceRoot = path.join(root, 'src') + path.sep;
const testRoot = path.join(root, 'test') + path.sep;

export async function load(url, context, nextLoad) {
	if (url.startsWith('file:') && url.endsWith('.ts')) {
		const filename = fileURLToPath(url);
		if (filename.startsWith(sourceRoot) || filename.startsWith(testRoot)) {
			const { code } = await transformTypeScript(filename, filename.startsWith(sourceRoot));
			return { format: 'module', source: code, shortCircuit: true };
		}
	}
	return nextLoad(url, context);
}
