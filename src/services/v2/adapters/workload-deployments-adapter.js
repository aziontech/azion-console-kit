export const WorkloadAdapter = {
  transformCreateWorkloadDeployment(payload) {
    return {
      binds: {
        edge_application: payload.edgeApplication,
        edge_firewall: payload.edgeFirewall,
        custom_page: payload.customPage
      }
    }
  },
  transformListWorkloadsDeployments(data) {
    return data.map((workload) => ({
      id: workload.id,
      tag: workload.tag,
      current: workload.current,
      edgeApplication: workload.binds.edge_application,
      edgeFirewall: workload.binds.edge_firewall,
      customPage: workload.binds.custom_page
    }))
  },
  transformLoadWorkloadDeployments({ data }) {
    return {
      id: data.id,
      tag: data.tag,
      edgeApplication: data.binds.edge_application,
      edgeFirewall: data.binds.edge_firewall,
      customPage: data.binds.custom_page,
      current: data.current
    }
  }
}
