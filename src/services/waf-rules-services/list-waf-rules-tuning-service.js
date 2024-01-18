import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

export const listWafRulesTuningService = async ({ wafId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${wafId}/waf_events`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}
// const parseStatusData = (status) => {
//   const parsedStatus = status
//     ? {
//         content: 'Active',
//         severity: 'success'
//       }
//     : {
//         content: 'Inactive',
//         severity: 'danger'
//       }

//   return parsedStatus
// }



const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  // eslint-disable-next-line no-console
  console.log(httpResponse.body);

  return {
    body: httpResponse.body,
    statusCode: httpResponse.statusCode
  }
}
