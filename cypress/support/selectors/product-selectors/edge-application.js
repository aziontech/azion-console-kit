export default {
  tabs: (tabName) => `[data-testid="edge-application-details-tab-panel__${tabName}__tab"] a`,
  mainSettings: {
    createButton: '[data-testid="create_Edge Application_button"]',
    nameInput: '[data-testid="form-horizontal-general-name__input"]',
    addressInput: '[data-testid="form-horizontal-default-origin-address-field-text__input"]',
    modulesSwitch: (moduleName) =>
      `[data-testid="form-horizontal-modules-default-switch__switch-${moduleName}__switch"] > .p-inputswitch-slider`
  },
  rulesEngine: {
    createButton: '[data-testid="rules-engine-create-button"]',
    ruleNameInput: '[data-testid="rule-form-general-name__input"]',
    createCachePolicyButton:
      '[data-testid="edge-applications-rules-engine-form__create-cache-policy-button"]',
    createOriginButton: '[data-testid="edge-applications-rules-engine-form__create-origin-button"]',
    optionRunFunction: '#behaviors[0].name_16',
    loadingIcon:
      '[data-testid="edge-application-rule-form__function-instance-item[0]__loading-icon"]',
    createFunctionInstanceButton:
      '[data-testid="edge-applications-rules-engine-form__create-function-instance-button"]',
    setCachePolicySelect: (behaviorIndex) =>
      `[data-testid="edge-application-rule-form__cache-settings-item[${behaviorIndex}]__dropdown"]`,
    setOriginSelect: (behaviorIndex) =>
      `[data-testid="edge-application-rule-form__origin-item[${behaviorIndex}]__dropdown"]`,
    setFunctionInstanceSelect: (behaviorIndex) =>
      `[data-testid="edge-application-rule-form__function-instance-item[${behaviorIndex}]__dropdown"]`,
    criteriaVariableSelect: (criteriaIdx, position) =>
      `[data-testid="edge-application-rule-form__criteria-variable[${criteriaIdx}][${position}]__autocomplete"] > .p-autocomplete-input`,
    criteriaOperatorDropdown: (criteriaIdx, position) =>
      `[data-testid="edge-application-rule-form__criteria-operator[${criteriaIdx}][${position}]__dropdown"] > .p-dropdown-trigger`,
    criteriaOperatorOption: (option) => `li[aria-label="${option}"]`,
    criteriaInputValue: (criteriaIdx, position) =>
      `[data-testid="edge-application-rule-form__criteria-input-value[${criteriaIdx}][${position}]__input"]`,
    behaviorsDropdown: (behaviorIdx) =>
      `[data-testid="edge-application-rule-form__behaviors-item[${behaviorIdx}]__dropdown"] > .p-dropdown-trigger`,
    behaviorsOption: (option) => `li[aria-label="${option}"]`,
    cachePolicyOptions: '#behaviors[0].cacheId_list',
    cachePolicyOption: (option) => `li[aria-label="${option}"]`,
    originOption: (option) => `li[aria-label="${option}"]`,
    functionInstanceOption: (option) => `li[aria-label="${option}"]`,
    cachePolicyActionBar: '[data-testid="create-cache-settings-drawer__action-bar"]',
    originActionBar: '[data-testid="create-origin-drawer__action-bar"]',
    functionInstanceActionBar: '[data-testid="create-function-instance-drawer__action-bar"]',
    criteriaConditionalButton: (type) =>
      `[data-testid="rule-form-criteria-item-conditional-add-button"] button[aria-label="${type}"]`,
    criteriaAddButton: '[data-testid="rule-form-criteria-add-button"]',
    behaviorsAddButton: '[data-testid="rule-form-behaviors-add-button"]',
    behaviorFunctionInstanceFilterInput:
      '[data-testid="edge-application-rule-form__function-instance-item[0]__dropdown-filter-input"]',
    behaviorFunctionValue:
      '[data-testid="edge-application-rule-form__function-instance-item[0]__dropdown"] > .p-dropdown-label',
    firstBehaviorValueOption: '#behaviors\\[0\\]\\.target_0',
    dropdownLoadingIcon:
      '[data-testid="edge-application-rule-form__function-instance-item[0]__loading-icon"]',
    phaseRadioGroup: '[data-testid="edge-application-rule-form__phase__radio-group"]'
  },
  origins: {
    createButton: '[data-testid="origins__add-button"]',
    addressInput: '[data-testid="origin-form__address__input"]',
    originType: '[data-testid="origin-form__origin-type__dropdown"]',
    nameInput: '[data-testid="form-horizontal-general-name__input"]'
  },
  errorResponses: {
    createButton: '[data-testid="error-responses-form__add-button"]',
    origin: '[data-testid="error-responses-form__origin__dropdown"]',
    statusCodes: (optionIdx) =>
      `[data-testid="error-responses-form__error-response__${optionIdx}__status-code__dropdown"]`,
    customStatus: (optionIdx) =>
      `[data-testid="error-responses-form__error-response__${optionIdx}__custom-status__input"]`,
    paths: (optionIdx) =>
      `[data-testid="error-responses-form__error-response__${optionIdx}__path__input"]`
  },
  cacheSettings: {
    createButton:
      '[data-testid="edge-application-cache-settings-list__create-cache-settings__button"]',
    nameInput: '[data-testid="edge-application-cache-settings-form__name-field__input"]',
    browserCacheSettingsRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__browser-cache-settings-field__radio__browserCacheSettings-radio-${position}"]`,
    cdnCacheSettingsRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__cdn-cache-settings-field__radio__cdnCacheSettings-radio-${position}"]`,
    browserCacheSettingsMaxTtlInput:
      '[data-testid="edge-application-cache-settings-form__browser-cache-settings-maximum-ttl-field__input"]',
    cdnCacheSettingsMaxTtlInput:
      '[data-testid="edge-application-cache-settings-form__cdn-cache-settings-maximum-ttl-field__input"]',
    cacheByQueryStringRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__cache-by-query-string-field__radio__cacheByQueryString-radio-${position}"]`,
    cacheByCookieRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__cache-by-cookie-field__radio__cacheByCookies-radio-${position}"]`
  },
  functionsInstance: {
    createFunctionButton:
      '[data-testid="edge-applications-functions-form__create-function-button"]',
    edgeFunctionActionbar: '[data-testid="create-edge-functions-drawer__action-bar"]',
    dropdownFilter:
      '[data-testid="edge-application-function-instance-form__edge-function__dropdown-filter-input"]',
    firstEdgeFunctionDropdownOption: '#edgeFunctionID_0',
    createButton: '[data-testid="functions-instance__create-button"]',
    edgeFunctionsDropdown:
      '[data-testid="edge-application-function-instance-form__edge-function__dropdown"]',
    nameInput: '[data-testid="edge-application-function-instance-form__name-field__input"]',
    firstFilteredNameRow: '[data-testid="list-table-block__column__name__row"] > p',
    firstFilteredEdgeFunctionRow: '[data-testid="list-table-block__column__functionInstanced__row"]'
  }
}
