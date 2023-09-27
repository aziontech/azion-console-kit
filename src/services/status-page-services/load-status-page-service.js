import axiosStatusPageApi from '../axios/makeStatusPageApi'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'

export async function loadStatusPageService() {
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `/status.json`,
      method: 'GET'
    },
    axiosStatusPageApi
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const status = httpResponse.body.status

  const body = {
    indicator: status.indicator,
    description: status.description
  }

  return {
    body,
    statusCode: httpResponse.statusCode
  }
}
