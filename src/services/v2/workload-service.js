export class WorkloadService {
  constructor(http, adapter, workloadDeployment) {
    this.http = http
    this.adapter = adapter
    ;(this.baseURL = 'v4/workspace/workloads'), (this.workloadDeployment = workloadDeployment)
  }

  createWorkload = async (payload) => {
    const body = this.adapter?.transformCreateWorkload?.(payload)
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body
    })

    const workloadDeploymentPayload = {
      edgeApplication: payload.edgeApplication,
      edgeFirewall: payload.edgeFirewall,
      customPage: payload.customPage,
      id: data.data.id,
      name: 'workload-deployment'
    }

    await this.workloadDeployment.createWorkloadDeployment(workloadDeploymentPayload)

    return {
      feedback: 'Your workload has been created',
      urlToEditView: `/workloads/edit/${data.data.id}`,
      domainName: data.data.workload_domain,
      id: parseInt(data.data.id)
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
