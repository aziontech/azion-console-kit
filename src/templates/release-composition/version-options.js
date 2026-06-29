// Surface-agnostic version helpers shared by every Release composition surface
// (the legacy deploy drawer and the full-page Review & deploy view). Lives in a
// neutral module so composition code never imports from a "drawer"-named file.

// Sentinel for "Track latest Ready": pin to the newest Ready version at dispatch
// time rather than a fixed short_id. Distinct from any real version id.
export const LATEST_READY = 'LATEST'

// A version is deployable when it is built — `ready` or `active` (serving).
const DEPLOYABLE_STATES = ['ready', 'active']

// Maps raw version records to the picker option shape consumed by
// ResourceVersionField (label/value + metadata for the option row).
export const toVersionOptions = (versions) =>
  (Array.isArray(versions) ? versions : [])
    .filter((version) => DEPLOYABLE_STATES.includes(version?.state))
    .map((version) => ({
      label: version.comment || version.id,
      value: version.id,
      createdAt: version.createdAt ?? null,
      author: version.lastEditor || null,
      isCurrent: Boolean(version.isCurrent)
    }))

// Resolves a chosen version to a concrete id for dispatch: the LATEST_READY
// sentinel maps to the newest Ready option (first `isCurrent`, else the first
// option); a pinned id is returned as-is.
export const resolveLatestVersion = (options, selected) => {
  if (selected !== LATEST_READY) return selected
  const list = Array.isArray(options) ? options : []
  const current = list.find((option) => option.isCurrent)
  return current?.value ?? list[0]?.value ?? null
}
