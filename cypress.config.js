/* eslint-disable no-undef */
import { defineConfig } from 'cypress'
import codeCoverageTask from '@cypress/code-coverage/task'
import fs from 'fs';

export default defineConfig({
  projectId: 'azion-console-kit',
  e2e: {
    specPattern: 'cypress/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    defaultCommandTimeout: 15000,
    video: true,
    experimentalStudio: true,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config)
      on('after:spec', (spec, results) => {
        if (results && results.video && results.stats.failures === 0) {
          fs.unlinkSync(results.video)
        }
      })
      return config
    }
  },
  env: {
    // TODO: remove this WORKAROUND for https://github.com/cypress-io/cypress/issues/20647,
    baseUrl: 'http://localhost:5173',
    isCI: process.env.GITHUB_ACTIONS,
    CYPRESS_EMAIL: process.env.DEV_CYPRESS_EMAIL,
    CYPRESS_PASSWORD: process.env.DEV_CYPRESS_PASSWORD,
    CYPRESS_USERNAME: process.env.DEV_CYPRESS_USERNAME,
  }
})
