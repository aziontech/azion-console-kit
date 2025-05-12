import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let customPageName = ''

describe('Custom Pages spec', { tags: ['@dev5'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', (req) => {
      req.reply((res) => {
        res.send({
          ...res.body,
          client_flags: ['allow_console', 'enable_ipv6', 'federated_auth', 'waf_mode']
        })
      })
    }).as('accountInfo')

    cy.login()
    customPageName = generateUniqueName('Custom Page')
    cy.openProduct('Custom Pages')
  })

  it('Create a Custom Page', function () {
    cy.get(selectors.customPages.createButton).click()
    cy.get(selectors.customPages.nameInput).type(customPageName)
    cy.get(selectors.customPages.isActiveSwitch).click()
    cy.get(selectors.customPages.ttlDefaultPage).type('1.000')

    // Assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Custom Page successfully created')
    cy.get(selectors.customPages.editPageTitle).should('have.text', 'Edit Custom Page')
    cy.get(selectors.customPages.nameInput).should('have.value', customPageName)
  })
})
