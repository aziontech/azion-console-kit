/**
 * Fixture Recording Helper
 *
 * Provides functionality to record API responses during test runs
 * and replay them from fixtures for faster, isolated testing.
 *
 * Test Modes:
 * - RECORD: Runs against real API and saves responses as fixtures
 * - REPLAY: Uses saved fixtures instead of real API
 * - LIVE: Runs against real API without recording (default)
 *
 * Profile Support:
 * Fixtures are organized by profile (v4-ui-v5-config, v4-ui-v3-config, etc.)
 * to handle different API responses based on account configuration.
 *
 * Structure:
 *   cypress/fixtures/recorded/{profile}/{module}/{operation}.json
 *
 * Usage:
 *   // In beforeEach or test
 *   fixtureRecorder.setupSync('variables', 'v3/variables')
 *
 *   // After test, call saveRecordings() in afterEach
 */

const TEST_MODE = {
  RECORD: 'record',
  REPLAY: 'replay',
  LIVE: 'live'
}

/**
 * Gets the current profile name from Cypress environment
 * @returns {string} Profile name (e.g., 'v4-ui-v5-config')
 */
const getCurrentProfileName = () => {
  const profileKey = Cypress.env('TEST_PROFILE') || 'V4_UI_V3_CONFIG'
  // Convert V4_UI_V3_CONFIG to v4-ui-v3-config
  return profileKey.toLowerCase().replace(/_/g, '-')
}

/**
 * Gets the current test mode from Cypress environment
 * @returns {string} Current test mode (record, replay, or live)
 */
const getTestMode = () => {
  return Cypress.env('TEST_MODE') || TEST_MODE.LIVE
}

/**
 * Checks if we're in recording mode
 * @returns {boolean}
 */
const isRecordMode = () => {
  return getTestMode() === TEST_MODE.RECORD
}

/**
 * Checks if we're in replay mode
 * @returns {boolean}
 */
const isReplayMode = () => {
  return getTestMode() === TEST_MODE.REPLAY
}

/**
 * Generates a fixture path for a given module and operation
 * Path includes the current profile for proper isolation
 *
 * @param {string} moduleName - Module name (e.g., 'edgeApplications')
 * @param {string} operation - Operation type (e.g., 'list', 'get', 'create')
 * @param {string} suffix - Optional suffix for unique identification
 * @returns {string} Fixture file path
 */
const getFixturePath = (moduleName, operation, suffix = '') => {
  const profile = getCurrentProfileName()
  const basePath = `recorded/${profile}/${moduleName}`
  const fileName = suffix ? `${operation}-${suffix}.json` : `${operation}.json`
  return `${basePath}/${fileName}`
}

/**
 * Generates full filesystem path for writing fixtures
 * @param {string} moduleName - Module name
 * @param {string} operation - Operation type
 * @returns {string} Full path for cy.writeFile
 */
const getFixtureWritePath = (moduleName, operation) => {
  const profile = getCurrentProfileName()
  return `cypress/fixtures/recorded/${profile}/${moduleName}/${operation}.json`
}

/**
 * Fixture recorder helper object
 */
