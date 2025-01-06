import selectors from '../../support/selectors'

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

describe('Edge Pulse spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Pulse')
  })

  it('should copy default and pre-loading tag in edge pulse', function () {
    // Act Default tag
    cy.get(selectors.edgePulse.defaultTagCopyButton).realClick()
    cy.verifyToast('Successfully copied!')

    // Default tag copy assertion
    const expectedDefaultTagValue = fixtures.defaultTag.replace(/\s+/g, ' ').trim()
    cy.assertValueCopiedToClipboard(expectedDefaultTagValue)

    // Act Pre-loading tag
    cy.get(selectors.edgePulse.preLoadingTab).click()
    cy.get(selectors.edgePulse.preLoadingTagCopyButton).realClick()
    cy.verifyToast('Successfully copied!')

    // Pre-loading tag copy assertion
    const expectedPreLoadingTagValue = fixtures.preLoadingTag.replace(/\s+/g, ' ').trim()
    cy.assertValueCopiedToClipboard(expectedPreLoadingTagValue)
  })
})
