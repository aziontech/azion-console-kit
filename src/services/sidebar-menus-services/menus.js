export const menus = [
  {
    label: 'Home',
    icon: 'pi pi-home',
    to: '/'
  },
  {
    label: 'Marketplace',
    icon: 'pi pi-cart-plus',
    to: '/marketplace'
  },
  {
    label: 'Domains',
    icon: 'pi pi-globe',
    to: '/domains'
  },
  {
    label: 'Build',
    icon: 'pi pi-code',
    items: [
      {
        label: 'Edge Application',
        icon: 'pi pi-box',
        to: '/edge-applications'
      },
      {
        label: 'Variables',
        to: '/variables',
        icon: 'pi pi-sliders-h'
      }
    ]
  },
  {
    label: 'Secure',
    icon: 'pi pi-lock',
    items: [
      {
        label: 'Intelligent DNS',
        to: '/intelligent-dns',
        icon: 'pi pi-share-alt'
      },
      {
        label: 'Edge Firewall',
        to: '/edge-firewall',
        icon: 'pi pi-lock'
      }
    ]
  },
  {
    label: 'Deploy',
    items: [
      {
        label: 'Edge Nodes',
        icon: 'pi pi-database',
        to: '/edge-node'
      }
    ]
  },
  {
    label: 'Observe',
    items: [
      {
        label: 'Data Streaming',
        to: '/data-streaming',
        icon: 'pi pi-play'
      },
      {
        label: 'Real-Time Metrics',
        to: '/real-time-metrics',
        icon: 'pi pi-chart-line'
      },
      {
        label: 'Real-Time Events',
        to: '/real-time-events',
        icon: 'pi pi-server',
        tag: 'Preview'
      },
      {
        label: 'Edge Pulse',
        to: '/edge-pulse',
        icon: 'pi pi-chart-line'
      }
    ]
  },
  {
    label: 'Tools',
    items: [
      {
        label: 'Real-Time Purge',
        to: '/real-time-purge',
        icon: 'pi pi-refresh'
      }
    ]
  },
  {
    label: 'Edge Libraries ',
    items: [
      {
        label: 'Edge Functions',
        to: '/edge-functions',
        icon: 'pi pi-code'
      },
      {
        label: 'Edge Services',
        to: '/edge-services',
        icon: 'pi pi-bookmark'
      },
      {
        label: 'Digital Certificates',
        to: '/digital-certificates',
        icon: 'pi pi-verified'
      },
      {
        label: 'Network Lists',
        to: '/network-lists',
        icon: 'pi pi-globe'
      },
      {
        label: 'WAF Rules',
        to: '/waf',
        icon: 'pi pi-sliders-h'
      }
    ]
  }
]
