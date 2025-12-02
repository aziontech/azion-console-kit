import { toValue } from 'vue'
import { hasAnyFieldChanged } from '../utils/hasAnyFieldChanged'
const keysToCheck = ['common_name', 'alternative_names']
import { BaseService } from '@/services/v2/base/query/baseService'
import { WorkloadAdapter } from './workload-adapter'
import { workloadDeploymentService } from './workload-deployments-service'
import { digitalCertificatesService } from '../digital-certificates/digital-certificates-service'
import { DigitalCertificatesAdapter } from '../digital-certificates/digital-certificates-adapter'

export const workloadKeys = {
  all: ['workloads'],
  lists: () => [...workloadKeys.all, 'list'],
  list: ({ page, pageSize, fields, search, ordering }) => [
    ...workloadKeys.lists(),
    page,
    pageSize,
    fields,
    search,
    ordering
  ],
  details: () => [...workloadKeys.all, 'detail'],
  detail: (id) => [...workloadKeys.details(), id]
}

export class WorkloadService extends BaseService {
  constructor() {
    super()
    this.adapter = WorkloadAdapter
    this.baseURL = 'v4/workspace/workloads'

    this.workloadDeployment = workloadDeploymentService
    this.digitalCertificate = digitalCertificatesService
    this.digitalCertificateAdapter = DigitalCertificatesAdapter

    this._certificateId = null
    this._objLetEncrypt = null
    this._workloadData = null
    this.initialDomains = null
  }

  #fetchList = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { results, count } = data
    const body = this.adapter?.transformListWorkloads?.(results) ?? results

