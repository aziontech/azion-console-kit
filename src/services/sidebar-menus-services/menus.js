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
    items: [
      {
        label: 'Edge Application',
        icon: 'pi pi-th-large',
        to: '/edge-applications'
      },
      {
        label: 'Variables',
        to: '/variables',
        icon: 'pi pi-box'
      }
    ]
  },
  {
    label: 'Secure',
    icon: 'pi pi-lock',
    items: [
      {
        label: 'Edge Firewall',
        to: '/edge-firewall',
        icon: 'pi pi-shield'
      },
      {
        label: 'Edge DNS',
        to: '/intelligent-dns',
        icon: 'pi pi-sitemap'
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
        label: 'Data Stream',
        to: '/data-streaming',
        icon: 'pi pi-play'
      },
      {
        label: 'Edge Pulse',
        to: '/edge-pulse',
        icon: 'pi pi-wifi'
      },
      {
        label: 'Real-Time Metrics',
        to: '/real-time-metrics',
        icon: 'pi pi-chart-line'
      },
      {
        label: 'Real-Time Events',
        to: '/real-time-events',
        icon: 'pi pi-chart-bar',
        tag: 'Preview'
      }
    ]
  },
  {
    label: 'Tools',
    items: [
      {
        label: 'Real-Time Purge',
        to: '/real-time-purge',
        icon: 'pi pi-sync'
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
        icon: 'pi pi-server'
      },
      {
        label: 'Digital Certificates',
        to: '/digital-certificates',
        icon: 'pi pi-check-circle'
      },
      {
        label: 'Network Lists',
        to: '/network-lists',
        icon: 'pi pi-list'
      },
      {
        label: 'WAF Rules',
        to: '/waf',
        icon: 'pi pi-sliders-h'
      }
    ]
  }
]
