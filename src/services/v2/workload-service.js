export class WorkloadService {
  constructor(http, adapter, workloadDeployment, digitalCertificate, digitalCertificateAdapter) {
    this.http = http
    this.adapter = adapter
    this.certificateId = null
    this.objLetEncrypt = null
    this.workload = null
    ;(this.baseURL = 'v4/workspace/workloads'),
      (this.workloadDeployment = workloadDeployment),
      (this.digitalCertificate = digitalCertificate),
      (this.digitalCertificateAdapter = digitalCertificateAdapter)
  }

  _hasAnyFieldChanged(oldObj, newObj, keysToCheck) {
    if (!oldObj) return false
    const payload =
      this.digitalCertificateAdapter.transformCreateDigitalCertificateLetEncrypt?.(newObj)
    return keysToCheck.some((key) => oldObj[key] !== payload[key])
  }

  createWorkload = async (payload) => {
    const keysToCheck = ['common_name', 'alternative_names']

    if (payload.tls.certificate === 1) {
      if (this._hasAnyFieldChanged(this.objLetEncrypt, payload, keysToCheck)) {
        // TODO update let encrypt here
        const certificate = await this.digitalCertificate.createDigitalCertificateLetEncrypt(
          payload,
          this.certificateId
        )
        payload.tls.certificate = certificate.id
        this.certificateId = certificate.id
        this.objLetEncrypt = certificate
      } else if (this.certificateId === null) {
        const certificate = await this.digitalCertificate.createDigitalCertificateLetEncrypt(
          payload
        )
        payload.tls.certificate = certificate.id
        this.certificateId = certificate.id
        this.objLetEncrypt = certificate
      }
      payload.tls.certificate = this.certificateId
    }

    const body = this.adapter?.transformCreateWorkload?.(payload)

    if (!this.workload) {
      const { data } = await this.http.request({
        method: 'POST',
        url: `${this.baseURL}`,
        body
      })
      this.workload = data.data
    }

    const workloadDeploymentPayload = {
      edgeApplication: payload.edgeApplication,
      edgeFirewall: payload.edgeFirewall,
      customPage: payload.customPage,
      id: this.workload.id,
      name: 'workload-deployment'
    }

    await this.workloadDeployment.createWorkloadDeployment(workloadDeploymentPayload)

    return {
      feedback:
        'Your workload has been created. After propagation the domain will be available in the Workload URL. You also can add a custom domain.',
      urlToEditView: `/workloads/edit/${this.workload.id}`,
      domainName: this.workload.workload_domain,
      id: parseInt(this.workload.id)
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

    return this.adapter?.transformLoadWorkload?.(data, workloadDeployment[0]) || data
  }

  editWorkload = async (payload) => {
    if (payload.tls.certificate === 1) {
      const { id } = await this.digitalCertificate.createDigitalCertificateLetEncrypt(payload)
      payload.tls.certificate = id
    }

    const body = this.adapter?.transformCreateWorkload?.(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    const workloadDeploymentPayload = {
      id: payload.workloadDeploymentId,
      edgeApplication: payload.edgeApplication,
      edgeFirewall: payload.edgeFirewall,
      customPage: payload.customPage
    }

    await this.workloadDeployment.updateWorkloadDeployment(payload.id, workloadDeploymentPayload)

    return 'Your workload has been updated'
  }

  deleteWorkload = async (id, { name }) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return `Workload ${name} successfully deleted.`
  }
}
