import axios from 'axios'
import { makeStatusPageBaseUrl } from './make-status-page-base-url'
import { parseHttpResponse } from '../axios/AxiosHttpClientAdapter'

export async function loadStatusPageService() {
  delete axios.defaults.headers.common['Accept']
  delete axios.defaults.headers.common['Authorization']
  delete axios.defaults.headers.common['Access-Control-Allow-Origin']
  axios.defaults.withCredentials = false

  let httpResponse = await axios.request({
    url: `${makeStatusPageBaseUrl()}/status.json`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const status = httpResponse.data.status

  const body = {
    indicator: status.indicator,
    description: status.description
  }

  return {
    body,
    statusCode: httpResponse.status
  }
}
