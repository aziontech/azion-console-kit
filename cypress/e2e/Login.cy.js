/// <reference types="Cypress" />

describe('Login Journey', () => {
  // it('Should be able to login with email credentials', () => {
  //   cy.visit('/login')

  //   cy.getByTestId('title').should('have.text', ' Azion Console ')
  //   cy.getInput('email').type('needToBeInjectedByEnv')
  //   cy.getByTestId('next-button').click()
  //   cy.getInput('password').type('needToBeInjectedByEnv')
  //   cy.getByTestId('submit').click()

  //   cy.url().should('include', '/')
  // })

  it('Should not be able to sign in with invalid email credentials', () => {
    cy.visit('/login')
    const invalidEmail = 'some-invalid-email--azion.com'

    cy.getByTestId('title').should('have.text', ' Azion Console ')
    cy.getInput('email').as('emailInput').type(invalidEmail)
    cy.getByTestId('next-button').click()

    cy.get('small').contains('Use a valid email to sign in.')
  })

  it('Should not be able to sign in with invalid password credential', () => {
    cy.visit('/login')

    cy.getByTestId('title').should('have.text', ' Azion Console ')
    cy.getInput('email').as('emailInput').type('abc@123.com')
    cy.getByTestId('next-button').click()
    cy.getInput('password').type(' ')
    cy.getByTestId('submit').click()

    cy.get('small').contains(`E-mail and password don't match with any account.`)
  })

  it('Should be able to recover password', () => {
    cy.visit('/login')

    cy.getByTestId('title').should('have.text', ' Azion Console ')
    cy.getInput('email').as('emailInput').type('abc@123.com')
    cy.getByTestId('next-button').click()
    cy.getByTestId('forgot-password').click()
    cy.getInput('email').as('recoverEmailInput').type('abc@123.com')

    cy.getByTestId('recover-password').click()
    cy.contains('Email sent successfully')
  })

  it('Should be able to retry to recover password after countdown reset', () => {
    cy.visit('/login')

    cy.getByTestId('title').should('have.text', ' Azion Console ')
    cy.getInput('email').as('emailInput').type('abc@123.com')
    cy.getByTestId('next-button').click()
    cy.getByTestId('forgot-password').click()
    cy.getInput('email').as('recoverEmailInput').type('abc@123.com')

    cy.getByTestId('recover-password').click()
    cy.contains('Email sent successfully')

    cy.clock()
    cy.getByTestId('resend-email').click()
    cy.contains('Email sent successfully')

    const advanceOneMinute = 600 * 1000
    const advanceTimeInFiveSeconds = 5000

    cy.tick(advanceTimeInFiveSeconds).then(() => {
      cy.getByTestId('countdown').should('have.text', '55')
    })

    cy.tick(advanceOneMinute).then((clock) => {
      cy.getByTestId('resend-email').click()
      cy.contains('Email sent successfully')
      clock.restore()
    })
  })
})
