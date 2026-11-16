import { mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import coverage from 'istanbul-lib-coverage';
import sourceMaps from 'istanbul-lib-source-maps';
import report from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import { transformTypeScript } from './instrument.mjs';
import { coverageFailures } from './coverage-gate.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const sourceRoot = path.join(root, 'src');
const critical = [
	'src/lib/occurency.ts',
	'src/lib/basic-scheduler.ts',
	'src/workers/calendar.worker.ts',
	'src/workers/scheduler.worker.ts',
].map((filename) => path.join(root, filename));

function sourceFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const filename = path.join(directory, entry.name);
		if (entry.isDirectory()) return sourceFiles(filename);
		return entry.isFile() && filename.endsWith('.ts') && !filename.endsWith('.d.ts') ? [filename] : [];
	});
}

const rawDir = mkdtempSync(path.join(os.tmpdir(), 'miffy-coverage-'));
try {
	const args = [
		'--experimental-test-module-mocks',
		'--enable-source-maps',
		'--import', 'tsx',
		'--import', path.join(root, 'test/helpers/register-coverage.mjs'),
		'--import', path.join(root, 'test/helpers/write-coverage.mjs'),
		'--test', '--test-reporter', 'spec', 'test/**/*.test.ts',
	];
	const result = spawnSync(process.execPath, args, {
		cwd: root,
		env: { ...process.env, TSX_TSCONFIG_PATH: path.join(root, 'common-tsconfig.json'), MIFFY_COVERAGE_DIR: rawDir },
		stdio: 'inherit',
	});
	if (result.error) throw result.error;
	if (result.status !== 0) process.exitCode = 1;

	const map = coverage.createCoverageMap({});
	const files = sourceFiles(sourceRoot);
	const executableFiles = [];
	for (const filename of files) {
		const { coverage: initial } = await transformTypeScript(filename, true);
		map.addFileCoverage(initial);
		if (Object.keys(initial.statementMap).length || Object.keys(initial.branchMap).length) {
			executableFiles.push(filename);
		}
	}
	const results = readdirSync(rawDir).filter((filename) => filename.endsWith('.json'));
	if (!results.length) throw new Error('Tests produced no coverage data');
	for (const filename of results) {
		map.merge(JSON.parse(readFileSync(path.join(rawDir, filename), 'utf8')));
	}
	const remapped = await sourceMaps.createSourceMapStore().transformCoverage(map);
	const output = path.join(root, 'coverage');
	mkdirSync(output, { recursive: true });
	writeFileSync(path.join(output, 'coverage-final.json'), JSON.stringify(remapped.toJSON()));
	const context = report.createContext({ dir: output, coverageMap: remapped });
	reports.create('text').execute(context);
	reports.create('lcovonly').execute(context);
	reports.create('html').execute(context);
	const failures = coverageFailures(remapped, [...new Set([...executableFiles, ...critical])], critical);
	if (failures.length) {
		for (const failure of failures) console.error(failure);
		process.exitCode = 1;
	}
} finally {
	rmSync(rawDir, { recursive: true });
}
