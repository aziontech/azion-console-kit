import { DigitalCertificatesV6Adapter } from '@/services/v2/digital-certificates/v6/digital-certificates-v6-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class DigitalCertificatesV6Service extends BaseService {
  #baseURL = '/tls-api/digital_certificates/api/certificates'

  #requestConfig = { accept: 'application/json; version=4' }

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
      config: this.#requestConfig
    })
    return this.#toPaginated(data, DigitalCertificatesV6Adapter.transformList)
  }

  #fetchVersions = async (id, params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}/versions`,
      params,
      config: this.#requestConfig
    })
    return this.#toPaginated(data, DigitalCertificatesV6Adapter.transformVersionsList)
  }

  list = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.digitalCertificatesV6.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  load = async ({ id }) => {
    return await this.useEnsureQueryData(queryKeys.digitalCertificatesV6.detail(id), async () => {
      const { data } = await this.http.request({
        method: 'GET',
        url: `${this.#baseURL}/${id}`,
        config: this.#requestConfig
      })
      return DigitalCertificatesV6Adapter.transformLoadItem(data)
    })
  }

  create = async (payload) => {
    const body = DigitalCertificatesV6Adapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body,
      config: this.#requestConfig
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesV6.all })

    const item = data?.data ?? data

    return { data: item }
  }

  edit = async ({ id, values }) => {
    const body = DigitalCertificatesV6Adapter.transformEditPayload(values)

    await this.http.request({
      method: 'PUT',
      url: `${this.#baseURL}/${id}`,
      body,
      config: this.#requestConfig
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesV6.all })

    return 'Certificate updated - a new version is now current'
  }

  delete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`,
      config: this.#requestConfig
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesV6.all })

    return 'Digital certificate successfully deleted'
  }

  listVersions = async ({ id, ...params }) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.digitalCertificatesV6.versions.list(id, params),
      () => this.#fetchVersions(id, params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  revert = async ({ id, versionId }) => {
    await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/revert/${versionId}`,
      body: {},
      config: this.#requestConfig
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificatesV6.all })

    return 'Certificate successfully reverted'
  }
}

export const digitalCertificatesV6Service = new DigitalCertificatesV6Service()
