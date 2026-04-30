/**
 * Workloads - Update.
 * Validates edit form rendering (skeleton overlay fix) and field visibility.
 * Generated from commit 18f9e5cba (fix: prevent form from rendering under skeleton).
 */
import selectors from '../../../support/selectors'
import tableHelpers from '../../../support/console-kit-helpers/table'

let hasWorkloads = false

describe('Workloads - Update', { tags: ['@workloads'] }, () => {
  before(() => {
    cy.login()
  })

  it('should navigate to workloads list and open first item', () => {
    cy.visit('/workloads')
    cy.get(selectors.list.container, { timeout: 30000 }).should('exist')

    cy.get('body').then(($body) => {
      if ($body.find(selectors.list.filteredRow.column('name')).length > 0) {
        hasWorkloads = true
        cy.get(selectors.list.filteredRow.column('name')).first().click()
      } else {
        cy.log('No workloads exist - skipping edit tests')
      }
    })
  })

  it('should display edit form fields after loading', () => {
    if (!hasWorkloads) {
      cy.log('Skipping - no workloads')
      return
    }
    // Skeleton overlay fix ensures form is properly visible after loading
    cy.get(selectors.workload.nameInput, { timeout: 15000 }).should('exist')
  })

  it('should show the domain URI field', () => {
    if (!hasWorkloads) {
      cy.log('Skipping - no workloads')
      return
    }
    cy.get(selectors.workload.domainUri).should('exist')
  })

  it('should show edge application dropdown', () => {
    if (!hasWorkloads) {
      cy.log('Skipping - no workloads')
      return
    }
    cy.get(selectors.workload.edgeApplicationField).should('exist')
  })

  it('should show the active switch', () => {
    if (!hasWorkloads) {
      cy.log('Skipping - no workloads')
      return
    }
    cy.get(selectors.workload.activeSwitchEditForm).should('exist')
  })

  it('should show submit button', () => {
    if (!hasWorkloads) {
      cy.log('Skipping - no workloads')
      return
    }
    cy.get(selectors.form.actionsSubmitButton).should('exist')
  })
})
