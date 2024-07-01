import generateUniqueName from '../support/utils'
const selectors = {
  form: {
    submitButton: '[data-testid="form-actions-submit-button"]'
  },
  list: {
    searchInput: '[data-testid="data-table-search-input"]',
    actionsMenu: {
      button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
      deleteButton: '[data-testid="data-table-actions-column-body-actions-menu"]'
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
      deleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
    }
  },
  usersManagement: {
    createButton: '[data-testid="create_User_button"]',
    firstNameInput: '[data-testid="users-form__first-name-field__input"]',
    firstNameErrorMessage: '[data-testid="users-form__first-name-field__error-message"]',
    lastNameInput: '[data-testid="users-form__last-name-field__input"]',
    lastNameErrorMessage: '[data-testid="users-form__last-name-field__error-message"]',
    emailInput: '[data-testid="users-form__email-field__input"]',
    emailErrorMessage: '[data-testid="users-form__email-field__error-message"]',
    phoneInput: '[data-testid="users-form__phone-field__input"]',
    phoneErrorMessage: '[data-testid="users-form__phone-field__error-message"]',
    languageDropdown: '[data-testid="users-form__language-field__dropdown"]',
    timezoneDropdown: '[data-testid="users-form__timezone-field"]',
    timezoneFilter: '[data-testid="users-form__timezone-field"] .p-dropdown-filter',
    timezoneOption: (index) => `#timezone_${index}`,
    teamDropdownTrigger:
      '[data-testid="users-form__teams-field__multiselect"] .p-multiselect-trigger',
    teamDropdownFilter: '[aria-owns="teams_list"].p-multiselect-filter',
    teamOption: (index) => `#teams_${index}`,
    selectedTeamTag: (optionNumber) =>
      `[data-testid="users-form__teams-field__multiselect"] :nth-child(${optionNumber})`,
    selectedTeamTagCloseBtn: (optionNumber) =>
      `[data-testid="users-form__teams-field__multiselect"] :nth-child(${optionNumber}) .p-icon`,
    selectedTeamErrorMessage: '[data-testid="users-form__teams-field__error-message"]',
    switchSocialLogin: '[data-testid="users-form__mfa-field__switch-isAccountOwner"]',
    switchMultiFactorAuth: '[data-testid="users-form__mfa-field__switch-twoFactorEnabled"]',
    listRow: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  }
}

const userFirstName = generateUniqueName('FirstName')
const userLastName = generateUniqueName('LastName')
const userEmail = `${userFirstName}@azion.com`

describe('Users Management spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Users Management')
  })

  it('should create a regular user with a team', () => {
    // Arrange
    cy.get(selectors.usersManagement.createButton).click()

    cy.get(selectors.usersManagement.firstNameInput).type('A')
    cy.get(selectors.usersManagement.firstNameInput).clear()
    cy.get(selectors.usersManagement.firstNameErrorMessage)
      .should('be.visible')
      .and('have.text', 'First Name is a required field.')

    cy.get(selectors.usersManagement.lastNameInput).type('A')
    cy.get(selectors.usersManagement.lastNameInput).clear()
    cy.get(selectors.usersManagement.lastNameErrorMessage)
      .should('be.visible')
      .and('have.text', 'Last Name is a required field.')

    cy.get(selectors.usersManagement.emailInput).type('A')
    cy.get(selectors.usersManagement.emailInput).clear()
    cy.get(selectors.usersManagement.emailErrorMessage)
      .should('be.visible')
      .and('have.text', 'Email is a required field.')

    cy.get(selectors.usersManagement.phoneInput).type('1')
    cy.get(selectors.usersManagement.phoneInput).clear()
    cy.get(selectors.usersManagement.phoneErrorMessage)
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field.')

    cy.get(selectors.usersManagement.languageDropdown)
      .should('have.text', 'English')
      .and('have.class', 'p-disabled')

    cy.get(selectors.usersManagement.selectedTeamTagCloseBtn(1)).click()
    cy.get(selectors.usersManagement.selectedTeamErrorMessage)
      .should('be.visible')
      .and('have.text', 'Must select at least one team')

    // Act
    cy.get(selectors.usersManagement.firstNameInput).type(userFirstName)
    cy.get(selectors.usersManagement.firstNameErrorMessage).should('not.exist')

    cy.get(selectors.usersManagement.lastNameInput).type(userLastName)
    cy.get(selectors.usersManagement.lastNameErrorMessage).should('not.exist')

    cy.get(selectors.usersManagement.timezoneDropdown).click()
    cy.get(selectors.usersManagement.timezoneFilter).type('são')
    cy.get(selectors.usersManagement.timezoneOption(0)).click()

    cy.get(selectors.usersManagement.emailInput).type(userEmail)
    cy.get(selectors.usersManagement.emailErrorMessage).should('not.exist')

    cy.get(selectors.usersManagement.phoneInput).type('12212122121212')
    cy.get(selectors.usersManagement.phoneErrorMessage).should('not.exist')

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

    // Clean up
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.deleteButton).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
    cy.get(selectors.list.deleteDialog.deleteButton).click()
    cy.verifyToast('User successfully deleted')
  })
})
