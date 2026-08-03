/**
 * Account-info contract (critical areas — session identity).
 * Source: src/services/v2/account/account-service.js (_adaptAccountInfo) +
 * src/helpers/account-type-name-mapping.js — `kind` drives icon/name across
 * the shell. Other fields pass through untouched, so only what the console
 * DEPENDS on is contracted.
 */
import * as yup from 'yup'

export const accountInfoResponse = yup.object({
  id: yup.number().required(),
  name: yup.string().required(),
  kind: yup
    .string()
    .oneOf(['client', 'clients', 'groups', 'reseller', 'resellers', 'company', 'brand', 'brands'])
    .required()
})
