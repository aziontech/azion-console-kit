import { BaseService } from '@/services/v2/base/query/baseService'
import { WorkloadDeploymentAdapter } from './workload-deployments-adapter'
export class WorkloadDeploymentService extends BaseService {
  constructor() {
    super()
    this.adapter = WorkloadDeploymentAdapter
    this.baseURL = 'v4/workspace/workloads'
  }

  #getUrl(workloadId, suffix = '') {
    return `${this.baseURL}/${workloadId}/deployments${suffix}`
  }

  createWorkloadDeployment = async (payload) => {
    const body = this.adapter?.transformCreateWorkloadDeployment?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(payload.id),
      body
    })

    return response
  }

  updateWorkloadDeployment = async (workloadId, payload) => {
    const body = this.adapter?.transformEditWorkloadDeployment?.(payload)

    const { data: response } = await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(workloadId, `/${payload.id}`),
      body
    })

    return response
  }

  listWorkloadDeployment = async (id, params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(id),
      params
    })

    return this.adapter?.transformListWorkloadsDeployments?.(data.results) || data.results
  }

  loadWorkloadDeployment = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(id)
    })

    return this.adapter?.transformLoadWorkloadDeployments?.(data) || data
  }
}

export const workloadDeploymentService = new WorkloadDeploymentService()
