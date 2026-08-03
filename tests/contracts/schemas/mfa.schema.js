/**
 * MFA contract (critical areas — authentication).
 * Source: src/services/v2/mfa/{mfa-service,mfa-adapter}.js
 *   READ (transformListMfa): id, name, email, confirmed → tag mapping
 */
import * as yup from 'yup'

export const mfaEntry = yup.object({
  id: yup.number().required(),
  name: yup.string().nullable(),
  email: yup.string().required(),
  confirmed: yup.boolean().required()
})

export const mfaListResponse = yup.object({
  count: yup.number().required(),
  results: yup.array().of(mfaEntry).required()
})
