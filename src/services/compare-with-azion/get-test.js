import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import makeCompareWithAzionApi from '../axios/makeCompareWithAzionApi'
import { makeWebpagetestBaseUrl } from './make-base-url'

export const getTestById = async (id, clientId) => {
  let url = `${makeWebpagetestBaseUrl()}/db/test?id=${id}`

  if (clientId) {
    url = url.concat(`&clientId=${clientId}`)
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: url,
      method: 'GET'
    },
    makeCompareWithAzionApi()
  )

  return httpResponse
}

export const getAllTestsByClientId = async (clientId) => {
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeWebpagetestBaseUrl()}/db/all-clientid-tests?clientId=${clientId}`,
      method: 'GET'
    },
    makeCompareWithAzionApi()
  )

  return httpResponse
}

export const getResult = async (testId) => {
  if (!testId) {
    return {
      status: 400,
      error: `Invalid testId param.`
    }
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeWebpagetestBaseUrl()}/result?id=${testId}`,
      method: 'GET'
    },
    makeCompareWithAzionApi()
  )

  return httpResponse
}
