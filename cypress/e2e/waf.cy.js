import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let wafName
const breadcrumbToListIndex = 2

describe('WAF spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('WAF Rules')

    wafName = generateUniqueName('WAF')
  })

  it('should create a WAF ', function () {
    // Arrange
    cy.get(selectors.wafs.createButton).click()

    cy.get(selectors.wafs.nameInput).clear()

    // Act
    cy.get(selectors.wafs.nameInput).type(wafName)

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your waf rule has been created')

    cy.get(selectors.wafs.breadcumb(breadcrumbToListIndex)).click()

    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(wafName)

    // Assert
    cy.get(selectors.wafs.listRow('name')).should('have.text', wafName)
    cy.get(selectors.wafs.listRow('threatTypes')).should('have.text', 'File upload')
  })

  afterEach(() => {
    // Delete the waf
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('WAF rule successfully deleted')
    })
  })
})
