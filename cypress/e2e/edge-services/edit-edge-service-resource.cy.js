import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let fixtures = {}

describe('Edge Services spec', { tags: ['@dev6', '@xfail'] }, () => {
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

  it('should edit a resource in an edge service', () => {
    // Arrange
    cy.intercept('/api/v3/edge_services/*').as('loadEdgeService')
    cy.intercept('/api/v3/edge_services/*/resources/*').as('loadResource')

    // Act
    // create edge service
    cy.get(selectors.edgeServices.createServiceButton).click()

    cy.get(selectors.edgeServices.serviceName).type(fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.variablesField).type(fixtures.contentType)

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Edge Service has been created')

    cy.wait('@loadEdgeService')

    // create resource
    cy.get(selectors.edgeServices.resoucesTab).click()
    cy.get(selectors.edgeServices.createResourceButton).click()

    cy.get(selectors.edgeServices.pathField).type(fixtures.path)
    cy.get(selectors.edgeServices.contentTypeField).type(fixtures.contentType)

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Resource has been created')

    // Assert
    //resource
    cy.get(selectors.edgeServices.listRow('name')).should('have.text', fixtures.path)
    cy.get(selectors.edgeServices.listRow('contentType')).should('have.text', 'Shell Script')
    cy.get(selectors.edgeServices.listRow('trigger')).should('have.text', 'Install')

    cy.get(selectors.edgeServices.breadcrumbReturnToList).click()
    //service
    cy.get(selectors.list.searchInput).type(fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.listRow('name')).should('have.text', fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.listRow('labelActive')).should('have.text', 'Inactive')
    cy.get(selectors.edgeServices.listRow('name')).click()

    // Act
    // edit service

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000) // waiting for api response is not working because of page update
    cy.get(selectors.edgeServices.statusSwitch).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge service has been updated')

    // edit resource
    cy.get(selectors.edgeServices.resoucesTab).click()

    cy.get(selectors.list.searchInput).type(fixtures.path)
    cy.get(selectors.edgeServices.listRow('name')).click()
    cy.wait('@loadResource')
    cy.get(selectors.edgeServices.typeDropdownTrigger).click()
    cy.get(selectors.edgeServices.typeDropdownOptions(1)).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Edge Service Resource has been updated')

    // Assert
    cy.get(selectors.edgeServices.listRow('name')).should('have.text', fixtures.path)
    cy.get(selectors.edgeServices.listRow('contentType')).should('have.text', 'Text')
    cy.get(selectors.edgeServices.listRow('trigger')).should('be.empty')

    // Prepare for cleanup
    cy.get(selectors.edgeServices.breadcrumbReturnToList).click()
    cy.get(selectors.list.searchInput).type(fixtures.edgeServiceName)
    cy.get(selectors.edgeServices.listRow('labelActive')).should('have.text', 'Active')
  })

  afterEach(() => {
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})