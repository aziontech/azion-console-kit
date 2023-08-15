import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeEdgeApplicationBaseUrl } from "./make-edge-application-base-url";

export const listEdgeApplicationsService = async ({ page }) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeEdgeApplicationBaseUrl()}?page=${page}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse);

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedEdgeApplications = httpResponse.body.results.map((edgeApplication) => {
    const originNames = edgeApplication.origins.map(origin => origin.name)?.join(',')
    console.log(originNames);

    return {
      active: edgeApplication.active ? 'active' : 'disabled',
      debugRules: edgeApplication.debug_rules ? 'active' : 'disabled',
      id: edgeApplication.id,
      lastEditor: edgeApplication.last_editor,
      lastModify: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(edgeApplication.last_modified)),
      name: edgeApplication.name,
      origins: originNames
    }
  })

  return {
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode,
  }
}