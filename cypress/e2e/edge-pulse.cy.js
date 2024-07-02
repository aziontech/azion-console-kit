const selectors = {
  buttons: {
    defaultTagCopyButton: '[data-testid="edge-pulse__default-tag-copy-button"]',
    preLoadingTab: '[data-testid="edge-pulse__pre-loading-tab"]',
    preLoadingTagCopyButton: '[data-testid="edge-pulse__pre-loading-tag-copy-button"]'
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
    cy.get(selectors.buttons.defaultTagCopyButton).realClick()
    cy.verifyToast('Successfully copied!')

    // Default tag copy assertion
    const expectedDefaultTagValue = fixtures.defaultTag.replace(/\s+/g, ' ').trim()
    cy.assertValueCopiedToClipboard(expectedDefaultTagValue)

    // Act Pre-loading tag
    cy.get(selectors.buttons.preLoadingTab).click()
    cy.get(selectors.buttons.preLoadingTagCopyButton).realClick()
    cy.verifyToast('Successfully copied!')

    // Pre-loading tag copy assertion
    const expectedPreLoadingTagValue = fixtures.preLoadingTag.replace(/\s+/g, ' ').trim()
    cy.assertValueCopiedToClipboard(expectedPreLoadingTagValue)
  })
})
