import { hasFlagBlockApiV4 } from '@/composables/user-flag'

const TEXT_FOR_DOMAIN = {
  singularTitle: 'Domain',
  singularLabel: 'domain',
  pluralTitle: 'Domains',
  pluralLabel: 'domains',
  icon: 'ai ai-domains'
}

const TEXT_FOR_WORKLOAD = {
  singularTitle: 'Workload',
  singularLabel: 'workload',
  pluralTitle: 'Workloads',
  pluralLabel: 'workloads',
  icon: 'ai ai-workloads',
  tag: 'Preview'
}

const TEXT_DOMAIN_WORKLOAD = () => (hasFlagBlockApiV4() ? TEXT_FOR_DOMAIN : TEXT_FOR_WORKLOAD)

export default TEXT_DOMAIN_WORKLOAD
