/* eslint-disable cypress/unsafe-to-chain-command */
import { importGithub, setupBaseIntercepts, visitImportGithub, fillSettingsStep } from './helpers'

const INVALID_NAME = 'Invalid_Name!'
const VALID_NAME = 'valid-app-name'

describe('Import from GitHub - Form validations (mocked)', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    setupBaseIntercepts()

    // Stubbed so we can assert it is NEVER called while the form is invalid.
    cy.intercept(
      { method: 'POST', url: '**/template-engine/templates/*/instantiate' },
      { statusCode: 201, body: { uuid: 'exec-validation' } }
    ).as('instantiate')

    visitImportGithub()
  })

  it('rejects an invalid application name and accepts a corrected one', () => {
    fillSettingsStep()

    cy.get(importGithub.applicationNameInput).clear()
    cy.get(importGithub.applicationNameInput).type(INVALID_NAME).blur()
    cy.get(importGithub.applicationNameError)
      .should('be.visible')
      .and('contain', 'Application Name may only contain')

    // Submit stays blocked while invalid - no deploy attempt.
    cy.get(importGithub.deployButton).click()
    cy.get('@instantiate.all').should('have.length', 0)

    // Correcting it clears the error.
    cy.get(importGithub.applicationNameInput).clear()
    cy.get(importGithub.applicationNameInput).type(VALID_NAME).blur()
    cy.get(importGithub.applicationNameError).should('not.exist')
  })

  it('requires the root directory to start with a slash', () => {
    fillSettingsStep()

    cy.get(importGithub.rootDirectoryInput).clear()
    cy.get(importGithub.rootDirectoryInput).type('no-slash').blur()
    cy.get(importGithub.rootDirectoryError)
      .should('be.visible')
      .and('contain', 'Root Directory must start with a slash')

    cy.get(importGithub.deployButton).click()
    cy.get('@instantiate.all').should('have.length', 0)

    // A valid root directory clears the error.
    cy.get(importGithub.rootDirectoryInput).clear()
    cy.get(importGithub.rootDirectoryInput).type('/').blur()
    cy.get(importGithub.rootDirectoryError).should('not.exist')
  })

  it('blocks the deploy and shows a required error when mandatory fields are empty', () => {
    cy.wait('@loadSolution')
    cy.wait('@listIntegrations')
    cy.wait('@listPresets')

    // Fill only the application name; leave Git Scope / Repository / Framework empty.
    cy.get(importGithub.applicationNameInput).clear()
    cy.get(importGithub.applicationNameInput).type(VALID_NAME)

    cy.get(importGithub.deployButton).click()

    // No deploy attempt; the required Git Scope error is surfaced.
    cy.get('@instantiate.all').should('have.length', 0)
    cy.contains('GitHub Account is a required field').should('be.visible')
  })
})
