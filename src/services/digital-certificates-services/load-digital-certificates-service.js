import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'

export const loadDigitalCertificateService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const certificate = httpResponse.body.results
  const parsedCertificate = {
    id: certificate.id,
    name: certificate.name,
    issuer: certificate.issuer,
    subjectName: certificate.subject_name,
    validity: certificate.validity,
    status: certificate.status,
    certificateType: certificate.certificate_type,
    managed: certificate.managed,
    csr: certificate.csr ?? undefined,
    certificateContent: certificate.certificate_content
  }

  return {
    body: parsedCertificate,
    statusCode: httpResponse.statusCode
  }
}
