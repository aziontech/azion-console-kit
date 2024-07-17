import selectors from '../support/selectors'
import fixtures from '../fixtures/billing.json'


describe('Payment Methods spec', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/billing/payment')
    cy.intercept('GET', '/api/v4/payments/*').as('getPaymentMethodsApi')
    cy.wait('@getPaymentMethodsApi')
  })

  it('should create an ASN Network List', function () {
    //Act
    cy.get(selectors.billing.addPaymentMethod).click()
    cy.get(selectors.billing.cardHolderNameInput).type(fixtures.cardHolderName)

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
    
    cy.get(selectors.billing.saveButton).click()
    cy.intercept('POST', '/api/v4/payments/*').as('postPaymentMethodApi')
    cy.wait('@postPaymentMethodApi')

    //assert
    cy.verifyToast('success', 'Your Credit Card has been added')

  })
})
