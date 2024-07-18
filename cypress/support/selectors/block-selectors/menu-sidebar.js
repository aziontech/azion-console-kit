export default {
  toggleButton: '[data-testid="sidebar-block__toggle-button"] > .p-button-icon',
  menuItem: (productName) => `[data-testid="sidebar-block__menu-item__${productName}"]`
}
