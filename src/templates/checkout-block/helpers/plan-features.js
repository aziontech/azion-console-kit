export const PRO_UPGRADE_HIGHLIGHTS = [
  { title: '20 Workloads' },
  { title: '20 GB Object Storage' },
  { title: '20M Application requests' },
  { title: '20M Firewall requests' },
  { title: '10 hours Function compute time' },
  { title: '2 GB Real-Time Events Storage' },
  { title: 'DDoS Protection included' },
  { title: 'SOC 2 Type 2 / SOC 3' }
]

export const PLAN_INFO = {
  hobby: {
    label: 'Hobby',
    features: [
      { title: '1 Workload' },
      { title: '1M Application requests' },
      { title: '2 hours Function compute time' },
      { title: '500 MB Real-Time Events Storage' },
      { title: '5 GB Object Storage' },
      { title: '200 MB SQL Database Storage' },
      { title: '1M Firewall requests' },
      { title: 'DDoS Protection included' }
    ]
  },
  pro: {
    label: 'Pro',
    features: [
      { title: '100 Workloads', description: 'then $0.10 per workload per month' },
      { title: '10M Application requests', description: 'then as low as $0.90 per 1M' },
      { title: '50 hours Function compute time', description: 'then $0.18 per hour' },
      { title: '10 GB Real-Time Events Storage', description: 'then $0.10 per GB-month' },
      { title: '100 GB Object Storage', description: 'then as low as $0.021 per GB-month' },
      { title: '1 GB SQL Database Storage', description: 'then $0.75 per GB-month' },
      { title: '100M Firewall requests', description: 'then as low as $0.30 per 1M' },
      { title: 'DDoS Protection included' },
      { title: 'PCI DSS 4.0.1 Level 1' },
      { title: 'SOC 2 Type 2 / SOC 3' },
      { title: 'Universal Data Migration Service' }
    ]
  }
}

export const getPlanLabel = (plan) => PLAN_INFO[plan]?.label || plan

export const getPlanFeatures = (plan) => PLAN_INFO[plan]?.features || []
