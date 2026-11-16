export function coverageFailures(map, expectedFiles, criticalFiles) {
	const failures = [];
	const mapped = new Set(map.files());
	if (!expectedFiles.length) failures.push('No executable production files were found');
	for (const filename of new Set([...expectedFiles, ...criticalFiles])) {
		if (!mapped.has(filename)) failures.push(`Missing coverage: ${filename}`);
	}
	const check = (summary, threshold, label) => {
		for (const metric of ['statements', 'branches']) {
			const { covered, total } = summary[metric];
			if (!total) {
				failures.push(`${label}: no measurable ${metric}`);
			} else if (covered * 100 < total * threshold) {
				failures.push(`${label}: ${metric} ${covered}/${total} is below ${threshold}%`);
			}
		}
	};
	for (const filename of criticalFiles) {
		if (mapped.has(filename)) check(map.fileCoverageFor(filename).toSummary(), 100, filename);
	}
	check(map.getCoverageSummary(), 90, 'overall');
	return failures;
}
