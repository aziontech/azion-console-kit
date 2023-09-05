import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'
export const listDigitalCertificatesService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedDomains = httpResponse.body.results?.map((item) => {
    const subjectNames = item.subject_name.map((subject) => subject)?.join(',')
    const typeMap = {
      edge_certificate: 'Edge Certificate',
      trusted_ca: 'Trusted CA Certificate',
    }
    return {
      id: item.id,
      name: item.name,
      issuer: item.issuer || '-',
      subject_name: subjectNames === '' ? '-' : subjectNames,
      type: typeMap[item.certificate_type],
      validity: item.validity === null ? '-' : new Intl.DateTimeFormat('us', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(new Date(item.validity)),
      status: item.status
    }
  })

  return {
    body: parsedDomains,
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
