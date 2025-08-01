import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

function createHomeItem() {
  return {
    label: 'Home',
    icon: 'ai ai-home',
    to: '/',
    id: 'home'
  }
}

function createMarketplaceItem() {
  return {
    label: 'Marketplace',
    icon: 'ai ai-marketplace',
    to: '/marketplace',
    id: 'marketplace'
  }
}

function createDomainsItem() {
  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()
  const menuOption = {
    label: handleTextDomainWorkload.pluralTitle,
    icon: hasFlagBlockApiV4() ? 'pi pi-globe' : 'ai ai-workloads',
    to: `/${handleTextDomainWorkload.pluralLabel}`,
    id: 'domains',
    tag: 'Preview'
  }

  if (hasFlagBlockApiV4()) {
    delete menuOption.tag
  }

  return menuOption
}

function createBuildItems() {
  return [
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
}

function createSecureItems() {
  return [
    {
      label: 'Edge Connectors',
      to: '/edge-connectors',
      icon: 'ai ai-edge-connectors',
      id: 'edge-connectors',
      visible: !hasFlagBlockApiV4()
    },
    {
      label: 'Edge DNS',
      to: '/edge-dns',
      icon: 'ai ai-edge-dns',
      id: 'edge-dns'
    },
    {
      label: 'Edge Firewall',
      to: '/edge-firewall',
      icon: 'ai ai-edge-firewall',
      id: 'edge-firewall'
    }
  ]
}

function createDeployItems() {
  return [
    {
      label: 'Edge Nodes',
      icon: 'ai ai-edge-nodes',
      to: '/edge-node',
      id: 'edge-nodes'
    }
  ]
}

function createObserveItems() {
  return [
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
    },
    {
      label: 'SIEM',
      to: '/siem',
      icon: 'pi pi-chart-bar',
      clientFlag: 'siem_bb',
      id: 'siem'
    }
  ]
}

function createToolsItems() {
  return [
    {
      label: 'Real-Time Purge',
      to: '/real-time-purge',
      icon: 'ai ai-real-time-purge',
      id: 'real-time-purge'
    }
  ]
}

function createEdgeLibrariesItems() {
  return [
    {
      label: 'Custom Pages',
      to: '/custom-pages',
      icon: 'ai ai-custom-pages',
      id: 'custom-pages',
      visible: !hasFlagBlockApiV4()
    },
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

function createMarketplaceProductsItems() {
  return [
    {
      label: 'Bot Manager',
      icon: 'pi pi-wrench',
      to: 'https://radware.eu.auth0.com/authorize?client_id=KnZSRL3CSoahL0ymcqfwsmt55EHxXxgS&response_type=code&connection=caixa-sso&prompt=login&scope=openid%20profile&redirect_uri=https://console.radwarecloud.com?connection=caixa-sso',
      id: 'bot-manager',
      external: true
    },
    {
      label: 'SIEM',
      to: 'https://caixa-siem.azion.com/login',
      icon: 'pi pi-chart-bar',
      id: 'siem',
      external: true
    }
  ]
}

export function getMenuItens(showMarketplaceProductsItens) {
  const menus = [
    createHomeItem(),
    createMarketplaceItem(),
    createDomainsItem(),
    {
      label: 'Build',
      items: createBuildItems()
    },
    {
      label: 'Secure',
      items: createSecureItems()
    },
    {
      label: 'Deploy',
      items: createDeployItems()
    },
    {
      label: 'Observe',
      items: createObserveItems()
    },
    {
      label: 'Tools',
      items: createToolsItems()
    },
    {
      label: 'Edge Libraries',
      items: createEdgeLibrariesItems()
    },
    {
      label: 'Marketplace Products',
      visible: showMarketplaceProductsItens,
      items: createMarketplaceProductsItems()
    }
  ]

  return menus
}
