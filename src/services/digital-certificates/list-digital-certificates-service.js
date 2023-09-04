import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'

export const listDigitalCertificatesService = async ({
  sort = 'asc',
  orderBy = 'name',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeDigitalCertificatesBaseUrl()}?${searchParams.toString()}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse);

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedDomains = httpResponse.body.results?.map((item) => {
    const subjectNames = item.subject_name.map(subject => subject)?.join(',')
    return {
      id: item.id,
      name: item.name,
      issuer: item.issuer || '-',
      subject_name: subjectNames === '' ? '-' : subjectNames,
      validity: item.validity || '-',
      status: item.status,
    }
  })

  return {
    body: parsedDomains,
    statusCode: httpResponse.statusCode,
  }
}

const makeSearchParams = ({ page, pageSize }) => {
  const searchParams = new URLSearchParams();
  searchParams.set('page', page);
  searchParams.set('page_size', pageSize);

  return searchParams;
}
