import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

const personalTokenName = generateUniqueName('Personal Token')

describe('Personal Token spec', { tags: ['@xfail'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Personal Token')
  })

  it('should create a personal token', () => {
    // Arrange
    cy.get(selectors.personalTokens.createTokenButton).click()
    cy.get(selectors.personalTokens.tokenName).type(personalTokenName)

    // Act
    // Verify if copy token dialog is displayed after save
    cy.get(selectors.personalTokens.submitButton).click()
    cy.get(selectors.personalTokens.copyTokenDialogHeader).should(
      'have.text',
      'Personal token has been created'
    )
    cy.get(selectors.personalTokens.copyTokenButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.personalTokens.closeCopyDialogButton).click()

    // Assert
    cy.get(selectors.personalTokens.searchInput).type(personalTokenName)
    cy.get(selectors.personalTokens.filteredRecordNameColumn).should('have.text', personalTokenName)
  })

  afterEach(() => {
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Personal token successfully deleted')
    })
  })
})
