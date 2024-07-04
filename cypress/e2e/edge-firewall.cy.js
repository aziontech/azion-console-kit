import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let firewallName = ''

describe('Edge Firewall spec', () => {
  beforeEach(() => {
    cy.login()
    firewallName = generateUniqueName('EdgeFirewall')
    cy.openProduct('Edge Firewall')
  })

  it('Create an Edge Firewall ', function () {
    // Act
    cy.get(selectors.edgeFirewall.createButton).click()
    cy.get(selectors.edgeFirewall.nameInput).clear()
    cy.get(selectors.edgeFirewall.nameInput).type(firewallName)
    cy.get(selectors.edgeFirewall.saveButton).click()
    cy.verifyToast('success', 'Your Edge Firewall has been created')
    cy.get(selectors.edgeFirewall.cancelButton).click()

    // Assert
    cy.get(selectors.edgeFirewall.searchInput).clear()
    cy.get(selectors.edgeFirewall.searchInput).type(firewallName)
    cy.get(selectors.edgeFirewall.nameRow).should('have.text', firewallName)
    cy.get(selectors.edgeFirewall.activeRow).should('have.text', 'Active')

    // Cleanup
    cy.get(selectors.wafs.actionButton).click()
    cy.get(selectors.wafs.deleteButton).click()
    cy.get(selectors.wafs.deleteInput).clear()
    cy.get(selectors.wafs.deleteInput).type('delete')
    cy.get(selectors.wafs.confirmDeleteButton).click()
    cy.verifyToast('Edge Firewall successfully deleted')
  })
})
