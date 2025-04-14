/* eslint-disable cypress/no-unnecessary-waiting */
import selectors from '../../support/selectors'

describe('Real-Time Events Advanced Filter', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Real-Time Events')
    cy.intercept('POST', '/v4/events/graphql').as('getGraphqlFilters')
    cy.get(`${selectors.realTimeEvents.filterOptions} > [tabindex="-1"]`).click()
  })

  it('should open advanced filter', () => {
    cy.get(selectors.realTimeEvents.input).click()
    cy.get(selectors.realTimeEvents.suggestions).should('be.visible')
  })

  context('Suggestions Handling', () => {
    it('should open advanced filter and show operators to status', () => {
      const operators = ['=', '<', '<=', '>', '>=', '<>', 'between']
      cy.wait('@getGraphqlFilters')
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).type('status')
      cy.wait(2000)
      cy.get(selectors.realTimeEvents.input).type(' ')
      cy.get(selectors.realTimeEvents.suggestions).should('be.visible')
      cy.get(selectors.realTimeEvents.suggestionsList).should('be.visible')
      cy.get(selectors.realTimeEvents.suggestionsList).find('li').each(($item) => {
        const text = $item.text().trim()
        expect(operators).to.include(text)
      })
    })

    it('should render the "and" operator when finishing an expression', () => {
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).clear()
      cy.get(selectors.realTimeEvents.input).type('status = 200 ')
      cy.get(selectors.realTimeEvents.suggestionsList).find('li').eq(0).should('have.text', 'AND')
    })

    it('should not repeat the operator already used in the filter', () => {
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).clear()
      cy.get(selectors.realTimeEvents.input).type('status = 200 and status')
      cy.wait(2000)
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).type(' ')
      cy.get(selectors.realTimeEvents.suggestionsList).find('li').each(($item) => {
        const text = $item.text().trim()
        expect(text).to.not.equal('=')
      })
    })

    it.only('should add the field when there is only one option using the tab key', () => {
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).clear()
      cy.wait(2000)
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get(selectors.realTimeEvents.input).type('stat').tab()
      cy.get(selectors.realTimeEvents.input).should('have.text', 'status ')
    })
  })

  context('Error Handling', () => {
    it('should open advanced filter and add field incorrect in filter', () => {
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).clear()
      cy.get(selectors.realTimeEvents.input).type('statis ')
      cy.get(selectors.realTimeEvents.errors).should('has.text', 'Attention: some provided fields do not match the currently available ones. Please, check and try again.')
    })

    it('should open advanced filter and add filter status between incorrect', () => {
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).clear()
      cy.get(selectors.realTimeEvents.input).type('status between (200, 300')
      cy.get(selectors.realTimeEvents.errors).should('has.text', 'Attention: Please enclose the values for the BETWEEN operator in parentheses. For example: status between (200, 300).')
    })

    it('should display an error when trying to add a composite field without double quotes in the field', () => {
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).clear()
      cy.get(selectors.realTimeEvents.input).type('upstream status')
      cy.get(selectors.realTimeEvents.errors).should('has.text', 'Attention: composite fields must be included in quotes. e.g: "Upstream Status".')
    })

    it('should display an error when adding a filter without space between the field, operator, and value', () => {
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).clear()
      cy.get(selectors.realTimeEvents.input).type('status =200')
      cy.get(selectors.realTimeEvents.errors).should('has.text', 'Attention: please add spaces between the field, operator, and value. For example, write "status = 200" instead of "status=200".')
    })
  })

  context('User Interactions', () => {
    it('should be able to navigate through the suggestions using only the keyboard', () => {
      cy.wait('@getGraphqlFilters')
      cy.get(selectors.realTimeEvents.input).click()
      cy.wait(2000)
      cy.get(selectors.realTimeEvents.input).type('{downArrow}')
      cy.get('[data-testid="azion-query-language-list-item1"]').should('have.class', 'bg-orange-base')
    })

    it('should be possible to build a query using only the keyboard, e.g., status = 200', () => {
      cy.wait('@getGraphqlFilters')
      cy.get(selectors.realTimeEvents.input).click()
      cy.wait(2000)
      cy.get(selectors.realTimeEvents.input).type('{downArrow}')
      cy.get(selectors.realTimeEvents.input).type('{enter}')
      cy.wait(1000)
      cy.get(selectors.realTimeEvents.input).type('{enter}')
      cy.get(selectors.realTimeEvents.input).type('200')
      cy.get(selectors.realTimeEvents.input).should('have.text', 'status = 200')
    })

    it('should be possible to create a query by clicking with the mouse and just typing the value', () => {
      cy.wait('@getGraphqlFilters')
      cy.get(selectors.realTimeEvents.input).click()
      cy.wait(2000)
      cy.get('[data-testid="azion-query-language-list-item2"]').click()
      cy.wait(1000)
      cy.get('[data-testid="azion-query-language-list-item1"]').click()
      cy.get(selectors.realTimeEvents.input).type('0.4')
      cy.get(selectors.realTimeEvents.input).should('have.text', '"upstream status" < 0.4')
    })

    it('should save filters when switching from wizard mode to advanced', () => {
      cy.wait('@getGraphqlFilters')
      cy.get(selectors.realTimeEvents.input).click()
      cy.wait(2000)
      cy.get('[data-testid="azion-query-language-list-item1"]').click()
      cy.wait(1000)
      cy.get('[data-testid="azion-query-language-list-item0"]').click()
      cy.get(selectors.realTimeEvents.input).type('200')
      cy.get('[data-testid="azion-query-language-search"]').click()
      cy.wait('@getGraphqlFilters')
      cy.get(`${selectors.realTimeEvents.filterOptions} > [tabindex="-1"] > .p-button-label`).click()
      cy.wait(1000)
      cy.get(`${selectors.realTimeEvents.filterOptions} > [tabindex="-1"]`).click()
      cy.wait(1000)
      cy.get(selectors.realTimeEvents.input).should('have.text', 'status = 200')
    })

    it('should restore operator and field suggestions after deleting', () => {
      const operators = ['=', '<', '<=', '>', '>=', '<>', 'between']
      cy.wait('@getGraphqlFilters')
      cy.get(selectors.realTimeEvents.input).click()
      cy.get(selectors.realTimeEvents.input).type('status = ')
      cy.wait(2000)
      cy.get(selectors.realTimeEvents.input).type('{backspace}')
      cy.get(selectors.realTimeEvents.input).type('{backspace}')
      cy.wait(1000)
      cy.get(selectors.realTimeEvents.suggestions).should('be.visible')
      cy.get(selectors.realTimeEvents.suggestionsList).should('be.visible')
      cy.get(selectors.realTimeEvents.suggestionsList).find('li').each(($item) => {
        const text = $item.text().trim()
        expect(operators).to.include(text)
      })
      cy.get(selectors.realTimeEvents.input).type('{backspace}')
      cy.get(selectors.realTimeEvents.input).type('{backspace}')
      cy.get(selectors.realTimeEvents.suggestions).should('be.visible')
      cy.get(selectors.realTimeEvents.suggestionsList).find('li').eq(0).should('have.text', 'Status')
    })
  })
})
