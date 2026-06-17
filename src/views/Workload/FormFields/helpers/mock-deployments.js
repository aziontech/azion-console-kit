import { ref } from 'vue'

// TODO: replace with workloadDeploymentService.listWorkloadDeployment / createWorkloadDeployment
// when the deployment-per-environment endpoint is wired up.

let nextId = 100

export const mockDeployments = ref([
  {
    id: 1,
    name: 'Default deployment',
    resourceTypes: ['application', 'firewall', 'customPage'],
    resources: { application: null, firewall: null, customPage: null }
  }
])

export const addMockDeployment = ({ name, resourceTypes = [], resources = {} }) => {
  const id = ++nextId
  mockDeployments.value = [
    ...mockDeployments.value,
    {
      id,
      name,
      resourceTypes: [...resourceTypes],
      resources: { ...resources }
    }
  ]
  return id
}

export const getMockDeployment = (id) =>
  mockDeployments.value.find((deployment) => deployment.id === id) || null
