/**
 * Fixture recorder for Cypress tests.
 *
 * Supports two modes:
 * - RECORD: Intercepts API calls, passes through to real server, saves responses as fixtures.
 * - REPLAY: Intercepts API calls and responds with previously recorded fixtures.
 *
 * Usage in tests:
 *   import { setupFixtures } from '../support/console-kit-helpers/fixture-recorder'
 *
 *   before(() => {
 *     setupFixtures('edge-applications/list', [
 *       { method: 'GET', url: '/api/v4/edge_applications*', alias: 'listApps' }
 *     ])
 *   })
 */

const FIXTURE_BASE_PATH = 'tests/cypress/fixtures/recorded'

/**
 * Returns the current fixture mode from env or defaults to 'live'.
 * Modes: 'live' (no mocking), 'record', 'replay'
 */
export function getFixtureMode() {
  return Cypress.env('fixtureMode') || 'live'
}

/**
 * Sets up fixture recording/replay for a set of API routes.
 *
 * @param {string} fixtureName - Subdirectory name under fixtures/recorded/
 * @param {Array<{method: string, url: string, alias: string}>} routes - API routes to intercept
 */
export function setupFixtures(fixtureName, routes) {
  const mode = getFixtureMode()

  if (mode === 'live') {
    // Just set up aliases for waiting, no mocking
    routes.forEach(({ method, url, alias }) => {
      cy.intercept(method, url).as(alias)
    })
    return
  }

  if (mode === 'record') {
    routes.forEach(({ method, url, alias }) => {
      cy.intercept(method, url, (req) => {
        req.continue((res) => {
          const fixturePath = `${FIXTURE_BASE_PATH}/${fixtureName}/${alias}.json`
          cy.writeFile(fixturePath, {
            statusCode: res.statusCode,
            headers: filterHeaders(res.headers),
            body: res.body
          })
        })
      }).as(alias)
    })
    return
  }

  if (mode === 'replay') {
    routes.forEach(({ method, url, alias }) => {
      const fixturePath = `recorded/${fixtureName}/${alias}.json`
      cy.fixture(fixturePath).then((fixture) => {
        cy.intercept(method, url, {
          statusCode: fixture.statusCode,
          body: fixture.body
        }).as(alias)
      })
    })
    return
  }

  throw new Error(`Unknown fixture mode: ${mode}. Use 'live', 'record', or 'replay'.`)
}

/**
 * Filters sensitive/noisy headers from recorded responses.
 */
function filterHeaders(headers) {
  const keep = ['content-type', 'x-request-id']
  const filtered = {}
  keep.forEach((h) => {
    if (headers[h]) filtered[h] = headers[h]
  })
  return filtered
}

export default { setupFixtures, getFixtureMode }
