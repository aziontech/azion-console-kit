import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVcsIntegrationBaseUrl } from './make-vcs-integration-base-url'

export const listIntegrationsService = async () => {
  // let httpResponse = await AxiosHttpClientAdapter.request({
  //   url: `${makeVcsIntegrationBaseUrl()}/platforms`,
  //   method: 'GET'
  // })

  // httpResponse = adapt(httpResponse)
  const mock = {
    "count": 2,
    "links": {
      "next": null,
      "prev": null
    },
    "results": [
      {
        "uuid": "3a8bc85d-0ccc-45c5-a666-2557107c4fb3",
        "scope": "luizcunhaazion",
        "platform": {
        "id": "github",
           "name": "GitHub"
  }
      },
      {
        "uuid":"3a8bc85d-0ccc-45c5-a666-2557107c4ff2",
        "scope": "aziontech",
        "platform": {
        "id": "github",
           "name": "GitHub"
  }
      }
    ]
  }
  
  

  return Promise.resolve(parseHttpResponse(adapt({body: mock})))
}

const adapt = (httpResponse) => {
  const parsedIntegrations = httpResponse.body.results.map((element) => {
    return {
      uuid: element.uuid,
      scope: element.scope,
    }
  })

  return {
    body: parsedIntegrations,
    statusCode: 200
  }
}
