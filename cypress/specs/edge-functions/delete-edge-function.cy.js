import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

describe('Edge Functions - Delete', { tags: ['@shard5'] }, () => {
  let fixtures = {}

  beforeEach(() => {
    cy.login()
    fixtures = {
      functionName: generateUniqueName('Function')
    }
    cy.openProduct('Edge Functions')
  })

  it('should delete an edge function', () => {
    // ==========================================
    // SETUP: Intercepts
    // ==========================================
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('DELETE', '/v4/workspace/functions/*').as('deleteFunction')
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    // ==========================================
    // SETUP: Create function first
    // ==========================================
    cy.get(selectors.functions.createButton)
      .should('be.visible')
      .click()

    cy.get(selectors.functions.nameInput)
      .should('be.visible')
      .clear()
      .type(fixtures.functionName, { delay: 0 })

    cy.get(selectors.functions.saveButton).click()

    cy.wait('@createFunction', { timeout: 20000 })
    cy.verifyToast('success', 'Your Function has been created')
    cy.wait('@listFunctions', { timeout: 10000 })

    // ==========================================
    // ACT: Delete using custom command
    // IMPORTANT: Delete dialog requires the NAME of the resource
    // ==========================================
    cy.deleteEntityFromList({
      entityName: fixtures.functionName,
      productName: 'Edge Functions'
    })

    // ==========================================
    // WAIT & ASSERT
    // ==========================================
    cy.wait('@deleteFunction', { timeout: 15000 })
    cy.verifyToast('success', 'Function successfully deleted')

    // Verify function no longer exists in list
    cy.get(selectors.functions.searchInput)
      .should('be.visible')
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    // Verify it doesn't appear
    cy.contains(fixtures.functionName).should('not.exist')
  })

  it('should delete multiple edge functions', () => {
    const secondFunctionName = generateUniqueName('Function2')

    // ==========================================
    // SETUP: Intercepts
    // ==========================================
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('DELETE', '/v4/workspace/functions/*').as('deleteFunction')
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    // ==========================================
    // SETUP: Create first function
    // ==========================================
    cy.get(selectors.functions.createButton)
      .should('be.visible')
      .click()

    cy.get(selectors.functions.nameInput)
      .should('be.visible')
      .clear()
      .type(fixtures.functionName, { delay: 0 })

    cy.get(selectors.functions.saveButton).click()

    cy.wait('@createFunction', { timeout: 20000 })
    cy.verifyToast('success', 'Your Function has been created')
    cy.wait('@listFunctions', { timeout: 10000 })

    // ==========================================
    // SETUP: Create second function
    // ==========================================
    cy.get(selectors.functions.createButton)
      .should('be.visible')
      .click()

    cy.get(selectors.functions.nameInput)
      .should('be.visible')
      .clear()
      .type(secondFunctionName, { delay: 0 })

    cy.get(selectors.functions.saveButton).click()

    cy.wait('@createFunction', { timeout: 20000 })
    cy.verifyToast('success', 'Your Function has been created')
    cy.wait('@listFunctions', { timeout: 10000 })

    // ==========================================
    // ACT: Delete first function
    // ==========================================
    cy.deleteEntityFromList({
      entityName: fixtures.functionName,
      productName: 'Edge Functions'
    })

    cy.wait('@deleteFunction', { timeout: 15000 })
    cy.verifyToast('success', 'Function successfully deleted')

    // ==========================================
    // ACT: Delete second function
    // ==========================================
    cy.deleteEntityFromList({
      entityName: secondFunctionName,
      productName: 'Edge Functions'
    })

    cy.wait('@deleteFunction', { timeout: 15000 })
    cy.verifyToast('success', 'Function successfully deleted')

    // ==========================================
    // ASSERT: Verify both are deleted
    // ==========================================
    cy.get(selectors.functions.searchInput)
      .should('be.visible')
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.contains(fixtures.functionName).should('not.exist')

    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${secondFunctionName}{enter}`, { delay: 0 })

    cy.contains(secondFunctionName).should('not.exist')
  })
})
