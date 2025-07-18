import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let zoneName = ''

describe('Edge DNS spec', { tags: ['@dev5', '@dont_run_prod'] }, () => {
  beforeEach(() => {
    cy.login()
    zoneName = generateUniqueName('DNSZone')
    cy.openProduct('Edge DNS')
  })

  it('Create a record of type TXT', () => {
    // Arrange
    cy.intercept('/v4/edge_dns/zones/*').as('loadZone')

    const recordTypeFixtures = {
      name: generateUniqueName('record'),
      recordType: 'TXT',
      recordTypeOption: 10,
      ttl: 2733,
      value: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget',
      policyType: 'simple',
      policyTypeOption: 0,
      description: ''
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
    cy.get(selectors.edgeDns.list.columnName('description')).should(
      'have.text',
      recordTypeFixtures.description
    )
  })
})
