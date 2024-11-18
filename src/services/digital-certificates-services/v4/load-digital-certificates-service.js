import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'

export const loadDigitalCertificateService = async ({ id }) => {
  const fields = ['id', 'name', 'type', 'csr', 'managed', 'certificate']

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}/${id}?fields=${fields}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const certificate = httpResponse.body.data

  const parsedCertificate = {
    id: certificate.id,
    name: certificate.name,
    type: certificate.type,
    managed: certificate.managed,
    csr: certificate.csr ?? undefined,
    certificate: certificate.certificate
  }

  return {
    body: parsedCertificate,
    statusCode: httpResponse.statusCode
  }
}
