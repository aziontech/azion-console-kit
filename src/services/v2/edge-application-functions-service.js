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

  #enrichFunctionsWithNames = async (functions) => {
    const unresolvedIds = new Set(functions.map((fn) => fn.edgeFunction))
    const enriched = []
    const nameMap = new Map()

    let page = 1
    const pageSize = 100

    while (unresolvedIds.size > 0) {
      const { body: data } = await this.#getEdgeFunctionService().listEdgeFunctions({
        page,
        pageSize,
        fields: ['id', 'name', 'version', 'initiator_type'],
        initiatorType: 'edge_application'
      })
      if (!data?.length) break

      data.forEach((fn) => nameMap.set(fn.id, fn.name, fn.version))

      for (const instance of functions) {
        if (unresolvedIds.has(instance.edgeFunction) && nameMap.has(instance.edgeFunction)) {
          enriched.push({
            ...instance,
            functionInstanced: nameMap.get(instance.edgeFunction),
            version: nameMap.get(instance.edgeFunction)
          })
          unresolvedIds.delete(instance.edgeFunction)
        }
      }

      if (data.length < pageSize) break
      page++
    }

    return enriched
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
    const functions = await this.listFunctions(edgeApplicationId, params)
    if (!functions) return []

    const enrichedFunctions = await this.#enrichFunctionsWithNames(functions)

    return {
      count: functions?.count,
      body: enrichedFunctions
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

    return {
      feedback: 'Your Function successfully deleted'
    }
  }
}
