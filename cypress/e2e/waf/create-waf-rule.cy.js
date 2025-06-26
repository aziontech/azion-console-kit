import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let wafName

describe('WAF spec', { tags: ['@dev7', '@dont_run_prod'] }, () => {
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

    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(`${wafName}{enter}`)

    // Assert
    cy.get(selectors.wafs.listRow('name')).should('have.text', wafName)

    cy.get(selectors.wafs.listRow('threatsConfiguration')).should(
      'have.text',
      'File uploadEvading TricksShow more (6)'
    )
  })
})
