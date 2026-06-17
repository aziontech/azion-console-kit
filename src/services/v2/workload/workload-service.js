import { BaseService } from '@/services/v2/base/query/baseService'
import { WorkloadAdapter } from './workload-adapter'
import { workloadDeploymentService } from './workload-deployments-service'
import { digitalCertificatesService } from '../digital-certificates/digital-certificates-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { edgeDNSService } from '../edge-dns/edge-dns-service'

const LE_CREATE_NEW = 1
const LE_REUSE = 2

const buildFqdn = (domain) =>
  `${domain.subdomain ? `${domain.subdomain}.` : ''}${domain.domain || ''}`

const isLetsEncryptSentinel = (value) => value === LE_CREATE_NEW || value === LE_REUSE

export class WorkloadService extends BaseService {
  constructor() {
    super()
    this.adapter = WorkloadAdapter
    this.baseURL = 'v4/workspace/workloads'

    this.workloadDeployment = workloadDeploymentService
    this.digitalCertificate = digitalCertificatesService
    this.edgeDNS = edgeDNSService

    this._certificateIds = new Map()
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
    const [workloadDeployment, zonesResponse, workloadResponse] = await Promise.all([
      this.workloadDeployment.listWorkloadDeployment(id),
      this.edgeDNS
        .listEdgeDNSService({ fields: ['domain'], active: 'True' })
        .catch(() => ({ body: [] })),
      this.http.request({ method: 'GET', url: `${this.baseURL}/${id}` })
    ])

    const zones = (zonesResponse?.body || []).map((zone) => zone.domain?.content ?? zone.domain)

    return (
      this.adapter?.transformLoadWorkload?.(workloadResponse.data, workloadDeployment[0], zones) ??
      workloadResponse.data
    )
  }

  prefetchList = (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      ordering: '-last_modified'
    }

    return this.usePrefetchQuery(queryKeys.workload.list(params), () => this.#fetchList(params))
  }

  #createDomainLetEncrypt = async (payload, domain) => {
    const fqdn = buildFqdn(domain)
    if (!fqdn) return null

    const cached = this._certificateIds.get(fqdn)
    if (cached) {
      domain.certificate = cached
      return cached
    }

    const letEncryptPayload = {
      ...payload,
      letEncrypt: { commonName: fqdn, alternativeNames: [] },
      tls: { ...(payload.tls || {}), certificate: domain.certificate }
    }

    const opts = domain.certificate === LE_REUSE ? domain.certificate : null
    const { id } = await this.digitalCertificate.createDigitalCertificateLetEncrypt(
      letEncryptPayload,
      opts
    )

