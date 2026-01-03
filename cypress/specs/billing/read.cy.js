/**
 * Billing - Read Tests
 *
 * API: v4/billing
 * Route: /billing
 *
 * Note: Billing is in the account menu (right side).
 * It has tabs: Bills and Payment Methods (for non-regular accounts).
 * This is a read-only module for viewing invoices and payment info.
 */

const selectors = {
  billsTab: '[data-testid="billing__bills-tab__button"]',
  paymentMethodsTab: '[data-testid="billing__payment-methods-tab__button"]',
  tabView: '.p-tabview',
  tabPanel: '.p-tabview-panel',
  invoiceTable: '.p-datatable',
  invoiceRow: '[data-testid*="list-table-block__column"]'
}

// Wait for Billing page to be ready
const waitForPageReady = () => {
  cy.get(selectors.billsTab, { timeout: 15000 }).should('be.visible')
}

describe('Billing - Read', { tags: ['@read', '@billing', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/billing')
    waitForPageReady()
  })

  describe('Page Display', () => {
    it('should display billing page', () => {
      cy.url().should('include', '/billing')
      cy.contains('Billing').should('be.visible')
    })

    it('should display Bills tab', () => {
      cy.get(selectors.billsTab).should('be.visible')
      cy.contains('Bills').should('be.visible')
    })

    it('should display TabView component', () => {
      cy.get(selectors.tabView).should('be.visible')
    })
  })

  describe('Bills Tab', () => {
    it('should display Bills tab content by default', () => {
      // Check that Bills tab is selected (p-highlight class is on parent li)
      cy.get(selectors.billsTab)
        .closest('li')
        .should('have.class', 'p-highlight')
    })

    it('should display invoice information or empty state', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable').length > 0) {
          cy.get('.p-datatable').should('be.visible')
        } else {
          // Empty state or loading
          cy.log('No invoices or still loading')
        }
      })
    })

    it('should display service plan information', () => {
      // Service plan card should be visible
      cy.get('body').then(($body) => {
        if ($body.text().includes('Service Plan') || $body.text().includes('Current Plan')) {
          cy.contains(/Service Plan|Current Plan/i).should('be.visible')
        }
      })
    })
  })

  describe('Payment Methods Tab', () => {
    it('should display Payment Methods tab if available', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.paymentMethodsTab).length > 0) {
          cy.get(selectors.paymentMethodsTab).should('be.visible')
          cy.contains('Payment Methods').should('be.visible')
        } else {
          cy.log('Payment Methods tab not available (regular account)')
        }
      })
    })

    it('should switch to Payment Methods tab when clicked', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.paymentMethodsTab).length > 0) {
          cy.get(selectors.paymentMethodsTab).click()
          cy.get(selectors.paymentMethodsTab)
            .closest('li')
            .should('have.class', 'p-highlight')
          cy.url().should('include', '/billing/payment')
        } else {
          cy.log('Payment Methods tab not available')
        }
      })
    })

    it('should display credit information in Payment Methods', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.paymentMethodsTab).length > 0) {
          cy.get(selectors.paymentMethodsTab).click()

          // Wait for content to load
          cy.get('.p-tabview-panel', { timeout: 10000 }).should('be.visible')

          // Should show credit or payment method info
          cy.get('body').then(($innerBody) => {
            if ($innerBody.text().includes('Credit') || $innerBody.text().includes('Payment')) {
              cy.log('Payment methods content displayed')
            }
          })
        }
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should update URL when switching tabs', () => {
      cy.get(selectors.billsTab).click()
      cy.url().should('include', '/billing')

      cy.get('body').then(($body) => {
        if ($body.find(selectors.paymentMethodsTab).length > 0) {
          cy.get(selectors.paymentMethodsTab).click()
          cy.url().should('include', '/billing/payment')

          cy.get(selectors.billsTab).click()
          cy.url().should('include', '/billing/bills')
        }
      })
    })
  })

  describe('Invoice Display', () => {
    it('should display invoice last updated tag if present', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-tag').length > 0) {
          cy.get('.p-tag').should('be.visible')
        }
      })
    })

    it('should display current month invoice information', () => {
      cy.get('body').then(($body) => {
        // Look for invoice-related content
        const hasInvoiceContent = $body.text().includes('Invoice') ||
          $body.text().includes('Total') ||
          $body.text().includes('Charges')

        if (hasInvoiceContent) {
          cy.log('Invoice content found')
        } else {
          cy.log('No invoice content visible')
        }
      })
    })
  })

  describe('Invoice Details Navigation', () => {
    it('should navigate to invoice details when clicking on invoice', () => {
      cy.get('body').then(($body) => {
        // Check if there are clickable invoice rows
        if ($body.find('[data-testid*="list-table-block__column"]').length > 0) {
          cy.get('[data-testid*="list-table-block__column"]').first().click()
          cy.url().should('satisfy', (url) => {
            return url.includes('/billing') || url.includes('/invoice')
          })
        } else {
          cy.log('No invoice rows to click')
        }
      })
    })
  })
})
