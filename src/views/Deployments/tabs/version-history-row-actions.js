const ACTIVE_STATES = ['ready', 'active']

const resolveState = (version) => version?.state ?? version?.meta?.state ?? null

const isCurrentVersion = (version) => ACTIVE_STATES.includes(resolveState(version))

export const buildVersionRowActions = (version, handlers = {}) => {
  const actions = []

  if (!isCurrentVersion(version)) {
    const runRevert = () => handlers.onRevert?.(version)
    actions.push({
      id: 'revert',
      label: 'Revert to this version',
      icon: 'pi pi-history',
      type: 'action',
      execute: runRevert,
      commandAction: runRevert
    })
  }

  const runCopy = () => handlers.onCopy?.(version)
  actions.push({
    id: 'copy-version-id',
    label: 'Copy version ID',
    icon: 'pi pi-copy',
    type: 'action',
    execute: runCopy,
    commandAction: runCopy
  })

  return actions
}
