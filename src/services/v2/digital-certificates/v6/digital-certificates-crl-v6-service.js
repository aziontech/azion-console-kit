import { DigitalCertificatesCRLV6Adapter } from '@/services/v2/digital-certificates/v6/digital-certificates-crl-v6-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class DigitalCertificatesCRLV6Service extends BaseService {
  #baseURL = '/tls-api/digital_certificates/api/crls'
  #config = { accept: 'application/json; version=4' }

  #toPaginated = (data, transform) => {
    const results = Array.isArray(data) ? data : (data?.results ?? [])
    const count = Array.isArray(data) ? data.length : (data?.count ?? results.length)
    return { count, body: transform(results) }
  }

  #fetchList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params,
      config: this.#config
    })
    return this.#toPaginated(data, DigitalCertificatesCRLV6Adapter.transformList)
  }

  #fetchVersions = async (id, params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}/versions`,
      params,
      config: this.#config
    })
    return this.#toPaginated(data, DigitalCertificatesCRLV6Adapter.transformVersionsList)
  }

  list = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.digitalCertificatesCRLV6.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  load = async ({ id }) => {
    return await this.useEnsureQueryData(
      queryKeys.digitalCertificatesCRLV6.detail(id),
      async () => {
        const { data } = await this.http.request({
          method: 'GET',
          url: `${this.#baseURL}/${id}`,
          config: this.#config
        })
        return DigitalCertificatesCRLV6Adapter.transformLoadItem(data)
      }
    )
  }

  create = async (payload) => {
    const body = DigitalCertificatesCRLV6Adapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body,
      config: this.#config
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesCRLV6.all })

    const item = data?.data ?? data

    return { data: item }
  }

  edit = async ({ id, values }) => {
    const body = DigitalCertificatesCRLV6Adapter.transformEditPayload(values)

    await this.http.request({
      method: 'PUT',
      url: `${this.#baseURL}/${id}`,
      body,
      config: this.#config
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesCRLV6.all })

    return 'CRL updated - a new version is now current'
  }

  delete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`,
      config: this.#config
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesCRLV6.all })

    return 'CRL successfully deleted'
  }

  listVersions = async ({ id, ...params }) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.digitalCertificatesCRLV6.versions.list(id, params),
      () => this.#fetchVersions(id, params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  rollback = async ({ id, versionId }) => {
    await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/rollback/${versionId}`,
      body: {},
      config: this.#config
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesCRLV6.all })

    return 'CRL successfully rolled back'
  }
}

export const digitalCertificatesCRLV6Service = new DigitalCertificatesCRLV6Service()
