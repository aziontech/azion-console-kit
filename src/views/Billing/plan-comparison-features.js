export const PLAN_COMPARISON_FEATURES = {
  hobby: {
    label: 'Hobby',
    tagline: 'The perfect starting place',
    description: 'Billed annually or $25/mo billed monthly.',
    sectionTitle: 'Todas as funcionalidades disponíveis',
    features: [
      { title: 'Infraestrutura global', icon: 'pi pi-globe' },
      { title: 'Funções serverless', icon: 'pi pi-code' },
      { title: 'Image optimization', icon: 'pi pi-image' },
      { title: 'Armazenamento e banco de dados', icon: 'pi pi-database' },
      { title: 'Mitigação de DDoS e firewall', icon: 'pi pi-shield' }
    ]
  },
  pro: {
    label: 'Pro',
    tagline: 'Billed annually or $25/mo billed monthly.',
    description: 'Billed annually or $25/mo billed monthly.',
    sectionTitle: 'Escale além dos limites incluídos',
    features: [
      { title: 'Workloads adicionais', icon: 'pi pi-box' },
      { title: 'Limites maiores para aplicações', icon: 'pi pi-arrows-h' },
      { title: 'Mais capacidade de Storage', icon: 'pi pi-database' },
      { title: 'Maior cobertura de segurança', icon: 'pi pi-shield' },
      { title: 'Limite de gasto configurável', icon: 'pi pi-dollar' }
    ]
  },
  enterprise: {
    label: 'Enterprise',
    tagline: 'Suporte avançado e serviços contínuos.',
    description: 'Billed annually or $250/mo billed monthly.',
    sectionTitle: 'Todas as funcionalidades disponíveis',
    features: [
      { title: 'Preços on-demand', icon: 'pi pi-chart-line' },
      { title: 'Economize com compromissos', icon: 'pi pi-dollar' },
      { title: 'Reserva de Capacidade disponível', icon: 'pi pi-th-large' },
      { title: 'Savings Plans disponíveis', icon: 'pi pi-tag' },
      { title: 'Suporte avançado disponível', icon: 'pi pi-wrench' }
    ]
  }
}

export const getComparisonFeatures = (plan) => PLAN_COMPARISON_FEATURES[plan]?.features || []

export const getComparisonInfo = (plan) => PLAN_COMPARISON_FEATURES[plan] ?? null
