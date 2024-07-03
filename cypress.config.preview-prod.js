/* eslint-disable no-undef */
import { defineConfig } from 'cypress';
import baseConfig from './cypress.config';

const e2eOverride = {
  hosts: {
    "console.azion.com": "179.191.172.120"
  },
};

const envOverride = {
  // TODO: remove this WORKAROUND for https://github.com/cypress-io/cypress/issues/20647,
  baseUrl: 'http://console.azion.com',
  CYPRESS_EMAIL: process.env.PREVIEW_PROD_CYPRESS_EMAIL,
  CYPRESS_PASSWORD: process.env.PREVIEW_PROD_CYPRESS_PASSWORD,
  CYPRESS_USERNAME: process.env.PREVIEW_PROD_CYPRESS_USERNAME,
};

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    ...e2eOverride,
  },
  env: {
      ...baseConfig.env,
    ...envOverride,
  },
});