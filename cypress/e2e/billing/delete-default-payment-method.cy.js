import selectors from '../../support/selectors'
import fixtures from '../../fixtures/billing.json'
import { generateUniqueNameWithLetters } from '../../support/utils'

let cardHolderName

describe('Payment Methods spec', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/payments/*').as('getPaymentMethodsApi')
    cy.visit('/billing/payment')

    cardHolderName = generateUniqueNameWithLetters('CardHolderName')

    cy.wait('@getPaymentMethodsApi')
  })

  it('should not delete a Default Payment Method', function () {
    //Act
    cy.get(selectors.billing.addPaymentMethod).click()
    cy.get(selectors.billing.cardHolderNameInput).type(cardHolderName)

    cy.get(selectors.billing.cardNumber).then(($iframe) => {
      const $body = $iframe.contents().find('body')
      cy.wrap($body).find('input[name="cardnumber"]').type(fixtures.cardNumber)
    })

    cy.get(selectors.billing.cardExpiry).then(($iframe) => {
      const $body = $iframe.contents().find('body')
      cy.wrap($body).find('input[name="exp-date"]').type(fixtures.cardExpiry)
    })

    cy.get(selectors.billing.cardCvc).then(($iframe) => {
      const $body = $iframe.contents().find('body')
      cy.wrap($body).find('input[name="cvc"]').type(fixtures.cardCvc)
    })

    cy.get(selectors.form.submitButton).click()
    cy.intercept('POST', '/api/v4/payments/*').as('postPaymentMethodApi')
    cy.wait('@postPaymentMethodApi')

    //assert
    cy.verifyToast('success', 'Your Payment Method has been added')

    cy.get(selectors.list.searchField).type(cardHolderName)
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Error', `You can't delete a default payment method.`)
    })
  })

  afterEach(() => {
    cy.visit('/billing/payment')
    cy.get(selectors.list.searchField).type(fixtures.defaultCard)
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.setDefaultButton).click()
    cy.verifyToast('success', 'Payment Method successfully set as default')
    cy.get(selectors.list.searchField).clear()
    cy.get(selectors.list.searchField).type(cardHolderName)
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.deleteButton).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
    cy.verifyToast('Payment Method successfully deleted!')
  })
})