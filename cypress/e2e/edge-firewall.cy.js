import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let firewallName = ''
let functionInstanceName = ''
let ruleName = ''

describe('Edge Firewall spec', () => {
  beforeEach(() => {
    cy.login()
    firewallName = generateUniqueName('EdgeFirewall')
    functionInstanceName = generateUniqueName('EdgeFirewallFunctionInstance')
    ruleName = generateUniqueName('EdgeFirewallRule')
    cy.openProduct('Edge Firewall')
  })
  afterEach(() => {
    // Delete the firewall
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Edge Firewall successfully deleted')
    })
  })

  it('Create an Edge Firewall ', function () {
    // Act
    cy.get(selectors.edgeFirewall.createButton).click()
    cy.get(selectors.edgeFirewall.nameInput).clear()
    cy.get(selectors.edgeFirewall.nameInput).type(firewallName)
    cy.get(selectors.edgeFirewall.edgeFunctionSwitch).click();
    cy.get(selectors.edgeFirewall.wafEnabledSwitch).click();

    cy.get(selectors.edgeFirewall.saveButton).click()
    cy.verifyToast('success', 'Your Edge Firewall has been created')

    cy.get(selectors.edgeFirewall.functionsTab).click()

    // -- Generated with Cypress Studio
    // Clica no botão
    cy.get(selectors.edgeFirewall.createFunctionInstanceButton).click();

    // preenche form
    cy.get(selectors.edgeFirewall.functionInstanceName).clear();
    cy.get(selectors.edgeFirewall.functionInstanceName).type(functionInstanceName);
    cy.get(selectors.edgeFirewall.functionInstanceDropdown).click();
    cy.get(selectors.edgeFirewall.functionInstanceDropdownFilter).clear();
    cy.get(selectors.edgeFirewall.functionInstanceDropdownFilter).type('Edge Firewall Test Function - NAO DELETAR{enter}');
    cy.get(selectors.edgeFirewall.functionInstanceDropdownIcon).click();
    cy.get(selectors.edgeFirewall.functionInstanceDropdownFunction).click();
    cy.get(selectors.edgeFirewall.functionInstanceSubmit).click();

    cy.verifyToast('success', 'Your Function has been created')

    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).clear();
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).type(functionInstanceName);
    cy.get(selectors.edgeFirewall.functionInstanceTableColumnName).should('have.text', functionInstanceName);
    cy.get(selectors.edgeFirewall.functionInstanceTableColumnInstanced).should('have.text', 'Edge Firewall Test Function - NAO DELETAR');

    // Vai para a tab do rules engine
    cy.get('[data-testid="edge-firewall__rules-engine-tab"] > .p-tabview-title').click();
    // Clica no botao de create
    cy.get('.rounded-md > .gap-5 > .flex > .p-button > .p-button-label').click();
    // preenche nome
    cy.get('[data-testid="edge-firewall-rule-form__name__input"]').click();
    cy.get('[data-testid="edge-firewall-rule-form__name__input"]').type(ruleName);
    // preenche descrição
    cy.get('[data-testid="edge-firewall-rule-form__description__input"]').clear();
    cy.get('[data-testid="edge-firewall-rule-form__description__input"]').type('My Rule Description');
    // seleciona request uri
    cy.get('#criteria\\[0\\]\\[0\\]\\.variable > .p-dropdown-trigger').click();
    cy.get('#criteria\\[0\\]\\[0\\]\\.variable_11').click();
    // seleciona starts with
    cy.get(':nth-child(2) > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label').click();
    cy.get('#criteria\\[0\\]\\[0\\]\\.operator_2').click();
    // digita / como valor
    cy.get(':nth-child(3) > [data-testid="field-text__input"]').clear();
    cy.get(':nth-child(3) > [data-testid="field-text__input"]').type('/');
    // seleciona run function
    cy.get(':nth-child(1) > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label').click();
    cy.get('#behaviors\\[0\\]\\.name_4').click();
    // seleciona function instance criada
    cy.get('.gap-3 > :nth-child(2) > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label').click();
    cy.get('#behaviors\\[0\\]\\.functionId_0').click();
    // salva
    cy.get('[data-testid="form-actions-submit-button"] > .p-button-label').click();

    cy.verifyToast('success', 'Rule Engine successfully created')

    cy.get('[data-testid="Rules List"] > [data-testid="data-table"] > .p-datatable-header > [data-testid="data-table-header"] > [data-testid="data-table-search"] > [data-testid="data-table-search-input"]').clear();
    cy.get('[data-testid="Rules List"] > [data-testid="data-table"] > .p-datatable-header > [data-testid="data-table-header"] > [data-testid="data-table-search"] > [data-testid="data-table-search-input"]').type(ruleName);
    cy.get(':nth-child(2) > [data-testid="list-table-block__column__name__row"]').should('have.text', ruleName);
    cy.get('.underline').click();
    cy.get('.whitespace-pre').should('have.text', 'My Rule Description');

    // deletar rule criada
    cy.get(selectors.edgeFirewall.rulesEngineTab).click()
    cy.get(selectors.edgeFirewall.rulesTableSearchInput).clear()
    cy.get(selectors.edgeFirewall.rulesTableSearchInput).type(ruleName)
    cy.get(cy.get('[data-testid="Rules List"] > [data-testid="data-table"] > .p-datatable-wrapper > .p-datatable-table > .p-datatable-tbody > .p-selectable-row > .p-frozen-column')).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')

    // cy.deleteEntityFromLoadedList().then(() => {
    cy.verifyToast('Rules Engine successfully deleted')
    // })

    // // deletar function
    // cy.get(selectors.edgeFirewall.functionsTab).click()
    // cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).clear()
    // cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).type(functionInstanceName)
    // cy.deleteEntityFromLoadedList().then(() => {
    //   cy.verifyToast('Function successfully deleted')
    // })

    // // retorna para main settings
    // cy.get(selectors.edgeFirewall.mainSettingsTab).click()
    // cy.get(selectors.edgeFirewall.cancelButton).click()

    // // Assert firewall
    // cy.get(selectors.edgeFirewall.searchInput).clear()
    // cy.get(selectors.edgeFirewall.searchInput).type(firewallName)
    // cy.get(selectors.edgeFirewall.nameRow).should('have.text', firewallName)
    // cy.get(selectors.edgeFirewall.activeRow).should('have.text', 'Active')


    // // /* ==== Generated with Cypress Studio ==== */
    // // cy.get(':nth-child(2) > [data-testid="list-table-block__column__name__row"]').should('have.text', 'EdgeFirewallRule100724131927');
    // // cy.get('.underline').click();
    // // cy.get('.whitespace-pre').should('have.text', 'My Rule Description');
    // // /* ==== End Cypress Studio ==== */
    // /* ==== Generated with Cypress Studio ==== */
    // cy.get('[data-testid="Rules List"] > [data-testid="data-table"] > .p-datatable-header > [data-testid="data-table-header"] > [data-testid="data-table-search"] > [data-testid="data-table-search-input"]').clear('E');
    // cy.get('[data-testid="Rules List"] > [data-testid="data-table"] > .p-datatable-header > [data-testid="data-table-header"] > [data-testid="data-table-search"] > [data-testid="data-table-search-input"]').type('EdgeFirewallRule{enter}');
    // // cy.get(':nth-child(2) > [data-testid="list-table-block__column__name__row"]').should('have.text', 'EdgeFirewallRule100724134218');
    // cy.get('.underline').click();
    // cy.get('.whitespace-pre').should('have.text', 'My Rule Description');
    // // cy.get('[data-testid="Rules List"] > [data-testid="data-table"] > .p-datatable-wrapper > .p-datatable-table > .p-datatable-tbody > .p-selectable-row > .p-frozen-column > [data-testid="data-table-actions-column-body-action"] > [data-testid="data-table-actions-column-body-action-button"]').click();
    // // cy.get('[data-testid="delete-dialog-confirmation-input-field"]').clear();
    // // cy.get('[data-testid="delete-dialog-confirmation-input-field"]').type('delete{enter}');
    // // cy.get(':nth-child(5) > .p-toast-message-content > [data-testid="toast-block__content__Rules Engine successfully deleted"] > .flex > [data-testid="toast-block__content__Rules Engine successfully deleted__title"]').should('have.text', 'Rules Engine successfully deleted');
    // // cy.get('#pv_id_72_2_content > .mt-4 > .rounded-md').click();
    // /* ==== End Cypress Studio ==== */
    // /* ==== Generated with Cypress Studio ==== */
    // // cy.get('[data-testid="edge-firewall__functions-tab"] > .p-tabview-title').click();
    // // cy.get('[data-testid="list-table-block__column__name__row"]').should('have.text', 'EdgeFirewallFunctionInstance100724134615');
    // // cy.get('[data-testid="list-table-block__column__functionInstanced__row"]').should('have.text', 'Edge Firewall Test Function - NAO DELETAR');
    // /* ==== End Cypress Studio ==== */
    // /* ==== Generated with Cypress Studio ==== */
    // cy.get(':nth-child(2) > [data-testid="list-table-block__column__name__row"]').should('have.text', 'EdgeFirewallRule100724134811');
    // cy.get('.underline').click();
    // cy.get('.whitespace-pre').should('have.text', 'My Rule Descrip...');
    // cy.get('[data-testid="edge-firewall__functions-tab"] > .p-tabview-title').click();
    // cy.get('[data-testid="data-table-search-input"]').click();
    // cy.get('[data-testid="data-table-search-input"]').clear();
    // cy.get('[data-testid="data-table-search-input"]').type('EdgeFirewallFunctionInstance100724134811{enter}');
    // cy.get('[data-testid="list-table-block__column__name__row"]').should('have.text', 'EdgeFirewallFunctionInstance100724134811');
    // cy.get('[data-testid="list-table-block__column__functionInstanced__row"]').should('have.text', 'Edge Firewall Test Function - NAO DELETAR');
    // /* ==== End Cypress Studio ==== */
  })
})
