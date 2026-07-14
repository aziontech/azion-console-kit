export const getVersionListColumns = ({ includeTraffic = true } = {}) => {
  const columns = [
    { key: 'version', label: 'Version', size: 'minmax(220px, 1.4fr)' },
    { key: 'status', label: 'Status', size: 'minmax(140px, 0.8fr)' }
  ]

  if (includeTraffic) {
    columns.push({
      key: 'traffic',
      field: 'activeTraffic',
      label: 'Traffic',
      size: 'minmax(160px, 0.9fr)',
      mobileLabel: 'Traffic'
    })
  }

  columns.push({ key: 'created', label: 'Created by', size: 'minmax(180px, 1.2fr)' })

  return columns
}

export const getLiveDeploymentColumns = () => [
  { key: 'version', label: 'Version', size: 'minmax(220px, 1.4fr)' },
  {
    key: 'environment',
    field: 'environment',
    label: 'Environment',
    size: 'minmax(160px, 1fr)',
    mobileLabel: 'Environment'
  },
  {
    key: 'workload',
    field: 'workload',
    label: 'Workload',
    size: 'minmax(200px, 1.2fr)',
    mobileLabel: 'Workload'
  },
  {
    key: 'deployed',
    field: 'deployed',
    label: 'Deployed',
    size: 'minmax(180px, 1fr)',
    mobileLabel: 'Deployed'
  }
]
