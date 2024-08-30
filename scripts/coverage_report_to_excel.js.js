import fs from 'fs';
import xlsx from 'xlsx';
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
        return !fileName.includes('.');
    });

    return [headers, ...parentPathsData];
}

function exportToXlsx(allData, parentPathsData, outputFilePath) {
    console.log('Starting to export data to .xlsx file:', outputFilePath);

    const allDataWorksheet = xlsx.utils.aoa_to_sheet(allData);
    const parentPathsWorksheet = xlsx.utils.aoa_to_sheet(parentPathsData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, allDataWorksheet, 'All Data');
    xlsx.utils.book_append_sheet(workbook, parentPathsWorksheet, 'Parent Paths Data');

    xlsx.writeFile(workbook, outputFilePath);

    console.log('Data exported successfully to', outputFilePath);
}

const txtFilePath = './coverage.txt';
const xlsxFilePath = './coverage/e2e/coverage-report.xlsx';

console.log('Script execution started.');
const parsedData = parseTxtFile(txtFilePath);
const parentPathsData = generateParentPathsData(parsedData);
exportToXlsx(parsedData, parentPathsData, xlsxFilePath);
console.log('Script execution completed.');
