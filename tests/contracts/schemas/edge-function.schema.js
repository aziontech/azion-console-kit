/**
 * Edge Function version contract.
 * Source: src/services/v2/edge-function/edge-function-version-adapter.js
 *   READ  (normalizeConfig guard `code != null || name != null`): name, active,
 *          code, runtime|language, execution_environment|runtime_environment,
 *          default_args|json_args, azion_form
 *   WRITE (EdgeFunctionsAdapter.transformPayloadEdgeFunctions): name, code, runtime,
 *          execution_environment, default_args, azion_form, active
 */
import * as yup from 'yup'
import {
  versionCommonResponse,
  draftRequestCommon,
  buildRequestCommon,
  archiveRequestCommon
} from './version-common.schema'

export const versionResponse = versionCommonResponse.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    code: yup.string(),
    runtime: yup.string(),
    language: yup.string(),
    execution_environment: yup.string(),
    runtime_environment: yup.string(),
    default_args: yup.mixed(),
    json_args: yup.mixed(),
    azion_form: yup.mixed()
  })
)

export const draftRequest = draftRequestCommon.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    code: yup.string(),
    runtime: yup.string(),
    execution_environment: yup.string(),
    default_args: yup.mixed(),
    azion_form: yup.mixed()
  })
)

export const buildRequest = buildRequestCommon
export const archiveRequest = archiveRequestCommon
