/**
 * Application (Edge App) version contract.
 * Source: src/services/v2/edge-app/edge-app-version-adapter.js
 *   READ  (normalizeConfig): name, modules.{cache,functions,application_accelerator,
 *          image_processor,tiered_cache}.enabled, active, debug
 *   WRITE (EdgeAppAdapter.transformPayload): same shape at the root
 */
import * as yup from 'yup'
import {
  versionCommonResponse,
  draftRequestCommon,
  buildRequestCommon,
  archiveRequestCommon
} from './version-common.schema'

const moduleFlag = yup.object({ enabled: yup.boolean() })

const modulesShape = yup.object({
  cache: moduleFlag,
  functions: moduleFlag,
  application_accelerator: moduleFlag,
  image_processor: moduleFlag,
  tiered_cache: moduleFlag
})

export const versionResponse = versionCommonResponse.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    debug: yup.boolean(),
    modules: modulesShape
  })
)

export const draftRequest = draftRequestCommon.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    debug: yup.boolean(),
    modules: modulesShape
  })
)

export const buildRequest = buildRequestCommon
export const archiveRequest = archiveRequestCommon
