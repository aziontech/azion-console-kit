/**
 * WAF (Main Settings) version contract.
 * Source: src/services/v2/waf/waf-version-adapter.js
 *   READ  (WafAdapter.transformLoadWafRule): name, active,
 *          engine_settings.attributes.thresholds[].{threat,sensitivity}
 *   WRITE (WafAdapter.adaptWafRulePayload): name, active,
 *          engine_settings.attributes.thresholds[].{threat,sensitivity}
 */
import * as yup from 'yup'
import {
  versionCommonResponse,
  draftRequestCommon,
  buildRequestCommon,
  archiveRequestCommon
} from './version-common.schema'

const engineSettingsShape = yup.object({
  attributes: yup.object({
    thresholds: yup.array().of(
      yup.object({
        threat: yup.string(),
        sensitivity: yup.string()
      })
    )
  })
})

export const versionResponse = versionCommonResponse.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    engine_settings: engineSettingsShape
  })
)

export const draftRequest = draftRequestCommon.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    engine_settings: engineSettingsShape
  })
)

export const buildRequest = buildRequestCommon
export const archiveRequest = archiveRequestCommon
