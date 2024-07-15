import fs from 'fs';
import fetch from 'node-fetch';

// eslint-disable-next-line no-undef
const [, , fileName, SLACK_URL] = process.argv;

const FILE_NAME_TO_ENV = {
  './cypress/reports/index.json': 'STAGE'
};

function getJsonFileContent(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    return JSON.parse(fileContent);
  } catch (error) {
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Error reading or parsing JSON file:', error);
    }
    return null;
  }
}

const fileContent = getJsonFileContent(fileName);

let result = '';
let status = '';
let environmentName = FILE_NAME_TO_ENV[fileName] || 'UNKNOWN';

if (fileContent && fileContent.stats && fileContent.stats.failures > 0) {
  const { stats } = fileContent;
  const failedTestsCount = stats.failures;

  status = failedTestsCount > 0 ? ':x:' : ':white_check_mark:';
  result = `${status} ${environmentName} - ${failedTestsCount} Failed Test(s)\n`;

  const suitesMap = new Map();

  fileContent.results.forEach(feature => {
    feature.suites.forEach(suite => {
      suite.tests.forEach(test => {
        if (test.fail) {
          if (!suitesMap.has(suite.title)) {
            suitesMap.set(suite.title, []);
          }
          suitesMap.get(suite.title).push(test.title);
        }
      });
    });
  });

  suitesMap.forEach((tests, suiteTitle) => {
    result += `\`${suiteTitle}\`\n\`\`\`\n`;
    tests.forEach(test => {
      result += `${test}\n`;
    });
    result += '```\n';
  });
} else {
  result = `:x: Unable to find/decode JSON file for ${environmentName}. Please ensure the workflow is working.`;
}

const data = { text: result };

fetch(SLACK_URL, {
  method: 'POST',
  headers: {
    'Content-type': 'application/json'
  },
  body: JSON.stringify(data)
})
  .then(response => response.text())
  .then(result => {
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(result);
    }
  })
  .catch(error => {
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('error', error);
    }
  });