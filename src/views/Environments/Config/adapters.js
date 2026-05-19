import {
  createEnvironmentService,
  updateEnvironmentService,
  getEnvironmentByIdService
} from '@/services/v2/environment/environment-mock'

export const getDeploymentVersionPolicyValue = (deploymentVersionPolicy) => {
  const value = Array.isArray(deploymentVersionPolicy)
    ? deploymentVersionPolicy[0]
    : deploymentVersionPolicy

  if (typeof value !== 'string') {
    return 'single_version'
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'versioned_url' || normalized === 'versioned_urls') {
    return 'versioned_urls'
  }

  return 'single_version'
}

export const normalizeEnvironmentVariables = (environmentVariables) => {
  if (!environmentVariables) return {}

  if (typeof environmentVariables === 'string') {
    try {
      const parsed = JSON.parse(environmentVariables)
      return typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }

  if (typeof environmentVariables === 'object' && !Array.isArray(environmentVariables)) {
    return Object.entries(environmentVariables).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : String(value ?? '')
      return acc
    }, {})
  }

  return {}
}

const normalizePayloadToEnvironmentContract = (payload) => {
  const deploymentVersionPolicy = getDeploymentVersionPolicyValue(payload.deployment_version_policy)

  return {
    name: payload.name,
    description: payload.description ?? '',
    deployment_version_policy: deploymentVersionPolicy
  }
}

export const loadEnvironmentByIdAdapter = async ({ id }) => {
  const response = await getEnvironmentByIdService(id)

  return {
    name: response.data.name,
    description: response.data.description ?? '',
    deployment_version_policy: getDeploymentVersionPolicyValue(
      response.data.deployment_version_policy
    ),
    globalVariables: Array.isArray(response.data.globalVariables)
      ? response.data.globalVariables.map((item) => item?.toString())
      : [],
    environmentVariables: normalizeEnvironmentVariables(response.data.environmentVariables)
  }
}

export const createEnvironmentAdapter = async (payload) => {
  const normalized = normalizePayloadToEnvironmentContract(payload)
  const response = await createEnvironmentService(normalized)
  return { feedback: 'Environment created successfully', ...response }
}

export const updateEnvironmentAdapter = async (id, payload) => {
  const normalized = normalizePayloadToEnvironmentContract(payload)
  await updateEnvironmentService(id, {
    name: normalized.name,
    description: normalized.description
  })
  return 'Environment updated successfully'
}
