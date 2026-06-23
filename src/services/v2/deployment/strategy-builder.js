const hasValue = (value) => value !== null && value !== undefined && value !== ''

export const buildStrategy = (values) => {
  const gradualEnabled = !!values.gradual_rollout_enabled
  const skewEnabled = !!values.skew_protection_enabled
  const hasRolloutMode = hasValue(values.rollout_mode)
  if (!gradualEnabled && !skewEnabled && !hasRolloutMode) return undefined

  return {
    rollout_mode: hasRolloutMode ? values.rollout_mode : null,
    gradual_rollout: {
      enabled: gradualEnabled,
      candidate_percentage: gradualEnabled ? values.gradual_rollout_candidate_percentage : null,
      candidate_cookie_name: hasValue(values.gradual_rollout_candidate_cookie_name)
        ? values.gradual_rollout_candidate_cookie_name
        : null,
      candidate_cookie_max_age_seconds: hasValue(
        values.gradual_rollout_candidate_cookie_max_age_seconds
      )
        ? values.gradual_rollout_candidate_cookie_max_age_seconds
        : null,
      candidate_from_deployment_version_id: hasValue(
        values.gradual_rollout_candidate_from_deployment_version_id
      )
        ? values.gradual_rollout_candidate_from_deployment_version_id
        : null
    },
    skew_protection: {
      enabled: skewEnabled,
      cookie_name: hasValue(values.skew_protection_cookie_name)
        ? values.skew_protection_cookie_name
        : null,
      max_age_seconds: hasValue(values.skew_protection_max_age_seconds)
        ? values.skew_protection_max_age_seconds
        : null,
      max_skewed_deployments: hasValue(values.skew_protection_max_skewed_deployments)
        ? values.skew_protection_max_skewed_deployments
        : null
    }
  }
}

const SKEW_PROTECTION_DEFAULTS = {
  cookie_name: '__azdeploy_skew',
  max_age_seconds: 3600,
  max_skewed_deployments: 10
}

const buildSkewProtection = (skew) => {
  const source = skew && typeof skew === 'object' ? skew : {}
  return {
    enabled: Boolean(source.enabled),
    cookie_name: hasValue(source.cookie_name)
      ? source.cookie_name
      : SKEW_PROTECTION_DEFAULTS.cookie_name,
    max_age_seconds: hasValue(source.max_age_seconds)
      ? source.max_age_seconds
      : SKEW_PROTECTION_DEFAULTS.max_age_seconds,
    max_skewed_deployments: hasValue(source.max_skewed_deployments)
      ? source.max_skewed_deployments
      : SKEW_PROTECTION_DEFAULTS.max_skewed_deployments
  }
}

export const mapStrategyForBuildAndActivate = (strategy) => {
  if (!strategy) return undefined

  const mapped = {
    ...strategy,
    skew_protection: buildSkewProtection(strategy.skew_protection)
  }

  const gradualRollout = strategy.gradual_rollout
  if (!gradualRollout) return mapped

  // eslint-disable-next-line no-unused-vars
  const { candidate_from_deployment_version_id, ...gradualRest } = gradualRollout

  return {
    ...mapped,
    gradual_rollout: {
      ...gradualRest,
      candidate_from_release_id: null
    }
  }
}
