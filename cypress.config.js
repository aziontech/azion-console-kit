/* eslint-disable no-undef */
import { defineConfig } from 'cypress'
import codeCoverageTask from '@cypress/code-coverage/task.js'
import registerCypressGrep from '@cypress/grep/src/plugin.js'
import cypressSplit from 'cypress-split'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  projectId: 'azion-console-kit',
  e2e: {
    specPattern: 'cypress/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    defaultCommandTimeout: 60000,
    chromeWebSecurity: false,
    video: process.env.CYPRESS_VIDEO === 'true',
    experimentalStudio: true,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      // Enable sharding via SPLIT and SPLIT_INDEX env vars
      cypressSplit(on, config)
      registerCypressGrep(config)
      codeCoverageTask(on, config)

      // Task to ensure directory exists for fixture recording
      on('task', {
        fileExists(filePath) {
          const fullPath = path.resolve(filePath)
          return fs.existsSync(fullPath)
        },
        ensureDir(dirPath) {
          const fullPath = path.resolve(dirPath)
          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true })
          }
          return null
        },
        readFixture(filePath) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            return JSON.parse(content)
          } catch {
            return null
          }
        },
        writeFixture({ filePath, data }) {
          const dir = path.dirname(filePath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
          return null
        }
      })

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
    grepOmitFiltered: true,
    // Test mode: 'live' (default), 'record', or 'replay'
    TEST_MODE: process.env.CYPRESS_TEST_MODE || 'live',
    // Test profile: V4_UI_V3_CONFIG (default - standard account), V4_UI_V5_CONFIG, V3_UI_V5_CONFIG, V3_UI_V3_CONFIG
    TEST_PROFILE: process.env.CYPRESS_TEST_PROFILE || 'V4_UI_V3_CONFIG',
    // Stage URL for record mode
    STAGE_URL: process.env.CYPRESS_STAGE_URL || 'https://stage-console.azion.com',
    // Mock server URL for mock_server mode
    MOCK_SERVER_URL: process.env.CYPRESS_MOCK_SERVER_URL || 'http://localhost:4000'
  }
})
