import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let zoneName = ''

describe('Edge DNS spec', { tags: ['@dev4', '@xfail'] }, () => {
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
    cy.verifyToast('success', 'Your Edge DNS has been created')
    cy.get(selectors.edgeDns.cancelButton).click()

    // Assert
    cy.get(selectors.edgeDns.searchInput).clear()
    cy.get(selectors.edgeDns.searchInput).type(zoneName)
    cy.get(selectors.edgeDns.nameRow).should('have.text', zoneName)
    cy.get(selectors.edgeDns.showMore).click()
    cy.get(selectors.edgeDns.domainRow).should('contain', zoneName.toLowerCase())
    cy.get(selectors.edgeDns.statusRow).should('have.text', 'Active')
  })

  afterEach(() => {
    cy.deleteEntityFromList({ entityName: zoneName, productName: 'Edge DNS' }).then(() => {
      cy.verifyToast('Your Edge DNS has been deleted')
    })
  })
})