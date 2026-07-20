export const PRO_UPGRADE_HIGHLIGHTS = [
  { title: '20 Workloads' },
  { title: '2 TB/month Workload Data Transfer' },
  { title: '20M Requests/month across Workloads and Firewalls' },
  { title: '20 Rules per Application and per Firewall' },
  { title: '10 hours/month Functions Compute Time' },
  { title: '10,000 Image Transformations/month' },
  { title: '20 GB Object Storage' },
  { title: '200,000 WAF-Analyzed Requests/month' }
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
      { title: '20 Workloads', description: 'then $0.10 per workload per month' },
      { title: '2 TB/month Workload Data Transfer', description: 'then as low as $0.02 per GB' },
      {
        title: '20M Requests/month across Workloads and Firewalls',
        description: 'then as low as $0.30 per 1M'
      },
      {
        title: '20 Rules per Application and per Firewall',
        description: 'then from $0.20 per additional rule'
      },
      {
        title: '10 hours/month Functions Compute Time',
        description: 'then $0.072 per 1,000 seconds'
      },
      {
        title: '10,000 Image Transformations/month',
        description: 'then as low as $0.64 per 10,000 images'
      },
      { title: '20 GB Object Storage', description: 'then as low as $0.021 per GB-month' },
      {
        title: '200,000 WAF-Analyzed Requests/month',
        description: 'then as low as $0.018 per 10,000 requests'
      }
    ]
  }
}

export const getPlanLabel = (plan) => PLAN_INFO[plan]?.label || plan

export const getPlanFeatures = (plan) => PLAN_INFO[plan]?.features || []
