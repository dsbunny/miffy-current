import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { createInstrumenter } from 'istanbul-lib-instrument';

export async function transformTypeScript(path, instrument = false) {
	const compiled = await transform(await readFile(path, 'utf8'), {
		loader: 'ts',
		format: 'esm',
		sourcemap: 'external',
		sourcefile: path,
		tsconfigRaw: {
			compilerOptions: {
				experimentalDecorators: true,
				useDefineForClassFields: false,
			},
		},
	});
	if (!instrument) return { code: compiled.code };

	const instrumenter = createInstrumenter({ esModules: true, compact: false, produceSourceMap: true });
	const instrumented = instrumenter.instrumentSync(compiled.code, path, JSON.parse(compiled.map));
	const map = Buffer.from(JSON.stringify(instrumenter.lastSourceMap())).toString('base64');
	const code = `${instrumented}\n//# sourceMappingURL=data:application/json;base64,${map}\n`;
	return { code, coverage: instrumenter.lastFileCoverage() };
}
