export default {
  tabs: (tabName) => `[data-testid="waf-rules-tabs__tab__${tabName}"] a`,
  domainsField: '[data-testid="waf-tuning-list__domains-field"]',
  domainItem: '[data-testid="waf-tuning-list__domains-field-item"]',
  closeDomainsSelector: '[data-testid="waf-tuning-list__domains-field-close-button"]',
  checkBox: '[data-testid="data-table-row-checkbox"]',
  moreDetailsDrawerCheckbox: '[data-testid="data-table"] td.p-selection-column .p-checkbox-box',
  dataTableRowCheckbox:
    '[data-testid="data-table-container"] [data-testid="data-table"] td.p-selection-column .p-checkbox-box',
  moreDetailsDrawer: '[data-testid="more-details-drawer"]',
  submitButton: '[data-testid="form-actions-submit-button"]',
  allowRulesButton: '[data-testid="allow-rules-button"]'
}
