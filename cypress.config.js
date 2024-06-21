/* eslint-disable no-undef */
import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';

export default defineConfig({
  projectId: 'azion-console-kit',
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:5173',
    defaultCommandTimeout: 8000,
    video: true,
    experimentalStudio: true,
    retries: {
      runMode: 2,
      openMode: 2
    },
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config);
      return config;
    }
  },
  env: {
    CYPRESS_EMAIL_STAGE: process.env.CYPRESS_EMAIL_STAGE,
    CYPRESS_PASSWORD_STAGE: process.env.CYPRESS_PASSWORD_STAGE,
    CYPRESS_USERNAME_STAGE: process.env.CYPRESS_USERNAME_STAGE
  }
});