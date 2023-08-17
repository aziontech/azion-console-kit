import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeVariablesBaseUrl } from "./make-variables-base-url";

export const createVariablesService = async (payload) => {
  console.log(payload)
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeVariablesBaseUrl()}`,
      method: 'POST',
      body:payload
    })
    
  return parseHttpResponse(httpResponse)
}