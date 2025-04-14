/* eslint-disable cypress/no-unnecessary-waiting */
// import selectors from '../../support/selectors/product-selectors/real-time-events'

describe('Real-Time Events Advanced Filter spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Real-Time Events')
    cy.intercept('POST', '/v4/events/graphql').as('getGraphqlFilters')
    cy.get('[data-testid="real-time-events-filter-options"] > [tabindex="-1"]').click()
  })

  it('should open advanced filter', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-suggestions"]').should('be.visible')
  })

  it('should open advanced filter and show operators to status', () => {
    const operators = ['=', '<', '<=', '>', '>=', '<>', 'between']
    cy.wait('@getGraphqlFilters')
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').type('status')
    cy.wait(2000)
    cy.get('[data-testid="azion-query-language-input"]').type(' ')
    cy.get('[data-testid="azion-query-language-suggestions"]').should('be.visible')
    cy.get('[data-testid="azion-query-language-suggestions-list"]').should('be.visible')
    cy.get('[data-testid="azion-query-language-suggestions-list"]').find('li').each(($item) => {
      const text = $item.text().trim()
      expect(operators).to.include(text)
    })
  })

  it('should render the "and" operator when finishing an expression', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').clear()
    cy.get('[data-testid="azion-query-language-input"]').type('status = 200 ')
    cy.get('[data-testid="azion-query-language-suggestions-list"]').find('li').eq(0).should('have.text', 'AND')
  })

  it('should open advanced filter and add field incorrect in filter', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').clear()
    cy.get('[data-testid="azion-query-language-input"]').type('statis ')
    cy.get('[data-testid="azion-query-language-errors"]').should('has.text', 'Attention: some provided fields do not match the currently available ones. Please, check and try again.')
  })

  it('should open advanced filter and add filter status between incorrect', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').clear()
    cy.get('[data-testid="azion-query-language-input"]').type('status between (200, 300')
    cy.get('[data-testid="azion-query-language-errors"]').should('has.text', 'Attention: Please enclose the values for the BETWEEN operator in parentheses. For example: status between (200, 300).')
  })

  it('should display an error when trying to add a composite field without double quotes in the field', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').clear()
    cy.get('[data-testid="azion-query-language-input"]').type('upstream status')
    cy.get('[data-testid="azion-query-language-errors"]').should('has.text', 'Attention: composite fields must be included in quotes. e.g: "Upstream Status".')
  })

  it('should not repeat the operator already used in the filter', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').clear()
    cy.get('[data-testid="azion-query-language-input"]').type('status = 200 and status')
    cy.wait(2000)
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').type(' ')
    cy.get('[data-testid="azion-query-language-suggestions-list"]').find('li').each(($item) => {
      const text = $item.text().trim()
      expect(text).to.not.equal('=')
    })
  })

  it('should display an error when adding a filter without space between the field, operator, and value', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').clear()
    cy.get('[data-testid="azion-query-language-input"]').type('status =200')
    cy.get('[data-testid="azion-query-language-errors"]').should('has.text', 'Attention: please add spaces between the field, operator, and value. For example, write "status = 200" instead of "status=200".')
  })

  it('should add the field when there is only one option using the tab key', () => {
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').clear()
    cy.wait(2000)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('[data-testid="azion-query-language-input"]').type('stat').tab()
    cy.get('[data-testid="azion-query-language-input"]').should('have.text', 'status ')
  })

  it('should be able to navigate through the suggestions using only the keyboard', () => {
    cy.wait('@getGraphqlFilters')
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.wait(2000)
    cy.get('[data-testid="azion-query-language-input"]').type('{downArrow}')
    cy.get('[data-testid="azion-query-language-list-item1"]').should('have.class', 'bg-orange-base')
  })

  it('should be possible to build a query using only the keyboard, e.g., status = 200', () => {
    cy.wait('@getGraphqlFilters')
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.wait(2000)
    cy.get('[data-testid="azion-query-language-input"]').type('{downArrow}')
    cy.get('[data-testid="azion-query-language-input"]').type('{enter}')
    cy.wait(1000)
    cy.get('[data-testid="azion-query-language-input"]').type('{enter}')
    cy.get('[data-testid="azion-query-language-input"]').type('200')
    cy.get('[data-testid="azion-query-language-input"]').should('have.text', 'status = 200')
  })

  it('should be possible to create a query by clicking with the mouse and just typing the value', () => {
    cy.wait('@getGraphqlFilters')
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.wait(2000)
    cy.get('[data-testid="azion-query-language-list-item2"]').click()
    cy.wait(1000)
    cy.get('[data-testid="azion-query-language-list-item1"]').click()
    cy.get('[data-testid="azion-query-language-input"]').type('0.4')
    cy.get('[data-testid="azion-query-language-input"]').should('have.text', '"upstream status" < 0.4')
  })

  it('should save filters when switching from wizard mode to advanced', () => {
    cy.wait('@getGraphqlFilters')
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.wait(2000)
    cy.get('[data-testid="azion-query-language-list-item1"]').click()
    cy.wait(1000)
    cy.get('[data-testid="azion-query-language-list-item0"]').click()
    cy.get('[data-testid="azion-query-language-input"]').type('200')
    cy.get('[data-testid="azion-query-language-search"]').click()
    cy.wait('@getGraphqlFilters')
    cy.get('[data-testid="real-time-events-filter-options"] > [tabindex="-1"] > .p-button-label').click()
    cy.wait(1000)
    cy.get('[data-testid="real-time-events-filter-options"] > [tabindex="-1"]').click()
    cy.wait(1000)
    cy.get('[data-testid="azion-query-language-input"]').should('have.text', 'status = 200')
  })

  it.only('should restore operator and field suggestions after deleting', () => {
    const operators = ['=', '<', '<=', '>', '>=', '<>', 'between']
    cy.wait('@getGraphqlFilters')
    cy.get('[data-testid="azion-query-language-input"]').click()
    cy.get('[data-testid="azion-query-language-input"]').type('status = ')
    cy.wait(2000)
    cy.get('[data-testid="azion-query-language-input"]').type('{backspace}')
    cy.get('[data-testid="azion-query-language-input"]').type('{backspace}')
    cy.wait(1000)
    cy.get('[data-testid="azion-query-language-suggestions"]').should('be.visible')
    cy.get('[data-testid="azion-query-language-suggestions-list"]').should('be.visible')
    cy.get('[data-testid="azion-query-language-suggestions-list"]').find('li').each(($item) => {
      const text = $item.text().trim()
      expect(operators).to.include(text)
    })
    cy.get('[data-testid="azion-query-language-input"]').type('{backspace}')
    cy.get('[data-testid="azion-query-language-input"]').type('{backspace}')
    cy.get('[data-testid="azion-query-language-suggestions"]').should('be.visible')
    cy.get('[data-testid="azion-query-language-suggestions-list"]').find('li').eq(0).should('have.text', 'Status')
  })
})
