import fs from 'fs';
import process from 'process';
import console from 'console';

function checkCoverage(lcovReportPath, threshold) {
  fs.readFile(lcovReportPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`❌ Error reading LCOV report: ${err.message}`);
      process.exit(1);
    }

    const lines = data.split('TN:\n');
    let totalLines = 0;
    let coveredLines = 0;

    for (const lineBlock of lines) {
      if (lineBlock.trim() === '') continue;

      const linesInFile = lineBlock.split('\n');
      for (const line of linesInFile) {
        if (line.startsWith('LF:')) {
          totalLines += parseInt(line.split(':')[1], 10);
        } else if (line.startsWith('LH:')) {
          coveredLines += parseInt(line.split(':')[1], 10);
        }
      }
    }

    const coverage = (coveredLines / totalLines) * 100;
    const coverageMessage = `Code coverage is ${coverage.toFixed(2)}%.`;

    if (coverage >= threshold) {
      console.log(`✅ ${coverageMessage} It meets the threshold of ${threshold}%.`);
      process.exit(0);
    } else {
      console.log(`❌ ${coverageMessage} It is below the threshold of ${threshold}%.`);
      process.exit(-1);
    }
  });
}

if (process.argv.length < 4) {
  console.log("Usage: node check_coverage.js <lcov_report_path> <threshold>");
  process.exit(1);
}

const lcovReportPath = process.argv[2];
let threshold;
try {
  threshold = parseFloat(process.argv[3]);
  if (isNaN(threshold)) throw new Error();
} catch (error) {
  console.log("Error: Threshold must be a number.");
  process.exit(1);
}

checkCoverage(lcovReportPath, threshold);
