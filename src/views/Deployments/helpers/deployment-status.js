export const statusIconMap = {
  ready: 'pi pi-check-circle',
  building: 'pi pi-spinner',
  draft: 'pi pi-clock',
  error: 'pi pi-times-circle',
  canceled: 'pi pi-ban'
}

export const statusSeverityClassMap = {
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  danger: 'bg-red-500/10 text-red-500',
  info: 'bg-blue-500/10 text-blue-500',
  secondary:
    'bg-[color-mix(in_srgb,var(--text-color-secondary)_12%,transparent)] text-[var(--text-color-secondary)]'
}

export const resourcePackTypeMeta = [
  { key: 'workload', label: 'Workload', icon: 'ai ai-workloads' },
  { key: 'application', label: 'Application', icon: 'ai ai-edge-application' },
  { key: 'variable', label: 'Variable', icon: 'ai ai-variables' },
  { key: 'connector', label: 'Connector', icon: 'ai ai-edge-connectors' },
  { key: 'edgeDns', label: 'Edge DNS', icon: 'ai ai-edge-dns' },
  { key: 'firewall', label: 'Firewall', icon: 'ai ai-edge-firewall' },
  { key: 'edgeNode', label: 'Edge Node', icon: 'ai ai-edge-nodes' },
  { key: 'dataStream', label: 'Data Stream', icon: 'ai ai-data-stream' },
  { key: 'edgePulse', label: 'Edge Pulse', icon: 'ai ai-edge-pulse' },
  { key: 'realTimeMetrics', label: 'Real-Time Metrics', icon: 'ai ai-real-time-metrics' },
  { key: 'realTimeEvents', label: 'Real-Time Events', icon: 'ai ai-real-time-events' },
  { key: 'siem', label: 'SIEM', icon: 'pi pi-chart-bar' },
  { key: 'realTimePurge', label: 'Real-Time Purge', icon: 'ai ai-real-time-purge' },
  { key: 'digitalCertificate', label: 'Certificate Manager', icon: 'ai ai-digital-certificates' },
  { key: 'customPage', label: 'Custom Page', icon: 'ai ai-custom-pages' },
  { key: 'edgeService', label: 'Edge Service', icon: 'ai ai-edge-services' },
  { key: 'function', label: 'Function', icon: 'ai ai-edge-functions' },
  { key: 'networkList', label: 'Network List', icon: 'ai ai-network-lists' },
  { key: 'wafRule', label: 'WAF Rule', icon: 'ai ai-waf-rules' },
  { key: 'objectStorage', label: 'Object Storage', icon: 'ai ai-edge-storage' },
  { key: 'sqlDatabase', label: 'SQL Database', icon: 'ai ai-edge-sql' }
]

export const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

export const getStatusIcon = (status) => {
  const normalizedStatus = normalizeText(status)
  const baseIcon = statusIconMap[normalizedStatus] || 'pi pi-info-circle'

  return normalizedStatus === 'building' ? `${baseIcon} animate-spin` : baseIcon
}

export const getStatusClass = (deployment) => {
  const severity = deployment?.status?.severity || 'secondary'

  return statusSeverityClassMap[severity] || statusSeverityClassMap.secondary
}

export const getDeploymentStatus = (deployment) => normalizeText(deployment?.status?.content)

export const getResourcePackRows = (deployment) => {
  return resourcePackTypeMeta
    .map((meta) => {
      const entry = deployment?.resourcePack?.[meta.key]
      if (!entry) return null

      return {
        key: meta.key,
        label: meta.label,
        icon: meta.icon,
        name: entry.name || '--',
        hash: entry.hash || '--'
      }
    })
    .filter(Boolean)
}

export const isReadonlyStatus = (status) => {
  const normalized = normalizeText(status)
  return normalized === 'ready' || normalized === 'building'
}
