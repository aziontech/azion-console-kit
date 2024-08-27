import fs from 'fs';
import chalk from 'chalk';
import process from 'process';
import console from 'console';

function checkSpecs(filePath) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\n📂 Reading specs file: ${filePath}\n`));
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(chalk.red(`❌ Error reading file: ${err.message}\n`));
        reject(err);
        return;
      }

      console.log(chalk.green('✅ File read successfully.\n'));
      const specsData = JSON.parse(data);
      const missingTagSpecs = checkSpecsData(specsData);

      if (missingTagSpecs.length > 0) {
        console.error(chalk.red(`\n❌ Specs missing '@dev{number}' tag:\n${missingTagSpecs.join('\n')}`));
        reject(new Error('Some specs are missing the required tags.'));
      } else {
        console.log(chalk.green('🎉 All specs have the required tags!\n'));
        resolve(true);
      }
    });
  });
}

function checkSpecsData(data) {
  const missingTagSpecs = [];
  for (const specFile in data) {
    if (Object.prototype.hasOwnProperty.call(data, specFile)) {
      const specData = data[specFile];
      let hasValidTag = false;
      for (const suite of specData.tests) {
        if (suite.tags && suite.tags.some(tag => tag.startsWith('@dev'))) {
          hasValidTag = true;
          break;
        }
      }
      if (!hasValidTag) {
        missingTagSpecs.push(specFile);
        console.warn(chalk.yellow(`⚠️ Spec '${specFile}' is missing a '@dev{number}' tag.`));
      }
    }
  }
  return missingTagSpecs;
}

const filePath = process.argv[2];

if (!filePath) {
  console.error(chalk.red("❌ Please provide the file path as an argument.\n"));
  process.exit(1);
}

checkSpecs(filePath)
  .then(() => {
    console.log(chalk.green("🎉 All specs have a tag '@dev{number}'.\n"));
  })
  .catch(err => {
    console.error(chalk.red(`\n❌ ${err.message}\n`));
    process.exit(1);
  });
