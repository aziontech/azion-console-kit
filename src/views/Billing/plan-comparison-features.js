export const PLAN_COMPARISON_FEATURES = {
  hobby: {
    label: 'Hobby',
    tagline: 'Start free for personal projects and learning.',
    description: 'All products and features available.',
    sectionTitle: 'All features available',
    features: [
      { title: 'Global infrastructure', icon: 'pi pi-globe text-[var(--primary)]' },
      { title: 'Serverless functions', icon: 'ai ai-edge-functions text-[var(--primary)]' },
      { title: 'Storage & SQL Database', icon: 'ai ai-store text-[var(--primary)]' },
      { title: 'Image optimization', icon: 'pi pi-image text-[var(--primary)]' },
      { title: 'DDoS protection & firewall', icon: 'pi pi-shield text-[var(--primary)]' }
    ]
  },
  pro: {
    label: 'Pro',
    tagline: 'For growing applications that need more.',
    description: 'Billed annually or $25/mo billed monthly.',
    sectionTitle: 'Scale beyond included limits',
    features: [
      { title: 'Additional workloads', icon: 'ai ai-workloads text-[var(--primary)]' },
      { title: 'Higher application limits', icon: 'ai ai-edge-application text-[var(--primary)]' },
      { title: 'More storage capacity', icon: 'ai ai-edge-storage text-[var(--primary)]' },
      { title: 'Broader security coverage', icon: 'ai ai-secure-pillar text-[var(--primary)]' },
      { title: 'Configurable spend limits', icon: 'pi pi-dollar text-[var(--primary)]' }
    ]
  },
  enterprise: {
    label: 'Enterprise',
    tagline: 'Optimize costs with commitment-based savings.',
    description: 'Billed annually or custom billed monthly.',
    sectionTitle: 'Choose your pricing model',
    features: [
      { title: 'On-demand pricing', icon: 'pi pi-wave-pulse text-[var(--primary)]' },
      { title: 'Lower costs with commitments', icon: 'pi pi-dollar text-[var(--primary)]' },
      { title: 'Reserved Capacity available', icon: 'pi pi-sliders-v text-[var(--primary)]' },
      { title: 'Savings Plans available', icon: 'pi pi-money-bill text-[var(--primary)]' },
      { title: 'Advanced support available', icon: 'pi pi-wrench text-[var(--primary)]' }
    ]
  }
}

export const getComparisonFeatures = (plan) => PLAN_COMPARISON_FEATURES[plan]?.features || []

export const getComparisonInfo = (plan) => PLAN_COMPARISON_FEATURES[plan] ?? null
