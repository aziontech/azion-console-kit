/**
 * Test Profiles Configuration
 *
 * Manages the different dimensions of Azion Console configuration:
 *
 * 1. API Version (v3 vs v4):
 *    - v3: Legacy endpoints (/v3/*, /api/v3/*)
 *    - v4: Modern workspace endpoints (/v4/workspace/*)
 *
 * 2. Interface Version (UI v3 vs v4):
 *    - Controlled by flag: block_apiv4_incompatible_endpoints
 *    - v3 UI: hasFlagBlockApiV4() = true
 *    - v4 UI: hasFlagBlockApiV4() = false
 *
 * 3. Account Configuration (v3 vs v5):
 *    - Controlled by flag: useV5Configurations
 *    - v3: Standard accounts (fewer domains)
 *    - v5: Massive accounts (thousands of domains)
 */

/**
 * Profile definitions for different test scenarios
 */
export const TEST_PROFILES = {
  // Standard v4 UI + v5 Config (modern, most common)
  V4_UI_V5_CONFIG: {
    name: 'v4-ui-v5-config',
    description: 'Modern UI with v5 configuration (massive domains)',
    flags: {
      block_apiv4_incompatible_endpoints: false, // Use v4 UI
      useV5Configurations: true // Use v5 config
    },
    fixtureFile: 'account/info/v4-ui-v5-config.json'
  },

  // Standard v4 UI + v3 Config
  V4_UI_V3_CONFIG: {
    name: 'v4-ui-v3-config',
    description: 'Modern UI with v3 configuration (standard domains)',
    flags: {
      block_apiv4_incompatible_endpoints: false,
      useV5Configurations: false
    },
    fixtureFile: 'account/info/v4-ui-v3-config.json'
  },

  // Legacy v3 UI + v5 Config
  V3_UI_V5_CONFIG: {
    name: 'v3-ui-v5-config',
    description: 'Legacy UI with v5 configuration (massive domains)',
    flags: {
      block_apiv4_incompatible_endpoints: true, // Use v3 UI
      useV5Configurations: true
    },
    fixtureFile: 'account/info/v3-ui-v5-config.json'
  },

  // Legacy v3 UI + v3 Config
  V3_UI_V3_CONFIG: {
    name: 'v3-ui-v3-config',
    description: 'Legacy UI with v3 configuration (standard domains)',
    flags: {
      block_apiv4_incompatible_endpoints: true,
      useV5Configurations: false
    },
    fixtureFile: 'account/info/v3-ui-v3-config.json'
  }
}

/**
 * API endpoint mappings for each module based on API version
 */
export const API_ENDPOINTS = {
  // Modules with v4 API
  edgeFunctions: {
    v4: 'v4/workspace/functions',
    v3: null // No v3 endpoint (always v4)
  },
  edgeApplications: {
    v4: 'v4/workspace/workloads', // Changed from applications to workloads
    v3: 'api/v3/edge_applications'
  },
  edgeFirewall: {
    v4: 'v4/workspace/firewalls',
    v3: 'api/v3/edge_firewall'
  },
  edgeDns: {
    v4: 'v4/workspace/dns/zones',
    v3: null
  },
  digitalCertificates: {
    v4: 'v4/workspace/tls/certificates',
    v3: null
  },
  dataStream: {
    v4: 'v4/workspace/stream/streams',
    v3: null
  },
  networkLists: {
    v4: 'v4/workspace/network_lists',
    v3: null
  },
  waf: {
    v4: 'v4/workspace/wafs',
    v3: null
  },
  workloads: {
    v4: 'v4/workspace/workloads',
    v3: null
  },
  users: {
    v4: 'v4/iam/users',
    v3: null
  },
  teams: {
    v4: 'v4/iam/teams',
    v3: 'v3/iam/teams'
  },
  credentials: {
    v4: 'v4/workspace/storage/credentials',
    v3: null
  },
  edgeStorage: {
    v4: 'v4/workspace/storage',
    v3: null
  },
  purge: {
    v4: 'v4/workspace/purge',
    v3: null
  },
  edgeSql: {
    v4: 'v4/workspace/sql/databases',
    v3: null
  },
  // Legacy modules (v3 only)
  variables: {
    v4: null,
    v3: 'v3/variables'
  }
}

/**
 * Profile helper functions
 */
