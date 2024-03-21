import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVcsIntegrationBaseUrl } from './make-vcs-integration-base-url'

export const listPlatformsService = async () => {
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
        "id": "github",
        "name": "GitHub",
        "instalation_url": "https://github.com/apps/azion-github-app-stage/installations/new",
        "callback_url": "/vcs-api/integrations/oauth/github/callback"
      },
      {
        "id": "gitlab",
        "name": "GitLab",
       "instalation_url": "https://oauth/gitlab",
        "callback_url": "/vcs-api/integrations/oauth/gitlab/callback"
      }
    ]
  }
  

  return Promise.resolve(parseHttpResponse(adapt({body: mock})))
}

const adapt = (httpResponse) => {
  const parsedPlatforms = httpResponse.body.results.map((element) => {
    return {
      id: element.id,
      name: element.name,
      installationUrl: element.instalation_url,
    }
  })

  return {
    body: parsedPlatforms,
    statusCode: 200
  }
}
