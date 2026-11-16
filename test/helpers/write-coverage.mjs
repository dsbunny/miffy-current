import { writeFileSync } from 'node:fs';
import path from 'node:path';

process.on('exit', () => {
	if (globalThis.__coverage__ && process.env.MIFFY_COVERAGE_DIR) {
		const filename = path.join(process.env.MIFFY_COVERAGE_DIR, `${process.pid}.json`);
		writeFileSync(filename, JSON.stringify(globalThis.__coverage__));
	}
});
