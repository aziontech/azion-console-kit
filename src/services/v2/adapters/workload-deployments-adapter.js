export const WorkloadDeploymentAdapter = {
  transformCreateWorkloadDeployment(payload) {
    return {
      name: payload.name,
      strategy: {
        type: 'default',
        attributes: {
          edge_application: payload.edgeApplication,
          edge_firewall: payload.edgeFirewall || null,
          custom_page: payload.customPage || null
        }
      }
    }
  },
  transformEditWorkloadDeployment(payload) {
    return {
      strategy: {
        type: 'default',
        attributes: {
          edge_application: payload.edgeApplication,
          edge_firewall: payload.edgeFirewall || null,
          custom_page: payload.customPage || null
        }
      }
    }
  },
  transformListWorkloadsDeployments(data) {
    return data.map((workload) => ({
      id: workload.id,
      current: workload.current,
      name: workload.name,
      edgeApplication: workload.strategy.attributes.edge_application,
      edgeFirewall: workload.strategy.attributes.edge_firewall,
      customPage: workload.strategy.attributes.custom_page
    }))
  },
  transformLoadWorkloadDeployments({ data }) {
    return {
      id: data.id,
      name: data.name,
      edgeApplication: data.strategy.attributes.edge_application,
      edgeFirewall: data.strategy.attributes.edge_firewall,
      customPage: data.strategy.attributes.custom_page,
      current: data.current
    }
  }
}
