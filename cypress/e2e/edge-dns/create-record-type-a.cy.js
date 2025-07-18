import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let zoneName = ''

describe('Edge DNS spec', { tags: ['@dev4', '@dont_run_prod'] }, () => {
  beforeEach(() => {
    cy.login()
    zoneName = generateUniqueName('DNSZone')
    cy.openProduct('Edge DNS')
  })

  it('Create a record of type A', () => {
    // Arrange
    cy.intercept('/v4/edge_dns/zones/*').as('loadZone')

    const recordTypeFixtures = {
      name: generateUniqueName('record'),
      recordType: 'A',
      recordTypeOption: 0,
      ttl: 7,
      value: '10.0.0.1',
      policyType: 'weighted',
      policyTypeOption: 1,
      weight: 10,
      description: 'base description'
    }

    cy.get(selectors.edgeDns.createButton).click()
    cy.get(selectors.edgeDns.nameInput).type(zoneName)
    cy.get(selectors.edgeDns.domainInput).type(`${zoneName}.com.az`)
    cy.get(selectors.edgeDns.saveButton).click()
    cy.verifyToast('success', 'Your DNS zone has been created. To complete the setup, ensure the Azion nameservers are configured in your domain provider.')
    cy.get(selectors.edgeDns.searchInput).type(`${zoneName}{enter}`)
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
    cy.get(selectors.edgeDns.records.ttlInput).clear()
    cy.get(selectors.edgeDns.records.ttlInput).type(recordTypeFixtures.ttl)
    cy.get(selectors.edgeDns.records.valueTextarea).type(recordTypeFixtures.value)
    cy.get(selectors.edgeDns.records.policyTypeDropdown).click()
    cy.get(selectors.edgeDns.records.policyTypeOption(recordTypeFixtures.policyTypeOption)).click()
    cy.get(selectors.edgeDns.records.weightInput).clear()
    cy.get(selectors.edgeDns.records.weightInput).type(recordTypeFixtures.weight)
    cy.get(selectors.edgeDns.records.descriptionTextarea).type(recordTypeFixtures.description)

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Edge DNS Record has been created')

    cy.get(selectors.list.searchInput).type(`${recordTypeFixtures.name}{enter}`)
    cy.get(selectors.edgeDns.list.columnName('name')).should('have.text', recordTypeFixtures.name)
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
    cy.get(selectors.edgeDns.list.columnName('weight')).should(
      'have.text',
      recordTypeFixtures.weight
    )
    cy.get(selectors.edgeDns.list.columnName('description')).should(
      'have.text',
      recordTypeFixtures.description
    )
  })
})
