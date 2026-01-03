/**
 * API Helpers
 *
 * Console-kit API patterns:
 * - Interceptation with retry handling
 * - N+1 query prevention via batch fetching
 * - GraphQL for events/metrics
 * - REST for CRUD operations
 *
 * API Versions:
 * - v4: Modern workspace endpoints (preferred)
 * - v3: Legacy endpoints (deprecated, use only when necessary)
 */

import { API_ENDPOINTS } from './profiles'

export const apiHelpers = {
  /**
   * Sets up intercept with retry handling.
   * Console-kit retries failed requests (3x for GLOBAL, 1x for SENSITIVE).
   *
   * @param {string} method - HTTP method
   * @param {string} url - URL pattern
   * @param {string} alias - Alias name (without @)
   * @param {Object} options - Additional intercept options
   */
  interceptWithRetry(method, url, alias, options = {}) {
    cy.intercept(method, url, (req) => {
      req.on('response', (res) => {
        // Log retry attempts for debugging
        if (res.statusCode >= 500) {
          cy.log(`Request to ${url} returned ${res.statusCode}, may retry`)
        }
      })
      if (options.reply) {
        req.reply(options.reply)
      }
    }).as(alias)
  },

  /**
   * Sets up intercepts for a module's CRUD operations.
   *
   * @param {string} baseUrl - Base URL for the module API
   * @param {string} moduleName - Module name for alias prefix
   */
  setupCrudIntercepts(baseUrl, moduleName) {
    cy.intercept('GET', `${baseUrl}`).as(`${moduleName}List`)
    cy.intercept('GET', `${baseUrl}/*`).as(`${moduleName}Get`)
    cy.intercept('POST', `${baseUrl}`).as(`${moduleName}Create`)
    cy.intercept('PUT', `${baseUrl}/*`).as(`${moduleName}Update`)
    cy.intercept('PATCH', `${baseUrl}/*`).as(`${moduleName}Patch`)
    cy.intercept('DELETE', `${baseUrl}/*`).as(`${moduleName}Delete`)
  },

  /**
   * Mocks an API response.
   *
   * @param {string} method - HTTP method
   * @param {string} url - URL pattern
   * @param {Object} response - Response body
   * @param {number} statusCode - HTTP status code (default 200)
   * @param {string} alias - Optional alias
   */
  mockResponse(method, url, response, statusCode = 200, alias = null) {
    const interceptOptions = {
      statusCode,
      body: response
    }

    if (alias) {
      cy.intercept(method, url, interceptOptions).as(alias)
    } else {
      cy.intercept(method, url, interceptOptions)
    }
  },

  /**
   * Mocks an API error response.
   *
   * @param {string} method - HTTP method
   * @param {string} url - URL pattern
   * @param {number} statusCode - Error status code
   * @param {string} errorMessage - Error message
   * @param {string} alias - Optional alias
   */
  mockError(method, url, statusCode, errorMessage, alias = null) {
    const errorBody = {
      error: errorMessage,
      status: statusCode
    }

    this.mockResponse(method, url, errorBody, statusCode, alias)
  },

  /**
   * Asserts no N+1 queries occurred.
   * N+1 happens when list loads then fetches each item individually.
   *
   * @param {string} listAlias - Alias for list request
   * @param {string} detailAlias - Alias for individual item requests
   * @param {number} maxDetailCalls - Maximum allowed detail calls (default 1)
   */
  assertNoN1Queries(listAlias, detailAlias, maxDetailCalls = 1) {
    // Get all requests matching the detail pattern
    cy.get(`@${detailAlias}.all`).then((requests) => {
      expect(requests.length).to.be.lte(
        maxDetailCalls,
        `Expected at most ${maxDetailCalls} detail requests but got ${requests.length}`
      )
    })
  },

  /**
   * Waits for enrichment requests after list load.
   * Console-kit uses enrichByMatchingReference for batch fetching related data.
   *
   * @param {string} listAlias - Alias for list request
   * @param {string} enrichAlias - Alias for enrichment request
   * @param {number} timeout - Max wait time (default 5000)
   */
  waitForEnrichment(listAlias, enrichAlias, timeout = 5000) {
    cy.wait(`@${listAlias}`, { timeout })
    cy.wait(`@${enrichAlias}`, { timeout })
  },

  /**
   * Sets up GraphQL intercept for events/metrics.
   *
   * @param {string} endpoint - GraphQL endpoint (events or metrics)
   * @param {string} operationName - GraphQL operation name
   * @param {string} alias - Alias name
   */
  interceptGraphQL(endpoint, operationName, alias) {
    cy.intercept('POST', `/v4/${endpoint}/graphql`, (req) => {
      if (req.body.query && req.body.query.includes(operationName)) {
        req.alias = alias
      }
    })
  },

  /**
   * Mocks a GraphQL response.
   *
   * @param {string} endpoint - GraphQL endpoint
   * @param {string} operationName - Operation to mock
   * @param {Object} data - Response data
   * @param {string} alias - Optional alias
   */
  mockGraphQL(endpoint, operationName, data, alias = null) {
    cy.intercept('POST', `/v4/${endpoint}/graphql`, (req) => {
      if (req.body.query && req.body.query.includes(operationName)) {
        req.reply({
          data
        })
        if (alias) {
          req.alias = alias
        }
      }
    })
  },

  /**
   * Conditional mock based on request body.
   *
   * @param {string} method - HTTP method
   * @param {string} url - URL pattern
   * @param {Object[]} conditions - Array of { match, response } objects
   * @param {string} alias - Optional alias
   */
  mockConditional(method, url, conditions, alias = null) {
    cy.intercept(method, url, (req) => {
      const matchedCondition = conditions.find((condition) => {
        if (typeof condition.match === 'function') {
          return condition.match(req.body)
        }
        return Object.entries(condition.match).every(([key, value]) => req.body[key] === value)
      })

      if (matchedCondition) {
        req.reply(matchedCondition.response)
      }

      if (alias) {
        req.alias = alias
      }
    })
  },

  /**
   * Waits for request and validates request body.
   *
   * @param {string} alias - Request alias (with @)
   * @param {Object} expectedBody - Expected request body (partial match)
   */
  waitAndValidateRequest(alias, expectedBody) {
    cy.wait(alias).then((interception) => {
      Object.entries(expectedBody).forEach(([key, value]) => {
        expect(interception.request.body[key]).to.deep.equal(value)
      })
    })
  },

  /**
   * Waits for request and validates response.
   *
   * @param {string} alias - Request alias (with @)
   * @param {number} expectedStatus - Expected status code
   */
  waitAndValidateResponse(alias, expectedStatus = 200) {
    cy.wait(alias).then((interception) => {
      expect(interception.response.statusCode).to.equal(expectedStatus)
    })
  },

  /**
   * Sets up intercepts for a module using the v4 API endpoints.
   * Uses API_ENDPOINTS from profiles.js for correct URLs.
   *
   * @param {string} moduleName - Module name (e.g., 'edgeFunctions', 'edgeApplications')
   * @param {boolean} useV4 - Whether to use v4 endpoints (default true)
   */
  setupModuleIntercepts(moduleName, useV4 = true) {
    const endpoints = API_ENDPOINTS[moduleName]
    if (!endpoints) {
      throw new Error(`Unknown module: ${moduleName}. Available: ${Object.keys(API_ENDPOINTS).join(', ')}`)
    }

    const baseUrl = useV4 ? endpoints.v4 : endpoints.v3
    if (!baseUrl) {
      throw new Error(`No ${useV4 ? 'v4' : 'v3'} endpoint available for module: ${moduleName}`)
    }

    // Capitalize module name for alias
    const aliasPrefix = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

    cy.intercept('GET', `**/${baseUrl}*`).as(`${aliasPrefix}List`)
    cy.intercept('GET', `**/${baseUrl}/*`).as(`${aliasPrefix}Get`)
    cy.intercept('POST', `**/${baseUrl}*`).as(`${aliasPrefix}Create`)
    cy.intercept('PUT', `**/${baseUrl}/*`).as(`${aliasPrefix}Update`)
    cy.intercept('PATCH', `**/${baseUrl}/*`).as(`${aliasPrefix}Patch`)
    cy.intercept('DELETE', `**/${baseUrl}/*`).as(`${aliasPrefix}Delete`)

    return {
      baseUrl,
      aliases: {
        list: `@${aliasPrefix}List`,
        get: `@${aliasPrefix}Get`,
        create: `@${aliasPrefix}Create`,
        update: `@${aliasPrefix}Update`,
        patch: `@${aliasPrefix}Patch`,
        delete: `@${aliasPrefix}Delete`
      }
    }
  },

  /**
   * Gets the v4 endpoint URL for a module.
   *
   * @param {string} moduleName - Module name
   * @returns {string} v4 endpoint URL
   */
  getV4Endpoint(moduleName) {
    const endpoints = API_ENDPOINTS[moduleName]
    if (!endpoints || !endpoints.v4) {
      throw new Error(`No v4 endpoint for module: ${moduleName}`)
    }
    return endpoints.v4
  },

  /**
   * Common v4 API endpoints for quick reference
   */
  V4_ENDPOINTS: {
    edgeFunctions: 'v4/workspace/functions',
    edgeApplications: 'v4/workspace/applications',
    edgeFirewall: 'v4/workspace/firewalls',
    edgeDns: 'v4/workspace/dns/zones',
    digitalCertificates: 'v4/workspace/tls/certificates',
    dataStream: 'v4/workspace/stream/streams',
    networkLists: 'v4/workspace/network_lists',
    waf: 'v4/workspace/wafs',
    workloads: 'v4/workspace/workloads',
    users: 'v4/iam/users',
    teams: 'v4/iam/teams',
    credentials: 'v4/workspace/storage/credentials',
    edgeStorage: 'v4/workspace/storage',
    purge: 'v4/workspace/purge',
    edgeSql: 'v4/workspace/sql/databases'
  }
}
