import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'
import { capitalizeFirstLetter } from '@/helpers'
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

export const EDGE_CERTIFICATE = 'TLS Certificate'
export const TRUSTED_CA_CERTIFICATE = 'Trusted CA Certificate'

const parseStatusData = (status) => {
  const isActive = status.toUpperCase() === 'ACTIVE'
  const parsedStatus = isActive
    ? {
        content: capitalizeFirstLetter(status),
        severity: 'success'
      }
    : {
        content: capitalizeFirstLetter(status),
        severity: 'danger'
      }

  return parsedStatus
}
const parseValidityDate = (validity) => {
  const formatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }

  const dateFormatted = new Intl.DateTimeFormat('en-US', formatOptions).format(new Date(validity))

  return dateFormatted
}

const adapt = (httpResponse) => {
  const parsedDomains = httpResponse.body.results?.map((item) => {
    const subjectNames = item.subject_name.map((subject) => subject)?.join(',')
    const typeMap = {
      edge_certificate: EDGE_CERTIFICATE,
      trusted_ca_certificate: TRUSTED_CA_CERTIFICATE
    }
    return {
      id: item.id,
      name: item.name,
      issuer: item.issuer || '-',
      subjectName: subjectNames === '' ? '-' : subjectNames,
      type: typeMap[item.certificate_type] || '-',
      validity: item.validity === null ? '-' : parseValidityDate(item.validity),
      status: parseStatusData(item.status)
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
