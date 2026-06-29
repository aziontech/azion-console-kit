import * as yup from 'yup'

export { ROLLOUT_MODE_OPTIONS } from '@/views/Deployments/Config/createVersionValidation'

export const canaryStrategyValidationSchema = yup.object({
  gradual_rollout_enabled: yup.boolean().default(false),

  rollout_mode: yup.string().nullable(),

  gradual_rollout_candidate_percentage: yup
    .number()
    .typeError('Candidate Percentage must be a number')
    .min(0)
    .max(100)
    .when('gradual_rollout_enabled', {
      is: true,
      then: (schema) => schema.required().label('Candidate Percentage'),
      otherwise: (schema) => schema.nullable()
    }),

  gradual_rollout_candidate_cookie_name: yup.string().when('gradual_rollout_enabled', {
    is: true,
    then: (schema) => schema.required().label('Candidate Cookie Name'),
    otherwise: (schema) => schema.nullable()
  }),

  gradual_rollout_candidate_cookie_max_age_seconds: yup
    .number()
    .typeError('Candidate Cookie Max Age must be a number')
    .min(0)
    .when('gradual_rollout_enabled', {
      is: true,
      then: (schema) => schema.required().label('Candidate Cookie Max Age'),
      otherwise: (schema) => schema.nullable()
    })
})

export const buildCanaryInitialValues = () => ({
  gradual_rollout_enabled: false,
  rollout_mode: 'GRADUAL',
  gradual_rollout_candidate_percentage: 10,
  gradual_rollout_candidate_cookie_name: '',
  gradual_rollout_candidate_cookie_max_age_seconds: null
})
