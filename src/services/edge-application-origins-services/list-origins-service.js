import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { createFinalKey } from '@/services/v2/base/query/keyFactory'
import { getCacheOptions, CACHE_TYPE } from '@/services/v2/base/query/queryOptions'

export const originsKeys = {
  all: (edgeAppId) => ['origins', edgeAppId],
  lists: (edgeAppId) => [...originsKeys.all(edgeAppId), 'list'],
  details: (edgeAppId) => [...originsKeys.all(edgeAppId), 'detail']
}

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
  await waitForPersistenceRestore()

  const params = { id, orderBy, sort, page, pageSize }
  const queryKey = [...originsKeys.lists(id), orderBy, sort, page, pageSize]

  const queryOptions = {
    meta: { persist: page === 1, cacheType: CACHE_TYPE.GLOBAL },
    ...getCacheOptions(CACHE_TYPE.GLOBAL)
  }

  return await queryClient.ensureQueryData({
    queryKey: createFinalKey(queryKey),
    queryFn: () => fetchList(params),
    ...queryOptions
  })
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
