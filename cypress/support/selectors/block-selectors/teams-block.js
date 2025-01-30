export default {
  createTeamButton: '[data-testid="create_Team_button"]',
  nameInput: '[data-testid="teams-permissions-form__name__field-text__input"]',
  statusSwitch: '[data-testid="teams-permissions-form__form-fields__status"]',
  sourceList: '[data-testid="teams-permissions-form__permissions-field-picklist__source-list"]',
  targetList: '[data-testid="teams-permissions-form__permissions-field-picklist__target-list"]',
  allPermissionsToTarget:
    '[data-testid="teams-permissions-form__permissions-field-picklist__move-all-to-target-btn"]',
  allPermissionsToSource:
    '[data-testid="teams-permissions-form__permissions-field-picklist__move-all-to-source-btn"]',
  singlePermissionToTarget:
    '[data-testid="teams-permissions-form__permissions-field-picklist__move-to-target-btn"]',
  permission: (permissionName) =>
    `[data-testid="teams-permissions-form__permissions-field__picklist__item-${permissionName}"]`,
  listRow: (rowName) => `[data-testid="list-table-block__column__${rowName}__row"]`,
  addOption:
    '[data-testid="teams-permissions-form__permissions-field-picklist__move-to-target-btn"]'
}
