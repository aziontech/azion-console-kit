export default {
  avatarIcon: '[data-testid="profile-block__avatar"]',
  sidebar: '[data-testid="profile-block__sidebar"]',
  profileMenu: '[data-testid="profile-block__sidebar__profile-menu"]',
  settingsMenu: '[data-testid="profile-block__sidebar__settings-menu"]',
  userName: '[data-testid="profile-block__profile-menu__user-name"]',
  logoutButton: '[data-testid="profile-block__sidebar__logout-btn"]',
  menuItem: (menuAccountLabel) =>
    `li[aria-label="${menuAccountLabel}"] > .p-menuitem-content > .p-menuitem-link`
}
