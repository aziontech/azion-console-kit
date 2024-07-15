/* eslint-disable no-undef */
import { defineConfig } from 'cypress'
import codeCoverageTask from '@cypress/code-coverage/task'
import registerCypressGrep from '@cypress/grep/src/plugin'
import cypressMochawesomeReporter from 'cypress-mochawesome-reporter/plugin'
import fs from 'fs'

export default defineConfig({
  projectId: 'azion-console-kit',
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: './cypress/reports',
    overwrite: true,
    html: false,
    json: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    videoOnFailOnly: true,
    saveJson: true
  },
  e2e: {
    specPattern: 'cypress/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    defaultCommandTimeout: 60000,
    video: true,
    experimentalStudio: true,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      cypressMochawesomeReporter(on);
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
    grepFilterSpecs: true
  }
})
