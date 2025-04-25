export default {
  createButton: '[data-testid="custom-page-list__create-custom-page__button"] > .p-button-label',
  nameInput: '[data-testid="custom-page-form__name__input"]',
  isActiveSwitch: '[data-testid="custom-page__isActive-field__switch"] > .p-inputswitch-slider',
  list: {
    columnName: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  }
}
