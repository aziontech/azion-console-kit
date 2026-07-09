export const buildVersionRowActions = (version, handlers = {}) => {
  const actions = []

  if (version?.isCurrent !== true) {
    const runRollback = () => handlers.onRollback?.(version)
    actions.push({
      id: 'rollback',
      label: 'Rollback to this version',
      icon: 'pi pi-history',
      type: 'action',
      execute: runRollback,
      commandAction: runRollback
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
