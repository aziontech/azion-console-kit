import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let networkListName = generateUniqueName('NetworkList')

describe('Network Lists spec', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should registry when a network list is created', function () {
    //Generate event to activity history
    // Act
    cy.openProduct('Network Lists')
    cy.get(selectors.networkLists.createButton).click()

    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    cy.get(selectors.networkLists.typeDropdown).click()
    cy.get(selectors.networkLists.typeDropdown).find('li').eq(0).should('have.text', 'ASN').click()

    cy.get(selectors.networkLists.asnTextarea).click()
    cy.get(selectors.networkLists.asnTextarea).type('9876{enter}6789{enter}')
    cy.get(selectors.networkLists.saveButton).click()

		//Assert
    cy.verifyToast('success', 'Your network list has been created')
    cy.get(selectors.networkLists.cancelButton).click()
		cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}`)

		//delete network lists
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Resource successfully deleted')
    })

		//Verify generated event on activity history
		//Arrange
    cy.openProduct('Activity History')

		//act
		cy.get(selectors.activityHistory.searchInput).clear()
		cy.get(selectors.activityHistory.searchInput).type(`${networkListName} was created`)

		//assert

  })

})
