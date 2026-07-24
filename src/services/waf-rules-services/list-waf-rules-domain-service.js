import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

const PAGE_SIZE = 100

export const listWafRulesDomainsService = async ({ wafId }) => {
  const firstPageResponse = await fetchDomainsPage({ wafId, page: 1 })

  const domains = extractDomains(firstPageResponse)
  const count = Number(firstPageResponse.body?.count) || 0
  const totalPages = Math.ceil(count / PAGE_SIZE)

  if (totalPages > 1) {
    const pagePromises = []
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(fetchDomainsPage({ wafId, page }))
    }

    const pagesResponses = await Promise.all(pagePromises)
    pagesResponses.forEach((pageResponse) => domains.push(...extractDomains(pageResponse)))
  }

  const httpResponse = adapt(domains, firstPageResponse.statusCode)

  return parseHttpResponse(httpResponse)
}

const fetchDomainsPage = async ({ wafId, page }) => {
  return AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${wafId}/domains?page=${page}&page_size=${PAGE_SIZE}`,
    method: 'GET'
  })
}

const extractDomains = (httpResponse) =>
  Array.isArray(httpResponse.body?.results) ? [...httpResponse.body.results] : []

const adapt = (domains, statusCode) => {
  const parsedWafRulesDomain = domains.map((domain) => ({
    domain: domain.domain,
    id: domain.id,
    name: domain.name
  }))

  return {
    body: parsedWafRulesDomain,
    statusCode
  }
}
