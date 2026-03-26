import { hasAnyFieldChanged } from '../utils/hasAnyFieldChanged'
const keysToCheck = ['common_name', 'alternative_names']
import { BaseService } from '@/services/v2/base/query/baseService'
import { WorkloadAdapter } from './workload-adapter'
import { workloadDeploymentService } from './workload-deployments-service'
import { digitalCertificatesService } from '../digital-certificates/digital-certificates-service'
import { DigitalCertificatesAdapter } from '../digital-certificates/digital-certificates-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { edgeDNSService } from '../edge-dns/edge-dns-service'

export class WorkloadService extends BaseService {
  constructor() {
    super()
    this.adapter = WorkloadAdapter
    this.baseURL = 'v4/workspace/workloads'

    this.workloadDeployment = workloadDeploymentService
    this.digitalCertificate = digitalCertificatesService
    this.digitalCertificateAdapter = DigitalCertificatesAdapter
    this.edgeDNS = edgeDNSService

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

      const hostnames = [payload.letEncrypt.commonName, ...payload.letEncrypt.alternativeNames]
      const skipRecreation = this.#shouldSkipLetsEncryptRecreation({
        changed,
        subjctName: payload.subjctName,
        hostnames
      })

      if (skipRecreation) {
        return
      }
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

  #transformPatchDomainsPayload = (payload) => {
    let domains = payload.domains
      .filter((item) => item.domain && item.domain.trim() !== '')
      .map((item) => item.domain)

    if (payload.useCustomDomain && payload.customDomain) {
      const customDomain = payload.customDomain.trim()
      const domainWithSuffix = customDomain.endsWith('.azion.app')
        ? customDomain
        : `${customDomain}.azion.app`
      domains.unshift(domainWithSuffix)
    }

    return {
      domains,
      workload_hostname_allow_access: payload.workloadHostnameAllowAccess ?? false
    }
  }

  patchWorkloadDomains = async (workloadId, payload) => {
    const body = this.#transformPatchDomainsPayload(payload)

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${workloadId}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.workload.all })

    return 'Your domain settings have been updated'
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
