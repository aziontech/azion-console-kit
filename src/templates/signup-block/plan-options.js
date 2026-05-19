export const PLAN_OPTIONS = [
  {
    value: 'hobby',
    label: 'Hobby',
    description: 'Start free for personal projects and learning.',
    buttonLabel: 'Choose Plan',
    features: [
      { label: 'All features available' },
      { label: 'Global infrastructure', icon: 'pi pi-globe' },
      { label: 'Serverless functions', icon: 'pi pi-code' },
      { label: 'Image optimization', icon: 'pi pi-image' },
      { label: 'Storage & SQL database', icon: 'ai ai-store' },
      { label: 'Firewall', icon: 'pi pi-shield' }
    ]
  },
  {
    value: 'pro',
    label: 'Pro',
    description: 'For professional or commercial workloads.',
    tagLabel: 'Popular',
    buttonLabel: 'Choose Plan',
    features: [
      { label: 'All Free features, plus' },
      { label: 'Additional workloads', icon: 'ai ai-workloads' },
      { label: 'Higher application limits', icon: 'pi pi-check-circle' },
      { label: 'Real-time event observability', icon: 'ai ai-observe-pillar' },
      { label: 'Enhanced security features', icon: 'pi pi-shield' },
      { label: 'Technical Support', icon: 'pi pi-question-circle' }
    ]
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Optimize costs with commitment-based savings',
    buttonLabel: 'Contact Sales',
    buttonDisabled: true,
    features: [
      { label: 'Choose your pricing model' },
      { label: 'On-demand pricing', icon: 'pi pi-check-circle' },
      { label: 'Lower costs with commitments', icon: 'pi pi-check-circle' },
      { label: 'Reserved Capacity available', icon: 'pi pi-check-circle' },
      { label: 'Savings Plans available', icon: 'pi pi-check-circle' },
      { label: 'Service Plans available', icon: 'pi pi-check-circle' }
    ]
  }
]
