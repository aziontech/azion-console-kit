const TEXT_FOR_DOMAIN = {
  singularTitle: 'Domain',
  singularLabel: 'domain',
  pluralTitle: 'Domains',
  pluralLabel: 'domains'
}

const TEXT_FOR_WORKLOAD = {
  singularTitle: 'Workload',
  singularLabel: 'workload',
  pluralTitle: 'Workloads',
  pluralLabel: 'workloads'
}

//TODO handle flags next task
const IS_DOMAIN_CONTEXT = false

const SELECTED_TEXT = IS_DOMAIN_CONTEXT ? TEXT_FOR_DOMAIN : TEXT_FOR_WORKLOAD

export default SELECTED_TEXT
