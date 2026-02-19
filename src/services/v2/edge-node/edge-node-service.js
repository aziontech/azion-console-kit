import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class EdgeNodeService extends BaseService {
  constructor() {
    super()
    this.baseURL = '/api/v3/edge_nodes'
  }

  #parseOrdering(ordering) {
    if (!ordering) return { orderBy: 'id', sort: 'asc' }
    const isDesc = ordering.startsWith('-')
    const field = isDesc ? ordering.slice(1) : ordering
    return { orderBy: field, sort: isDesc ? 'desc' : 'asc' }
  }

  #buildListUrl(params = {}) {
    const { page = 1, pageSize = 200, ordering, search } = params
    const { orderBy, sort } = this.#parseOrdering(ordering)

    const searchParams = new URLSearchParams()
    searchParams.set('order_by', orderBy)
    searchParams.set('sort', sort)
    searchParams.set('page', page)
    searchParams.set('page_size', pageSize)

    if (search) {
      searchParams.set('search', search)
    }

    return `${this.baseURL}?${searchParams.toString()}`
  }

  #adaptListItem(element) {
    return {
      id: element.id,
      name: element.name,
      groups: element.groups || [],
      hashId: element.hash_id,
      status: {
        content: element.status,
        severity: element.status === 'Authorized' ? 'success' : 'warning'
      }
    }
  }

  #fetchList = async (params = {}) => {
    const url = this.#buildListUrl(params)

    const { data } = await this.http.request({
      method: 'GET',
      url
    })

    const nodes = Array.isArray(data.nodes) ? data.nodes : []
    const body = nodes.map((element) => this.#adaptListItem(element))

    return {
      count: data.count || body.length,
      body
    }
  }

  listEdgeNodeService = async (params) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.search || params?.hasFilter

    return await this.useEnsureQueryData(
      queryKeys.edgeNode.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getEdgeNodeFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.edgeNode.all,
      id,
      listPath: 'body',
      select: (item) => ({
        id: item.id,
        name: item.name,
        hashId: item.hashId,
        groups: item.groups
      })
    })
  }

  #fetchOne = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return {
      id,
      name: data.name,
      hashId: data.hash_id,
      groups: data.groups || [],
      hasServices: data.has_services
    }
  }

  loadEdgeNodeService = async ({ id }) => {
    return await this.useEnsureQueryData(
      queryKeys.edgeNode.detail(id),
      () => this.#fetchOne({ id }),
      { persist: false }
    )
  }

  editEdgeNodeService = async (payload) => {
    const body = {
      name: payload.name,
      hashId: payload.hashId,
      groups: payload.groups || [],
      status: payload.status,
      has_services: payload.hasServices
    }

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })
    return 'Your edge node has been updated'
  }

  deleteEdgeNodeService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })
    return 'Edge Node successfully deleted'
  }

  authorizeEdgeNodeService = async (id) => {
    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${id}`,
      body: { status: 'Authorized' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })
  }

  #adaptServiceItem(element) {
    return {
      id: element.bind_id,
      name: element.name,
      serviceId: element.service_id,
      lastEditor: element.last_editor,
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
        new Date(element.updated_at)
      ),
      status: element.is_active
        ? { content: 'Active', severity: 'success' }
        : { content: 'Inactive', severity: 'danger' }
    }
  }

  #fetchServicesList = async (edgeNodeId, params = {}) => {
    const { page = 1 } = params
    const searchParams = new URLSearchParams()
    searchParams.set('page', page)
    searchParams.set('page_size', 1000000)
    searchParams.set('is_bound', true)

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${edgeNodeId}/services?${searchParams.toString()}`
    })

    const services = Array.isArray(data.services) ? data.services : []
    return services.map((element) => this.#adaptServiceItem(element))
  }

  listEdgeNodeServicesService = async (edgeNodeId, params = {}) => {
    return await this.useEnsureQueryData(
      queryKeys.edgeNode.services.list(edgeNodeId, params),
      () => this.#fetchServicesList(edgeNodeId, params),
      { persist: false }
    )
  }

  prefetchEdgeNodeServicesList = async (edgeNodeId) => {
    return await this.listEdgeNodeServicesService(edgeNodeId, { page: 1 })
  }

  invalidateEdgeNodeServicesCache = (edgeNodeId) => {
    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeNode.services.all(edgeNodeId)
    })
  }

  #parseCodeToVariables(code) {
    if (!code) return []
    const lines = code.trim().split(/\r?\n/)
    return lines.map((line) => {
      const [name, ...rest] = line.split('=')
      const value = rest.join('=')
      return { name: name.trim(), value: value.trim() }
    })
  }

  createEdgeNodeServiceService = async (payload) => {
    const { id: edgeNodeId, serviceId, variables } = payload

    await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${edgeNodeId}/services`,
      body: {
        service_id: serviceId,
        variables: this.#parseCodeToVariables(variables)
      }
    })

    this.invalidateEdgeNodeServicesCache(edgeNodeId)
    return { feedback: 'Service was added to the edge node' }
  }

  loadEdgeNodeServiceDetailService = async ({ id, edgeNodeId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${edgeNodeId}/services/${id}`
    })

    let variables = ''
    if (data.variables?.length) {
      variables = data.variables.map((obj) => `${obj.name}=${obj.value}`).join('\n')
    }

    return {
      id,
      serviceId: data.service_id,
      variables
    }
  }

  editEdgeNodeServiceService = async (payload) => {
    const { edgeNodeId, id, name, variables } = payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${edgeNodeId}/services/${id}`,
      body: {
        id: edgeNodeId,
        service_id: id,
        service_name: name,
        variables: this.#parseCodeToVariables(variables)
      }
    })

    this.invalidateEdgeNodeServicesCache(edgeNodeId)
    return 'Your service on edge node has been updated'
  }

  deleteEdgeNodeServiceService = async ({ edgeNodeId, id }) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${edgeNodeId}/services/${id}`
    })

    this.invalidateEdgeNodeServicesCache(edgeNodeId)
    return 'Service successfully unbound'
  }
}

export const edgeNodeService = new EdgeNodeService()
