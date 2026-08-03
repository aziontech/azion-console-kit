/**
 * Edge Firewall version contract.
 * Source: src/services/v2/edge-firewall/edge-firewall-version-adapter.js
 *   READ  (normalizeConfig): name, active, debug|debug_rules, and each module flag
 *          from modules.{functions,network_protection,waf,ddos_protection}.enabled
 *          OR the flat *_enabled / ddos_protection_unmetered fallbacks
 *   WRITE (mapResourceFields): name, active, modules.{ddos_protection,functions,
 *          network_protection,waf}.enabled, debug
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
  functions: moduleFlag,
  network_protection: moduleFlag,
  waf: moduleFlag,
  ddos_protection: moduleFlag
})

export const versionResponse = versionCommonResponse.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    debug: yup.boolean(),
    debug_rules: yup.boolean(),
    edge_functions_enabled: yup.boolean(),
    network_protection_enabled: yup.boolean(),
    waf_enabled: yup.boolean(),
    ddos_protection_unmetered: yup.boolean(),
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
