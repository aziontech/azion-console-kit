/**
 * Navigation helpers for the Console Kit.
 * Maps product display names to sidebar IDs and routes.
 */

/**
 * Product route mapping: displayName → { sidebarId, route }
 * sidebarId is used for sidebar-block__menu-item__${sidebarId}
 * route is the base URL path
 */
export const productRoutes = {
  // Build
  'Edge Application': { sidebarId: 'edge-application', route: '/applications' },
  Variables: { sidebarId: 'variables', route: '/variables' },

  // Secure
  'Edge Firewall': { sidebarId: 'edge-firewall', route: '/firewalls' },
  'Edge DNS': { sidebarId: 'edge-dns', route: '/edge-dns' },

  // Store
  'Object Storage': { sidebarId: 'object-storage', route: '/object-storage' },
  'Edge Storage': { sidebarId: 'object-storage', route: '/object-storage' },
  'SQL Database': { sidebarId: 'sql-database', route: '/sql-database' },
  'Edge SQL': { sidebarId: 'sql-database', route: '/sql-database' },

  // Secure (continued)
  'Edge Connectors': { sidebarId: 'edge-connectors', route: '/connectors' },

  // Observe
  'Data Stream': { sidebarId: 'data-stream', route: '/data-stream' },
  'Edge Pulse': { sidebarId: 'edge-pulse', route: '/edge-pulse' },
  'Real-Time Metrics': { sidebarId: 'real-time-metrics', route: '/real-time-metrics' },
  'Real-Time Events': { sidebarId: 'real-time-events', route: '/real-time-events' },
  'Real-Time Purge': { sidebarId: 'real-time-purge', route: '/real-time-purge' },

  // Edge Libraries
  'Edge Functions': { sidebarId: 'edge-functions', route: '/functions' },
  'Digital Certificates': { sidebarId: 'digital-certificates', route: '/digital-certificates' },
  'Network Lists': { sidebarId: 'network-lists', route: '/network-lists' },
  'WAF Rules': { sidebarId: 'waf-rules', route: '/waf' },

  // Other sidebar
  Home: { sidebarId: 'home', route: '/' },
  Marketplace: { sidebarId: 'marketplace', route: '/marketplace' },
  Domains: { sidebarId: 'domains', route: '/workloads' },

  // Account menu items (no sidebarId, use account menu)
  'Account Settings': { route: '/account/settings' },
  'Users Management': { route: '/users' },
  Billing: { route: '/billing' },
  Credentials: { route: '/credentials' },
  'Activity History': { route: '/activity-history' },
  'Teams Permissions': { route: '/teams-permission' },
  'Your Settings': { route: '/your-settings' },
  'Personal Token': { route: '/personal-tokens' }
}

/**
 * Gets the route path for a product.
 * @param {string} productName - Display name of the product
 * @returns {string} The route path
 */
export function getRoute(productName) {
  const product = productRoutes[productName]
  if (!product) {
    throw new Error(`Unknown product: ${productName}`)
  }
  return product.route
}

/**
 * Gets the sidebar ID for a product.
 * @param {string} productName - Display name of the product
 * @returns {string|undefined} The sidebar ID or undefined for account menu items
 */
export function getSidebarId(productName) {
  const product = productRoutes[productName]
  return product?.sidebarId
}

export default { productRoutes, getRoute, getSidebarId }
