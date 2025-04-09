import selectors from '../support/selectors'

describe('Feedback Form with Request Interception', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('POST', '/api/webhook/console_feedback', {
      statusCode: 200,
      body: { message: 'Feedback sent successfully' }
    }).as('sendFeedback')
  })

  it('should send feedback successfully', () => {
    // Arrange
    cy.openFeedback()

    // Act
    cy.get(selectors.header.buttonFeedback.typeDropdown).click()
    cy.get(selectors.header.buttonFeedback.typeDropdownOption('Other')).click()
    cy.get(selectors.header.buttonFeedback.description).type('This is a test feedback.')
    cy.get(selectors.header.buttonFeedback.submitFeedback).click()

    // Assert
    cy.wait('@sendFeedback')
    cy.verifyToast('Success', 'Feedback sent successfully')
  })

  it('should reset the form fields on reopening', () => {
    // Arrange
    cy.openFeedback()

    // Act
    cy.get(selectors.header.buttonFeedback.typeDropdown).should('have.text', 'Issue')
    cy.get(selectors.header.buttonFeedback.description).type('This is a test feedback.')
    cy.get(selectors.header.buttonFeedback.closeFeedback).click()
    cy.openFeedback()

    // Assert
    cy.get(selectors.header.buttonFeedback.typeDropdown).should('have.text', 'Issue')
    cy.get(selectors.header.buttonFeedback.description).should('have.value', '')
    cy.get(selectors.header.buttonFeedback.closeFeedback).click()
  })
})