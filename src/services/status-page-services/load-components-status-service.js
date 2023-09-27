import axiosStatusPageApi from '../axios/makeStatusPageApi'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'

export async function loadComponentsStatusService() {
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `/components.json`,
      method: 'GET'
    },
    axiosStatusPageApi
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const data = httpResponse.body

  const body = {
    components: data.components
  }

  return {
    body,
    statusCode: httpResponse.statusCode
  }
}
