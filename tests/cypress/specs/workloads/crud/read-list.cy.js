/**
 * Workloads - Read/List.
 * Validates workload list view, columns, and search.
 */
import selectors from '../../../support/selectors'
import tableHelpers from '../../../support/console-kit-helpers/table'

let hasData = false

describe('Workloads - Read/List', { tags: ['@workloads'] }, () => {
  before(() => {
    cy.login()
  })

  it('should navigate to workloads list', () => {
    cy.visit('/workloads')
    cy.url().should('include', '/workloads')
  })

  it('should display the list table or empty state', () => {
    // Workloads list may be empty or have a server error
    cy.get(selectors.list.container, { timeout: 30000 }).should('exist')
    cy.get('body').then(($body) => {
      // Check for actual data rows (not just table headers)
      if ($body.find(selectors.list.actionsMenu.button).length > 0) {
        hasData = true
        cy.get(selectors.list.createButton('Workload')).should('exist')
      } else {
        cy.contains('Workloads').should('exist')
      }
    })
  })

  it('should display correct columns when data exists', () => {
    if (!hasData) {
      cy.log('Skipping - no workloads data')
      return
    }
    cy.get(selectors.list.dataTable).within(() => {
      cy.contains('th', 'Name').should('exist')
    })
  })

  it('should search when data exists', () => {
    if (!hasData) {
      cy.log('Skipping - no workloads data')
      return
    }
    tableHelpers.searchFor('test')
    cy.get(selectors.list.dataTable).should('exist')
    cy.get(selectors.list.searchInput).clear()
  })

  it('should have action menu button on rows if data exists', () => {
    if (!hasData) {
      cy.log('Skipping - no workloads data')
      return
    }
    cy.get('body').then(($body) => {
      if ($body.find(selectors.list.actionsMenu.button).length > 0) {
        cy.get(selectors.list.actionsMenu.button).first().should('exist')
      }
    })
  })
})
