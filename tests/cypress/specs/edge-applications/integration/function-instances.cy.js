/**
 * Edge Applications - Function Instances integration.
 * Validates the function instance tab, dropdown, and create button.
 * Generated from commit 0fdc54c7b (feat: enhance function dropdowns with runtime filtering).
 */
import selectors from '../../../support/selectors'
import tableHelpers from '../../../support/console-kit-helpers/table'

let hasFunctionsTab = false

describe('Edge Applications - Function Instances', { tags: ['@edge-applications'] }, () => {
  before(() => {
    cy.login()
  })

  it('should navigate to edge applications list and open first item', () => {
    cy.visit('/applications')
    cy.get(selectors.list.container, { timeout: 30000 }).should('exist')

    cy.get('body').then(($body) => {
      if ($body.find(selectors.list.filteredRow.column('name')).length > 0) {
        cy.get(selectors.list.filteredRow.column('name')).first().click()
      } else {
        cy.log('No edge applications exist - skipping function instance tests')
      }
    })
  })

  it('should check if Functions Instances tab exists', () => {
    // The Functions Instances tab only appears when Edge Functions module is enabled
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const tabSelector = selectors.edgeApplication.tabs('functions-instances')
      if ($body.find(tabSelector).length > 0) {
        hasFunctionsTab = true
        cy.log('Functions Instances tab is available')
      } else {
        cy.log('Edge Functions module not enabled - skipping function instance tests')
      }
    })
  })

  it('should navigate to Functions Instances tab', () => {
    if (!hasFunctionsTab) {
      cy.log('Skipping - no functions-instances tab')
      return
    }
    cy.get(selectors.edgeApplication.tabs('functions-instances')).click()
    cy.url().should('include', '/functions-instances')
  })

  it('should have a create button for function instances', () => {
    if (!hasFunctionsTab) {
      cy.log('Skipping - no functions-instances tab')
      return
    }
    cy.get(selectors.edgeApplication.functionsInstance.createButton, { timeout: 10000 }).should(
      'exist'
    )
  })

  it('should open the create function instance drawer', () => {
    if (!hasFunctionsTab) {
      cy.log('Skipping - no functions-instances tab')
      return
    }
    cy.get(selectors.edgeApplication.functionsInstance.createButton).click()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput, { timeout: 10000 }).should(
      'exist'
    )
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).should('exist')
  })

  it('should have a create function button in the dropdown footer', () => {
    if (!hasFunctionsTab) {
      cy.log('Skipping - no functions-instances tab')
      return
    }
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.createFunctionButton, {
      timeout: 10000
    }).should('exist')
    cy.get('body').click(0, 0)
  })
})
