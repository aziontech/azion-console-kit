export const AZION_SEARCH_RESULT = 'https://www.azion.com/en/search-result'
export const AZION_DOCUMENTATION = 'https://www.azion.com/en/documentation'
export const AZION_DOCUMENTATION_PRODUCTS = 'https://www.azion.com/en/documentation/products'
export const AZION_API_DOCUMENTATION = 'https://api.azion.com/'
export const AZION_CONTACT_SUPPORT =
  'https://azion.freshworks.com/login/auth/1621629799053?client_id=41441690836303948&redirect_uri=https://tickets.azion.com/freshid/customer_authorize_callback'
export const GOOGLE_AUTHENTICATOR_DOCUMENTATION =
  'https://support.google.com/accounts/answer/1066447'
export const AZION_SITE = 'https://www.azion.com/'
export const AZION_SITE_ABOUTUS = 'https://www.azion.com/en/about-us/'
export const AZION_LAUNCH_WEEK = 'https://www.azion.com/en/launch-week/'
export const AZION_BLOG = 'https://www.azion.com/en/blog/'
export const AZION_DISCORD = 'https://discord.com/invite/Yp9N7RMVZy'
export const AZION_GITHUB = 'https://github.com/aziontech/azion-console-kit'
export const AZION_X = 'https://x.com/aziontech'
export const AZION_PLAN = 'https://www.azion.com/en/professional-services&id=#plans'
export const AZION_INTEGRATIONS =
  'https://www.azion.com/en/documentation/products/marketplace/integrations/'
export const AZION_FORMJSON_DOCUMENTATION = 'https://jsonforms.io/docs/integrations/react/#schema'

export const openAzionSite = () => {
  window.open(AZION_SITE, '_blank')
}

export const openAzionSiteAboutUs = () => {
  window.open(AZION_SITE_ABOUTUS, '_blank')
}

export const azionJsonFormWindowOpener = () => {
  window.open(AZION_FORMJSON_DOCUMENTATION, '_blank')
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

export const openShowMorePlan = () => {
  window.open(AZION_PLAN, '_blank')
}

export const openMarketplaceIntegrationsDocumentation = () => {
  window.open(AZION_INTEGRATIONS, '_blank')
}

export const openLaunchWeek = () => {
  window.open(AZION_LAUNCH_WEEK, '_blank')
}
