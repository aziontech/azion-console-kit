import { isProduction } from './get-environment'
import { getRuntimeConfig } from './runtime-config'

const SSO_PROVIDERS = [
  {
    name: 'GitHub',
    slug: 'github',
    configId: 'ssoGithub',
    envVar: 'VITE_SSO_GITHUB'
  },
  {
    name: 'Google',
    slug: 'google',
    configId: 'ssoGoogle',
    envVar: 'VITE_SSO_GOOGLE'
  },
  {
    name: 'Microsoft Azure',
    slug: 'azure',
    configId: 'ssoAzure',
    envVar: 'VITE_SSO_AZURE'
  },
  {
    name: 'IDP SCIM e2e',
    slug: '',
    configId: 'ssoIdpScimE2e',
    envVar: 'VITE_SSO_IDP_SCIM_E2E'
  }
]

/**
 * Builds the SSO provider list from runtime config (falling back to
 * build-time env vars). Must stay a call-time function: this module is in
 * the router's static import graph, so anything evaluated at module scope
 * would run before loadRuntimeConfig() resolves and silently drop the
 * providers on runtime-configured deploys.
 *
 * @returns {Array<{name: string, isActive: boolean, uuid: string, loginUrl: string, slug: string}>}
 */
export const getSocialIdps = () => {
  const ssoDomain = isProduction() ? 'sso' : 'stage-sso'
  const ssoBaseUrl = `https://${ssoDomain}.azion.com/api/sp/social`
  const runtimeConfig = getRuntimeConfig()

  return SSO_PROVIDERS.map((provider) => {
    const uuid = runtimeConfig[provider.configId] || import.meta.env[provider.envVar]

    if (!uuid) {
      return null
    }

    return {
      name: provider.name,
      isActive: true,
      uuid: uuid,
      loginUrl: `${ssoBaseUrl}/${uuid}/login?console=true`,
      slug: provider.slug
    }
  }).filter(Boolean)
}
