import { environmentService } from '@/services/v2/environment/environment-service'
import { variablesService } from '@/services/v2/variables'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

export const getDeploymentVersionPolicyValue = (deploymentVersionPolicy) => {
  const value = Array.isArray(deploymentVersionPolicy)
    ? deploymentVersionPolicy[0]
    : deploymentVersionPolicy

  if (typeof value !== 'string') {
    return 'single_version'
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'versioned_urls' || normalized === 'versioned_urls') {
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
  const deploymentVersionPolicy = getDeploymentVersionPolicyValue(payload.deployment_policy)

  return {
    name: payload.name,
    description: payload.description ?? '',
    deployment_policy: deploymentVersionPolicy
  }
}

const buildEnvScope = (envId) => [{ type: 'environment', environment_id: String(envId) }]

const extractErrMessage = (err) => {
  if (!err) return 'Unknown error'
  if (Array.isArray(err.message)) return err.message.join('; ')
  return err.message ?? 'Unknown error'
}

const createScopedVariables = async (envId, envVarsObj) => {
  const entries = Object.entries(envVarsObj ?? {})
  if (!entries.length) return { failures: [] }

  const results = await Promise.allSettled(
    entries.map(([key, value]) =>
      variablesService.create({
        key,
        value: String(value ?? ''),
        secret: false,
        scope: buildEnvScope(envId)
      })
    )
  )

  const failures = []
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failures.push({ key: entries[index][0], message: extractErrMessage(result.reason) })
    }
  })
  return { failures }
}

export const diffScopedVariables = (current = {}, original) => {
  const toCreate = []
  const toUpdate = []
  const toDelete = []
  const seenKeys = new Set()

  Object.entries(current ?? {}).forEach(([key, value]) => {
    seenKeys.add(key)
    const snapshot = original?.get?.(key)
    const stringValue = String(value ?? '')
    if (!snapshot) {
      toCreate.push({ key, value: stringValue })
    } else if (snapshot.value !== stringValue) {
      toUpdate.push({ id: snapshot.id, key, value: stringValue, secret: snapshot.secret })
    }
  })

  original?.forEach?.((snapshot, key) => {
    if (!seenKeys.has(key)) {
      toDelete.push({ id: snapshot.id, key })
    }
  })

  return { toCreate, toUpdate, toDelete }
}

const syncScopedVariables = async (envId, diff) => {
  const tasks = []

  diff.toCreate.forEach((item) =>
    tasks.push({
      key: item.key,
      action: 'create',
      promise: variablesService.create({
        key: item.key,
        value: item.value,
        secret: false,
        scope: buildEnvScope(envId)
      })
    })
  )

  diff.toUpdate.forEach((item) =>
    tasks.push({
      key: item.key,
      action: 'update',
      promise: variablesService.edit({
        id: item.id,
        key: item.key,
        value: item.value,
        secret: item.secret,
        scope: buildEnvScope(envId)
      })
    })
  )

  diff.toDelete.forEach((item) =>
    tasks.push({
      key: item.key,
      action: 'delete',
      promise: variablesService.delete(item.id)
    })
  )

  if (!tasks.length) return { failures: [] }

  const results = await Promise.allSettled(tasks.map((task) => task.promise))
  const failures = []
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failures.push({
        key: tasks[index].key,
        action: tasks[index].action,
        message: extractErrMessage(result.reason)
      })
    }
  })
  return { failures }
}

export const loadEnvironmentByIdAdapter = async ({ id }) => {
  const response = await environmentService.getEnvironmentByIdService(id)

  const base = {
    name: response.data.name,
    description: response.data.description ?? '',
    deployment_policy: getDeploymentVersionPolicyValue(response.data.deployment_policy),
    environmentVariables: normalizeEnvironmentVariables(response.data.environmentVariables)
  }

  if (!hasFlagUseV6Configurations()) return base

  try {
    const { body } = await variablesService.list({
      scope_type: 'environment',
      scope_id: String(id),
      skipCache: true
    })

    const envVarsObj = {}
    const snapshot = new Map()
    ;(body ?? []).forEach((item) => {
      const value = item.value?.content ?? item.value ?? ''
      envVarsObj[item.key] = String(value ?? '')
      snapshot.set(item.key, {
        id: item.id,
        value: String(value ?? ''),
        secret: item.value?.isSecret ?? false
      })
    })

    base.environmentVariables = envVarsObj
    base.originalScopedVariables = snapshot
    base.scopedVariablesLoadFailed = false
  } catch (err) {
    base.originalScopedVariables = new Map()
    base.scopedVariablesLoadFailed = true
    base.scopedVariablesLoadError = extractErrMessage(err)
  }

  return base
}

export const createEnvironmentAdapter = async (payload) => {
  const normalized = normalizePayloadToEnvironmentContract(payload)
  const response = await environmentService.createEnvironmentService(normalized)
  const envId = response.data?.id

  if (!hasFlagUseV6Configurations() || !envId) {
    return { feedback: 'Environment created successfully', ...response }
  }

  const { failures } = await createScopedVariables(envId, payload.environmentVariables)
  return {
    feedback: 'Environment created successfully',
    ...response,
    urlToEditView: `/environments/edit/${envId}`,
    variablesFailures: failures
  }
}

export const updateEnvironmentAdapter = async (id, payload, options = {}) => {
  const normalized = normalizePayloadToEnvironmentContract(payload)
  await environmentService.updateEnvironmentService(id, {
    name: normalized.name,
    description: normalized.description
  })

  if (!hasFlagUseV6Configurations()) {
    return { feedback: 'Environment updated successfully', variablesFailures: [] }
  }

  if (options.scopedVariablesLoadFailed) {
    return {
      feedback: 'Environment updated successfully',
      variablesFailures: [
        {
          key: '*',
          action: 'sync',
          message: 'Skipped — failed to load existing scoped variables'
        }
      ]
    }
  }

  const diff = diffScopedVariables(payload.environmentVariables, options.originalScopedVariables)
  const { failures } = await syncScopedVariables(id, diff)

  return {
    feedback: 'Environment updated successfully',
    variablesFailures: failures
  }
}
