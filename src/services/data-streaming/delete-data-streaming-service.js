import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeDataStreamingBaseUrl } from "./make-data-streaming-base-url";

export const deleteDataStreamingService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
    url:`${makeDataStreamingBaseUrl()}/${id}`,
    method:'DELETE',
  })

  return parseHttpResponse(httpResponse)
}

