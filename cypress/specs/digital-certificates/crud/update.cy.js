/**
 * Digital Certificates - Update Tests
 *
 * API: PUT v4/workspace/tls/certificates/{id}
 * Route: /digital-certificates/edit/:id
 *
 * Note: These tests require existing certificates. If none exist, tests pass with log message.
 */

import selectors from '../../../support/selectors/product-selectors/digital-certificates'

describe('Digital Certificates - Update', { tags: ['@crud', '@digital-certificates', '@v4'] }, () => {
  let hasCertificates = false

  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Check if certificates exist
    cy.get('body').then(($body) => {
      hasCertificates = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    })
  })

  it('should open edit page when clicking certificate row', function() {
    if (!hasCertificates) {
      cy.log('SKIP: No certificates exist to test update')
      this.skip()
    }

    cy.get('[data-testid*="list-table-block__column__name"]')
      .first()
      .click()

    cy.url({ timeout: 15000 }).should('include', '/digital-certificates/edit/')
    cy.get(selectors.form.nameInput, { timeout: 15000 }).should('exist')
  })

  it('should display certificate name in edit form', function() {
    if (!hasCertificates) {
      cy.log('SKIP: No certificates exist')
      this.skip()
    }

    cy.get('[data-testid*="list-table-block__column__name"]')
      .first()
      .invoke('text')
      .then((originalName) => {
        cy.get('[data-testid*="list-table-block__column__name"]')
          .first()
          .click()

        cy.get(selectors.form.nameInput, { timeout: 15000 })
          .should('have.value', originalName.trim())
      })
  })

  it('should show form actions in edit page', function() {
    if (!hasCertificates) {
      cy.log('SKIP: No certificates exist')
      this.skip()
    }

    cy.get('[data-testid*="list-table-block__column__name"]')
      .first()
      .click()

    cy.get(selectors.formActions.saveButton, { timeout: 15000 }).should('exist')
    cy.get(selectors.formActions.cancelButton).should('exist')
  })

  it('should cancel update and return to list', function() {
    if (!hasCertificates) {
      cy.log('SKIP: No certificates exist')
      this.skip()
    }

    cy.get('[data-testid*="list-table-block__column__name"]')
      .first()
      .click()

    cy.get(selectors.form.nameInput, { timeout: 15000 })
      .type('_MODIFIED')

    cy.get(selectors.formActions.cancelButton).click()

    // Handle potential confirmation dialog
    cy.get('body').then(($cancelBody) => {
      if ($cancelBody.find('.p-dialog-footer button').length) {
        cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
      }
    })

    cy.get('.p-datatable', { timeout: 30000 }).should('exist')
  })
})
