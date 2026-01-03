// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import './utils'
import '@cypress/code-coverage/support'
import 'cypress-plugin-tab'
import registerCypressGrep from '@cypress/grep'

registerCypressGrep()

// Alternatively you can use CommonJS syntax:
// require('./commands')

// ============================================================================
// AUTOMATIC FIXTURE RECORDING
// When TEST_MODE=record, automatically capture all API responses
// ============================================================================

const TEST_MODE = Cypress.env('TEST_MODE') || 'live'

// Storage for recorded API calls during a test run
let recordedApiCalls = {}
let currentSpecName = ''

// API endpoint patterns to record
const API_PATTERNS = [
  { pattern: '**/v4/workspace/**', name: 'v4-workspace' },
  { pattern: '**/v4/iam/**', name: 'v4-iam' },
  { pattern: '**/v3/**', name: 'v3' },
  { pattern: '**/api/v3/**', name: 'api-v3' }
]

if (TEST_MODE === 'record') {
  // Set up intercepts for all API patterns
  beforeEach(() => {
    recordedApiCalls = {}

    // Get current spec name from Cypress.spec
    currentSpecName = Cypress.spec.name
      .replace('.cy.js', '')
      .replace(/\//g, '-')

    // Intercept all API calls
    API_PATTERNS.forEach(({ pattern }) => {
      cy.intercept(pattern, (req) => {
        req.continue((res) => {
          const urlPath = new URL(req.url).pathname
          const method = req.method
          const key = `${method}:${urlPath}`

          // Store the response
          recordedApiCalls[key] = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            path: urlPath,
            statusCode: res.statusCode,
            body: res.body,
            requestBody: req.body
          }
        })
      })
    })
  })

  // Save recordings after each test
  afterEach(function () {
    if (Object.keys(recordedApiCalls).length > 0) {
      const testTitle = this.currentTest.title
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()

      const filename = `cypress/fixtures/recorded/${currentSpecName}/${testTitle}.json`

      cy.task('writeFixture', {
        filePath: filename,
        data: {
          recordedAt: new Date().toISOString(),
          spec: Cypress.spec.name,
          test: this.currentTest.title,
          calls: recordedApiCalls
        }
      })
    }
  })

  // Log that we're in record mode
  before(() => {
    cy.log('🔴 RECORD MODE: Capturing API responses')
  })
}

// In replay mode, mock responses from fixtures
if (TEST_MODE === 'replay') {
  before(() => {
    cy.log('🔵 REPLAY MODE: Using recorded fixtures')
  })

  beforeEach(function () {
    // Only try to load fixtures if we have a current test
    if (!this.currentTest) return

    const specName = Cypress.spec.name
      .replace('.cy.js', '')
      .replace(/\//g, '-')
    const testTitle = this.currentTest.title
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()

    const fixturePath = `recorded/${specName}/${testTitle}.json`

    // Try to load and replay the fixture
    // Use cy.task to check file existence first (Cypress commands don't have .catch())
    cy.task('fileExists', `cypress/fixtures/${fixturePath}`, { log: false }).then((exists) => {
      if (exists) {
        cy.fixture(fixturePath, { log: false }).then((data) => {
          if (data && data.calls) {
            Object.values(data.calls).forEach((call) => {
              cy.intercept(call.method, `**${call.path}*`, {
                statusCode: call.statusCode,
                body: call.body
              })
            })
          }
        })
      }
      // If fixture doesn't exist, continue with live API (silent)
    })
  })
}
