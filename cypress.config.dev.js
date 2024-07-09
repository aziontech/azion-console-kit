/* eslint-disable no-undef */
import { defineConfig } from 'cypress';
import baseConfig from './cypress.config';

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
  },
  env: {
    ...baseConfig.env,
  },
});
