export default {
  avatarIcon: '[data-testid="profile-block__avatar"]',
  menuItem: (menuAccountLabel) =>
    `li[aria-label="${menuAccountLabel}"] > .p-menuitem-content > .p-menuitem-link`
}
