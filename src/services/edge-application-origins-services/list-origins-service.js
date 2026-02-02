import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import { BaseService } from '@/services/v2/base/query/baseService'

const baseService = new BaseService()

const fetchList = async ({ id, orderBy, sort, page, pageSize }) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/origins?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const listOriginsService = async ({
  id,
  orderBy = 'origin_id',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const params = { id, orderBy, sort, page, pageSize }

  const queryKey = baseService.queryKeys.edgeApp.origins.all(id)
  const firstPage = page === 1
  return await baseService.useEnsureQueryData(queryKey, () => fetchList(params), {
    persist: firstPage
  })
}

export const prefetchOriginsList = async (edgeApplicationId) => {
  return await listOriginsService({ id: edgeApplicationId, page: 1, pageSize: 200 })
}

const adapt = (httpResponse) => {
  const originTypeFormat = {
    single_origin: 'Single Origin',
    load_balancer: 'Load Balancer',
    live_ingest: 'Live Ingest',
    object_storage: 'Edge Storage'
  }
  const parsedOrigin = httpResponse.body.results?.map((origin) => {
    let formattedListOfAddresses = origin.addresses?.map((address) => address.address) || []

    return {
      id: origin.origin_key,
      originKey: {
        content: origin.origin_key
      },
      originId: convertOriginIdToString(origin.origin_id),
      name: origin.name,
      originType: originTypeFormat[origin.origin_type],
      addresses:
        origin.origin_type === 'live_ingest'
          ? [origin.streaming_endpoint]
          : formattedListOfAddresses,
      originProtocolPolicy: origin.origin_protocol_policy,
      isOriginRedirectionEnabled: origin.is_origin_redirection_enabled,
      hostHeader: origin.origin_type === 'live_ingest' ? '-' : origin.host_header,
      method: origin.method,
      originPath: origin.origin_path,
      connectionTimeout: origin.connection_timeout,
      timeoutBetweenBytes: origin.timeout_between_bytes,
      hmacAuthentication: origin.hmac_authentication,
      hmacRegionName: origin.hmac_region_name,
      hmacAccessKey: origin.hmac_access_key,
      hmacSecretKey: origin.hmac_secret_key
    }
  })

  return {
    body: parsedOrigin,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}

const convertOriginIdToString = (originId) => {
  return new String(originId).toString()
}
