export default {
  createButton: '[data-testid="create_Edge Firewall_button"] > .p-button-label',
  nameInput: '[data-testid="edge-firewall-form__name-field__input"]',
  edgeFunctionSwitch:
    '[data-testid="field-group-switch__switch-edgeFunctionsEnabled__switch"] > .p-inputswitch-slider',
  wafEnabledSwitch:
    '[data-testid="field-group-switch__switch-wafEnabled__switch"] > .p-inputswitch-slider',
  networkProtectionSwitch:
    '[data-testid="field-group-switch__switch-networkProtectionEnabled__switch"] > .p-inputswitch-slider',
  mainSettingsTab: '[data-testid="edge-firewall__main-settings-tab"] > .p-tabview-title',
  functionsTab: '[data-testid="edge-firewall__functions-tab"] > .p-tabview-title',
  rulesEngineTab: '[data-testid="edge-firewall__rules-engine-tab"] > .p-tabview-title',
  createFunctionInstanceButton: '[data-testid="create_Function Instance_button"] > .p-button-label',
  functionInstanceName: '[data-testid="field-text__input"]',
  behaviorsDropdown: '[data-testid="field-dropdown__dropdown"] > .p-dropdown-label',
  dropdownValueFilter: '.p-dropdown-filter',
  functionInstanceDropdownIcon:
    '[data-testid="field-dropdown__dropdown"] > .p-dropdown-trigger > .p-icon',
  functionInstanceDropdownFunction: '#edgeFunctionID_0',
  functionInstanceSubmit: '[data-testid="form-actions-submit-button"] > .p-button-label',
  functionInstanceTableSearchInput: '[data-testid="data-table-search-input"]',
  functionInstanceTableColumnName: '[data-testid="list-table-block__column__name__row"]',
  functionInstanceTableColumnInstanced:
    '[data-testid="list-table-block__column__functionInstanced__row"]',
  createRuleButton: '[data-testid="create_Rules Engine_button"] > .p-button-label',
  ruleNameInput: '[data-testid="edge-firewall-rule-form__name__input"]',
  ruleDescriptionInput: '[data-testid="edge-firewall-rule-form__description__input"]',
  ruleCriteriaVariableDropdown:
    '[data-testid="edge-firewall-rules-form__variable[0]"] > .p-dropdown-label',
  ruleCriteriaVariableDropdownNetworkLists: '#criteria\\[0\\]\\[0\\]\\.variable_8',
  ruleCriteriaVariableDropdownRequestUri: '#criteria\\[0\\]\\[0\\]\\.variable_11',
  ruleCriteriaOperatorDropdown:
    '[data-testid="edge-firewall-rules-form__operator[0]__dropdown"] > .p-dropdown-label',
  ruleCriteriaOperatorStartsWith: '#criteria\\[0\\]\\[0\\]\\.operator_2',
  ruleCriteriaOperatorFirstOption: '#criteria\\[0\\]\\[0\\]\\.operator_0',
  ruleCriteriaValueFirstOption: '#criteria\\[0\\]\\[0\\]\\.argument_0',
  ruleCriteriaInput: ':nth-child(3) > [data-testid="field-text__input"]',
  ruleCriteriaNetworkListDropdown:
    '[data-testid="edge-firewall-rules-form__network-list[0]__dropdown"] > .p-dropdown-label',
  ruleBehaviorDropdown:
    ':nth-child(1) > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label',
  ruleBehaviorRunFunction: '#behaviors\\[0\\]\\.name_4',
  ruleBehaviorFirstOption: '#behaviors\\[0\\]\\.name_0',
  rulesWafDropdown:
    '[data-testid="edge-firewall-rule-form__behaviors[0]__waf__dropdown"] > .p-dropdown-label',
  rulesWafFirstOption: '#behaviors\\[0\\]\\.waf_id_0',
  rulesWafFirstModeOption: '#behaviors\\[0\\]\\.mode_0',
  behaviorsWafOption: '#behaviors\\[0\\]\\.name_3',
  rulesWafModeDropdown: '[data-testid="edge-firewall-rule-form__behaviors[0]__waf-mode__dropdown"] > .p-dropdown-label',
  ruleBehaviorFunctionToRunDropdown:
    '.gap-3 > :nth-child(2) > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label',
  ruleBehaviorFunctionToRun: '#behaviors\\[0\\]\\.functionId_0',
  ruleSubmit: '[data-testid="form-actions-submit-button"] > .p-button-label',
  rulesTableSearchInput: '[data-testid="data-table-search-input"]',
  rulesTableColumnName: '[data-testid="list-table-block__column__name__row"]',
  rulesTableColumnDescriptionShowMore: '.underline',
  rulesTableColumnDescription: '.whitespace-pre',
  saveButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  nameRow: '[data-testid="list-table-block__column__name__row"]',
  activeRow: '[data-testid="list-table-block__column__status__row"] > .p-tag-value',
  actionButton:
    '[data-testid="data-table-actions-column-body-actions-menu-button"] > .p-button-icon',
  deleteButton: '.p-menuitem-content > .p-menuitem-link > .p-menuitem-text',
  deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
  confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"] > .p-button-label'
}
