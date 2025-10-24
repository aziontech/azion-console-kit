import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let zoneName = ''

describe('Edge DNS spec', { tags: ['@dev4', '@dont_run_prod'] }, () => {
  beforeEach(() => {
    cy.login()
    zoneName = generateUniqueName('DNSZone')
    cy.openProduct('Edge DNS')
  })

  it('Create a Edge DNS Zone', function () {
    // Act
    cy.get(selectors.edgeDns.createButton).click()
    cy.get(selectors.edgeDns.nameInput).clear()
    cy.get(selectors.edgeDns.nameInput).type(zoneName)
    cy.get(selectors.edgeDns.domainInput).clear()
    cy.get(selectors.edgeDns.domainInput).type(`${zoneName}.com.az`)
    cy.get(selectors.edgeDns.saveButton).click()
    cy.verifyToast('success', 'Your DNS zone has been created. To complete the setup, ensure the Azion nameservers are configured in your domain provider.')

    // Assert
    cy.get(selectors.edgeDns.searchInput).clear()
    cy.get(selectors.edgeDns.searchInput).type(`${zoneName}{enter}`)
    cy.get(selectors.edgeDns.nameRow).should('have.text', zoneName)
    cy.get(selectors.edgeDns.showMore).click()
    cy.get(selectors.edgeDns.domainRow).should('contain', zoneName)
    cy.get(selectors.edgeDns.statusRow).should('have.text', 'Active')
  })
})
