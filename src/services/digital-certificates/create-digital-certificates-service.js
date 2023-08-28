import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeDigitalCertificatesBaseUrl } from "./make-digital-certificates-base-url";

export default {
  createDigitalCertificate: async (payload) => {
    let httpResponse = await AxiosHttpClientAdapter
      .request({
        url: `${makeDigitalCertificatesBaseUrl()}`,
        method: 'POST',
        body: adaptCertificate(payload),
      })

    return parseHttpResponse(httpResponse);
  },
  createCSR: async (payload) => {
    let httpResponse = await AxiosHttpClientAdapter
      .request({
        url: `${makeDigitalCertificatesBaseUrl()}/csr`,
        method: 'POST',
        body: adaptCSR(payload),
      })

    return parseHttpResponse(httpResponse);
  },
}

const adaptCSR = (payload) => {
  return {
    name: payload.digitalCertificateName,
    common_name: payload.common,
    locality: payload.city,
    state: payload.state,
    country: payload.country,
    organization: payload.organization,
    email: payload.email,
    organization_unity: payload.organizationUnity,
    private_key_type: payload.privateKeyType,
    sans: payload.subjectAlternativeNames?.split('\n'),
  }
}
const adaptCertificate = (payload) => {
  return {
    name: payload.digitalCertificateName,
    certificate_type: payload.certificateType,
    certificate: payload.certificate,
    private_key: payload.privateKey,
  }
}