export const getVersionListColumns = () => [
  { key: 'version', label: 'Version', size: 'minmax(220px, 1.4fr)' },
  { key: 'status', label: 'Status', size: 'minmax(140px, 0.8fr)' },
  {
    key: 'traffic',
    field: 'activeTraffic',
    label: 'Traffic',
    size: 'minmax(160px, 0.9fr)',
    mobileLabel: 'Traffic'
  },
  { key: 'created', label: 'Created by', size: 'minmax(180px, 1.2fr)' }
]
