import { createHttpService } from './base/httpServiceFactory'
import { EdgeFunctionService } from './edge-function-service'
import { EdgeFunctionsAdapter } from './adapters/edge-function-adapter'

export class EdgeApplicationFunctionService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_application/applications'
  }

  #getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/functions${suffix}`
  }

  #getEdgeFunctionService = () => {
    const httpService = createHttpService()
    return new EdgeFunctionService(httpService, EdgeFunctionsAdapter)
  }

  listFunctions = async (edgeApplicationId, params = { pageSize: 10, fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeApplicationId),
      params
    })

    const { results } = data

    return this.adapter?.transformListFunctions?.(results, params?.fields) ?? results
  }

  listEdgeApplicationFunctions = async (
    edgeApplicationId,
    params = { pageSize: 10, fields: [] }
  ) => {
    params.fields = ['id', 'name', 'last_editor', 'last_modified', 'edge_function']
    const funcions = await this.listFunctions(edgeApplicationId, params)
    if (!funcions) return []

    const edgeFunctions = await Promise.all(
      funcions.map(async (funcion) => {
        const paramsEdgeFunction = { fields: ['name', 'version'] }
        return await this.#getEdgeFunctionService().loadEdgeFunctionByEdgeApplicationFunction(
          funcion,
          paramsEdgeFunction
        )
      })
    )

    return {
      count: funcions?.count,
      body: edgeFunctions
    }
  }

  loadEdgeApplicationFunction = async ({ edgeApplicationID, functionID }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeApplicationID, `/${functionID}`)
    })

    return this.adapter?.transformLoadEdgeApplicationFunction(data) ?? data
  }

  createEdgeApplicationFunction = async (payload) => {
    const edgeApplicationId = payload.id
    const body = this.adapter?.transformPayload(payload)

    await this.http.request({
      method: 'POST',
      url: this.#getUrl(edgeApplicationId),
      body
    })

    return {
      feedback: 'Your Function has been created'
    }
  }

  editEdgeApplicationFunction = async (payload) => {
    const body = this.adapter?.transformEditPayload(payload)

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.edgeApplicationID, `/${payload.id}`),
      body
    })

    return 'Your Function has been updated'
  }

  deleteEdgeApplicationFunction = async (functionID, edgeApplicationID) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeApplicationID, `/${functionID}`)
    })

    return 'Your Function successfully deleted'
  }
}
