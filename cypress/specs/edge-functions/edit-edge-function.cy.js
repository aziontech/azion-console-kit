import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

describe('Edge Functions - Edit', { tags: ['@shard5'] }, () => {
  let fixtures = {}

  beforeEach(() => {
    cy.login()
    fixtures = {
      functionName: generateUniqueName('Function'),
      updatedName: generateUniqueName('FunctionEdited')
    }
    cy.openProduct('Edge Functions')
  })

  it('should edit an edge function name', () => {
    // ==========================================
    // SETUP: Intercepts
    // ==========================================
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('PATCH', '/v4/workspace/functions/*').as('updateFunction')
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
    // NAVIGATE: Go to edit via list
    // After create, app redirects to LIST (not DETAIL)
    // ==========================================
    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .click()

    // Verify we're on edit page
    cy.url({ timeout: 10000 }).should('include', '/edge-functions/edit/')

    // ==========================================
    // ACT: Edit the function name
    // ==========================================
    cy.get(selectors.functions.nameInput)
      .should('be.visible')
      .clear()
      .type(fixtures.updatedName, { delay: 0 })

    cy.get(selectors.functions.saveButton)
      .should('be.visible')
      .should('not.be.disabled')
      .click()

    // ==========================================
    // WAIT & ASSERT
    // ==========================================
    cy.wait('@updateFunction', { timeout: 20000 })
    cy.verifyToast('success', 'Your Function has been updated')

    // Navigate back to list and verify changes
    cy.openProduct('Edge Functions')
    cy.wait('@listFunctions', { timeout: 10000 })

    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.updatedName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .should('have.text', fixtures.updatedName)
  })

  it('should edit an edge function execution environment', () => {
    // ==========================================
    // SETUP: Intercepts
    // ==========================================
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('PATCH', '/v4/workspace/functions/*').as('updateFunction')
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    // ==========================================
    // SETUP: Create function first (default is Application)
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
    // NAVIGATE: Go to edit via list
    // ==========================================
    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .click()

    cy.url({ timeout: 10000 }).should('include', '/edge-functions/edit/')

    // ==========================================
    // ACT: Change execution environment to Firewall
    // ==========================================
    cy.contains('Firewall').click()

    cy.get(selectors.functions.saveButton)
      .should('be.visible')
      .should('not.be.disabled')
      .click()

    // ==========================================
    // WAIT & ASSERT
    // ==========================================
    cy.wait('@updateFunction', { timeout: 20000 })
    cy.verifyToast('success', 'Your Function has been updated')

    // Navigate back to list and verify changes
    cy.openProduct('Edge Functions')
    cy.wait('@listFunctions', { timeout: 10000 })

    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .should('have.text', fixtures.functionName)

    cy.get(selectors.functions.initiatorTypeRow)
      .should('have.text', 'edge_firewall')
  })

  it('should show validation error when name is cleared', () => {
    // ==========================================
    // SETUP: Intercepts
    // ==========================================
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    // Create function first
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

    // Navigate to edit
    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .click()

    cy.url({ timeout: 10000 }).should('include', '/edge-functions/edit/')

    // Clear name and try to save
    cy.get(selectors.functions.nameInput).clear()
    cy.get(selectors.functions.saveButton).click()

    // Verify validation error
    cy.contains('Name is a required field').should('be.visible')
  })

  it('should cancel edit and return to list', () => {
    // ==========================================
    // SETUP: Intercepts
    // ==========================================
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    // Create function first
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

    // Navigate to edit
    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .click()

    cy.url({ timeout: 10000 }).should('include', '/edge-functions/edit/')

    // Make a change then cancel
    cy.get(selectors.functions.nameInput)
      .clear()
      .type(fixtures.updatedName, { delay: 0 })

    cy.get(selectors.functions.cancelButton).click()

    // Verify returned to list
    cy.url().should('include', '/edge-functions')
    cy.url().should('not.include', '/edit')

    // Verify original name still exists
    cy.wait('@listFunctions', { timeout: 10000 })
    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .should('have.text', fixtures.functionName)
  })
})
