import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVersionControlSystemBaseUrl } from './make-version-control-system-base-url'

export const listPlatformsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVersionControlSystemBaseUrl()}/platforms`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedPlatforms =
    httpResponse.body.results.map((platform) => {
      const uri = platform.callback_url.split('vcs')[1]
      return {
        id: platform.id,
        name: platform.name,
        installationUrl: platform.installation_url,
        callbackUrl: uri
      }
    }) || []

  return {
    body: parsedPlatforms,
    statusCode: httpResponse.statusCode
  }
}
