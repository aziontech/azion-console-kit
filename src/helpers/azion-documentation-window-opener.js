export const AZION_SEARCH_RESULT = 'https://www.azion.com/en/search-result'
export const AZION_DOCUMENTATION = 'https://www.azion.com/en/documentation'
export const AZION_DOCUMENTATION_PRODUCTS = 'https://www.azion.com/en/documentation/products'
export const AZION_API_DOCUMENTATION = 'https://api.azion.com/'
export const AZION_CONTACT_SUPPORT = 'https://tickets.azion.com/en/support/home'
export const GOOGLE_AUTHENTICATOR_DOCUMENTATION =
  'https://support.google.com/accounts/answer/1066447'

export const openSearchResult = (searchText) => {
  window.open(`${AZION_SEARCH_RESULT}/?q=${searchText}&filter=doc`)
}

export const openDocumentationProducts = (page = '') => {
  window.open(`${AZION_DOCUMENTATION_PRODUCTS}/${page}`, '_blank')
}

export const openDocumentation = () => {
  window.open(AZION_DOCUMENTATION, '_blank')
}

export const openAPIDocumentation = () => {
  window.open(AZION_API_DOCUMENTATION, '_blank')
}

export const openContactSupport = () => {
  window.open(AZION_CONTACT_SUPPORT, '_blank')
}

export const openGoogleAuthenticatorAppDocumentation = () => {
  window.open(GOOGLE_AUTHENTICATOR_DOCUMENTATION, '_blank')
}
