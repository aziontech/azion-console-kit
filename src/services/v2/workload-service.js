import { hasAnyFieldChanged } from './utils/hasAnyFieldChanged'
const keysToCheck = ['common_name', 'alternative_names']

export class WorkloadService {
  constructor(http, adapter, workloadDeployment, digitalCertificate, digitalCertificateAdapter) {
    this.http = http
    this.adapter = adapter
    this._certificateId = null
    this._objLetEncrypt = null
    this._workloadData = null
    this.initialDomains = null
    ;(this.baseURL = 'v4/workspace/workloads'),
      (this.workloadDeployment = workloadDeployment),
      (this.digitalCertificate = digitalCertificate),
      (this.digitalCertificateAdapter = digitalCertificateAdapter)
  }

  #ensureCertificate = async (payload) => {
    if (payload.tls.certificate !== 1) return
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

    this._workloadData = data.data
    return this._workloadData
  }

  #ensureDeployment = async (payload, workloadId) => {
    if (payload._deploymentCreated) return

    const deployPayload = {
      id: workloadId,
      name: 'workload-deployment',
      edgeApplication: payload.edgeApplication,
      edgeFirewall: payload.edgeFirewall,
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

    return {
      feedback:
        'Your workload has been created. After propagation the domain will be available in the Workload URL. You also can add a custom domain.',
      urlToEditView: `/workloads/edit/${workload.id}`,
      domainName: workload.workload_domain,
      id: Number(workload.id)
    }
  }

  listWorkloads = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}`,
      params
    })

    const { results, count } = data

    const transformed = this.adapter?.transformListWorkloads?.(results) || results

    return {
      count,
      body: transformed
    }
  }

  loadWorkload = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    const workloadDeployment = await this.workloadDeployment.listWorkloadDeployment(id)

    this.initialDomains = data.data.domains
    return this.adapter?.transformLoadWorkload?.(data, workloadDeployment[0]) || data
  }

  editWorkload = async (payload) => {
    await this.#ensureCertificateForEdit(payload)
    await this.#updateWorkload(payload)
    await this.#updateDeployment(payload)

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
    payload.letEncrypt.alternativeNames = alternativeNames
  }

  #ensureCertificateForEdit = async (payload) => {
    const isNewCertificate = payload.tls.certificate === 1
    const isLetsEncrypt = payload.authorityCertificate === 'lets_encrypt'

    const [commonName, ...alternativeNames] = this.#dropFirstAzion(this.initialDomains)
    const letEncryptBase = {
      common_name: commonName,
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
      edgeApplication: payload.edgeApplication,
      edgeFirewall: payload.edgeFirewall,
      customPage: payload.customPage
    }
    await this.workloadDeployment.updateWorkloadDeployment(payload.id, deployPayload)
  }

  deleteWorkload = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return `Workload successfully deleted.`
  }
}
