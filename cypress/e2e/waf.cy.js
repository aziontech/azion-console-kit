import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let wafName = ''

describe('WAF spec', () => {
  beforeEach(() => {
    cy.login()
    wafName = generateUniqueName('WAF')
    cy.openProductThroughSidebar('waf-rules')
  })

  it('Create a WAF ', function() {
    // Act
    cy.get(selectors.wafs.createButton).click()
    cy.get(selectors.wafs.nameInput).clear('')
    cy.get(selectors.wafs.nameInput).type(wafName)

    cy.get(selectors.wafs.saveButton).click()
    cy.verifyToast('success', 'Your waf rule has been created')
    cy.get(selectors.wafs.cancelButton).click()
    cy.get(selectors.wafs.cancelButton).click()
    cy.get(selectors.wafs.cancelButton).click()

    // Assert
    cy.get(selectors.wafs.searchInput).clear()
    cy.get(selectors.wafs.searchInput).type(`${wafName}{enter}`)
    cy.get(selectors.wafs.nameRow).should('have.text', wafName)
    cy.get(selectors.wafs.threatTypesRow).should('have.text', 'File upload')

    // Cleanup
    cy.get(selectors.wafs.actionButton).click()
    cy.get(selectors.wafs.deleteButton).click()
    cy.get(selectors.wafs.deleteInput).clear()
    cy.get(selectors.wafs.deleteInput).type('delete')
    cy.get(selectors.wafs.confirmDeleteButton).click()
    cy.verifyToast('WAF rule successfully deleted')
  })
})
