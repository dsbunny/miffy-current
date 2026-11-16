interface CoverageSummary {
	statements: { covered: number; total: number };
	branches: { covered: number; total: number };
}

interface CoverageMap {
	files(): string[];
	fileCoverageFor(path: string): { toSummary(): CoverageSummary };
	getCoverageSummary(): CoverageSummary;
}

export function coverageFailures(map: CoverageMap, expectedFiles: string[], criticalFiles: string[]): string[];
