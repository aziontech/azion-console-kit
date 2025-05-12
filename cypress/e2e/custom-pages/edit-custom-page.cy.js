import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let customPageName = ''

describe('Custom Pages spec', { tags: ['@dev6'] }, () => {
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

  it('should edit a custom page', () => {
    cy.intercept('GET', '/api/v4/workspace/custom_pages/*').as('getCustomPageData')

    cy.get(selectors.customPages.createButton).click()
    cy.get(selectors.customPages.nameInput).type(customPageName)
    cy.get(selectors.customPages.isActiveSwitch).click()
    cy.get(selectors.customPages.ttlDefaultPage).type('222')

    // Assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Custom Page successfully created')
    cy.get(selectors.customPages.nameInput).type(`${customPageName}-edit`)

    cy.wait('@getCustomPageData')
    cy.get(selectors.customPages.ttlDefaultPage).should('be.visible').type('333')

    // // Assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Custom Page has been updated!')
    cy.get(selectors.list.searchInput).type(`${customPageName}{enter}`)
    cy.get(selectors.customPages.list.columnName('name')).should('have.text', customPageName)
  })
})
