import selectors from '../../support/selectors'

describe('Edge Pulse spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Pulse')
  })

  it('should copy default and pre-loading tag in edge pulse', function () {
    // Act Default tag
    cy.get(selectors.edgePulse.defaultTagCopyButton).realClick()
    cy.verifyToast('Successfully copied!')

    // Act Pre-loading tag
    cy.get(selectors.edgePulse.preLoadingTab).click()
    cy.get(selectors.edgePulse.preLoadingTagCopyButton).realClick()
    cy.verifyToast('Successfully copied!')
  })
})
