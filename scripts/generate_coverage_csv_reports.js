import fs from 'fs';
import path from 'path';
import console from 'console';

function parseTxtFile(filePath) {
    console.log('Starting to read the .txt file:', filePath);
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    console.log('File read successfully. Processing the content...');

    const lines = fileContent.split('\n').filter(line => line.trim() !== '' && !line.includes('---'));
    const headers = lines[0].split('|').map(header => header.trim());

    const data = lines.slice(1).map(line => line.split('|').map(col => col.trim()));

    console.log('File content parsed successfully.');
    return [headers, ...data];
}

function generateParentPathsData(parsedData) {
    const headers = parsedData[0];
    const data = parsedData.slice(1);

    const parentPathsData = data.filter(row => {
        const fileName = row[0].trim();
        return !fileName.includes('.') || (fileName.startsWith('...') && !fileName.slice(3).includes('.'));
    });

    return [headers, ...parentPathsData];
}

function exportToCsv(data, outputFilePath) {
    console.log('Starting to export data to .csv file:', outputFilePath);

    const csvContent = data.map(row => row.join(',')).join('\n');
    fs.writeFileSync(outputFilePath, csvContent);

    console.log('Data exported successfully to', outputFilePath);
}

const txtFilePath = './coverage.txt';
const allDataCsvPath = path.join('./coverage/e2e', 'coverage-report-all.csv');
const parentPathsCsvPath = path.join('./coverage/e2e', 'coverage-report-parents.csv');

console.log('Script execution started.');
const parsedData = parseTxtFile(txtFilePath);
const parentPathsData = generateParentPathsData(parsedData);

exportToCsv(parsedData, allDataCsvPath);
exportToCsv(parentPathsData, parentPathsCsvPath);

console.log('Script execution completed.');
