import { VERSION_STATES } from './version-machine'

// A version is deployable once built. `active` is a release/traffic concept with no
// backend version state today, kept for forward-compat with the editor's filter.
export const DEPLOYABLE_STATES = [VERSION_STATES.READY, VERSION_STATES.ACTIVE]

// The single option shape for the deploy drawer's version dropdown, shared by the
// version-editor heading and the landing screens so they never drift. `isCurrent`
// is by identity against the version passed as current (null on the listing).
export const toVersionOption = (item, currentVersionId) => ({
  id: item.id,
  value: item.id,
  label: item.comment || item.id,
  createdAt: item.createdAt ?? null,
  author: item.lastEditor || null,
  isCurrent: item.id === currentVersionId
})

export const toDeployableVersionOptions = (rawVersions, currentVersionId = null) =>
  (rawVersions ?? [])
    .filter((item) => DEPLOYABLE_STATES.includes(item.state))
    .map((item) => toVersionOption(item, currentVersionId))
