import selectors from '../../support/selectors'

function getPreviousMonth() {
  const today = new Date();
  today.setMonth(today.getMonth() - 1);

  const month = String(today.getMonth() + 1).padStart(2, '0');
  return month;
}


describe('Billing spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/payments/*').as('getPaymentMethodsApi')
    cy.visit('/billing')

    cy.wait('@getPaymentMethodsApi')
  })

  it('Should validate that the first item in the list has a date from the previous month', function () {
    //Act
    cy.get(selectors.billing.listPayments).first().invoke('text').then((text) => {
      const previousMonth = getPreviousMonth();
      const itemMonth = text.trim().slice(0, 2); 
      
  
      expect(itemMonth).to.equal(previousMonth);
    })
  })

})