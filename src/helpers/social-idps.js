import { isProduction } from './get-environment'

const SSO_PROVIDERS = [
  {
    name: 'GitHub',
    slug: 'github',
    envVar: 'VITE_SSO_GITHUB'
  },
  {
    name: 'Google',
    slug: 'google',
    envVar: 'VITE_SSO_GOOGLE'
  },
  {
    name: 'Microsoft Azure',
    slug: 'azure',
    envVar: 'VITE_SSO_AZURE'
  },
  {
    name: 'IDP SCIM e2e',
    slug: '',
    envVar: 'VITE_SSO_IDP_SCIM_E2E'
  }
]

const SSO_DOMAIN = isProduction() ? 'sso' : 'stage-sso'
const SSO_BASE_URL = `https://${SSO_DOMAIN}.azion.com/api/sp/social`

const getSocialIdpsData = () => {
  return SSO_PROVIDERS.map((provider) => {
    const uuid = import.meta.env[provider.envVar]

    if (!uuid) {
      return null
    }

    return {
      name: provider.name,
      isActive: true,
      uuid: uuid,
      loginUrl: `${SSO_BASE_URL}/${uuid}/login?console=true`,
      slug: provider.slug
    }
  }).filter(Boolean)
}

export default getSocialIdpsData()
