import { deploymentService } from '@/services/v2/deployment/deployment-service'

const sanitizeDescription = (description) =>
  typeof description === 'string' && description.trim().length > 0 ? description.trim() : null

export const createDeploymentAdapter = async (payload) => {
  const response = await deploymentService.createDeploymentService({
    name: payload.name,
    description: sanitizeDescription(payload.description),
    binding_policy: payload.binding_policy,
    deployment_policy: payload.deployment_policy
  })

  return { feedback: 'Deployment created successfully', ...response }
}

export const loadDeploymentByIdAdapter = async ({ id }) => {
  const response = await deploymentService.getDeploymentByIdService(id)
  const deployment = response?.data ?? {}

  return {
    id: deployment.id ?? id,
    name: deployment.name ?? '',
    description: deployment.description ?? '',
    binding_policy: deployment.binding_policy ?? 'STRICT',
    deployment_policy: deployment.deployment_policy ?? 'single_version',
    state: deployment.state ?? null
  }
}

export const updateDeploymentAdapter = async (id, payload, { headState } = {}) => {
  await deploymentService.updateDeploymentService(id, {
    name: payload.name,
    description: sanitizeDescription(payload.description),
    binding_policy: payload.binding_policy,
    deployment_policy: payload.deployment_policy
  })

  return headState === 'draft' ? 'Deployment updated' : 'A new version is now current'
}
