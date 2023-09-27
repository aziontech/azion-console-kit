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

  return parseHttpResponse(httpResponse)
}
