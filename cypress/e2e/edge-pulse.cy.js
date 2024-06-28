const selectors = {
  buttons: {
    defaultTagCopyButton: '[data-testid="edge-pulse__default-tag-copy-button"] > .p-button-label',
    preLoadingTab: '[data-testid="edge-pulse__pre-loading-tab"]',
    preLoadingTagCopyButton:
      '[data-testid="edge-pulse__pre-loading-tag-copy-button"] > .p-button-label'
  },
  toast: {
    defaultTagCopySuccessMessage:
      ':nth-child(2) > .p-toast-message-content > .flex-column > .flex > .text-color',
    defaultTagCopyCloseButton:
      ':nth-child(2) > .p-toast-message-content > [data-pc-section="buttoncontainer"] > .p-toast-icon-close > .p-icon',
    preLoadingTagCopySuccessMessage:
      ':nth-child(3) > .p-toast-message-content > .flex-column > .flex > .text-color',
    preLoadingTagCopyCloseButton:
      ':nth-child(3) > .p-toast-message-content > [data-pc-section="buttoncontainer"] > .p-toast-icon-close'
  }
}

const fixtures = {
  preLoadingTag: `<script async src="//client.azionrum.net/8900e/azion-pulse.js"><${'/'}script>`,
  defaultTag: `<script>
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('load', function() {
      if (window.azpulse === undefined) {
        var pulse = document.createElement('script');
        pulse.src = '//client.azionrum.net/8900e/azion-pulse.js';
        document.body.appendChild(pulse);
      }
    })
  }
<${'/'}script>`
}

describe('Edge Pulse spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProductThroughSidebar('edge-pulse')
  })

  it('should copy default and pre-loading tag in edge pulse', function () {
    // Act Default tag
    cy.get(selectors.buttons.defaultTagCopyButton).click()
    cy.get(selectors.toast.defaultTagCopySuccessMessage).should('have.text', 'Copied successfully!')
    // Default tag copy assertion
    const expectedDefaultTagValue = fixtures.defaultTag.replace(/\s+/g, ' ').trim()
    cy.assertValueCopiedToClipboard(expectedDefaultTagValue)
    cy.get(selectors.toast.defaultTagCopyCloseButton).click()

    // Act Pre-loading tag
    cy.get(selectors.buttons.preLoadingTab).click()
    cy.get(selectors.buttons.preLoadingTagCopyButton).click()
    cy.get(selectors.toast.preLoadingTagCopySuccessMessage).should(
      'have.text',
      'Copied successfully!'
    )
    // Pre-loading tag copy assertion
    const expectedPreLoadingTagValue = fixtures.preLoadingTag.replace(/\s+/g, ' ').trim()
    cy.assertValueCopiedToClipboard(expectedPreLoadingTagValue)
    cy.get(selectors.toast.preLoadingTagCopyCloseButton).click()
  })
})
