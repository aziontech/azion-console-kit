import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let networkListName

describe('Network Lists spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    networkListName = generateUniqueName('NetworkList')
  })

  it('should edit an IP/CIDR Network List', function () {
    // Creation Flow
    // Arrange
    cy.get(selectors.networkLists.createButton).click()

    // Act
    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    cy.get(selectors.networkLists.typeDropdown).click()
    cy.get(selectors.networkLists.typeDropdown)
      .find('li')
      .eq(2)
      .should('have.text', 'IP/CIDR')
      .click()

    cy.get(selectors.networkLists.ipcidrTextarea).click()
    cy.get(selectors.networkLists.ipcidrTextarea).type(
      '192.168.172.4 #comment{enter}192.168.1.4 #comment{enter}'
    )

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your network list has been created')
    cy.get(selectors.networkLists.cancelButton).click()

    // Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
    cy.get(selectors.networkLists.typeRow).should('have.text', 'IP/CIDR')
    //Edit Flow
    //Arrange
    cy.intercept('GET', '/api/v4/workspace/network_lists/*').as('networkListsApi')
    cy.get(selectors.networkLists.nameRow).click()
    cy.wait('@networkListsApi')

    //Act
    cy.get(selectors.networkLists.ipcidrTextarea).click()
    cy.get(selectors.networkLists.ipcidrTextarea).type('{enter}192.148.3.4')

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
      cy.verifyToast('Network list successfully deleted')
    })
  })
})
