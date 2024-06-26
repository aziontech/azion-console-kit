const selectors = {
  menu: {
    credentials: 'li[aria-label="Credentials"] > .p-menuitem-content > .p-menuitem-link'
  }
}

describe('Credentials', () => {
  beforeEach(() => {
    cy.login()
    cy.get(selectors.menu.credentials).click()
  })

  it('should create a new credential from an empty page', () => {})
})
