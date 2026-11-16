import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { coverageFailures } from '../helpers/coverage-gate.mjs';

function mapFor(statements: [number, number], branches: [number, number], files = ['critical']) {
	const summary = {
		statements: { covered: statements[0], total: statements[1] },
		branches: { covered: branches[0], total: branches[1] },
	};
	return {
		files: () => files,
		fileCoverageFor: () => ({ toSummary: () => summary }),
		getCoverageSummary: () => summary,
	};
}

// R9: Coverage gates must fail closed on missing files and uncovered paths.
describe('coverage gates', () => {
	it('rejects a missing critical file', () => {
		const failures = coverageFailures(mapFor([1, 1], [1, 1], []), ['critical'], ['critical']);

		assert.ok(failures.some((failure) => failure.includes('Missing coverage: critical')));
	});

	it('rejects an uncovered critical branch even when overall coverage exceeds 90 percent', () => {
		const failures = coverageFailures(mapFor([100, 100], [99, 100]), ['critical'], ['critical']);

		assert.ok(failures.some((failure) => failure.includes('critical: branches 99/100')));
		assert.equal(failures.some((failure) => failure.startsWith('overall:')), false);
	});

	it('uses exact counts rather than rounded percentages for the overall threshold', () => {
		const failures = coverageFailures(mapFor([8999, 10000], [90, 100], ['other']), ['other'], []);

		assert.ok(failures.some((failure) => failure.startsWith('overall: statements')));
	});

	it('rejects empty coverage rather than treating it as success', () => {
		const failures = coverageFailures(mapFor([0, 0], [0, 0], []), [], []);

		assert.ok(failures.includes('No executable production files were found'));
		assert.ok(failures.includes('overall: no measurable branches'));
	});

	it('accepts 100 percent critical coverage and 90 percent overall coverage', () => {
		const failures = coverageFailures(mapFor([100, 100], [100, 100]), ['critical'], ['critical']);

		assert.deepEqual(failures, []);
		const overall = coverageFailures(mapFor([90, 100], [90, 100], ['other']), ['other'], []);
		assert.deepEqual(overall, []);
	});
});
