export default {
  // List page
  createButton: '[data-testid="create_Firewall_button"]',
  table: '.p-datatable',
  emptyState: '[data-testid*="empty"]',
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
  functionInstanceName: '[data-testid="edge-firewall-functions-form__name-field__input"]',
  behaviorsDropdown:
    '[data-testid="edge-firewall-rules-form__behaviors[0]-dropdown__dropdown-trigger"]',
  functionInstancDropdownFilter:
    '[data-testid="edge-firewall-functions-form__edge-function-dropdown__dropdown-filter-input"]',
  functionInstanceDropdown:
    '[data-testid="edge-firewall-functions-form__edge-function-dropdown__dropdown-trigger"]',
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
  createFunctionButton: '[data-testid="edge-firewall-functions-form__create-function-button"]',
  edgeFunctionActionbar: '[data-testid="create-edge-functions-drawer__action-bar"]',
  ruleCriteriaVariableDropdownRequestUri: '#criteria\\[0\\]\\[0\\]\\.variable_11',
  ruleCriteriaVariableDropdownHeaderAccept: '#criteria\\[0\\]\\[0\\]\\.variable_1',
  ruleCriteriaOperatorDropdown: '[data-testid="edge-firewall-rules-form__operator[0]__dropdown"]',
  ruleCriteriaOperatorStartsWith: '#criteria\\[0\\]\\[0\\]\\.operator_2',
  ruleCriteriaOperatorMatches: '#criteria\\[0\\]\\[0\\]\\.operator_0',
  ruleCriteriaOperatorFirstOption: '#criteria\\[0\\]\\[0\\]\\.operator_0',
  ruleCriteriaValueFirstOption: '#criteria\\[0\\]\\[0\\]\\.argument_0',
  ruleCriteriaInput: '[data-testid="edge-firewall-rules-form__argument[0][0]__input"]',
  ruleCriteriaNetworkListDropdown:
    '[data-testid="edge-firewall-rules-form__network-list[0]__dropdown"]',
  ruleCriteriaNetworkListDropdownValue:
    '[data-testid="edge-firewall-rules-form__network-list[0]__dropdown__value"]',
  ruleCriteriaNetworkListFilter:
    '[data-testid="edge-firewall-rules-form__network-list[0]__dropdown-search"]',
  ruleBehaviorDropdown: '[data-testid="edge-firewall-rules-form__behaviors[0]-dropdown__dropdown"]',
  ruleBehaviorRunFunction: '#behaviors\\[0\\]\\.name_5',
  ruleBehaviorSetRateLimit: '#behaviors\\[0\\]\\.name_3',
  ruleBehaviorFirstOption: '#behaviors\\[0\\]\\.name_0',
  ruleBehaviorTagEventOption: '#behaviors\\[0\\]\\.name_1',
  scrollWafDropdown: '.p-dropdown-items-wrapper .p-virtualscroller',
  selectTheLastWaf: '.p-dropdown-items-wrapper .p-virtualscroller ul li',
  rulesWafDropdown:
    '[data-testid="edge-firewall-rule-form__behaviors[0]__waf__dropdown"] > .p-dropdown-label',
  rulesWafDropdownFilter:
    '[data-testid="edge-firewall-rule-form__behaviors[0]__waf__dropdown-filter-input"]',
  rulesWafFirstOption: '#behaviors\\[0\\]\\.id_0',
  rulesWafFirstModeOption: '#behaviors\\[0\\]\\.mode_0',
  behaviorsWafOption: '#behaviors\\[0\\]\\.name_4',
  rulesWafModeDropdown:
    '[data-testid="edge-firewall-rule-form__behaviors[0]__waf-mode__dropdown"] > .p-dropdown-label',
  ruleBehaviorFunctionToRunDropdown:
    '[data-testid="edge-firewall-rule-form__behaviors[0]-function__dropdown-trigger"]',
  ruleBehaviorFunctionToRun: '#behaviors\\[0\\]\\.functionId_0',
  ruleSubmit: '[data-testid="form-actions-submit-button"] > .p-button-label',
  rulesTableSearchInput: '[data-testid="data-table-search-input"]',
  rulesTableColumnName: '[data-testid="list-table-block__column__name__row"]',
  rulesTableColumnDescriptionShowMore:
    '[data-testid="table-column-expand-text-column__show-more__toggle"]',
  rulesTableColumnDescription: '[data-testid="table-column-expand-text-column__value"]',
  saveButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  nameRow: '[data-testid="list-table-block__column__name__row"]',
  activeRow: '[data-testid="list-table-block__column__status__row"] > .p-tag-value',
  behaviorRateLimitType: '#behaviors\\[0\\]\\.type > .p-dropdown-label',
  behaviorRateLimitTypeFirstOption: '#behaviors\\[0\\]\\.type_1',
  behaviorAverageRateLimitInput: '[data-testid="field-number__input"] > .p-inputtext',
  behaviorLimitBy: '#behaviors\\[0\\]\\.limit_by > .p-dropdown-label',
  behaviorLimitByFirstOption: '#behaviors\\[0\\]\\.limit_by_0',
  behaviorTagEventOption: '#behaviors\\[0\\]\\.tag_event',

  createRulesEngine: '[data-testid="rules-engine-create-button"] > .p-button-label',
  inputNumberFirstPosition:
    '#row-0 > :nth-child(1) > .gap-4 > [data-testid="data-table-input-position"] > .p-inputtext',
  reviewChanges: '[data-testid="rules-engine-save-order-button"] > .p-button-label',
  reviewChangesModal: '[data-testid="review-changes-dialog-warning-message-details"]',
  saveReorder: '[data-testid="review-changes-dialog-footer-delete-button"] > .p-button-label',

  // Form actions
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]'
  },

  // Actions menu
  actions: {
    singleActionButton: '[data-testid="data-table-actions-column-body-action-button"]',
    menuButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]'
  },

  // Delete dialog
  deleteDialog: {
    confirmInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  }
}
