import { hasFlagBlockApiV4 } from '@/composables/user-flag'
import { BaseService } from '@/services/v2/base/query/baseService'
import { DigitalCertificatesAdapter } from './digital-certificates-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class DigitalCertificatesService extends BaseService {
  constructor() {
    super()
    this.adapter = DigitalCertificatesAdapter
    this.baseURL = 'v4/workspace/tls/certificates'
  }

  createDigitalCertificate = async (payload) => {
    const body = this.adapter?.transformCreateDigitalCertificate?.(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificates.all })

    return data
  }

  createDigitalCertificateLetEncrypt = async (payload, sourceCertificate) => {
    const body = this.adapter?.transformCreateDigitalCertificateLetEncrypt?.(
      payload,
      sourceCertificate
    )

    const { data: response } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/request`,
      body,
      processError: false
    })

    if (response?.meta?.certificate) {
      return { id: response.meta.certificate }
    }

    if (response?.meta) {
      throw response.error()
    }

    return response.data
  }

  editDigitalCertificate = async (payload) => {
    const body = this.adapter?.transformEditDigitalCertificate?.(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificates.all })

    return 'Your digital certificate has been updated!'
  }

  #fetchDigitalCertificates = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        pageSize: 10,
        ...params
      }
    })

    return this.adapter?.transformListDigitalCertificates?.(data, params)
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
    return this.usePrefetchQuery(queryKeys.digitalCertificates.list(defaultParams), () =>
      this.#fetchDigitalCertificates(defaultParams)
    )
  }

  listDigitalCertificates = async (params) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.digitalCertificates.list(params),
      () => this.#fetchDigitalCertificates(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  listDigitalCertificatesDropdown = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        pageSize: 10,
        ...params
      }
    })

    if (hasFlagBlockApiV4())
      return this.adapter?.transformListDigitalCertificatesDropdownToDomains?.(data, params)

    return this.adapter?.transformListDigitalCertificatesDropdownToWorkloads?.(data, params)
  }

  loadDigitalCertificate = async ({ id }) => {
    const fields = ['id', 'name', 'type', 'authority', 'csr', 'managed', 'certificate', 'status']

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`,
      params: {
        fields
      }
    })

    return this.adapter?.transformLoadDigitalCertificate?.(data)
  }

  deleteDigitalCertificate = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificates.all })

    return 'Digital certificate successfully deleted!'
  }
}

export const digitalCertificatesService = new DigitalCertificatesService()
