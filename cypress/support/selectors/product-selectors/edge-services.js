export default {
  createServiceButton: '[data-testid="create_Service_button"]',
  createResourceButton: '[data-testid="list-table-block__create-resource-button"]',
  listRow: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
  pageTitle: (entityName) => `[data-testid="page_title_${entityName}"]`,
  serviceName: '[data-testid="edge-service-form__name-field__input"]',
  variablesField: '[data-testid="edge-service-form__variables-field"] .view-lines',
  status: '[data-testid="edge-service-form__status__active-field"] input',
  statusSwitch: '[data-testid="edge-service-form__status__active-field"] .p-inputswitch-slider',
  mainSettingsTab: '[data-testid="edge-service-tabs__tab__main-settings"] a',
  resoucesTab: '[data-testid="edge-service-tabs__tab__resources"] a',
  pathField: '[data-testid="edge-service-drawer-form__path-field__input"]',
  contentTypeField: '[data-testid="edge-service-drawer-form__content-field"] .view-lines',
  typeDropdownTrigger:
    '[data-testid="edge-service-drawer-form__type-field__dropdown"] > .p-dropdown-trigger',
  typeDropdownOptions: (position) => `#contentType_${position}`
}
