/**
 * Network List version contract.
 * Source: src/services/v2/network-lists/network-list-version-adapter.js
 *   READ  (normalizeConfig guard `type != null`): name, type, items[] via
 *          NetworkListsAdapter.transformLoadNetworkList
 *   WRITE (transformEditNetworkList): name, type, items[]
 * `items` holds strings for ip_cidr/asn and country codes for countries.
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
    type: yup.string(),
    items: yup.array().of(yup.string())
  })
)

export const draftRequest = draftRequestCommon.concat(
  yup.object({
    name: yup.string(),
    type: yup.string(),
    items: yup.array().of(yup.string())
  })
)

export const buildRequest = buildRequestCommon
export const archiveRequest = archiveRequestCommon
