import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import makeCompareWithAzionApi from '../axios/makeCompareWithAzionApi'
import { makeWebpagetestBaseUrl } from './make-base-url'

export const testConsolidation = async ({ testId, clientId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeWebpagetestBaseUrl()}/db/consolidation`,
      method: 'POST',
      body: JSON.stringify({
        testId: testId,
        clientId: clientId
      })
    },
    makeCompareWithAzionApi()
  )

  return httpResponse
}
