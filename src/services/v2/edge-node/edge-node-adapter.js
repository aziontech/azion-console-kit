const nodeStatusMap = {
  authorized: 'Authorized',
  waiting_authorization: 'Waiting Authorization'
}

export const EdgeNodeAdapter = {
  /**
   * V3 list adapter - identical to old list-edge-node-service adapt()
   */
  transformList(data) {
    const isArray = Array.isArray(data)

    return isArray && data.length
      ? data.map((element) => ({
          id: element.id,
          name: element.name,
          groups: element.groups.map((obj) => obj.name),
          hashId: element.hash_id,
          status: {
            content: element.status,
            severity: element.status === 'Authorized' ? 'success' : 'warning'
          }
        }))
      : []
  },

  /**
   * V4 list adapter - identical to old v4/list-edge-node-service adapt()
   */
  transformListV4(data) {
    const isArray = Array.isArray(data)

    return isArray && data.length
      ? data.map((element) => ({
          id: element.id,
          name: element.name,
          hashId: element.hash_id,
          status: {
            content: nodeStatusMap[element.status],
            severity: element.status === 'authorized' ? 'success' : 'warning'
          }
        }))
      : []
  },

  /**
   * Identical to the old load-edge-node-service adapt()
   */
  transformLoad(data, id) {
    return {
      name: data.name,
      id: id,
      hashId: data.hash_id,
      groups: data.groups,
      hasServices: data.has_services
    }
  },

  /**
   * Identical to the old edit-edge-node-service adapt()
   */
  transformPayload(payload) {
    let groups = payload.groups || []

    return {
      name: payload.name,
      hashId: payload.hashId,
      groups,
      status: payload.status,
      has_services: payload.hasServices
    }
  },

  /**
   * Identical to the old list-service-edge-node-service adapt()
   */
  transformServicesList(data) {
    const isArray = Array.isArray(data)

    return isArray && data.length
      ? data.map((element) => ({
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
        }))
      : []
  },

  /**
   * Identical to the old load-service-edge-node-service adapt()
   */
  transformLoadService(data, id) {
    let variables = ''

    if (data.variables?.length) {
      variables = data.variables.map((obj) => `${obj.name}=${obj.value}`).join('\n')
    }

    return {
      id: id,
      serviceId: data.service_id,
      variables: variables
    }
  },

  /**
   * Identical to the old create-service-edge-node-service adapt()
   */
  transformCreateServicePayload(payload) {
    return {
      service_id: payload.serviceId,
      variables: this.parseCodeToVariables(payload.variables)
    }
  },

  /**
   * Identical to the old edit-service-edge-node-services adapt()
   */
  transformEditServicePayload({ edgeNodeId, id, name, variables }) {
    return {
      id: edgeNodeId,
      service_id: id,
      service_name: name,
      variables: this.parseCodeToVariables(variables)
    }
  },

  parseCodeToVariables(code) {
    if (!code) return []
    const lines = code.trim().split(/\r?\n/)

    return lines.map((line) => {
      const [name, ...rest] = line.split('=')
      const value = rest.join('=')
      return { name: name.trim(), value: value.trim() }
    })
  }
}
