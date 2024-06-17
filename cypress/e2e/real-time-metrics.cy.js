const clickMultipleTimes = (selector, times) => {
  for (let iterator = 0; iterator < times; iterator++) {
    cy.get(selector).click()
  }
}

const toBeholderDate = (date) => {
  const toLocale = new Date(date).toLocaleString('en-GB')
  const parts = toLocale.split(/\/|, /)
  const [day, month, year, time] = parts

  return `${year}-${month}-${day}T${time}`
}

describe('Real Time Metrics', () => {
  beforeEach(() => {
    cy.intercept('/api/v4/iam/account').as('setAccount')

    const email = Cypress.env('CYPRESS_EMAIL_STAGE')
    const password = Cypress.env('CYPRESS_PASSWORD_STAGE')

    cy.visit('/login')

    cy.getByTestId('signin-block__email-input').type(email)
    cy.getByTestId('signin-block__next-button').click()

    cy.getByTestId('signin-block__password-input').type(password, { log: false })
    cy.getByTestId('signin-block__signin-button').click()

    cy.wait('@setAccount')

    cy.visit('/real-time-metrics')
  })

  it('should successfully apply the custom time range filter', () => {
    cy.intercept('POST', '/api/v3/metrics/graphql', {
      statusCode: 200,
      body: { data: {} }
    }).as('beholderRequest')

    cy.wait('@beholderRequest')

    cy.get('.p-dropdown-items-wrapper ul').should('not.exist')

    cy.getByTestId('real-time-metrics__interval-filter-block__dropdown').as('dropdown').click()

    cy.get('.p-dropdown-items-wrapper ul').should('be.visible')

    // Select Custom Time Range option
    cy.get('.p-dropdown-items-wrapper li').last().should('have.text', 'Custom time range').click()

    cy.getByTestId('real-time-metrics__interval-filter-block__calendar')
      .as('calendar')
      .should('be.visible')
      .click()

    cy.get('.p-datepicker-today').as('today').click()

    // Set the initial date with one hour less difference
    clickMultipleTimes('[aria-label="Previous Hour"]', 4)

    cy.get('@today').click()

    // Set the final date with two hours more difference
    clickMultipleTimes('[aria-label="Next Hour"]', 4)

    // click outside of the calendar to trigger the filter
    cy.getByTestId('real-time-metrics__page-heading-block__title').as('title').click()

    // filter interceptor
    cy.intercept('POST', '/api/v3/metrics/graphql').as('firstFilterRequest')

    cy.get('@calendar')
      .invoke('attr', 'aria-valuenow')
      .then((filter) => {
        const [start, end] = filter.split(',')

        cy.wait('@firstFilterRequest')
          .its('request.body.variables')
          .should('deep.equal', {
            tsRange_begin: toBeholderDate(start),
            tsRange_end: toBeholderDate(end)
          })
      })

    // change time range again
    cy.get('@calendar').click()
    clickMultipleTimes('[aria-label="Previous Hour"]', 1)

    cy.get('@title').click()

    // filter interceptor
    cy.intercept('POST', '/api/v3/metrics/graphql', {
      statusCode: 200,
      body: { data: {} }
    }).as('secondFilterRequest')

    cy.get('@calendar')
      .invoke('attr', 'aria-valuenow')
      .then((filter) => {
        const [start, end] = filter.split(',')

        cy.wait('@secondFilterRequest')
          .its('request.body.variables')
          .should('deep.equal', {
            tsRange_begin: toBeholderDate(start),
            tsRange_end: toBeholderDate(end)
          })
      })
  })
})
