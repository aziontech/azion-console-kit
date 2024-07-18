import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

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

  it('should create a Countries Network List', function () {
    // Act
    cy.get(selectors.networkLists.createButton).click()

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
  })

  it('should create a IP/CIDR Network List', function () {
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
    cy.get(selectors.networkLists.cancelButton).click()

    // Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
    cy.get(selectors.networkLists.typeRow).should('have.text', 'ASN')

    //Edit Flow
    //Arrange
    cy.intercept('GET', '/api/v3/network_lists/*').as('networkListsApi')
    cy.get(selectors.networkLists.nameRow).click()
    cy.wait('@networkListsApi')

    //Act
    cy.get(selectors.networkLists.asnTextarea).click()
    cy.get(selectors.networkLists.asnTextarea).type('{enter}123{enter}')

    cy.get(selectors.networkLists.saveButton).click()
    cy.verifyToast('success', 'Your network list has been edited')

    //Assert
    cy.get(selectors.networkLists.searchInput).clear()
    cy.get(selectors.networkLists.searchInput).type(`${networkListName}{enter}`)
    cy.get(selectors.networkLists.nameRow).should('have.text', `${networkListName}`)
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

  it('should edit an IP/CIDR Network List', function () {
    // Creation Flow
    // Arrange
    cy.get(selectors.networkLists.createButton).click()

    // Act
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
    //Edit Flow
    //Arrange
    cy.intercept('GET', '/api/v3/network_lists/*').as('networkListsApi')
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
      cy.verifyToast('Resource successfully deleted')
    })
  })

})
