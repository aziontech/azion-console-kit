import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

describe('Edge Functions - Create', { tags: ['@shard5'] }, () => {
  let fixtures = {}

  beforeEach(() => {
    cy.login()
    fixtures = {
      functionName: generateUniqueName('Function')
    }
    cy.openProduct('Edge Functions')
  })

  it('should create an edge function', () => {
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

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

    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('be.visible')
      .should('have.text', fixtures.functionName)

    cy.get(selectors.functions.languageRow)
      .should('have.text', 'JavaScript')

    cy.get(selectors.functions.initiatorTypeRow)
      .should('have.text', 'edge_application')
  })

  it('should create an edge function with firewall initiator type', () => {
    cy.intercept('POST', '/v4/workspace/functions').as('createFunction')
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    cy.get(selectors.functions.createButton)
      .should('be.visible')
      .click()

    cy.get(selectors.functions.nameInput)
      .clear()
      .type(fixtures.functionName, { delay: 0 })

    // Select Firewall execution environment
    cy.contains('Firewall').click()

    cy.get(selectors.functions.saveButton).click()

    cy.wait('@createFunction', { timeout: 20000 })
    cy.verifyToast('success', 'Your Function has been created')

    cy.wait('@listFunctions', { timeout: 10000 })

    cy.get(selectors.functions.searchInput)
      .clear()
      .type(`${fixtures.functionName}{enter}`, { delay: 0 })

    cy.get(selectors.functions.nameRow)
      .should('have.text', fixtures.functionName)

    cy.get(selectors.functions.initiatorTypeRow)
      .should('have.text', 'edge_firewall')
  })

  it('should show validation error when name is empty', () => {
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    cy.get(selectors.functions.createButton).click()

    cy.get(selectors.functions.nameInput).clear()

    cy.get(selectors.functions.saveButton).click()

    cy.contains('Name is a required field').should('be.visible')
  })

  it('should cancel creation and return to list', () => {
    cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

    cy.wait('@listFunctions', { timeout: 10000 })

    cy.get(selectors.functions.createButton).click()

    cy.get(selectors.functions.nameInput).type('TestFunction', { delay: 0 })

    cy.get(selectors.functions.cancelButton).click()

    cy.url().should('include', '/edge-functions')
    cy.url().should('not.include', '/create')
  })
})
