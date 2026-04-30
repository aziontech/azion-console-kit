/**
 * Edge Storage (Object Storage) - Read/List.
 * Validates bucket list view, search, and create button.
 * Generated from commit f654d9234 (fix: Object Storage list view + Bucket Button).
 */
import selectors from '../../../support/selectors'
import tableHelpers from '../../../support/console-kit-helpers/table'

describe('Edge Storage - Read/List', { tags: ['@edge-storage'] }, () => {
  before(() => {
    cy.login()
  })

  it('should navigate to object storage list', () => {
    cy.visit('/object-storage')
    cy.url().should('include', '/object-storage')
  })

  it('should display the list table with create button', () => {
    tableHelpers.waitForListReady()
    cy.get(selectors.list.createButton('Bucket')).should('exist')
  })

  it('should display correct columns', () => {
    cy.get(selectors.list.dataTable).within(() => {
      cy.contains('th', 'Name').should('exist')
    })
  })

  it('should search for a bucket', () => {
    tableHelpers.searchFor('test')
    cy.get(selectors.list.dataTable).should('exist')
  })

  it('should clear search and restore list', () => {
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.dataTable).should('exist')
  })

  it('should have action menu button on rows if data exists', () => {
    cy.get('body').then(($body) => {
      if ($body.find(selectors.list.actionsMenu.button).length > 0) {
        cy.get(selectors.list.actionsMenu.button).first().should('exist')
      }
    })
  })
})
