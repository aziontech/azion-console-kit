import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let networkListName

describe('Network Lists spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    networkListName = generateUniqueName('NetworkList')
  })

  it('should create a Countries Network List', function () {
    // Act
    cy.get(selectors.networkLists.createButton).click()

    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    cy.get(selectors.networkLists.typeDropdown).click()
    cy.get(selectors.networkLists.typeDropdown)
      .find('li')
      .eq(1)
      .should('have.text', 'Countries')
      .click()

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
  })

  afterEach(() => {
    // Delete the network list
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Network list successfully deleted')
    })
  })
})