    return { body, count }
  }

  #fetchOne = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    const workloadDeployment = await this.workloadDeployment.listWorkloadDeployment(id)
    this.initialDomains = data.data.domains

    return this.adapter?.transformLoadWorkload?.(data, workloadDeployment[0]) ?? data
  }

  ensureList = async (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: [
        'name',
        'domains',
        'workload_domain',
        'infrastructure',
        'active',
        'last_modified',
        'id',
        'last_editor',
        'product_version',
        'workload_domain'
      ],
      ordering: '-last_modified'
    }

    await this._ensureQueryData(workloadKeys.list(params), () => this.#fetchList(params), {
      persist: true
    })
  }

  #ensureCertificate = async (payload) => {
    if (!payload.tls || (payload.tls.certificate !== 1 && payload.tls.certificate !== 2)) return
    const shouldCreate =
      this._certificateId == null ||
      hasAnyFieldChanged(this.digitalCertificateAdapter, this._objLetEncrypt, payload, keysToCheck)

    if (!shouldCreate) {
      payload.tls.certificate = this._certificateId
      return
    }

    const { id } = await this.digitalCertificate.createDigitalCertificateLetEncrypt(
      payload,
      this._certificateId
    )

    payload.tls.certificate = id
    this._certificateId = id
    this._objLetEncrypt =
      this.digitalCertificateAdapter.transformCreateDigitalCertificateLetEncrypt?.(payload)
  }

  #ensureWorkload = async (payload) => {
    if (this._workloadData) {
      return this._workloadData
    }

    const body = this.adapter.transformCreateWorkload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    if (data.hasError) {
      throw data.error()
    }

    this._workloadData = data.data
    return this._workloadData
  }

  #ensureDeployment = async (payload, workloadId) => {
    if (payload._deploymentCreated) return

    const deployPayload = {
      id: workloadId,
      name: 'workload-deployment',
      application: payload.application,
      firewall: payload.firewall,
      customPage: payload.customPage
    }

    await this.workloadDeployment.createWorkloadDeployment(deployPayload)

    payload._deploymentCreated = true
    this._workloadData = null
  }

  createWorkload = async (payload) => {
    await this.#ensureCertificate(payload)
    const workload = await this.#ensureWorkload(payload)
    await this.#ensureDeployment(payload, workload.id)

    this.queryClient.removeQueries({ queryKey: workloadKeys.lists() })

    return {
      feedback:
        'Your Workload has been created. After propagation the domain will be available in the Workload URL. You also can add a custom domain.',
      urlToEditView: `/workloads/edit/${workload.id}`,
      domainName: workload.workload_domain,
      id: Number(workload.id)
    }
  }

  listWorkloads = async (params) => {
    const paramsValue = toValue(params)
    return await this._ensureQueryData(
      () => workloadKeys.list(paramsValue),
      () => this.#fetchList(paramsValue),
      { persist: paramsValue?.page === 1 && !paramsValue?.search }
    )
  }

  loadWorkload = async ({ id }) => {
    const cachedQueries = this.queryClient.getQueriesData({ queryKey: workloadKeys.details() })

    const hasDifferentId = cachedQueries.some(([key]) => {
      const cachedId = key[key.length - 1]
      return cachedId && cachedId !== id
    })

    if (hasDifferentId) {
      await this.queryClient.removeQueries({ queryKey: workloadKeys.details() })
    }

    return await this._ensureQueryData(
      () => workloadKeys.detail(id),
      () => this.#fetchOne({ id }),
      { persist: true }
    )
  }

  editWorkload = async (payload) => {
    await this.#ensureCertificateForEdit(payload)
    await this.#updateWorkload(payload)
    if (payload.workloadDeploymentId) {
      await this.#updateDeployment(payload)
    } else {
      await this.#ensureDeployment(payload, payload.id)
    }

    this.queryClient.removeQueries({ queryKey: workloadKeys.lists() })
    this.queryClient.removeQueries({ queryKey: workloadKeys.details() })

    return 'Your workload has been updated'
  }

  #dropFirstAzion = (domains) => {
    return domains.filter((domain, index) => !(index === 0 && domain.endsWith('.azion.app')))
  }

  #handleDomains = (payload) => {
    const [first, ...rest] = payload.domains

    const commonName = `${first.subdomain ? `${first.subdomain}.` : ''}${first.domain}`
    const alternativeNames = rest
      .map(({ subdomain, domain }) => `${subdomain ? `${subdomain}.` : ''}${domain}`)
      .filter((name) => name.trim() !== '.')
    payload.letEncrypt.commonName = commonName
    payload.letEncrypt.alternativeNames = alternativeNames.filter((name) => name !== '')
  }

  #ensureCertificateForEdit = async (payload) => {
    const isNewCertificate = payload.tls.certificate === 1
    const isLetsEncrypt = payload.authorityCertificate === 'lets_encrypt'

    const [commonName, ...alternativeNames] = this.#dropFirstAzion(this.initialDomains)

    const letEncryptBase = {
      common_name: commonName || '',
      alternative_names: alternativeNames
    }

    let shouldCreate = false

    if (isNewCertificate) {
      shouldCreate = true
      this.#handleDomains(payload)
    } else if (isLetsEncrypt) {
      this.#handleDomains(payload)
      const changed = hasAnyFieldChanged(
        this.digitalCertificateAdapter,
        letEncryptBase,
        payload,
        keysToCheck
      )
      shouldCreate = changed
    }

    if (!shouldCreate) {
      return
    }

    const opts = isNewCertificate ? null : payload.tls.certificate
    const certificate = await this.digitalCertificate.createDigitalCertificateLetEncrypt(
      payload,
      opts
    )

    payload.tls.certificate = certificate.id
    this._certificateId = certificate.id
    this._objLetEncrypt =
      this.digitalCertificateAdapter.transformCreateDigitalCertificateLetEncrypt?.(payload)
  }

  #updateWorkload = async (payload) => {
    const body = this.adapter.transformCreateWorkload(payload)
    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
    })
  }

  #updateDeployment = async (payload) => {
    const deployPayload = {
      id: payload.workloadDeploymentId,
      application: payload.application,
      firewall: payload.firewall,
      customPage: payload.customPage
    }
    await this.workloadDeployment.updateWorkloadDeployment(payload.id, deployPayload)
  }

  deleteWorkload = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: workloadKeys.lists() })

    return `Workload successfully deleted.`
  }
}

export const workloadService = new WorkloadService()