export const fixtureRecorder = {
  /**
   * Current test mode
   */
  mode: getTestMode(),

  /**
   * Recorded responses (used during record mode)
   */
  recordings: {},

  /**
   * Simple synchronous setup that works with Cypress command queue.
   * For RECORD mode: intercepts and records responses
   * For LIVE mode: just sets up intercepts for waiting
   * For REPLAY mode: mocks responses from fixtures (requires fixtures to exist)
   *
   * @param {string} moduleName - Module name (e.g., 'variables')
   * @param {string} baseUrl - Base API URL (e.g., 'v3/variables')
   * @returns {Object} Object with aliases
   */
  setupSync(moduleName, baseUrl) {
    const mode = getTestMode()
    const aliasPrefix = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

    const operations = {
      list: { method: 'GET', pattern: `**/${baseUrl}`, alias: `${aliasPrefix}List` },
      get: { method: 'GET', pattern: `**/${baseUrl}/*`, alias: `${aliasPrefix}Get` },
      create: { method: 'POST', pattern: `**/${baseUrl}`, alias: `${aliasPrefix}Create` },
      update: { method: 'PUT', pattern: `**/${baseUrl}/*`, alias: `${aliasPrefix}Update` },
      delete: { method: 'DELETE', pattern: `**/${baseUrl}/*`, alias: `${aliasPrefix}Delete` }
    }

    const aliases = {}

    Object.entries(operations).forEach(([op, config]) => {
      aliases[op] = `@${config.alias}`

      if (mode === TEST_MODE.RECORD) {
        // Record mode: intercept and store response
        cy.intercept(config.method, config.pattern, (req) => {
          req.continue((res) => {
            const key = `${moduleName}_${op}`
            this.recordings[key] = {
              timestamp: new Date().toISOString(),
              url: req.url,
              method: req.method,
              statusCode: res.statusCode,
              body: res.body
            }
          })
        }).as(config.alias)
      } else {
        // Live mode: just intercept for waiting
        cy.intercept(config.method, config.pattern).as(config.alias)
      }
    })

    return { baseUrl, aliases, mode }
  },

  /**
   * Sets up replay from pre-recorded fixtures.
   * Call this BEFORE navigation in beforeEach.
   * Looks for fixtures in profile-specific directory.
   *
   * @param {string} moduleName - Module name
   * @param {string} baseUrl - Base API URL
   */
  setupReplay(moduleName, baseUrl) {
    const aliasPrefix = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)
    const profile = getCurrentProfileName()
    const fixturePath = `recorded/${profile}/${moduleName}`

    // Mock list endpoint
    cy.fixture(`${fixturePath}/list.json`).then((data) => {
      cy.intercept('GET', `**/${baseUrl}`, {
        statusCode: data.statusCode || 200,
        body: data.body
      }).as(`${aliasPrefix}List`)
    })

    // Mock get endpoint
    cy.fixture(`${fixturePath}/get.json`).then((data) => {
      cy.intercept('GET', `**/${baseUrl}/*`, {
        statusCode: data.statusCode || 200,
        body: data.body
      }).as(`${aliasPrefix}Get`)
    })

    return {
      aliases: {
        list: `@${aliasPrefix}List`,
        get: `@${aliasPrefix}Get`
      }
    }
  },

  /**
   * Sets up recording/replay for a module's endpoints
   *
   * @param {string} moduleName - Module name
   * @param {Object} config - Configuration object
   * @param {string} config.baseUrl - Base API URL for the module
   * @param {string[]} config.operations - Operations to intercept ['list', 'get', 'create', 'update', 'delete']
   * @param {Object} config.fixtures - Custom fixture paths (optional)
   */
  setup(moduleName, config) {
    const mode = getTestMode()
    const { baseUrl, operations = ['list', 'get', 'create', 'update', 'patch', 'delete'] } = config

    const operationMethods = {
      list: { method: 'GET', urlPattern: `**/${baseUrl}*`, notContains: '/' },
      get: { method: 'GET', urlPattern: `**/${baseUrl}/*` },
      create: { method: 'POST', urlPattern: `**/${baseUrl}*` },
      update: { method: 'PUT', urlPattern: `**/${baseUrl}/*` },
      patch: { method: 'PATCH', urlPattern: `**/${baseUrl}/*` },
      delete: { method: 'DELETE', urlPattern: `**/${baseUrl}/*` }
    }

    const aliasPrefix = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)
    const aliases = {}

    operations.forEach((op) => {
      const opConfig = operationMethods[op]
      if (!opConfig) return

      const aliasName = `${aliasPrefix}${op.charAt(0).toUpperCase() + op.slice(1)}`
      aliases[op] = `@${aliasName}`

      if (mode === TEST_MODE.REPLAY) {
        // Replay mode: use fixtures
        this.setupReplayIntercept(moduleName, op, opConfig, aliasName)
      } else if (mode === TEST_MODE.RECORD) {
        // Record mode: intercept and save
        this.setupRecordIntercept(moduleName, op, opConfig, aliasName)
      } else {
        // Live mode: just intercept for waiting
        cy.intercept(opConfig.method, opConfig.urlPattern).as(aliasName)
      }
    })

    return { baseUrl, aliases }
  },

  /**
   * Sets up intercept for replay mode (uses fixtures)
   */
  setupReplayIntercept(moduleName, operation, opConfig, aliasName) {
    const fixturePath = getFixturePath(moduleName, operation)

    cy.fixture(fixturePath)
      .then((fixtureData) => {
        cy.intercept(opConfig.method, opConfig.urlPattern, {
          statusCode: fixtureData.statusCode || 200,
          body: fixtureData.body
        }).as(aliasName)
      })
      .catch(() => {
        // Fixture doesn't exist, fall back to live
        cy.log(`Fixture not found: ${fixturePath}, using live API`)
        cy.intercept(opConfig.method, opConfig.urlPattern).as(aliasName)
      })
  },

  /**
   * Sets up intercept for record mode (captures responses)
   */
  setupRecordIntercept(moduleName, operation, opConfig, aliasName) {
    cy.intercept(opConfig.method, opConfig.urlPattern, (req) => {
      req.on('response', (res) => {
        // Record the response
        const recording = {
          timestamp: new Date().toISOString(),
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
          body: res.body
        }

        // Store in memory (will be saved after test)
        const key = `${moduleName}_${operation}`
        this.recordings[key] = recording

        cy.log(`Recorded: ${key}`)
      })
    }).as(aliasName)
  },

  /**
   * Saves all recorded responses to fixtures (call in afterEach)
   * Fixtures are saved to profile-specific directories
   * Note: This uses cy.writeFile which requires the task plugin
   */
  saveRecordings() {
    if (!isRecordMode()) return

    const profile = getCurrentProfileName()

    Object.entries(this.recordings).forEach(([key, recording]) => {
      const [moduleName, operation] = key.split('_')
      const fixturePath = `cypress/fixtures/recorded/${profile}/${moduleName}/${operation}.json`

      // Add profile info to recording metadata
      recording.profile = profile

      cy.writeFile(fixturePath, recording, { log: true })
    })

    // Clear recordings after saving
    this.recordings = {}
  },

  /**
   * Records a specific API call and saves as fixture
   *
   * @param {string} alias - The intercept alias (without @)
   * @param {string} fixtureName - Name for the fixture file
   */
  recordAndSave(alias, fixtureName) {
    cy.wait(`@${alias}`).then((interception) => {
      if (isRecordMode()) {
        const recording = {
          timestamp: new Date().toISOString(),
          url: interception.request.url,
          method: interception.request.method,
          statusCode: interception.response.statusCode,
          body: interception.response.body,
          requestBody: interception.request.body
        }

        cy.writeFile(`cypress/fixtures/recorded/${fixtureName}.json`, recording)
      }
    })
  },

  /**
   * Creates a mock response from a recorded fixture
   *
   * @param {string} method - HTTP method
   * @param {string} urlPattern - URL pattern to match
   * @param {string} fixturePath - Path to fixture file
   * @param {string} alias - Alias name
   */
  replayFromFixture(method, urlPattern, fixturePath, alias) {
    cy.fixture(fixturePath).then((data) => {
      cy.intercept(method, urlPattern, {
        statusCode: data.statusCode || 200,
        body: data.body
      }).as(alias)
    })
  },

  /**
   * Records multiple endpoints for a test scenario
   *
   * @param {string} scenarioName - Name of the test scenario
   * @param {Object[]} endpoints - Array of { method, urlPattern, alias } objects
   */
  recordScenario(scenarioName, endpoints) {
    if (!isRecordMode()) return

    const scenarioRecordings = {}

    endpoints.forEach(({ method, urlPattern, alias }) => {
      cy.intercept(method, urlPattern, (req) => {
        req.on('response', (res) => {
          scenarioRecordings[alias] = {
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body,
            requestBody: req.body
          }
        })
      }).as(alias)
    })

    // Return cleanup function
    return () => {
      cy.writeFile(`cypress/fixtures/scenarios/${scenarioName}.json`, {
        recordedAt: new Date().toISOString(),
        recordings: scenarioRecordings
      })
    }
  },

  /**
   * Replays a recorded test scenario
   *
   * @param {string} scenarioName - Name of the scenario to replay
   */
  replayScenario(scenarioName) {
    if (!isReplayMode()) return

    cy.fixture(`scenarios/${scenarioName}.json`).then((scenario) => {
      Object.entries(scenario.recordings).forEach(([alias, data]) => {
        const method = data.method
        const urlPattern = new URL(data.url).pathname + '*'

        cy.intercept(method, `**${urlPattern}`, {
          statusCode: data.statusCode,
          body: data.body
        }).as(alias)
      })
    })
  },

  /**
   * Gets current test mode
   * @returns {string} Test mode
   */
  getMode() {
    return getTestMode()
  },

  /**
   * Checks if recording is enabled
   * @returns {boolean}
   */
  isRecording() {
    return isRecordMode()
  },

  /**
   * Checks if replaying from fixtures
   * @returns {boolean}
   */
  isReplaying() {
    return isReplayMode()
  },

  /**
   * Gets the current profile name
   * @returns {string} Profile name (e.g., 'v4-ui-v5-config')
   */
  getProfileName() {
    return getCurrentProfileName()
  },

  /**
   * Gets the fixture base path for current profile
   * @param {string} moduleName - Module name
   * @returns {string} Base path for fixtures
   */
  getFixtureBasePath(moduleName) {
    const profile = getCurrentProfileName()
    return `recorded/${profile}/${moduleName}`
  }
}

export default fixtureRecorder
