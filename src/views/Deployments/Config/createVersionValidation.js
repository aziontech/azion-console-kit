import * as yup from 'yup'
import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'

// TODO: confirm valid rollout_mode values with backend. Assumed INSTANT / GRADUAL.
export const ROLLOUT_MODE_OPTIONS = [
  { label: 'Instant', value: 'INSTANT' },
  { label: 'Gradual', value: 'GRADUAL' }
]

export const validationSchema = yup.object({
  application: yup.mixed().required().label('Application'),
  firewall: yup.mixed().nullable(),
  custom_page: yup.mixed().nullable(),

  rollout_mode: yup.string().nullable(),

  gradual_rollout_enabled: yup.boolean().default(false),
  gradual_rollout_candidate_percentage: yup
    .number()
    .min(0)
    .max(100)
    .when('gradual_rollout_enabled', {
      is: true,
      then: (schema) => schema.required().label('Candidate Percentage'),
      otherwise: (schema) => schema.nullable()
    }),
  gradual_rollout_candidate_cookie_name: yup.string().nullable(),
  gradual_rollout_candidate_cookie_max_age_seconds: yup.number().nullable().min(0),
  gradual_rollout_candidate_from_deployment_version_id: yup.string().nullable(),

  skew_protection_enabled: yup.boolean().default(false),
  skew_protection_cookie_name: yup.string().nullable(),
  skew_protection_max_age_seconds: yup.number().nullable().min(0),
  skew_protection_max_skewed_deployments: yup.number().nullable().min(0),

  origin_type: yup.string().nullable(),
  origin_source_environment_id: yup.string().nullable(),
  origin_source_deployment_version_id: yup.string().nullable(),
  origin_promoted_from: yup.string().nullable()
})

export const buildInitialValues = (workload = {}) => ({
  application: workload?.application ?? null,
  firewall: workload?.firewall ?? null,
  custom_page: workload?.customPage ?? null,
  rollout_mode: null,
  gradual_rollout_enabled: false,
  gradual_rollout_candidate_percentage: 10,
  gradual_rollout_candidate_cookie_name: '',
  gradual_rollout_candidate_cookie_max_age_seconds: null,
  gradual_rollout_candidate_from_deployment_version_id: '',
  skew_protection_enabled: false,
  skew_protection_cookie_name: '',
  skew_protection_max_age_seconds: null,
  skew_protection_max_skewed_deployments: null,
  origin_type: '',
  origin_source_environment_id: '',
  origin_source_deployment_version_id: '',
  origin_promoted_from: ''
})

const hasValue = (value) => value !== null && value !== undefined && value !== ''

const buildResources = (values) => {
  const resources = []
  if (hasValue(values.application)) {
    resources.push({ id: values.application, resource_type: 'application' })
  }
  if (hasValue(values.firewall)) {
    resources.push({ id: values.firewall, resource_type: 'firewall' })
  }
  if (hasValue(values.custom_page)) {
    resources.push({ id: values.custom_page, resource_type: 'custom_page' })
  }
  return resources
}

const buildStrategy = (values) => {
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

const buildOrigin = (values) => {
  const fields = {
    type: values.origin_type,
    source_environment_id: values.origin_source_environment_id,
    source_deployment_version_id: values.origin_source_deployment_version_id,
    promoted_from: values.origin_promoted_from
  }
  const hasAny = Object.values(fields).some(hasValue)
  if (!hasAny) return undefined

  return {
    type: hasValue(fields.type) ? fields.type : null,
    source_environment_id: hasValue(fields.source_environment_id)
      ? fields.source_environment_id
      : null,
    source_deployment_version_id: hasValue(fields.source_deployment_version_id)
      ? fields.source_deployment_version_id
      : null,
    promoted_from: hasValue(fields.promoted_from) ? fields.promoted_from : null
  }
}

export const createVersionAdapter = (workloadDeploymentId) => async (values) => {
  if (!workloadDeploymentId) {
    throw new Error('Workload deployment id is missing')
  }

  const payload = {
    resources: buildResources(values),
    strategy: buildStrategy(values),
    origin: buildOrigin(values)
  }

  const response = await deploymentVersionService.createVersionService(
    workloadDeploymentId,
    payload
  )

  return {
    ...response,
    feedback: 'Deployment version created successfully'
  }
}
