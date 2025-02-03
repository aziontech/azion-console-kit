import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let fixtures = {}

const createEdgeApplicationCase = () => {
  // Act
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
  cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.form.actionsSkipButton).click()
  cy.get(selectors.edgeApplication.mainSettings.unsaved).click()
  cy.get(selectors.form.actionsCancelButton).click()

  // Assert - Verify the edge application was created
  cy.get(selectors.list.searchInput).type(`${fixtures.edgeApplicationName}{enter}`)
  cy.get(selectors.list.filteredRow.column('name')).should(
    'have.text',
    fixtures.edgeApplicationName
  )

  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
}

describe('Edge Application Device Groups Spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    fixtures.deviceGroupName = generateUniqueName('DeviceGroup')
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('applicationAccelerator')).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been updated')
    cy.get(selectors.edgeApplication.tabs('Device Groups')).click()
  })

  it('Should creeate and list device groups.', function () {
    cy.get(selectors.edgeApplication.deviceGroups.createButton).click()
    cy.get(selectors.edgeApplication.deviceGroups.nameInput).type(fixtures.deviceGroupName)
    cy.get(selectors.edgeApplication.deviceGroups.userAgentInput).type('(Mobile)')
    cy.get(selectors.form.actionsSubmitButton).click()

    //assert
    cy.verifyToast('success', 'Device Group successfully created')
    cy.get(selectors.list.searchInput).type(`${fixtures.deviceGroupName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.deviceGroupName)
  })

  afterEach(() => {
    // Delete the edge application
    cy.deleteEntityFromList({
      entityName: fixtures.edgeApplicationName,
      productName: 'Edge Application'
    }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})
