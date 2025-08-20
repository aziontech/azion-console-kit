import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let domainName
let edgeAppName
let firewallName

const cnames = 'trabalho_local.lucas.com.br\n-trabalho-local.lucas.com.br'

const createEdgeApplicationCase = () => {
  edgeAppName = generateUniqueName('EdgeApp')
  firewallName = generateUniqueName('EdgeFirewall')
  // Arrange
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type(`${edgeAppName}.edge.app`)

  // Act
  cy.get(selectors.domains.edgeApplicationDrawer).find(selectors.form.actionsSubmitButton).click()

  // Assert
  cy.verifyToast('success', 'Your edge application has been created')
}

const createEdgeFirewallCase = () => {
  cy.get(selectors.edgeFirewall.nameInput).clear()
  cy.get(selectors.edgeFirewall.nameInput).type(firewallName)

  cy.get(selectors.domains.edgeFirewallActionBar).find(selectors.form.actionsSubmitButton).click()

  cy.verifyToast('success', 'Your Edge Firewall has been created')
}

describe('Domains spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/domain_flags.json'
    }).as('accountInfo')
    cy.login()

  })

  it('should create and delete a domain using a edge application', () => {
    domainName = generateUniqueName('domain')

    // Arrange
    cy.openProduct('Domains')

    cy.intercept(
      'GET',
      '/api/v4/workspace/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')

    cy.intercept(
      'GET',
      `/api/v4/workspace/firewalls?ordering=name&page=1&page_size=100&fields=&search=`
    ).as('getEdgeFirewallList')

    cy.intercept(
      'GET',
      '/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=*&search=azion&type=*'
    ).as('searchDigitalCertificatesApi')

    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.createEdgeApplicationButton).click()
    createEdgeApplicationCase()

    cy.get(selectors.domains.edgeFirewallField).click()
    cy.get(selectors.domains.createEdgeFirewallButton).click()
    createEdgeFirewallCase()

    cy.get(selectors.domains.cnameAccessOnlyField).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField).should('be.visible')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Domain management section.'
    )
  })

  it('should error when cname is invalid on domain creation', () => {
    domainName = generateUniqueName('domain')

    // Arrange
    cy.openProduct('Domains')

    cy.intercept(
      'GET',
      '/api/v4/workspace/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')

    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.createEdgeApplicationButton).click()
    createEdgeApplicationCase()

    cy.get(selectors.domains.cnamesField).type(cnames)
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast(
      'error',
      'cname_invalid_format: trabalho_local.lucas.com.br, -trabalho-local.lucas.com.br'
    )
  })
})
