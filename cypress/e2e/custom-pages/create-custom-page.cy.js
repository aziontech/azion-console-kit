import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let customPageName = ''

describe('Custom Pages spec', { tags: ['@dev5'] }, () => {
  beforeEach(() => {
    cy.login()
    customPageName = generateUniqueName('Custom Page')
    cy.openProduct('Custom Pages')
  })

  it('Create a Custom Page', function () {
    cy.get(selectors.customPages.createButton).click();
    cy.get(selectors.customPages.nameInput).type(customPageName);
    cy.get(selectors.customPages.isActiveSwitch).click();

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Custom Page successfully created')

    cy.get(selectors.list.searchInput).type(`${customPageName}{enter}`)
    cy.get(selectors.customPages.list.columnName('name')).should('have.text', customPageName)
  })
})
