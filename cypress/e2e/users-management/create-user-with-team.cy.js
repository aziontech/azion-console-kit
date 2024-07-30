import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

const userFirstName = generateUniqueName('FirstName')
const userLastName = generateUniqueName('LastName')
const userEmail = `${userFirstName}@azion.com`

describe('Users Management spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Users Management')
  })

  it('should create a regular user with a team', () => {
    // Arrange
    cy.get(selectors.usersManagement.createButton).click()

    cy.get(selectors.usersManagement.selectedTeamTagCloseBtn(1)).click()

    // Act
    cy.get(selectors.usersManagement.firstNameInput).type(userFirstName)
    cy.get(selectors.usersManagement.lastNameInput).type(userLastName)

    cy.get(selectors.usersManagement.timezoneDropdown).click()
    cy.get(selectors.usersManagement.timezoneFilter).type('são')
    cy.get(selectors.usersManagement.timezoneOption(0)).click()

    cy.get(selectors.usersManagement.emailInput).type(userEmail)

    cy.get(selectors.usersManagement.phoneInput).type('12212122121212')

    cy.get(selectors.usersManagement.teamDropdownTrigger).click()
    cy.get(selectors.usersManagement.teamDropdownFilter).type('default team')
    cy.get(selectors.usersManagement.teamOption(0)).click()

    cy.get(selectors.usersManagement.switchMultiFactorAuth).click()

    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your user has been created')

    cy.get(selectors.list.searchInput).type(userFirstName)

    cy.get(selectors.usersManagement.listRow('firstName')).should('have.text', userFirstName)
    cy.get(selectors.usersManagement.listRow('lastName')).should('have.text', userLastName)
    cy.get(selectors.usersManagement.listRow('email')).should('have.text', userEmail)
    cy.get(selectors.usersManagement.listRow('teams')).should('have.text', 'Default Team')
    cy.get(selectors.usersManagement.listRow('mfa')).should('have.text', 'Active')
    cy.get(selectors.usersManagement.listRow('status')).should('have.text', 'Inactive')
    cy.get(selectors.usersManagement.listRow('owner')).should('have.text', 'No')
  })

  afterEach(() => {
    // Delete the user
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('User successfully deleted')
    })
  })
})