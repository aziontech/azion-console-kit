import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'
import { httpResponseCreate, httpResponseGet } from '../../fixtures/custom-pages.js'

let customPageName = ''

describe.skip('Custom Pages spec', { tags: ['@dev6'] }, () => {
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

  it('should edit a custom page', () => {
    cy.intercept(
      { method: 'POST', url: '/v4/workspace/custom_pages' },
      { body: httpResponseCreate, statusCode: 202 }
    ).as('createCustomPages')

    cy.intercept(
      { method: 'GET', url: '/v4/workspace/custom_pages/*' },
      { body: httpResponseGet, statusCode: 200 }
    ).as('getCustomPages')

    cy.intercept(
      { method: 'PATCH', url: '/v4/workspace/custom_pages/*' },
      { body: httpResponseCreate, statusCode: 202 }
    ).as('updateCustomPages')

    cy.get(selectors.customPages.createButton).click()
    cy.get(selectors.customPages.nameInput).type(customPageName)

    cy.get(selectors.customPages.clickItemTable(1)).click()
    cy.get(selectors.customPages.drawer.customStatusCode).clear()
    cy.get(selectors.customPages.drawer.customStatusCode).type('222')
    cy.get(selectors.customPages.drawer.buttonSave).click()

    cy.get(selectors.customPages.drawer.sidebar).should('not.exist')
    cy.get(selectors.form.actionsSubmitButton).click()

    cy.wait('@createCustomPages').its('response.statusCode').should('eq', 202)
    cy.verifyToast('success', 'Custom Page successfully created')

    cy.wait('@getCustomPages').its('response.statusCode').should('eq', 200)

    cy.get(selectors.customPages.nameInput).clear()
    cy.get(selectors.customPages.nameInput).type(`${customPageName}-edit`)

    cy.get(selectors.customPages.clickItemTable(1)).click()
    cy.get(selectors.customPages.drawer.customStatusCode).clear()
    cy.get(selectors.customPages.drawer.customStatusCode).type('333')
    cy.get(selectors.customPages.drawer.buttonSave).click()

    cy.get(selectors.customPages.drawer.sidebar).should('not.exist')
    cy.get(selectors.form.actionsSubmitButton).click()

    cy.wait('@updateCustomPages').its('response.statusCode').should('eq', 202)
    cy.verifyToast('success', 'Your Custom Page has been updated!')
  })
})
