export class WorkloadService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/workloads'
  }

  createWorkload = async (payload) => {
    const body = this.adapter?.transformCreateWorkload?.(payload)
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body
    })

    return {
      feedback: 'Your workload has been created',
      urlToEditView: `/workloads/edit/${data.id}`,
      domainName: data.workload_hostname,
      id: parseInt(data.id)
    }
  }

  listWorkloads = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}`,
      params
    })

    return this.adapter?.transformListWorkloads?.(data.results) || data.results
  }

  loadWorkload = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadWorkload?.(data) || data
  }
}
