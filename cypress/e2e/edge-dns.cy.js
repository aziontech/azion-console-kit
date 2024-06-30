import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let zoneName = ''

describe('Edge DNS spec', () => {
  beforeEach(() => {
    cy.login()
    zoneName = generateUniqueName('DNSZone')
    cy.openProductThroughSidebar('edge-dns')
  })

  it('Create a Edge DNS ZOne', function() {
    cy.get(selectors.edgeDns.createButton).click();
    cy.get(selectors.edgeDns.nameInput).clear();
    cy.get(selectors.edgeDns.nameInput).type(zoneName);
    cy.get(selectors.edgeDns.domainInput).clear();
    cy.get(selectors.edgeDns.domainInput).type(`${zoneName}.com.az`);
    cy.get(selectors.edgeDns.saveButton).click();
    cy.verifyToast('success','Your Edge DNS has been created');
    cy.get(selectors.edgeDns.cancelButton).click();
    cy.get(selectors.edgeDns.searchInput).clear();
    cy.get(selectors.edgeDns.searchInput).type('Zone12345678');
    cy.get(selectors.edgeDns.nameRow).should('have.text', 'Zone12345678');
    cy.get(selectors.edgeDns.domainRow).should('contain', 'zone12345678');
    cy.get(selectors.edgeDns.statusRow).should('have.text', 'Active');
  })
  afterEach(() => {
    cy.deleteProduct(zoneName, '/edge-dns')
  })
})
