import axios from 'axios'
import { makeStatusPageBaseUrl } from './make-status-page-base-url'
import { parseHttpResponse } from '../axios/AxiosHttpClientAdapter'

export async function loadComponentsStatusService() {
  delete axios.defaults.headers.common['Accept']
  delete axios.defaults.headers.common['Authorization']
  delete axios.defaults.headers.common['Access-Control-Allow-Origin']
  axios.defaults.withCredentials = false

  let httpResponse = await axios.request({
    url: `${makeStatusPageBaseUrl()}/components.json`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  console.log(httpResponse)
  const data = httpResponse.data

  const body = {
    components: data.components
  }

  return {
    body,
    statusCode: httpResponse.status
  }
}
