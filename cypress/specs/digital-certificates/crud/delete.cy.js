/**
 * Digital Certificates - Delete Tests
 *
 * API: DELETE v4/workspace/tls/certificates/{id}
 * Route: /digital-certificates
 *
 * Aprendizados:
 * - Delete confirmation usa o NOME do certificado
 * - Managed certificates (Let's Encrypt) cannot be deleted
 */

import selectors from '../../../support/selectors/product-selectors/digital-certificates'

describe('Digital Certificates - Delete', { tags: ['@crud', '@digital-certificates', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  it('should show delete action button for certificates', () => {
    cy.get('body').then(($body) => {
      if (!$body.find('[data-testid*="empty"]').length) {
        cy.get('[data-testid*="actions"]').should('exist')
      } else {
        cy.log('No certificates exist to test delete button')
      }
    })
  })

  it('should open delete confirmation dialog', () => {
    cy.get('body').then(($body) => {
      if (!$body.find('[data-testid*="empty"]').length) {
        // Click action button
        cy.get('[data-testid="data-table-actions-column-body-action-button"]')
          .first()
          .click()

        // If it's a menu, click delete
        cy.get('body').then(($menuBody) => {
          if ($menuBody.find('[data-testid*="Delete"]').length) {
            cy.get('[data-testid*="Delete"]').first().click()
          }
        })

        // Dialog should appear
        cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
          .should('be.visible')

        // Cancel button should exist
        cy.get(selectors.deleteDialog.cancelButton).should('be.visible')
      } else {
        cy.log('No certificates exist to test delete dialog')
      }
    })
  })

  it('should cancel delete operation', () => {
    cy.get('body').then(($body) => {
      if (!$body.find('[data-testid*="empty"]').length) {
        // Get certificate name first
        cy.get('[data-testid*="list-table-block__column__name"]')
          .first()
          .invoke('text')
          .then((certName) => {
            // Click action button
            cy.get('[data-testid="data-table-actions-column-body-action-button"]')
              .first()
              .click()

            cy.get('body').then(($menuBody) => {
              if ($menuBody.find('[data-testid*="Delete"]').length) {
                cy.get('[data-testid*="Delete"]').first().click()
              }
            })

            // Wait for dialog
            cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
              .should('be.visible')

            // Cancel
            cy.get(selectors.deleteDialog.cancelButton).click()

            // Dialog should close
            cy.get(selectors.deleteDialog.confirmInput).should('not.exist')

            // Certificate should still exist
            cy.get('[data-testid*="list-table-block__column__name"]')
              .contains(certName.trim())
              .should('exist')
          })
      } else {
        cy.log('No certificates exist to test cancel delete')
      }
    })
  })

  it('should require correct name to enable delete button', () => {
    cy.get('body').then(($body) => {
      if (!$body.find('[data-testid*="empty"]').length) {
        // Get certificate name first
        cy.get('[data-testid*="list-table-block__column__name"]')
          .first()
          .invoke('text')
          .then((certName) => {
            // Click action button
            cy.get('[data-testid="data-table-actions-column-body-action-button"]')
              .first()
              .click()

            cy.get('body').then(($menuBody) => {
              if ($menuBody.find('[data-testid*="Delete"]').length) {
                cy.get('[data-testid*="Delete"]').first().click()
              }
            })

            // Wait for dialog
            cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
              .should('be.visible')

            // Delete button should be disabled initially
            cy.get(selectors.deleteDialog.deleteButton)
              .should('be.disabled')

            // Type wrong text
            cy.get(selectors.deleteDialog.confirmInput)
              .type('wrong_name')

            // Delete button should still be disabled
            cy.get(selectors.deleteDialog.deleteButton)
              .should('be.disabled')

            // Clear and type correct name
            cy.get(selectors.deleteDialog.confirmInput)
              .clear()
              .type(certName.trim())

            // Delete button should be enabled
            cy.get(selectors.deleteDialog.deleteButton)
              .should('not.be.disabled')
          })
      } else {
        cy.log('No certificates exist to test delete confirmation')
      }
    })
  })

  // Note: We don't perform actual deletion in tests to avoid affecting production data
  // A full delete test would need a self-created certificate, which requires valid PEM data
})
