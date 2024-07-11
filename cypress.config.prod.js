/* eslint-disable no-undef */
import { defineConfig } from 'cypress';
import baseConfig from './cypress.config';

const envOverride = {
  // TODO: remove this WORKAROUND for https://github.com/cypress-io/cypress/issues/20647,
  baseUrl: 'http://console.azion.com',
  CYPRESS_EMAIL: process.env.PROD_CYPRESS_EMAIL,
  CYPRESS_PASSWORD: process.env.PROD_CYPRESS_PASSWORD,
};

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
  },
  env: {
    ...baseConfig.env,
    ...envOverride,
  },
});