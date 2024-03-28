import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVcsIntegrationBaseUrl } from './make-vcs-integration-base-url'

export const listPlatformsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVcsIntegrationBaseUrl()}/platforms`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return Promise.resolve(parseHttpResponse(httpResponse))
}

const adapt = (httpResponse) => {
  const parsedPlatforms = httpResponse.body.results.map((element) => {
    return {
      id: element.id,
      name: element.name,
      installationUrl: element.installation_url,
      callbackUrl: element.callback_url
    }
  })

  return {
    body: parsedPlatforms,
    statusCode: 200
  }
}
