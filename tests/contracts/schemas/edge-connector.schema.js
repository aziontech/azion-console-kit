/**
 * Edge Connector version contract (polymorphic: HTTP/Storage/LiveIngest).
 * Source: src/services/v2/edge-connectors/edge-connector-version-adapter.js
 *   READ  (normalizeConfig guard `type != null`): the full snapshot — type +
 *          nested `attributes` (addresses, connection_options, modules) — via
 *          EdgeConnectorsAdapter.transformLoadEdgeConnectors
 *   WRITE (transformPayloadEdgeConnectors): name, type, active, attributes
 * `attributes` stays a loose object: its shape varies by connector type and the
 * front reads it wholesale through the load transform.
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
    active: yup.boolean(),
    attributes: yup.object()
  })
)

export const draftRequest = draftRequestCommon.concat(
  yup.object({
    name: yup.string(),
    type: yup.string(),
    active: yup.boolean(),
    attributes: yup.object()
  })
)

export const buildRequest = buildRequestCommon
export const archiveRequest = archiveRequestCommon
