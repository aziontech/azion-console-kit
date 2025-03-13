import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-service'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
const LOCKED_VALUE = 'custom'

export const listDomainsService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const parseName = (domain) => {
  const nameProps = { text: domain.name, tagProps: {} }

  if (domain?.product_version === LOCKED_VALUE) {
    nameProps.tagProps = {
      icon: 'pi pi-lock',
      value: 'Locked',
      outlined: true,
      severity: 'warning'
    }
  }

  return nameProps
}

const adapt = async (httpResponse) => {
  const parsedDomains = httpResponse.body.results?.map((domain) => {
    return {
      id: domain.id,
      name: parseName(domain),
      isLocked: domain.product_version === LOCKED_VALUE,
      disableEditClick: domain.product_version === LOCKED_VALUE,
      active: domain.active
        ? {
            content: 'Active',
            severity: 'success'
          }
        : {
            content: 'Inactive',
            severity: 'danger'
          },
      activeSort: domain.active,
      domainName: {
        content: domain.domains ? domain.domains[0].domain : null
      },
      cnames: domain.alternate_domains
    }
  })

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedDomains,
    statusCode: httpResponse.statusCode
  }
}
