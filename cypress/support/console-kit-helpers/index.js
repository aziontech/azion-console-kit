/**
 * Console-Kit Helpers
 *
 * Library that understands console-kit patterns:
 * - Cache (TanStack Query with GLOBAL, SENSITIVE, PAGE_LIST types)
 * - Table (lazy loading, pagination, search debounce)
 * - Form (validation, conditional fields, lazy dropdowns)
 * - API (interceptation, retry, N+1 prevention)
 * - Navigation (prefetch, route guards, breadcrumbs)
 * - Profiles (v3/v4 UI, v3/v5 config, API versions)
 * - Fixture Recording (record/replay API responses)
 */

export { cacheHelpers } from './cache'
export { tableHelpers } from './table'
export { formHelpers } from './form'
export { apiHelpers } from './api'
export { navigationHelpers } from './navigation'
export { TEST_PROFILES, API_ENDPOINTS, profileHelpers } from './profiles'
export { fixtureRecorder } from './fixture-recorder'
export { rulesEngineHelpers } from './rules-engine'
