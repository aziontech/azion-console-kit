import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeVariablesBaseUrl } from "./make-variables-base-url";

export const deleteVariablesService = async (environmentVariableId) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeVariablesBaseUrl()}/${environmentVariableId}`,
      method: 'DELETE',
    })
    
  return parseHttpResponse(httpResponse)
}