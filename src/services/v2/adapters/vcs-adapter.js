export const VcsAdapter = {
  transformListIntegrations(response) {
    return (
      response.body?.results?.map((integration) => {
        const uri = integration.provider.callback_url.split('vcs')[1]
        return {
          label: integration.scope,
          value: integration.id,
          callbackUrl: uri
        }
      }) || []
    )
  },
  transformListPlatforms(response) {
    return (
      response.body.results.map((platform) => {
        const uri = platform.callback_url.split('vcs')[1]
        return {
          id: platform.id,
          name: platform.name,
          installationUrl: platform.installation_url,
          callbackUrl: uri
        }
      }) || []
    )
  }
}
