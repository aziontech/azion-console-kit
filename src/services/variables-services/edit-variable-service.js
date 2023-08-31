import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeVariablesBaseUrl } from "./make-variables-base-url";

export const editVariableService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeVariablesBaseUrl()}/${payload.id}`,
      method: 'PUT',
      body:parsedPayload
    })
    
  return parseHttpResponse(httpResponse)
}

const adapt = (payload)=>{
  return{
    key:payload.key,
    value:payload.value,
    secret:payload.secret
  }
}