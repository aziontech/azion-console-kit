/* eslint-disable no-undef */
import { defineConfig } from 'cypress'
import registerCypressGrep from '@cypress/grep/src/plugin/index.js'
import fs from 'fs'

// Usando require para o módulo de code-coverage
const codeCoverageTask = require('@cypress/code-coverage/task')

export default defineConfig({
  projectId: 'azion-console-kit',
  e2e: {
    specPattern: 'cypress/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    defaultCommandTimeout: 60000,
    chromeWebSecurity: false,
    video: true,
    experimentalStudio: true,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      registerCypressGrep(config)
      codeCoverageTask(on, config)
      on('after:spec', (spec, results) => {
        if (results?.video && results?.stats?.failures === 0) {
          fs.unlinkSync(results.video)
        }
      })
      return config
    },
    testIsolation: false
  },
  env: {
    // TODO: remove this WORKAROUND for https://github.com/cypress-io/cypress/issues/20647,
    baseUrl: 'http://localhost:5173',
    isCI: process.env.GITHUB_ACTIONS,
    CYPRESS_EMAIL: process.env.DEV_CYPRESS_EMAIL,
    CYPRESS_PASSWORD: process.env.DEV_CYPRESS_PASSWORD,
    grepFilterSpecs: true,
    grepOmitFiltered: true
  }
})
