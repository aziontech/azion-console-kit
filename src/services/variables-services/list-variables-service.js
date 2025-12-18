import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVariablesBaseUrl } from './make-variables-base-url'
import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'

export const listVariablesService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVariablesBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */
  const isArray = Array.isArray(httpResponse.body)

  const parsedVariables = isArray
    ? httpResponse.body.map((variable) => ({
        id: variable.uuid,
        key: variable.key,
        value: {
          isSecret: variable.secret,
          content: variable.value
        },
        lastEditor: variable.last_editor,
        lastModified: formatDateToDayMonthYearHour(variable.updated_at),
        lastModify: convertToRelativeTime(variable.updated_at)
      }))
    : []

  return {
    body: parsedVariables,
    statusCode: httpResponse.statusCode
  }
}
