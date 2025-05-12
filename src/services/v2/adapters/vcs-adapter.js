export const VcsAdapter = {
  transformGetRepositories(response) {
    return response.filter((repo) => repo.isActive)
  },

  transformGetPlatforms(response) {
    return (
      response.results.map((platform) => {
        const uri = platform.callback_url.split('vcs')[1]
        return {
          id: platform.id,
          name: platform.name,
          installationUrl: platform.installation_url,
          callbackUrl: uri
        }
      }) || []
    )
  },

  transformGetIntegrations(response) {
    return (
      response.results.map((integration) => {
        const uri = integration.provider.callback_url.split('vcs')[1]
        return {
          label: integration.scope,
          value: integration.id,
          callbackUrl: uri
        }
      }) || []
    )
  },

  transformGetIntegrationRepositories(response) {
    return response.results || response
  },

  transformPostCallbackUrl(response) {
    if (response.statusCode === 200) {
      return { feedback: 'Git Hub Installation successfully completed' }
    }
    return response
  }
}
