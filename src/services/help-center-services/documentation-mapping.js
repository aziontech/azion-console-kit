/**
 * Mapping dictionary for Azion documentation links
 * Maps product identifiers to their documentation URLs
 */

export const DOCUMENTATION_MAPPINGS = {
  OBJECT_STORAGE: 'https://www.azion.com/en/documentation/products/store/object-storage',
  SQL_DATABASE: 'https://www.azion.com/pt-br/documentacao/produtos/store/sql-database',
  VARIABLES: 'https://www.azion.com/en/documentation/products/functions/environment-variables'
}

/**
 * Gets the full documentation URL for a given product identifier
 * @param {string} productIdentifier - The product identifier (e.g., 'OBJECT_STORAGE', 'SQL_DATABASE')
 * @returns {string|null} The full documentation URL or null if not found
 */
export const getDocumentationUrl = (productIdentifier) => {
  return DOCUMENTATION_MAPPINGS[productIdentifier] || null
}

/**
 * Checks if a product identifier exists in the mappings
 * @param {string} productIdentifier - The product identifier to check
 * @returns {boolean} True if the identifier exists, false otherwise
 */
export const hasDocumentationMapping = (productIdentifier) => {
  return productIdentifier in DOCUMENTATION_MAPPINGS
}
