export const buildVersionRowActions = (version, handlers = {}) => {
  const actions = []

  if (version?.isCurrent !== true) {
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
