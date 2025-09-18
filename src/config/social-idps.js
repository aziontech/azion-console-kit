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
  }
]

const SSO_BASE_URL = 'https://sso.azion.com/api/sp/social'

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
