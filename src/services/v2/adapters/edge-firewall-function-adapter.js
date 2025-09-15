import { parseStatusData } from '../utils/adapter/parse-status-utils'

export const EdgeFirewallFunctionAdapter = {
  transformPayloadFunction(data) {
    const [payloadRequest, action] = data

    return {
      name: payloadRequest.name,
      function: payloadRequest.edgeFunctionID,
      args: JSON.parse(payloadRequest.args),
      azion_form: JSON.parse(payloadRequest.azionForm),
      ...(action === 'POST' && { active: true })
    }
  },
  transformListFunction(data) {
    return (
      data?.map((edgeFirewall) => {
        return {
          id: edgeFirewall.id,
          edgeFunctionId: edgeFirewall.function,
          name: edgeFirewall.name,
          lastEditor: edgeFirewall.last_editor,
          lastModified: edgeFirewall.last_modified,
          args: edgeFirewall.args,
          active: edgeFirewall.active
        }
      }) || []
    )
  },

  transformListFunctionsDropdown(data) {
    return data.map((item) => ({
      name: item.name,
      id: item.id
    }))
  },
  transformLoadEdgeFirewallFunction(data) {
    return {
      id: data.id,
      edgeFunctionID: data.function,
      name: data.name,
      args: JSON.stringify(data.args, null, '\t'),
      azionForm: JSON.stringify(data.azion_form, null, '\t')
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
