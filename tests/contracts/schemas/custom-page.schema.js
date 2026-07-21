/**
 * Custom Page version contract.
 * Source: src/services/v2/custom-page/custom-page-version-adapter.js
 *   READ  (normalizeConfig): name, active, pages[] (mapped via transformPageItem)
 *   WRITE (CustomPageAdapter.transformPayloadCreateCustomPage): name, active, pages[]
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
    pages: yup.array().of(yup.object())
  })
)

export const draftRequest = draftRequestCommon.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    pages: yup.array().of(yup.object())
  })
)

export const buildRequest = buildRequestCommon
export const archiveRequest = archiveRequestCommon
