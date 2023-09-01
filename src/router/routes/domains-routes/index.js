import * as DomainServicesService from '@/services/domains-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const domainsRoutes = {
  path: '/domains',
  name: 'domains',
  component: () => import('@views/Domains/ListView.vue'),
  props: {
    listDomainsService: DomainServicesService.listDomainsService,
    deleteDomainsService: DomainServicesService.deleteDomainService
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Domains',
        to: '/domains'
      }
    ]
  }
}
