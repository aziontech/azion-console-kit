import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'

export const loadDigitalCertificatesService = async (globalId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}/${globalId}?fields=id,name`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const data = httpResponse.body?.data
  const parsedDigitalCertificates = {
    id: data?.id,
    name: data?.name
  }

  return {
    body: parsedDigitalCertificates,
    statusCode: httpResponse.statusCode
  }
}
