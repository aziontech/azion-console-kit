// cypress/integration/edge-services/create-edge-service.spec.js
import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let fixtures = {}

describe('Edge Services spec', { tags: ['run'] }, () => {
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

  // TODO: remove skip when the bug is fixed
  it.skip('should create an edge service', () => {
    // Arrange
    cy.intercept('POST', '/api/v3/edge_services').as('saveEdgeService')

    cy.get(selectors.edgeServices.createServiceButton).click()

    // Act
    cy.get(selectors.edgeServices.serviceName).type(fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.variablesField).type(fixtures.contentType)
    cy.get(selectors.edgeServices.statusSwitch).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@saveEdgeService')

    cy.get(selectors.edgeServices.serviceName).should('have.value', fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.variablesField).should('have.value', fixtures.contentType)
    cy.get(selectors.edgeServices.status).should('be.checked')

    // Assert
    cy.verifyToast('success', 'Your Edge Service has been created')
    cy.get(selectors.edgeServices.pageTitle(fixtures.edgeServiceName)).should(
      'have.text',
      fixtures.edgeServiceName
    )
    cy.get(selectors.form.actionsCancelButton).click()
    cy.get(selectors.list.searchInput).type(fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.listRow('name')).should('have.text', fixtures.edgeServiceName)

    cy.get(selectors.edgeServices.listRow('labelActive')).should('have.text', 'Active')
  })

  afterEach(() => {
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})