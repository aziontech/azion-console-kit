/**
 * Shared Navigation Selectors
 *
 * Selectors for sidebar, account menu, and breadcrumbs.
 */

export default {
  // Sidebar
  sidebar: {
    toggleButton: '[data-testid="sidebar__menu-item__toggle-button"]',
    menuItem: (productSlug) => `[data-testid="sidebar__menu-item__${productSlug}"]`,
    logo: '[data-testid="sidebar__logo"]',
    container: '[data-testid="sidebar"]'
  },

  // Account menu
  accountMenu: {
    avatar: '[data-testid="header-account-menu__avatar"]',
    container: '.p-menu',
    menuItem: (label) => `[role="menuitem"]:contains("${label}")`,
    logout: '[data-testid="menu-account__logout"]'
  },

  // Header
  header: {
    container: '[data-testid="header"]',
    feedbackButton: '[data-testid="header__feedback-button"]',
    helpButton: '[data-testid="header__help-button"]',
    notificationsButton: '[data-testid="header__notifications-button"]'
  },

  // Breadcrumb
  breadcrumb: {
    container: '.p-breadcrumb',
    items: '.p-breadcrumb li',
    home: '.p-breadcrumb-home',
    separator: '.p-breadcrumb-chevron',
    item: (text) => `.p-breadcrumb li:contains("${text}")`
  },

  // Page heading
  pageHeading: {
    title: '[data-testid*="__page-heading"]',
    description: '[data-testid*="__page-description"]',
    backButton: '[data-testid*="__back-button"]'
  },

  // Loading states
  loading: {
    pageSpinner: '[data-testid="loading-spinner"]',
    progressSpinner: '.p-progress-spinner',
    skeleton: '.p-skeleton'
  }
}
