/// <reference types="Cypress" />

import { mockOk, mockServerError } from '../utils/http-mocks'

const DEFAULTEMAILMOCK = 'abc@test.com'
const fillLoginEmailCredential = (email = DEFAULTEMAILMOCK) => {
  cy.getByTestId('title').should('have.text', ' Azion Console ')
  cy.getInput('email').as('emailInput').type(email)
  cy.getByTestId('next-button').click()
}
const fillRecoveryFormWithCredentials = (email = DEFAULTEMAILMOCK) => {
  cy.getByTestId('forgot-password').click()
  cy.getInput('email').as('recoverEmailInput').type(email)
}
const goToLoginPage = () => {
  cy.visit('/login')
}

describe('Login Journey', () => {
  it('Should not be able to try to sign in with invalid email credentials', () => {
    goToLoginPage()
    const invalidEmail = 'some-invalid-email--azion.com'

    cy.getByTestId('title').should('have.text', ' Azion Console ')
    cy.getInput('email').as('emailInput').type(invalidEmail)
    cy.getByTestId('next-button').click()

    cy.get('small').contains('Use a valid email to sign in.')
  })

  it('Should get and invalid password credential when provide invalid password', () => {
    goToLoginPage()

    cy.getByTestId('title').should('have.text', ' Azion Console ')
    cy.getInput('email').as('emailInput').type(Cypress.env('EMAIL_STAGE'))
    cy.getByTestId('next-button').click()
    cy.getInput('password').type(' ')
    cy.getByTestId('submit').click()

    cy.get('small').contains(`E-mail and password don't match with any account.`)
  })

  it('Should be able to recover the account password', () => {
    goToLoginPage()

    cy.getByTestId('title').should('have.text', ' Azion Console ')
    cy.getInput('email').as('emailInput').type(Cypress.env('EMAIL_STAGE'))
    cy.getByTestId('next-button').click()
    cy.getByTestId('forgot-password').click()
    cy.getInput('email').as('recoverEmailInput').type('abc@123.com')

    cy.getByTestId('recover-password').click()
    cy.contains('Email sent successfully')
  })

  it('Should be able to retry to recover password multiple times', () => {
    goToLoginPage()
    fillLoginEmailCredential()
    fillRecoveryFormWithCredentials()

    mockOk('POST', '**/iam/user/password/request', {
      alias: 'recover-password',
      response: null
    })

    cy.getByTestId('recover-password').click()
    cy.wait(['@recover-password'])
    cy.contains('Email sent successfully')

    cy.clock()
    cy.getByTestId('resend-email').click()
    cy.wait(['@recover-password'])
    cy.contains('Email sent successfully')

    const advanceOneMinute = 600 * 1000
    const advanceTimeInFiveSeconds = 5000

    cy.tick(advanceTimeInFiveSeconds).then(() => {
      cy.getByTestId('countdown').should('have.text', '55')
    })

    cy.tick(advanceOneMinute).then((clock) => {
      mockServerError('POST', '**/password/request', {
        statusCode: 400,
        alias: 'recover-password-error'
      })
      cy.getByTestId('resend-email').click()
      cy.wait(['@recover-password-error'])
      cy.contains('Error sending email')
      clock.restore()
    })
  })
})
