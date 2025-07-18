import { parseStatusData } from '../utils/adapter/parse-status-utils'

export const EdgeFirewallFunctionAdapter = {
  transformPayloadFunction(data) {
    const [payloadRequest, action] = data

    return {
      name: payloadRequest.name,
      edge_function: payloadRequest.edgeFunctionID,
      args: JSON.parse(payloadRequest.args),
      ...(action === 'POST' && { active: true })
    }
  },
  transformListFunction(data) {
    return (
      data?.map((edgeFirewall) => {
        return {
          id: edgeFirewall.id,
          edgeFunctionId: edgeFirewall.edge_function,
          name: edgeFirewall.name,
          lastEditor: edgeFirewall.last_editor,
          lastModified: edgeFirewall.last_modified,
          args: edgeFirewall.args,
          active: edgeFirewall.active
        }
      }) || []
    )
  },
  transformLoadEdgeFirewallFunction(data) {
    return {
      id: data.id,
      edgeFunctionID: data.edge_function,
      name: data.name,
      args: JSON.stringify(data.args, null, '\t')
    }
  },
  transformLoadEdgeFunction({ data }) {
    return {
      id: data.id,
      name: data.name,
      version: data.version || '-'
    }
  },
  transformFunction(data) {
    return (
      data?.map((edgeFirewallFunction) => {
        return {
          id: edgeFirewallFunction.id,
          name: edgeFirewallFunction.name,
          functionInstanced: edgeFirewallFunction.functionInstanced,
          lastEditor: edgeFirewallFunction.lastEditor,
          active: parseStatusData(edgeFirewallFunction.active),
          modified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(edgeFirewallFunction.lastModified)
          )
        }
      }) || []
    )
  }
}
