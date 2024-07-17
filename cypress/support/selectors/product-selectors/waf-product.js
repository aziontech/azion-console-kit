export default {
  createButton: '[data-testid="create_WAF Rule_button"] > .p-button-label',
  nameInput: '[data-testid="waf-rules-form__name-field__input"]',
  threatTypeSwitch: (name) =>
    `[data-testid="field-group-switch__switch-${name}__switch"] > .p-inputswitch-slider`,
  dropdownTrigger: (name) =>
    `[data-testid="waf-rules-form__${name}-field__dropdown"] .p-dropdown-trigger`,
  dropdownOptions: (name, position) => `#${name}_${position}`,
  breadcumbToList: '.p-breadcrumb-list li.p-menuitem:nth-child(3) .p-menuitem-link',
  listRow: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
  seeMore: (columnName) =>
    `[data-testid="list-table-block__column__${columnName}__row"] .underline`,
  mainSettingsTab: '[data-testid="waf-rules-tabs__tab__main-settings"] > a',
  tuningTab: '[data-testid="waf-rules-tabs__tab__tuning"] > a',
  allowedRulesTab: '[data-testid="waf-rules-tabs__tab__allowed-rules"] > a',
  allowedRules: {
    createButton: '[data-testid="create_Allowed Rule_button"]',
    ruleIdDropdown: '[data-testid="allowed-rules-form__rule-id-field"] > .p-dropdown-trigger',
    ruleIdOption: (ruleId) => `[data-testid="allowed-rules-form__rule-id-field"] #ruleid_${ruleId}`,
    descriptionField: '[data-testid="allowed-rules-form__description-field__input"]',
    pathField: '[data-testid="allowed-rules-form__path-field__input"]',
    matchZoneDropdown: (zoneId) =>
      `[data-testid="allowed-rules-form__match-zone[${zoneId}]-field"] > .p-dropdown-trigger`,
    matchZoneOption: (zoneId, position) =>
      `[data-testid="allowed-rules-form__match-zone[${zoneId}]-field"] #ruleid_${position}`,
    headerField: (zoneId) =>
      `[data-testid="allowed-rules-form__zone[${zoneId}]__header-field__input"]`,
    matchesOnRadio: (zoneId, position) =>
      `[data-testid="allowed-rules-form__zone[${zoneId}]__matches-on-field__radio"][name="matchZones[${zoneId}].matches_on-radio-${position}"]`,
    deleteMatchZoneButton: (zoneId) =>
      `[data-testid="allowed-rules-form__delete-match-zone[${zoneId}]__button"]`,
    addZoneButton: '[data-testid="allowed-rules-form__add-match-zone__button"]',
    regexSwitch:
      '[data-testid="allowed-rules-form__use-regex-field__switch"] > .p-inputswitch-slider',
    statusSwitch: '[data-testid="allowed-rules-form__status-field__switch"] > .p-inputswitch-slider'
  }
}
