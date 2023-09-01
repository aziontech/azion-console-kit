import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter';
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url';

export const loadDigitalCertificateService = async ({id}) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeDigitalCertificatesBaseUrl()}/${id}`,
      method: 'GET',
    })
  httpResponse = adapt(httpResponse);

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const body = httpResponse.body.results;
  const parsedVariable = {
    id: body.id,
    name: body.name,
    issuer: body.issuer,
    subjectName: body.subject_name,
    validity: body.validity,
    status: body.status,
    certificateType: body.certificate_type,
    managed: body.managed,
    csr: body.csr ?? undefined,
    certificateContent: body.certificate_content,
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}