export const menus = [
  {
    label: 'Home',
    icon: 'ai ai-home',
    to: '/',
    id: 'home'
  },
  {
    label: 'Marketplace',
    icon: 'ai ai-marketplace',
    to: '/marketplace',
    id: 'marketplace'
  },
  {
    label: 'Domains',
    icon: 'ai ai-domains',
    to: '/domains',
    id: 'domains'
  },
  {
    label: 'Build',
    items: [
      {
        label: 'Edge Application',
        icon: 'ai ai-edge-application',
        to: '/edge-applications',
        id: 'edge-application'
      },
      {
        label: 'Variables',
        to: '/variables',
        icon: 'ai ai-variables',
        id: 'variables'
      }
    ]
  },
  {
    label: 'Secure',
    items: [
      {
        label: 'Edge Firewall',
        to: '/edge-firewall',
        icon: 'ai ai-edge-firewall',
        id: 'edge-firewall'
      },
      {
        label: 'Edge DNS',
        to: '/edge-dns',
        icon: 'ai ai-edge-dns',
        id: 'edge-dns'
      }
    ]
  },
  {
    label: 'Deploy',
    items: [
      {
        label: 'Edge Nodes',
        icon: 'ai ai-edge-nodes',
        to: '/edge-node',
        id: 'edge-nodes'
      }
    ]
  },
  {
    label: 'Observe',
    items: [
      {
        label: 'Data Stream',
        to: '/data-stream',
        icon: 'ai ai-data-stream',
        id: 'data-stream'
      },
      {
        label: 'Edge Pulse',
        to: '/edge-pulse',
        icon: 'ai ai-edge-pulse',
        id: 'edge-pulse'
      },
      {
        label: 'Real-Time Metrics',
        to: '/real-time-metrics',
        icon: 'ai ai-real-time-metrics',
        id: 'real-time-metrics'
      },
      {
        label: 'Real-Time Events',
        to: '/real-time-events',
        icon: 'ai ai-real-time-events',
        tag: 'Preview',
        id: 'real-time-events'
      }
    ]
  },
  {
    label: 'Tools',
    items: [
      {
        label: 'Real-Time Purge',
        to: '/real-time-purge',
        icon: 'ai ai-real-time-purge',
        id: 'real-time-purge'
      }
    ]
  },
  {
    label: 'Edge Libraries ',
    items: [
      {
        label: 'Edge Functions',
        to: '/edge-functions',
        icon: 'ai ai-edge-functions',
        id: 'edge-functions'
      },
      {
        label: 'Edge Services',
        to: '/edge-services',
        icon: 'ai ai-edge-services',
        id: 'edge-services'
      },
      {
        label: 'Digital Certificates',
        to: '/digital-certificates',
        icon: 'ai ai-digital-certificates',
        id: 'digital-certificates'
      },
      {
        label: 'Network Lists',
        to: '/network-lists',
        icon: 'ai ai-network-lists',
        id: 'network-lists'
      },
      {
        label: 'WAF Rules',
        to: '/waf',
        icon: 'ai ai-waf-rules',
        id: 'waf-rules'
      }
    ]
  }
]
