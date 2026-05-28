export const PLAN_COMPARISON_FEATURES = {
  hobby: {
    label: 'Hobby',
    tagline: 'The perfect starting place',
    description: 'Start free for personal projects and learning.',
    sectionTitle: 'All features available',
    features: [
      { title: 'Global infrastructure', icon: 'pi pi-globe' },
      { title: 'Serverless functions', icon: 'pi pi-code' },
      { title: 'Image optimization', icon: 'pi pi-image' },
      { title: 'Storage & SQL Database', icon: 'pi pi-database' },
      { title: 'Firewall', icon: 'pi pi-shield' }
    ]
  },
  pro: {
    label: 'Pro',
    tagline: 'Billed annually or $25/mo billed monthly.',
    description: 'Billed annually or $25/mo billed monthly.',
    sectionTitle: 'All Free features, plus',
    features: [
      { title: 'Additional workloads', icon: 'pi pi-box' },
      { title: 'Higher application limits', icon: 'pi pi-check-circle' },
      { title: 'Real-time event observability', icon: 'pi pi-eye' },
      { title: 'Enhanced security features', icon: 'pi pi-shield' },
      { title: 'Technical Support', icon: 'pi pi-question-circle' }
    ]
  },
  enterprise: {
    label: 'Enterprise',
    tagline: 'Advanced support and ongoing services.',
    description: 'Billed annually or $250/mo billed monthly.',
    sectionTitle: 'Choose your pricing model',
    features: [
      { title: 'On-demand pricing', icon: 'pi pi-check-circle' },
      { title: 'Lower costs with commitments', icon: 'pi pi-check-circle' },
      { title: 'Reserved Capacity available', icon: 'pi pi-check-circle' },
      { title: 'Savings Plans available', icon: 'pi pi-check-circle' },
      { title: 'Service Plans available', icon: 'pi pi-check-circle' }
    ]
  }
}

export const getComparisonFeatures = (plan) => PLAN_COMPARISON_FEATURES[plan]?.features || []

export const getComparisonInfo = (plan) => PLAN_COMPARISON_FEATURES[plan] ?? null
