import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let zoneName = ''

describe('Edge DNS spec', () => {
  beforeEach(() => {
    cy.login()
    zoneName = generateUniqueName('DNSZone')
    cy.openProductThroughSidebar('edge-dns')
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

  it('Create a record of type A', () => {
    // Arrange
    cy.intercept('/api/v3/intelligent_dns/*').as('loadZone')

    const recordTypeFixtures = {
      name: 'recordTypeA',
      recordType: 'A',
      recordTypeOption: 0,
      ttl: 100,
      value: '0.0.0.0',
      policyType: 'simple',
      policyTypeOption: 0,
      description: '-'
    }

    cy.get(selectors.edgeDns.createButton).click()
    cy.get(selectors.edgeDns.nameInput).type(zoneName)
    cy.get(selectors.edgeDns.domainInput).type(`${zoneName}.com.az`)
    cy.get(selectors.edgeDns.saveButton).click()
    cy.verifyToast('success', 'Your Edge DNS has been created')
    cy.get(selectors.edgeDns.cancelButton).click()
    cy.get(selectors.edgeDns.searchInput).type(zoneName)
    cy.get(selectors.edgeDns.nameRow)
      .should('contain', zoneName)
      .then(() => {
        cy.get(selectors.edgeDns.nameRow).click()
      })

    cy.wait('@loadZone')

    // Act
    cy.get(selectors.edgeDns.records.tab).click()
    cy.get(selectors.edgeDns.records.createButton).click()
    cy.get(selectors.edgeDns.records.nameInput).type(recordTypeFixtures.name)
    cy.get(selectors.edgeDns.records.recordTypeDropdown).click()
    cy.get(selectors.edgeDns.records.recordTypeOption(recordTypeFixtures.recordTypeOption)).click()
    cy.get(selectors.edgeDns.records.ttlInput).type(recordTypeFixtures.ttl)
    cy.get(selectors.edgeDns.records.valueTextarea).type(recordTypeFixtures.value)
    cy.get(selectors.edgeDns.records.policyTypeDropdown).click()
    cy.get(selectors.edgeDns.records.policyTypeOption(recordTypeFixtures.policyTypeOption)).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Edge DNS Record has been created')

    cy.get(selectors.list.searchInput).type(recordTypeFixtures.name.toLocaleLowerCase())
    cy.get(selectors.edgeDns.list.columnName('name')).should(
      'have.text',
      recordTypeFixtures.name.toLocaleLowerCase()
    )
    cy.get(selectors.edgeDns.list.columnName('type')).should(
      'have.text',
      recordTypeFixtures.recordType
    )
    cy.get(selectors.edgeDns.list.columnName('value')).should('have.text', recordTypeFixtures.value)
    cy.get(selectors.edgeDns.list.columnName('ttl')).should('have.text', recordTypeFixtures.ttl)
    cy.get(selectors.edgeDns.list.columnName('policy')).should(
      'have.text',
      recordTypeFixtures.policyType
    )
    cy.get(selectors.edgeDns.list.columnName('weight')).should('be.empty')
    cy.get(selectors.edgeDns.list.columnName('description')).should(
      'have.text',
      recordTypeFixtures.description
    )

    // Cleanup
    cy.deleteEntityFromList().then(() => {
      cy.verifyToast('Edge DNS Record successfully deleted')
    })
  })

  afterEach(() => {
    cy.deleteProduct(zoneName, '/edge-dns').then(() => {
      cy.verifyToast('Your Edge DNS has been deleted')
    })
  })
})
