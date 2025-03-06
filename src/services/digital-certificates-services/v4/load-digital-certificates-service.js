import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadDigitalCertificateService = async ({ id }) => {
  const fields = ['id', 'name', 'type', 'csr', 'managed']

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}/${id}?fields=${fields}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const certificate = httpResponse.body.data

  const parsedCertificate = {
    id: certificate.id,
    name: certificate.name,
    type: certificate.type,
    managed: certificate.managed,
    csr: certificate.csr ?? undefined
  }

  return {
    body: parsedCertificate,
    statusCode: httpResponse.statusCode
  }
}
