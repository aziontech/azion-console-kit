/**
 * Categorizes an import source into architectural categories.
 * Used by rules to determine if an import is forbidden in a given context.
 */

const HTTP_PACKAGES = ['axios', 'node-fetch', 'got', 'ky', 'ofetch']

const HTTP_PATTERNS = [/^axios/, /httpService/i, /http-service/i, /api-client/i, /apiClient/i]

const SERVICE_PATTERNS = [
  /^@\/services\//,
  /\.\.\/.*services?\//,
  /\.\/.*services?\//,
  /-service(['"/.]|$)/
]

const STORE_PATTERNS = [
  /^@\/stores\//,
  /\.\.\/.*stores?\//,
  /\.\/.*stores?\//,
  /-store(['"/.]|$)/,
  /^pinia$/
]

const COMPOSABLE_PATTERNS = [
  /^@\/composables\//,
  /\.\.\/.*composables?\//,
  /\.\/.*composables?\//,
  /\/use[-A-Z]/
]

const DOM_PATTERNS = [/^@\/router/, /^vue-router$/]

const VUE_QUERY_IMPORTS = ['@tanstack/vue-query', '@tanstack/query-core']

// Paths that are utilities/helpers, not actual services — allowed in adapters/components
const SERVICE_EXCEPTIONS = [
  /\/utils\//,
  /\/helpers?\//,
  /\/errors?(\/|$)/,
  /\/constants?\//,
  /\/base\/query\//
]

/**
 * Determines the category of an import source.
 */
function categorizeImport(source) {
  if (HTTP_PACKAGES.includes(source)) return 'http'
  if (HTTP_PATTERNS.some((p) => p.test(source))) return 'http'
  if (SERVICE_PATTERNS.some((p) => p.test(source))) {
    // Check if it's actually a utility/helper, not a real service
    if (SERVICE_EXCEPTIONS.some((p) => p.test(source))) return 'other'
    return 'service'
  }
  if (STORE_PATTERNS.some((p) => p.test(source))) return 'store'
  if (COMPOSABLE_PATTERNS.some((p) => p.test(source))) return 'composable'
  if (DOM_PATTERNS.some((p) => p.test(source))) return 'dom'
  if (VUE_QUERY_IMPORTS.includes(source)) return 'vue-query'

  return 'other'
}

function isHttpImport(source) {
  const cat = categorizeImport(source)
  return cat === 'http'
}

function isServiceImport(source) {
  const cat = categorizeImport(source)
  return cat === 'service'
}

function isHttpOrServiceImport(source) {
  const cat = categorizeImport(source)
  return cat === 'http' || cat === 'service'
}

function isStoreImport(source) {
  return categorizeImport(source) === 'store'
}

function isComposableImport(source) {
  return categorizeImport(source) === 'composable'
}

function isDomImport(source) {
  return categorizeImport(source) === 'dom'
}

function isVueQueryImport(source) {
  return categorizeImport(source) === 'vue-query'
}

/**
 * Checks if an import source points to type/contract files only (allowed everywhere).
 */
function isTypeOnlyImport(source) {
  return /\.types(\.(js|ts))?$/.test(source) || /\.contracts(\.(js|ts))?$/.test(source)
}

/**
 * Checks if an import source points to error handling utilities (allowed in components).
 */
function isErrorImport(source) {
  return /\/errors?([/.]|$)/.test(source)
}

module.exports = {
  categorizeImport,
  isHttpImport,
  isServiceImport,
  isHttpOrServiceImport,
  isStoreImport,
  isComposableImport,
  isDomImport,
  isVueQueryImport,
  isTypeOnlyImport,
  isErrorImport
}