    domain.certificate = id
    this._certificateIds.set(fqdn, id)
    return id
  }

  #ensureCertificate = async (payload) => {
    if (!Array.isArray(payload.domains) || !payload.domains.length) return

    for (const domain of payload.domains) {
      if (!isLetsEncryptSentinel(domain.certificate)) continue
      await this.#createDomainLetEncrypt(payload, domain)
    }
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

    this.queryClient.invalidateQueries({ queryKey: queryKeys.workload.all })
    this.queryClient.removeQueries({ queryKey: queryKeys.workload.all })

    return {
      feedback:
        'Your Workload has been created. After propagation the domain will be available in the Workload URL. You also can add a custom domain.',
      urlToEditView: `/workloads/edit/${workload.id}`,
      domainName: workload.workload_domain,
      id: Number(workload.id)
    }
  }

  listWorkloads = async ({ skipCache, hasFilter, ...apiParams } = {}) => {
    const firstPage = apiParams?.page === 1
    const shouldSkipCache = skipCache || hasFilter

    return await this.useEnsureQueryData(
      queryKeys.workload.list(apiParams),
      () => this.#fetchList(apiParams),
      {
        persist: firstPage && !shouldSkipCache,
        skipCache: shouldSkipCache
      }
    )
  }

  loadWorkload = async ({ id }) => {
    const workload = await this.useEnsureQueryData(
      queryKeys.workload.detail(id),
      () => this.#fetchOne({ id }),
      { persist: false }
    )

    this.initialDomains = workload.initialDomains || []

    return workload
  }

  editWorkload = async (payload) => {
    await this.#ensureCertificateForEdit(payload)
    await this.#updateWorkload(payload)
    if (payload.workloadDeploymentId) {
      await this.#updateDeployment(payload)
    } else {
      await this.#ensureDeployment(payload, payload.id)
    }

    this.queryClient.removeQueries({ queryKey: queryKeys.workload.all })

    return 'Your workload has been updated'
  }

  #initialFqdnSet = () => {
    return new Set(
      (this.initialDomains || [])
        .map((domain) => (typeof domain === 'string' ? domain : domain?.name))
        .filter(Boolean)
    )
  }

  #certificateIsWildcard = (subjctName) => {
    if (Array.isArray(subjctName)) {
      return subjctName.some((name) => typeof name === 'string' && name.trim().startsWith('*'))
    }

    if (typeof subjctName === 'string') {
      return subjctName.trim().startsWith('*')
    }

    return false
  }

  #getWildcardBaseDomains = (subjectName) =>
    (Array.isArray(subjectName) ? subjectName : [subjectName]).reduce((acc, name) => {
      if (typeof name === 'string') {
        const domain = name.trim().slice(1).replace(/^\.+/, '')
        if (name.trim().startsWith('*') && domain) acc.push(domain)
      }
      return acc
    }, [])

  #hostnameIsSubdomainOf = (hostname, baseDomain) => {
    if (typeof hostname !== 'string' || typeof baseDomain !== 'string') return false
    const host = hostname.trim().toLowerCase()
    const base = baseDomain.trim().toLowerCase()

    if (!host || !base) return false
    if (!host.endsWith(`.${base}`)) return false

    // ensures there is at least one label before baseDomain
    return host.length > base.length + 1
  }

  #hasUncoveredHostnamesForWildcard = (subjctName, hostnames) => {
    const bases = this.#getWildcardBaseDomains(subjctName)
    if (!bases.length) return []

    const uncovered = (hostnames || []).filter((hostname) => {
      return !bases.some((base) => this.#hostnameIsSubdomainOf(hostname, base))
    })

    return !uncovered.length
  }

  #shouldSkipLetsEncryptRecreation = ({ changed, subjctName, hostnames }) => {
    if (!changed) return false
    if (!this.#certificateIsWildcard(subjctName)) return false
    return this.#hasUncoveredHostnamesForWildcard(subjctName, hostnames)
  }

  #ensureCertificateForEdit = async (payload) => {
    if (!Array.isArray(payload.domains) || !payload.domains.length) return

    const initialFqdns = this.#initialFqdnSet()

    for (const domain of payload.domains) {
      if (!isLetsEncryptSentinel(domain.certificate)) continue

      const fqdn = buildFqdn(domain)
      if (!fqdn) continue

      const isNewCertificate = domain.certificate === LE_CREATE_NEW
      let shouldCreate = isNewCertificate

      if (!isNewCertificate) {
        const hostnameChanged = !initialFqdns.has(fqdn)
        const skipRecreation = this.#shouldSkipLetsEncryptRecreation({
          changed: hostnameChanged,
          subjctName: payload.subjctName,
          hostnames: [fqdn]
        })

        if (skipRecreation) continue
        shouldCreate = hostnameChanged
      }

      if (!shouldCreate) continue

      await this.#createDomainLetEncrypt(payload, domain)
    }
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

    this.queryClient.removeQueries({ queryKey: queryKeys.workload.all })

    return `Workload successfully deleted.`
  }

  getWorkloadFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.workload.all,
      id,
      select: (item) => this.adapter.transformCachedWorkloadToEdit(item),
      listPath: 'body'
    })
  }

  getDomainFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.workload.all,
      id,
      select: (item) => ({
        id: item.id,
        name: item.name?.text ?? item.name,
        active: item.active?.content === 'Active',
        domainName: item.workloadHostname?.content,
        environment: item.infrastructure === 'Production' ? 'production' : 'staging',
        cnames: item?.domains?.join('\n') || ''
      }),
      listPath: 'body'
    })
  }
}

export const workloadService = new WorkloadService()
