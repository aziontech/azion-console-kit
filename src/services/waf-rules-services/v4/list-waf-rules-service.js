import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listWafRulesService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}
const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }

  return parsedStatus
}

const parseThreatTypes = (waf) => {
  const threatTypes = {
    file_upload: 'File upload',
    evading_tricks: 'Evading Tricks',
    unwanted_access: 'Unwanted Access',
    identified_attack: 'Identified Attack',
    cross_site_scripting: 'Cross-Site Scripting (XSS)',
    directory_traversal: 'Directory Traversal',
    remote_file_inclusion: 'Remote File Inclusions (RFI)',
    sql_injection: 'SQL Injection'
  }

  const threatTypesArray = []
  for (const key in threatTypes) {
    const threat = threatTypes[key]
    if (waf[key]) {
      threatTypesArray.push(threat)
    }
  }

  return threatTypesArray
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  const isArray = Array.isArray(httpResponse.body.results)

  const parsedWafRules = isArray
    ? httpResponse.body.results.map((waf) => {
        const threatTypes =
          waf?.threats_configuration && parseThreatTypes(waf.threats_configuration)

        return {
          ...(waf?.id !== undefined && { id: waf.id }),
          ...(waf?.name !== undefined && { name: waf.name }),
          ...(waf?.active !== undefined && { active: parseStatusData(waf.active) }),
          ...(threatTypes !== undefined && { threatsConfiguration: threatTypes })
        }
      })
    : []

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedWafRules,
    statusCode: httpResponse.statusCode
  }
}
