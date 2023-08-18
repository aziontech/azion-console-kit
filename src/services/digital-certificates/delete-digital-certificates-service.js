import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeDigitalCertificatesBaseUrl } from "./make-digital-certificates-base-url";

export const deleteDigitalCertificatesService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
    url:`${makeDigitalCertificatesBaseUrl()}/${id}`,
    method:'DELETE',
  })

  return parseHttpResponse(httpResponse)
}

