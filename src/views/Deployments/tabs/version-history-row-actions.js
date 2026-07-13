export const buildVersionRowActions = (version, handlers = {}) => {
  const runCopy = () => handlers.onCopy?.(version)

  return [
    {
      id: 'copy-version-id',
      label: 'Copy version ID',
      icon: 'pi pi-copy',
      type: 'action',
      execute: runCopy,
      commandAction: runCopy
    }
  ]
}
