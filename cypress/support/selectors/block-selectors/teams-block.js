export default {
  createTeamButton: '[data-testid="create_Team_button"]',
  nameInput: '[data-testid="teams-permissions-form__name__field-text__input"]',
  statusSwitch: '[data-testid="teams-permissions-form__form-fields__status"]',
  sourceList: '.p-picklist-list.p-picklist-source-list',
  targetList: '.p-picklist-list.p-picklist-target-list',
  allPermissionsToTarget: '[aria-label="Move All to Target"] > .p-icon',
  allPermissionsToSource: '[aria-label="Move All to Source"] > .p-icon',
  singlePermissionToTarget: 'button[aria-label="Move to Target"]',
  permission: (permissionName) =>
    `[data-testid="teams-permissions-form__permissions-field__picklist__item-${permissionName}"]`,
  listRow: (rowName) => `[data-testid="list-table-block__column__${rowName}__row"]`
}
