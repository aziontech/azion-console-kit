import axios from 'axios';
import fs from 'fs';
import path from 'path';
import process from 'process';
import console from 'console';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readCypressEnv = () => {
  const cypressEnvPath = path.resolve(__dirname, '../cypress.env.json');
  if (fs.existsSync(cypressEnvPath)) {
    const rawdata = fs.readFileSync(cypressEnvPath);
    return JSON.parse(rawdata);
  } else {
    console.error('⚠️ cypress.env.json file not found.');
    process.exit(1);
  }
};

const cypressEnv = readCypressEnv();

const ENV = process.argv[2] ? process.argv[2].toUpperCase() : 'STAGE';
const API_v3 = ENV === 'PROD' ? 'https://api.azionapi.net' : 'https://stage-api.azion.net';
const API_v4 = ENV === 'PROD' ? 'https://api.azion.com/v4' : 'https://stage-api.azion.com/v4';
const URL = `${API_v3}`;
const URL_v4 = `${API_v4}`;

const CYPRESS_TOKEN = cypressEnv[`${ENV}_CYPRESS_TOKEN`];

const credentials = {
  "cypress": { "token": CYPRESS_TOKEN, "wait_time": 10 },
};

const entities = [
  { name: 'credentials', url: `${URL}/credentials`, version: 3 },
  { name: 'data_streaming', url: `${URL}/data_streaming/streamings`, version: 3 },
  { name: 'edge_applications', url: `${URL}/edge_applications`, version: 3, exclude: [1718380244, 340244] },
  { name: 'edge_firewall', url: `${URL}/edge_firewall`, version: 3 },
  { name: 'edge_sql', url: `${URL_v4}/edge_sql/databases`, version: 4 },
  { name: 'waf_rulesets', url: `${URL}/waf/rulesets`, version: 3 },
  { name: 'digital_certificates', url: `${URL}/digital_certificates/`, version: 3 },
  { name: 'network_lists', url: `${URL}/network_lists`, version: 3, exclude: [66, 2] },
];

const deleteResources = async (url, headers, wait_time, getCount, getResults, getSingleUrl, excludeIds = []) => {
  let hasResource = true;

  while (hasResource) {
    const response = await axios.get(url, { headers });
    const count = getCount(response.data);
    const results = getResults(response.data);

    console.log(`\n🗑️ Total of ${count} resources to be deleted.`);

    if (count === 0) {
      console.log('✅ No more resources to delete.');
      break;
    }

    hasResource = results.length > 0;

    if (!hasResource) {
      console.log('✅ No more resources to delete.');
      break;
    }

    let deletedCount = 0;

    for (const resource of results) {
      if (!excludeIds.includes(resource.id)) {
        try {
          const singleResourceUrl = getSingleUrl(resource);
          const deleteResponse = await axios.delete(singleResourceUrl, { headers });
          console.log(`🗑️ Deleted resource: ${singleResourceUrl} - Status code: ${deleteResponse.status}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Error deleting resource with ID ${resource.id}: ${error.message}`);
        }
      } else {
        console.log(`🚫 Skipping deletion for resource with ID ${resource.id}`);
      }
    }

    if (deletedCount === 0) {
      console.log('✅ No resources deleted in this iteration.');
      break;
    }

    console.log(`⏳ Waiting for ${wait_time} seconds before continuing...`);
    await setTimeout(wait_time * 1000);
  }
};

const getCountFunctions = {
  credentials: data => data.credentials ? data.credentials.length : 0,
  data_streaming: data => data.results ? data.results.length : 0,
  edge_applications: data => data.count ? data.count : 0,
  edge_firewall: data => data.count ? data.count : 0,
  edge_sql: data => data.count ? data.count : 0,
  waf_rulesets: data => data.count ? data.count : 0,
  digital_certificates: data => data.count ? data.count : 0,
  network_lists: data => data.count ? data.count : 0,
};

const getResultsFunctions = {
  credentials: data => data.credentials || [],
  data_streaming: data => data.results || [],
  edge_applications: data => data.results || [],
  edge_firewall: data => data.results || [],
  edge_sql: data => data.results || [],
  waf_rulesets: data => data.results || [],
  digital_certificates: data => data.results || [],
  network_lists: data => data.results || [],
};

(async () => {
  for (const userType in credentials) {
    const { token, wait_time } = credentials[userType];
    const headers = {
      "Accept": "application/json; version=3",
      "Content-Type": "application/json",
      "Authorization": `token ${token}`,
    };

    for (const entity of entities) {
      console.log(`\n🔄 Processing ${entity.name}...`);
      const getCount = getCountFunctions[entity.name.split('/')[0]];
      const getResults = getResultsFunctions[entity.name.split('/')[0]];

      if (!getCount || !getResults) {
        console.error(`⚠️ No functions found for entity: ${entity.name}`);
        continue;
      }

      await deleteResources(
        entity.url,
        headers,
        wait_time,
        getCount,
        getResults,
        resource => `${entity.url}/${resource.id}`,
        entity.exclude || []
      );
    }
  }
})();
