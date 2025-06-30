import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let fixtures = {}

describe('Edge Services spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Services')

    const uniqueName = generateUniqueName('EdgeService')
    fixtures = {
      edgeServiceName: uniqueName,
      path: `/tmp/${uniqueName}`,
      contentType: `value=${uniqueName}`
    }
  })

  it('should create an edge service', () => {
    // Arrange
    cy.intercept('POST', '/api/v3/edge_services').as('saveEdgeService')

    cy.get(selectors.edgeServices.createServiceButton).click()

    // Act
    cy.get(selectors.edgeServices.serviceName).type(fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.variablesField).type(fixtures.contentType)
    cy.get(selectors.edgeServices.statusSwitch).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@saveEdgeService')

    // Assert
    cy.verifyToast('success', 'Your Edge Service has been created')
    cy.get(selectors.list.searchInput).type(`${fixtures.edgeServiceName}{enter}`)
    cy.get(selectors.edgeServices.listRow('name')).should('have.text', fixtures.edgeServiceName)

    cy.get(selectors.edgeServices.listRow('labelActive')).should('have.text', 'Inactive')
  })
})
