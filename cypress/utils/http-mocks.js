/* eslint-disable no-undef */
/// <reference types="Cypress" />
/// <reference types="../support" />

const requestAlias = 'request'

/**
 * Mocks a 401 Unauthorized error response
 * @param {RegExp} url - The URL to intercept
 * @returns {void}
 */
export const mockUnauthorizedError = (url) => {
  cy.intercept(url, {
    delay: 100,
    statusCode: 401,
    body: {
      error: 'UnauthorizedErrorMessage'
    }
  }).as(requestAlias)
}

/**
 * Mocks a 403 Forbidden error response
 * @param {RegExp} url - The URL to intercept
 * @returns {void}
 */
export const mockForbiddenError = (url) => {
  cy.intercept(url, {
    delay: 100,
    statusCode: 403,
    body: {
      error: 'ForbiddenErrorMessage'
    }
  }).as(requestAlias)
}

/**
 * Mocks a server error response with a random status code
 * between 4xx and 5xx, and the given response body.
 * @template R
 * @param {RegExp} url - The URL to intercept
 * @param {R} response - The response body
 * @returns {void}
 */
export const mockServerError = (url, response) => {
  const options = [400, 402, 404, 500]
  const randomIndex = Math.floor(Math.random() * options.length)
  const randomOption = options[randomIndex]
  cy.intercept(url, {
    delay: 100,
    statusCode: randomOption,
    body: response
  }).as(requestAlias)
}

/**
 * Mocks a successful response with a 200 status code
 * and the given response body.
 * @template R The response body type
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method - The HTTP method to intercept
 * @param {RegExp} url - The URL to intercept
 * @param {Object} configuration - The URL to intercept
 * @param {R} [configuration.response] - response body
 * @param {R} [configuration.fixture] - response fixture to be used as body response
 *  * @param {string} configuration.alias - cypress alias for the request
 * @returns {void}
 */
export const mockOk = (method, url, { response, fixture, alias }) => {
  cy.intercept(method, url, {
    delay: 100,
    statusCode: 200,
    body: response,
    fixture: fixture
  }).as(alias)
}
