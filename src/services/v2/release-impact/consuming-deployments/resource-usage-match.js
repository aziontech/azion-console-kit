import { matchIdValue } from './contract'

export const sameId = (left, right) =>
  left != null && right != null && String(left) === String(right)

export const rowResourceVersion = (rowResource) =>
  rowResource?.resource_version ??
  rowResource?.version_id ??
  rowResource?.resource_version_id ??
  null

export const matchesRow = (rowResource, ref) =>
  rowResource?.resource_type === ref.resource_type &&
  sameId(matchIdValue(rowResource), ref.resource_id)