export const profileHelpers = {
  /**
   * Gets the current profile from Cypress environment
   * @returns {Object} Current profile configuration
   */
  getCurrentProfile() {
    const profileName = Cypress.env('TEST_PROFILE') || 'V4_UI_V5_CONFIG'
    return TEST_PROFILES[profileName] || TEST_PROFILES.V4_UI_V5_CONFIG
  },

  /**
   * Checks if running in live mode (real accounts with real flags)
   * @returns {boolean}
   */
  isLiveMode() {
    const testMode = Cypress.env('TEST_MODE') || 'live'
    return testMode === 'live'
  },

  /**
   * Sets up profile for testing based on TEST_MODE:
   * - live: Uses real account (no mocking) - flags come from actual account
   * - mock/replay: Uses fixture to mock account info
   *
   * @param {Object} profile - Profile from TEST_PROFILES (only used in mock mode)
   */
  setupProfile(profile = null) {
    if (this.isLiveMode()) {
      // Live mode: Account has correct flags configured
      // Just intercept to track, don't modify
      cy.intercept('GET', '/api/account/info').as('accountInfo')
      cy.log(`Running in LIVE mode with profile: ${this.getCurrentProfile().name}`)
    } else {
      // Mock mode: Use fixture
      this.mockProfileFixture(profile)
      cy.log(`Running in MOCK mode with profile: ${(profile || this.getCurrentProfile()).name}`)
    }
  },

  /**
   * Sets up intercepts to mock account info with specific profile flags
   * @param {Object} profile - Profile from TEST_PROFILES
   */
  setupProfileIntercepts(profile = null) {
    const currentProfile = profile || this.getCurrentProfile()

    cy.intercept('GET', '/api/account/info', (req) => {
      req.reply((res) => {
        // Modify the client_flags based on profile
        if (res.body && res.body.client_flags) {
          if (currentProfile.flags.block_apiv4_incompatible_endpoints) {
            res.body.client_flags.push('block_apiv4_incompatible_endpoints')
          } else {
            res.body.client_flags = res.body.client_flags.filter(
              (f) => f !== 'block_apiv4_incompatible_endpoints'
            )
          }
        }
        res.send(res.body)
      })
    }).as('accountInfo')
  },

  /**
   * Mocks account info with a specific profile fixture
   * @param {Object} profile - Profile from TEST_PROFILES
   */
  mockProfileFixture(profile = null) {
    const currentProfile = profile || this.getCurrentProfile()

    cy.intercept('GET', '/api/account/info', {
      fixture: currentProfile.fixtureFile
    }).as('accountInfo')
  },

  /**
   * Gets the appropriate API endpoint for a module based on profile
   * @param {string} moduleName - Module name (e.g., 'edgeFunctions')
   * @param {boolean} useV4 - Whether to use v4 endpoint
   * @returns {string} API endpoint
   */
  getApiEndpoint(moduleName, useV4 = true) {
    const endpoints = API_ENDPOINTS[moduleName]
    if (!endpoints) {
      throw new Error(`Unknown module: ${moduleName}`)
    }

    const endpoint = useV4 ? endpoints.v4 : endpoints.v3
    if (!endpoint) {
      throw new Error(`No ${useV4 ? 'v4' : 'v3'} endpoint for module: ${moduleName}`)
    }

    return endpoint
  },

  /**
   * Checks if current profile uses v4 UI
   * @returns {boolean}
   */
  isV4UI() {
    return !this.getCurrentProfile().flags.block_apiv4_incompatible_endpoints
  },

  /**
   * Checks if current profile uses v5 configuration
   * @returns {boolean}
   */
  isV5Config() {
    return this.getCurrentProfile().flags.useV5Configurations
  },

  /**
   * Gets profile-specific selectors (some components differ between v3/v4 UI)
   * @param {string} moduleName - Module name
   * @returns {Object} Selectors object for current profile
   */
  getProfileSelectors(moduleName) {
    const isV4 = this.isV4UI()
    // This will be expanded as we identify UI differences
    return {
      isV4UI: isV4,
      tabOrder: isV4 ? 'v4' : 'v3'
    }
  }
}

/**
 * Default export for easy import
 */
export default {
  profiles: TEST_PROFILES,
  endpoints: API_ENDPOINTS,
  helpers: profileHelpers
}
