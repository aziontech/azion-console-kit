import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listDigitalCertificatesServiceDropdown = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10,
  type = ''
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}?${searchParams.toString()}&type=${type}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, type, search)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, certificateType, search) => {
  let parsedDigitalCertificates = httpResponse.body.results?.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })

  let count = httpResponse.body?.count ?? 0

  if (certificateType === 'edge_certificate') {
    const DEFAULT_CERTIFICATES = [{ id: 0, name: 'Azion (SAN)' }]

    const filteredDefaultCertificates = search
      ? DEFAULT_CERTIFICATES.filter((cert) =>
          cert.name.toLowerCase().includes(search.toLowerCase())
        )
      : DEFAULT_CERTIFICATES

    parsedDigitalCertificates = [...filteredDefaultCertificates, ...parsedDigitalCertificates]
    count += filteredDefaultCertificates.length
  }

  return {
    count,
    body: parsedDigitalCertificates,
    statusCode: httpResponse.statusCode
  }
}
