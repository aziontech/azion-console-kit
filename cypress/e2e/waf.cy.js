import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let wafName

describe('WAF spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('WAF Rules')

    cy.intercept('/api/v3/waf/rulesets/*').as('saveRuleset')

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

    cy.wait('@saveRuleset')
    cy.get(selectors.wafs.breadcumbToList).click()

    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(wafName)

    // Assert
    cy.get(selectors.wafs.listRow('name')).should('have.text', wafName)
    cy.get(selectors.wafs.listRow('threatTypes')).should(
      'have.text',
      'File uploadEvading TricksShow more (6)'
    )
  })

  it('should edit a waf with some threat types enabled', () => {
    // Creation flow
    // Arrange
    cy.get(selectors.wafs.createButton).click()

    // Act
    cy.get(selectors.wafs.nameInput).type(wafName)

    //disable
    cy.get(selectors.wafs.threatTypeSwitch('sqlInjection')).click()
    cy.get(selectors.wafs.threatTypeSwitch('directoryTraversal')).click()
    cy.get(selectors.wafs.threatTypeSwitch('fileUpload')).click()
    cy.get(selectors.wafs.threatTypeSwitch('unwantedAccess')).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    cy.verifyToast('success', 'Your waf rule has been created')

    cy.wait('@saveRuleset')
    cy.get(selectors.wafs.breadcumbToList).click()

    // Assert
    cy.get(selectors.list.searchInput).type(wafName)

    cy.get(selectors.wafs.listRow('name')).should('have.text', wafName)
    cy.get(selectors.wafs.seeMore('threatTypes')).click()
    cy.get(selectors.wafs.listRow('threatTypes')).should(
      'have.text',
      'Evading TricksIdentified AttackCross-Site Scripting (XSS)Remote File Inclusions (RFI)Show less'
    )
    cy.get(selectors.wafs.listRow('active')).should('have.text', 'Active')

    // Edit flow
    // Arrange
    cy.get(selectors.wafs.listRow('name')).click()

    // Act
    //enable
    cy.get(selectors.wafs.threatTypeSwitch('sqlInjection')).click()
    cy.get(selectors.wafs.threatTypeSwitch('directoryTraversal')).click()
    cy.get(selectors.wafs.threatTypeSwitch('fileUpload')).click()
    cy.get(selectors.wafs.threatTypeSwitch('unwantedAccess')).click()
    //disable
    cy.get(selectors.wafs.threatTypeSwitch('remoteFileInclusion')).click()
    cy.get(selectors.wafs.threatTypeSwitch('crossSiteScripting')).click()
    cy.get(selectors.wafs.threatTypeSwitch('evadingTricks')).click()
    cy.get(selectors.wafs.threatTypeSwitch('identifiedAttack')).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    cy.verifyToast('success', 'Your waf rule has been updated')

    cy.wait('@saveRuleset')
    cy.get(selectors.wafs.breadcumbToList).click()

    // Assert
    cy.get(selectors.list.searchInput).type(wafName)

    cy.get(selectors.wafs.listRow('name')).should('have.text', wafName)
    cy.get(selectors.wafs.seeMore('threatTypes')).click()
    cy.get(selectors.wafs.listRow('threatTypes')).should(
      'have.text',
      'File uploadUnwanted AccessDirectory TraversalSQL InjectionShow less'
    )
    cy.get(selectors.wafs.listRow('active')).should('have.text', 'Active')
  })

  afterEach(() => {
    // Delete the waf
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('WAF rule successfully deleted')
    })
  })
})
