export default {
  createButton: '[data-testid="create_Custom Page_button"] > .p-button-label',
  nameInput: '[data-testid="custom-page-form__name__input"]',
  isActiveSwitch: '[data-testid="custom-page__isActive-field__switch"] > .p-inputswitch-slider',
  list: {
    columnName: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  },
  ttlDefaultPage: '[data-testid="custom-page-form__page__0__ttl__input"] > .p-inputtext',
  editPageTitle: '[data-testid="page_title_Edit Custom Page"]',
  clickItemTable: (columnPosition) => `[data-pc-section="bodyrow"]:nth-child(${columnPosition})`,
  drawer: {
    customStatusCode: '[data-testid="field-number__input"] > .p-inputtext',
    buttonSave: 'button[aria-label="Apply"]'
  }
}
