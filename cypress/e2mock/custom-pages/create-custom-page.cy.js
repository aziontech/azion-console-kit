import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'
import { httpResponseCreate } from '../../fixtures/custom-pages.js'

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

    cy.wait('@accountInfo')

    customPageName = generateUniqueName('Custom Page')
    cy.openProduct('Custom Pages')
  })

  it('Create a Custom Page', function () {
    cy.intercept(
      { method: 'POST', url: '/v4/workspace/custom_pages' },
      { body: httpResponseCreate, statusCode: 202 }
    ).as('createCustomPages')

    cy.get(selectors.customPages.createButton).click()
    cy.get(selectors.customPages.nameInput).type(customPageName)

    cy.get(selectors.customPages.clickItemTable(1)).click()
    cy.get(selectors.customPages.drawer.customStatusCode).type('123')
    // cy.get(selectors.customPages.drawer.buttonSave).click()

    // // // Assert
    // // cy.get(selectors.form.actionsSubmitButton).click()

    // cy.wait('@createCustomPages').its('response.statusCode').should('eq', 202)
    // cy.verifyToast('success', 'Custom Page successfully created')
  })
})
