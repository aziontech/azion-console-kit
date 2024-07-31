import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let networkListName

describe('Network Lists spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    networkListName = generateUniqueName('NetworkList')
  })

  it('should create an ASN Network List', function () {
    // Act
    cy.get(selectors.networkLists.createButton).click()

    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    cy.get(selectors.networkLists.typeDropdown).click()
    cy.get(selectors.networkLists.typeDropdown).find('li').eq(0).should('have.text', 'ASN').click()

    cy.get(selectors.networkLists.asnTextarea).click()
    cy.get(selectors.networkLists.asnTextarea).type('9876{enter}6789{enter}')

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your network list has been created')
    cy.get(selectors.networkLists.cancelButton).click()

    // Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
    cy.get(selectors.networkLists.typeRow).should('have.text', 'ASN')
  })

  afterEach(() => {
    // Delete the network list
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})