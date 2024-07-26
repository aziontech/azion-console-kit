import selectors from '../support/selectors'
import fixtures from '../fixtures/billing.json'


describe('Payment Methods spec',  { tags: [] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/payments/*').as('getPaymentMethodsApi')
    cy.visit('/billing/payment')
    cy.wait('@getPaymentMethodsApi')
  })

  it('should create a Payment Method', function () {
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
    
    cy.get(selectors.form.submitButton).click()
    cy.intercept('POST', '/api/v4/payments/*').as('postPaymentMethodApi')
    cy.wait('@postPaymentMethodApi')

    //assert
    cy.verifyToast('success', 'Your Payment Method has been added')
  })
  it('should add credits to account', function () {
    //Add payment method
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
    
    cy.get(selectors.form.submitButton).click()
    cy.intercept('POST', '/api/v4/payments/*').as('postPaymentMethodApi')
    cy.wait('@postPaymentMethodApi')

    //assert
    cy.verifyToast('success', 'Your Payment Method has been added')

    //Add credit
    //arrange
    cy.get(selectors.billing.addCredit).click()

    //act
    cy.get(selectors.billing.creditAmount).type('30')
    cy.get(selectors.form.submitButton).click()

    //assert
    cy.verifyToast('success')
  })
  afterEach(() => {
    cy.visit('/billing/payment')
    cy.get(selectors.list.searchField).type(fixtures.defaultCard)
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.setDefaultButton).click()
    cy.verifyToast('success', 'Payment Method successfully set as default')
    cy.get(selectors.list.searchField).clear()
    cy.get(selectors.list.searchField).type(fixtures.cardHolderName)
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.deleteButton).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
    cy.verifyToast('Payment Method successfully deleted!')
  })
})
