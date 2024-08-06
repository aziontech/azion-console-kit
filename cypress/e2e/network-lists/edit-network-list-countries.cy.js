import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let networkListName

describe('Network Lists spec', { tags: ['@dev5'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    networkListName = generateUniqueName('NetworkList')
  })

  it('should edit an Countries Network List', function () {
    // Creation Flow
    // Arrange
    cy.get(selectors.networkLists.createButton).click()

    // Act
    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    cy.get(selectors.networkLists.typeDropdown).click()
    cy.get(selectors.networkLists.typeDropdown).find('li').eq(1).should('have.text', 'Countries').click()

    cy.get(selectors.networkLists.countriesMultiselect).click()
    cy.get(selectors.networkLists.countriesListOption(0)).click()
    cy.get(selectors.networkLists.countriesListOption(1)).click()

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your network list has been created')
    cy.get(selectors.networkLists.cancelButton).click()

    // Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
    cy.get(selectors.networkLists.typeRow).should('have.text', 'Countries')
    //Edit Flow
    //Arrange
    cy.intercept('GET', '/api/v3/network_lists/*').as('networkListsApi')
    cy.get(selectors.networkLists.nameRow).click()
    cy.wait('@networkListsApi')

    //Act
    cy.get(selectors.networkLists.countriesMultiselect).click()
    cy.get(selectors.networkLists.countriesListOption(0)).click()
    cy.get(selectors.networkLists.countriesListOption(3)).click()

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your network list has been edited')

    //Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
  })

  afterEach(() => {
    // Delete the network list
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})