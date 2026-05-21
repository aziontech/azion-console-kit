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
      { title: '20 Workloads' },
      { title: '20M Application requests' },
      { title: '10 hours Function compute time' },
      { title: '2 GB Real-Time Events Storage' },
      { title: '20 GB Object Storage' },
      { title: '1 GB SQL Database Storage' },
      { title: '20M Firewall requests' },
      { title: 'DDoS Protection included' }
    ]
  }
}

export const getPlanLabel = (plan) => PLAN_INFO[plan]?.label || plan

export const getPlanFeatures = (plan) => PLAN_INFO[plan]?.features || []
