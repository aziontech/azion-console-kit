import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let edgeApplicationName
const originName = generateUniqueName('origin')
const rulesEngineName = generateUniqueName('RulesEng')

describe('Edge Application', { tags: ['run',] }, () => {
  beforeEach(() => {
    edgeApplicationName = generateUniqueName('EdgeApp')
    // Login
    cy.login()
    cy.openProduct('Edge Application')
  })

  it('Create and delete an edge application, and create a rule', () => {
    // Create an edge application
    cy.get(selectors.edgeApplication.createButton).click()
    cy.get(selectors.edgeApplication.nameInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    // Verify the edge application was created
    cy.get(selectors.edgeApplication.searchInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName)
      .should('be.visible')
      .should('have.text', edgeApplicationName)

    // Navigate to Rules Engine Tab
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.rulesEngineTab).click()

    // Create a rule
    cy.get(selectors.edgeApplication.addRuleButton).click()
    cy.get(selectors.edgeApplication.ruleNameInput).type(rulesEngineName)
    cy.get(selectors.edgeApplication.criteriaOperatorDropdown).click()
    cy.get(selectors.edgeApplication.criteriaOperator).click()
    cy.get(selectors.edgeApplication.criteriaInputValue).clear('/')
    cy.get(selectors.edgeApplication.criteriaInputValue).type('/')
    cy.get(selectors.edgeApplication.behaviorsDropdown).click()
    cy.get(selectors.edgeApplication.behaviors).click()
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get('.flex-column > .text-sm').should('be.visible')

    // Verify the rule was created
    cy.get(selectors.edgeApplication.searchInput).type(rulesEngineName)
    cy.get(selectors.edgeApplication.ruleTable)
      .should('be.visible')
      .should('have.text', rulesEngineName)
  })

  it('should add an origin', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.createButton).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    //assert
    cy.get(selectors.edgeApplication.searchInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', edgeApplicationName)

    //add origin
    //arrange
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.tabOption(1)).click()
    cy.get(selectors.edgeApplication.createOrigin).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(originName)
    cy.get(selectors.edgeApplication.originType).click()
    cy.get(selectors.edgeApplication.originType).find('li').eq(0).should("have.text", 'Single Origin').click()
    
    cy.get(selectors.edgeApplication.originAddressInput).type('teste.com')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.goBackButton).click()
    cy.get(selectors.edgeApplication.leavePageButton).click()

    //Assert
    cy.get(selectors.edgeApplication.searchInput).type(originName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', originName)
  })

  it('should edit an origin', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.createButton).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    //assert
    cy.get(selectors.edgeApplication.searchInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', edgeApplicationName)

    //add origin
    //arrange
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.tabOption(1)).click()
    cy.get(selectors.edgeApplication.createOrigin).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(originName)
    cy.get(selectors.edgeApplication.originType).click()
    cy.get(selectors.edgeApplication.originType).find('li').eq(0).should("have.text", 'Single Origin').click()
    
    cy.get(selectors.edgeApplication.originAddressInput).type('test.com')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.goBackButton).click()
    cy.get(selectors.edgeApplication.leavePageButton).click()

    //Assert
    cy.get(selectors.edgeApplication.searchInput).type(originName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', originName)

    //edit origin
    //arrange
    cy.get(selectors.edgeApplication.tableRowName).click()

    //act
    cy.get(selectors.edgeApplication.originAddressInput).clear()
    cy.get(selectors.edgeApplication.originAddressInput).type('test2.com')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.goBackButton).click()

    //assert
    cy.get(selectors.edgeApplication.searchInput).clear()
    cy.get(selectors.edgeApplication.searchInput).type(originName)
    cy.get(selectors.edgeApplication.tableRowAddress).should('have.text', 'test2.com')
  })

  afterEach(() => {
    // Delete the edge application
    cy.deleteEntityFromList({ entityName: edgeApplicationName, productName: 'Edge Application' }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})
