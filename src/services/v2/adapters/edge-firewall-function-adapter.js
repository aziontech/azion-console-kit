export const EdgeFirewallFunctionAdapter = {
  transformPayloadFunction(payload) {
    return {
      name: payload.name,
      edge_function: payload.edgeFunctionID,
      json_args: JSON.parse(payload.args)
    }
  },
  transformListEdgeFirewallFunction(data) {
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
  }
}
