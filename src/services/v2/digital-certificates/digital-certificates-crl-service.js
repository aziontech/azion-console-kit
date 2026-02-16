import { BaseService } from '@/services/v2/base/query/baseService'
import { DigitalCertificatesCRLAdapter } from './digital-certificates-crl-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
export class DigitalCertificatesCRLService extends BaseService {
  constructor() {
    super()
    this.adapter = DigitalCertificatesCRLAdapter
    this.baseURL = 'v4/workspace/tls/crls'
  }

  #fetchDigitalCertificatesCRL = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const body = this.adapter?.transformListDigitalCertificatesCRL(data.results)

    return { count: data.count, body }
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: [
        'id',
        'name',
        'subject_name',
        'issuer',
        'status',
        'status_detail',
        'validity',
        'type',
        'challenge',
        'authority',
        'key_algorithm',
        'last_editor',
        'last_modified',
        'managed'
      ],
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.digitalCertificatesCRL.list(defaultParams), () =>
      this.#fetchDigitalCertificatesCRL(defaultParams)
    )
  }

  listDigitalCertificatesCRL = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.digitalCertificatesCRL.list(params),
      () => this.#fetchDigitalCertificatesCRL(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  listDigitalCertificatesCRLDropdown = async ({ params }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const body = this.adapter?.transformListDigitalCertificatesCRLDropwdown(data.results)

    return { count: data.count, body }
  }

  createDigitalCertificateCRL = async (payload) => {
    const body = this.adapter?.transformCreateDigitalCertificateCRL(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesCRL.all })

    return data
  }

  loadDigitalCertificateCRL = async (payload) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${payload.id}`,
      body: payload
    })

    return this.adapter?.transformLoadDigitalCertificateCRL(data)
  }

  editDigitalCertificateCRL = async (payload) => {
    const body = this.adapter?.transformEditDigitalCertificateCRL(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesCRL.all })

    return 'Your CRL has been updated!'
  }

  deleteDigitalCertificateCRL = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesCRL.all })

    return 'CRL successfully deleted!'
  }
}

export const digitalCertificatesCRLService = new DigitalCertificatesCRLService()
