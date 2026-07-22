import { VERSION_STATES } from './version-machine'

export const DEPLOYABLE_STATES = [VERSION_STATES.READY, VERSION_STATES.ACTIVE]

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
