import { deploymentService } from '@/services/v2/deployment/deployment-service'

// Strategy Defaults hidden until the API supports strategy_defaults.
// const buildStrategyDefaults = (payload, { alwaysEmit = false } = {}) => {
//   const canaryOn = !!payload.strategy_canary_enabled
//   const skewOn = !!payload.strategy_skew_enabled
//
//   if (!alwaysEmit && !canaryOn && !skewOn) return undefined
//
//   return {
//     canary: {
//       enabled: canaryOn,
//       default_percentage: payload.strategy_canary_default_percentage
//     },
//     skew_protection: {
//       enabled: skewOn,
//       default_ttl_seconds: payload.strategy_skew_default_ttl_seconds
//     }
//   }
// }

const sanitizeDescription = (description) =>
  typeof description === 'string' && description.trim().length > 0 ? description.trim() : null

export const createDeploymentAdapter = async (payload) => {
  const response = await deploymentService.createDeploymentService({
    name: payload.name,
    description: sanitizeDescription(payload.description),
    binding_policy: payload.binding_policy,
    deployment_policy: payload.deployment_policy
    // Strategy Defaults hidden until the API supports strategy_defaults.
    // strategy_defaults: buildStrategyDefaults(payload)
  })

  return { feedback: 'Deployment created successfully', ...response }
}

export const loadDeploymentByIdAdapter = async ({ id }) => {
  const response = await deploymentService.getDeploymentByIdService(id)
  const deployment = response?.data ?? {}

  // Strategy Defaults hidden until the API supports strategy_defaults.
  // const canary = deployment.strategy_defaults?.canary
  // const skew = deployment.strategy_defaults?.skew_protection

  return {
    id: deployment.id ?? id,
    name: deployment.name ?? '',
    description: deployment.description ?? '',
    binding_policy: deployment.binding_policy ?? 'STRICT',
    deployment_policy: deployment.deployment_policy ?? 'single_version',
    // Strategy Defaults hidden until the API supports strategy_defaults.
    // strategy_canary_enabled: !!canary?.enabled,
    // strategy_canary_default_percentage: canary?.default_percentage ?? 10,
    // strategy_skew_enabled: !!skew?.enabled,
    // strategy_skew_default_ttl_seconds: skew?.default_ttl_seconds ?? 3600,
    state: deployment.state ?? null
  }
}

export const updateDeploymentAdapter = async (id, payload, { headState } = {}) => {
  await deploymentService.updateDeploymentService(id, {
    name: payload.name,
    description: sanitizeDescription(payload.description),
    binding_policy: payload.binding_policy,
    deployment_policy: payload.deployment_policy
    // Strategy Defaults hidden until the API supports strategy_defaults.
    // strategy_defaults: buildStrategyDefaults(payload, { alwaysEmit: true })
  })

  return headState === 'draft' ? 'Deployment updated' : 'A new version is now current'
}
