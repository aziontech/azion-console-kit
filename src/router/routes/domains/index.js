import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as EdgeApplicationServicesV4 from '@/services/edge-application-services/v4'
import * as WorkloadServices from '@/services/workloads-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const domainsRoutes = {
  path: '/domains',
  name: 'domains',
  children: [
    {
      path: '',
      name: 'list-domains',
      component: () => import('@views/Workload/ListView.vue'),
      props: {
        listDomainsService: WorkloadServices.listWorkloadsService,
        deleteDomainService: WorkloadServices.deleteWorkloadService,
        documentationService: Helpers.documentationCatalog.domains,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        flag: 'checkout_access',
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-domain',
      component: () => import('@views/Domains/CreateView.vue'),
      props: {
        createDomainService: DomainServices.createDomainService,
        listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
        loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsService,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        flag: 'checkout_access',
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          },
          {
            label: 'Create Domain',
            to: '/domains/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-domain',
      component: () => import('@views/Domains/EditView.vue'),
      props: {
        editDomainService: DomainServices.editDomainService,
        listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
        loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsService,
        loadDomainService: DomainServices.loadDomainService,
        updatedRedirect: 'list-domains',
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        flag: 'checkout_access',
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          },
          {
            label: 'Edit Domain'
          }
        ]
      }
    }
  ]
}
