export const AZION_SEARCH_RESULT = 'https://www.azion.com/en/search-result'
export const AZION_DOCUMENTATION = 'https://www.azion.com/en/documentation'
export const AZION_DOCUMENTATION_PRODUCTS = 'https://www.azion.com/en/documentation/products'
export const AZION_API_DOCUMENTATION = 'https://api.azion.com/'
export const AZION_CONTACT_SUPPORT = 'https://tickets.azion.com/en/support/home'
export const GOOGLE_AUTHENTICATOR_DOCUMENTATION =
  'https://support.google.com/accounts/answer/1066447'
export const AZION_SITE = 'https://www.azion.com/'
export const AZION_BLOG = 'https://www.azion.com/en/blog/'
export const AZION_DISCORD = 'https://discord.com/invite/Yp9N7RMVZy'
export const AZION_GITHUB = 'https://github.com/aziontech/azion-platform-kit'
export const AZION_X = 'https://x.com/aziontech'

export const openAzionSite = () => {
  window.open(AZION_SITE, '_blank')
}

export const openAzionBlog = () => {
  window.open(AZION_BLOG, '_blank')
}

export const openAzionDiscord = () => {
  window.open(AZION_DISCORD, '_blank')
}

export const openAzionGithub = () => {
  window.open(AZION_GITHUB, '_blank')
}

export const openAzionX = () => {
  window.open(AZION_X, '_blank')
}

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
