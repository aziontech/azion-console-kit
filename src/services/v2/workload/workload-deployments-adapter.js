export const WorkloadDeploymentAdapter = {
  transformCreateWorkloadDeployment(payload) {
    return {
      name: payload.name,
      strategy: {
        type: 'default',
        attributes: {
          application: payload.application,
          firewall: payload.firewall || null,
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
          application: payload.application,
          firewall: payload.firewall || null,
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
      application: workload.strategy.attributes.application,
      firewall: workload.strategy.attributes.firewall,
      customPage: workload.strategy.attributes.custom_page
    }))
  },
  transformLoadWorkloadDeployments({ data }) {
    return {
      id: data.id,
      name: data.name,
      application: data.strategy.attributes.application,
      firewall: data.strategy.attributes.firewall,
      customPage: data.strategy.attributes.custom_page,
      current: data.current
    }
  }
}
