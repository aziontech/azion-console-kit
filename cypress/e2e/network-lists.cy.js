import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let networkListName

describe('Network Lists spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    networkListName = generateUniqueName('NetworkList')
  })

  it('Create a ASN Network List', function () {
    // Act
    cy.get(selectors.networkLists.createButton).click()

    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    // ALISSON'S NOTE : Dropdowns have dynamic IDs, so find/eq are needed
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
  it('Create a IP/CIDR Network List', function () {
    // Act
    cy.get(selectors.networkLists.createButton).click()

    cy.get(selectors.networkLists.nameInput).clear()
    cy.get(selectors.networkLists.nameInput).type(`${networkListName}`)

    cy.get(selectors.networkLists.typeDropdown).click()
    cy.get(selectors.networkLists.typeDropdown).find('li').eq(2).should('have.text', 'IP/CIDR').click()

    cy.get(selectors.networkLists.ipcidrTextarea).click()
    cy.get(selectors.networkLists.ipcidrTextarea).type('192.168.172.4 #comment{enter}192.168.1.4 #comment{enter}')

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your network list has been created')
    cy.get(selectors.networkLists.cancelButton).click()

    // Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
    cy.get(selectors.networkLists.typeRow).should('have.text', 'IP/CIDR')
  })

  afterEach(() => {
    // Delete the network list
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})
