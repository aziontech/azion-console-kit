export const EdgeFirewallFunctionAdapter = {
  transformPayloadFunction(data, action) {
    const payload = {
      name: data.name,
      edge_function: data.edgeFunctionID,
      json_args: JSON.parse(data.args)
    }

    if (action === 'POST') {
      payload.active = true
    }

    return payload
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
          args: edgeFirewall.json_args
        }
      }) || []
    )
  },
  transformLoadEdgeFirewallFunction({ data }) {
    return {
      id: data.id,
      edgeFunctionID: data.edge_function,
      name: data.name,
      args: JSON.stringify(data.json_args, null, '\t')
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
          modified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(edgeFirewallFunction.lastModified)
          )
        }
      }) || []
    )
  }
}
