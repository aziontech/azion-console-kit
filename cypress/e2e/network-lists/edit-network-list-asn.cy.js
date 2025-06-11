import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let networkListName

describe('Network Lists spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    networkListName = generateUniqueName('NetworkList')
  })

  it('should edit an ASN Network List', function () {
    // Creation Flow
    // Arrange
    cy.get(selectors.networkLists.createButton).click()

    // Act
    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    cy.get(selectors.networkLists.typeDropdown).click()
    cy.get(selectors.networkLists.typeDropdown).find('li').eq(0).should('have.text', 'ASN').click()

    cy.get(selectors.networkLists.asnTextarea).click()
    cy.get(selectors.networkLists.asnTextarea).type('9876{enter}6789{enter}')

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your network list has been created')

    // Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
    cy.get(selectors.networkLists.typeRow).should('have.text', 'ASN')

    //Edit Flow
    //Arrange
    cy.intercept('GET', '/v4/workspace/network_lists/*').as('networkListsApi')
    cy.get(selectors.networkLists.nameRow).click()
    cy.wait('@networkListsApi')

    //Act
    cy.get(selectors.networkLists.asnTextarea).click()
    cy.get(selectors.networkLists.asnTextarea).type('{enter}123{enter}')

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your Network List has been updated.')

    //Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
  })
})
