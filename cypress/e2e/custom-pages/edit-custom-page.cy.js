import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let customPageName = ''

describe('Custom Pages spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
    customPageName = generateUniqueName('Custom Page')
    cy.openProduct('Custom Pages')
  })

  it('should edit a custom page', () => {
    cy.get(selectors.customPages.createButton).click()
    cy.get(selectors.customPages.nameInput).type(customPageName)
    cy.get(selectors.customPages.isActiveSwitch).click()
    cy.get(selectors.customPages.ttlDefaultPage).type('2')

    // Assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Custom Page successfully created')

    cy.get(selectors.list.searchInput).type(`${customPageName}{enter}`)
    cy.get(selectors.customPages.list.columnName('name')).should('have.text', customPageName)
    cy.get(selectors.customPages.list.columnName('name')).click()
    cy.get(selectors.customPages.nameInput).type(`${customPageName}-edit`)
    cy.get(selectors.customPages.ttlDefaultPage).type('3')

    // Assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Custom Page has been updated!')
  })
})
