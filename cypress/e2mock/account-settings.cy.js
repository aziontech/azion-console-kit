import selectors from '../support/selectors'

const fixtures = {
  allCountries: [{ geonameId: 1149361, name: 'Afghanistan' }],
  country: [{ regionSet: [{ geonameId: 1147745, name: 'Badakhshan' }] }],
  region: [{ citySet: [{ name: 'Fayzabad', geonameId: 1142170 }] }]
}

describe('Your Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/iam/account', { fixture: 'account-settings.json' }).as(
      'getAccount'
    )
    cy.intercept('POST', '/graphql/cities', (req) => {
      if (req.body.query.includes('{ allCountries { name, geonameId }')) {
        req.reply({
          statusCode: 200,
          body: { data: { allCountries: fixtures.allCountries } }
        })
      }

      if (req.body.query.includes('regionSet { name, geonameId }')) {
        req.reply({
          statusCode: 200,
          body: { data: { country: fixtures.country } }
        })
      }

      if (req.body.query.includes('citySet { name, geonameId }')) {
        req.reply({
          statusCode: 200,
          body: { data: { region: fixtures.region } }
        })
      }
    }).as('citiesApi')

    cy.openProduct('Account Settings')
  })

  it('should enforce MFA to all users', () => {
    // Arrange
    cy.intercept('PATCH', '/api/v4/iam/account', { statusCode: 200, body: {} }).as('patchAccount')

    // Act
    cy.get(selectors.accountSettings.enforceMfa).click()

    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')

    cy.wait('@patchAccount')
      .its('request.body')
      .should('have.property', 'is_enabled_mfa_to_all_users', true)
  })

  it('should enable social login', () => {
    // Arrange
    cy.intercept('PATCH', '/api/v4/iam/account', { statusCode: 200, body: {} }).as('patchAccount')

    // Act
    cy.get(selectors.accountSettings.socialLogin).click()

    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')

    cy.wait('@patchAccount')
      .its('request.body')
      .should('have.property', 'is_social_login_enabled', true)
  })
})
