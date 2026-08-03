export const LATEST_READY = 'LATEST'

const DEPLOYABLE_STATES = ['ready', 'active']

const toOption = (version) => ({
  label: version.comment || version.id,
  value: version.id,
  createdAt: version.createdAt ?? null,
  author: version.lastEditor || null,
  isCurrent: Boolean(version.isCurrent)
})

const mapVersions = (versions, isAllowed) =>
  (Array.isArray(versions) ? versions : [])
    .filter((version) => isAllowed(version?.state))
    .map(toOption)

export const toVersionOptions = (versions) =>
  mapVersions(versions, (state) => DEPLOYABLE_STATES.includes(state))

export const toReadyVersionOptions = (versions) =>
  mapVersions(versions, (state) => state === 'ready')

export const resolveLatestVersion = (options, selected) => {
  if (selected !== LATEST_READY) return selected
  const list = Array.isArray(options) ? options : []
  const current = list.find((option) => option.isCurrent)
  return current?.value ?? list[0]?.value ?? null
}
