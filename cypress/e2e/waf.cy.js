import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

const wafName = generateUniqueName('WAF')

describe('WAF spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('WAF Rules')
  })

  it('Create a WAF ', function () {
    // Act
    cy.get(selectors.wafs.createButton).click()
    cy.get(selectors.wafs.nameInput).clear('')
    cy.get(selectors.wafs.nameInput).type(wafName)

    cy.get(selectors.wafs.saveButton).click()
    cy.verifyToast('success', 'Your waf rule has been created')
    cy.get(selectors.wafs.cancelButton).click()
    cy.get(selectors.wafs.cancelButton).click()
    cy.get(selectors.wafs.cancelButton).click()

    // Assert
    cy.get(selectors.wafs.searchInput).clear()
    cy.get(selectors.wafs.searchInput).type(`${wafName}{enter}`)
    cy.get(selectors.wafs.nameRow).should('have.text', wafName)
    cy.get(selectors.wafs.threatTypesRow).should('have.text', 'File upload')
  })

  afterEach(() => {
    // Delete the waf
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('WAF rule successfully deleted')
    })
  })
})
