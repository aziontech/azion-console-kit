describe('Digital Certificates spec', () => {
  it('Create a new digital certificate', function () {
    // Arrange
    cy.login()
    cy.getByTestId('sidebar-block__toggle-button').click()
    cy.getByTestId('sidebar-block__menu-item__digital-certificates').click()
    cy.getByTestId('create_Digital Certificate_button').click()

    // Act
    cy.getByTestId('digital_certificate__name_field').clear()
    cy.getByTestId('digital_certificate__name_field').type('EntityName')
    cy.getByTestId('Save_button').click()

    // Assert
    cy.get(':nth-child(2) > .p-toast-message-content > .flex-column > .text-sm').should(
      'have.text',
      'Your digital certificate has been created!'
    )
    cy.getByTestId('page_title_Edit Digital Certificate').should('have.text', 'Edit Digital Certificate')
    cy.get(':nth-child(3) > .p-menuitem-link').click()
    cy.getByTestId('search_input').clear()
    cy.getByTestId('search_input').type('EntityName')
    cy.getByTestId('list-table-block__column__name__row').should('have.text', 'EntityName')
    cy.get('[data-testid="list-table-block__column__status__row"] > .p-tag-value').should(
      'have.text',
      'Pending'
    )

    // Cleanup
    cy.getByTestId('search_input').clear()
    cy.get('.p-inputwrapper-filled.p-paginator-rpp-options > .p-dropdown-trigger').click()
    cy.get('.p-dropdown-item [aria-posinset="4"]').click()
    cy.get(':nth-child(18) > .p-frozen-column > .flex > .p-button').click()
    cy.get('.p-menuitem-content > .p-menuitem-link').click()
    cy.get('#confirm-input').clear()
    cy.get('#confirm-input').type('delete{enter}')
    cy.get(':nth-child(3) > .p-toast-message-content > .flex-column > .flex > .text-color').should(
      'have.text',
      'Digital certificate successfully deleted!'
    )
  })
})
