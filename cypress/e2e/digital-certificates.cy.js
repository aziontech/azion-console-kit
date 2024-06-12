describe('Digital Certificates', () => {
  beforeEach(() => {
    cy.intercept('/api/v4/iam/account').as('setAccount')
    cy.intercept('GET', '/api/v3/digital_certificates*', {
      fixture: 'digital-certificates.json'
    })

    const email = Cypress.env('CYPRESS_EMAIL_STAGE')
    const password = Cypress.env('CYPRESS_PASSWORD_STAGE')

    cy.visit('/login')

    cy.getByTestId('signin-block__email-input').type(email)
    cy.getByTestId('signin-block__next-button').click()

    cy.getByTestId('signin-block__password-input').type(password)
    cy.getByTestId('signin-block__signin-button').click()

    cy.wait('@setAccount')

    cy.getByTestId('sidebar-block__toggle-button').click()

    cy.getByTestId('sidebar-block__menu-item__digital-certificates').click()

    cy.getByTestId('list-table-block__column__status__row').should('have.length', 8)
  })

  it('should successfully sort the status column in digital certificates', () => {
    // Before sorting
    const unsortedList = [
      'Active',
      'Pending',
      'Active',
      'Waiting domain',
      'Active',
      'Pending',
      'Active',
      'Waiting domain'
    ]

    cy.getByTestId('list-table-block__column__status__row').each((el, index) => {
      cy.wrap(el).should('contain', unsortedList[index])
    })

    // Sort
    cy.get('.p-datatable-thead > tr > :nth-child(6)').click()

    // Sorted ASC
    const sortedListASC = [
      'Active',
      'Active',
      'Active',
      'Active',
      'Pending',
      'Pending',
      'Waiting domain',
      'Waiting domain'
    ]

    cy.getByTestId('list-table-block__column__status__row').each((el, index) => {
      cy.wrap(el).should('contain', sortedListASC[index])
    })

    // Sort
    cy.get('.p-datatable-thead > tr > :nth-child(6)').click()

    // Sorted DESC
    const sortedListDESC = [
      'Waiting domain',
      'Waiting domain',
      'Pending',
      'Pending',
      'Active',
      'Active',
      'Active',
      'Active'
    ]

    cy.getByTestId('list-table-block__column__status__row').each((el, index) => {
      cy.wrap(el).should('contain', sortedListDESC[index])
    })

    // Sort
    cy.get('.p-datatable-thead > tr > :nth-child(6)').click()

    cy.getByTestId('list-table-block__column__status__row').each((el, index) => {
      cy.wrap(el).should('contain', unsortedList[index])
    })
  })
})
