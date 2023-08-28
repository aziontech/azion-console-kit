import { createRouter, createWebHistory } from 'vue-router'
import * as VariablesService from '@/services/variables-services'
import * as IntelligentDNSService from '@/services/intelligent-dns-services'
import * as EdgeFirewall from '@/services/edge-firewall'
import * as EdgeFunctionsService from '@/services/edge-functions'
import * as DataStreamingService from '@/services/data-streaming'
import * as EdgeServicesService from '@/services/edge-services'
import * as NetworkListService  from '@/services/network-list-services'
import * as EdgeApplicationsService from '@/services/edge-application-services'
import * as DomainServicesService from '@/services/domains-services'
import * as DigitalCertificatesServices from '@/services/digital-certificates'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/EdgeApplications/ListView.vue'),
      props: {
        listEdgeApplicationsService: EdgeApplicationsService.listEdgeApplicationsService,
        deleteEdgeApplicationService: EdgeApplicationsService.deleteEdgeApplicationService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Applications',
            to: '/edge-applications'
          }
        ]
      }
    },
    {
      path: '/edge-applications',
      name: 'edge-applications',
      component: () => import('@/views/EdgeApplications/ListView.vue'),
      props: {
        listEdgeApplicationsService: EdgeApplicationsService.listEdgeApplicationsService,
        deleteEdgeApplicationService: EdgeApplicationsService.deleteEdgeApplicationService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Applications',
            to: '/edge-applications'
          }
        ]
      }
    },
    {
      path: '/domains',
      name: 'domains',
      component: () => import('@/views/Domains/ListView.vue'),
      props: {
        listDomainsService: DomainServicesService.listDomainsService,
        deleteDomainsService: DomainServicesService.deleteDomainService,
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          }
        ]
      }
    },
    {
      path: '/digital-certificates',
      name: 'digital-certificates',
      component: () => import('@/views/DigitalCertificates/ListView.vue'),
      props: {
        listDigitalCertificatesService: DigitalCertificatesServices.listDigitalCertificatesService,
        deleteDigitalCertificatesService: DigitalCertificatesServices.deleteDigitalCertificatesService,
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Digital Certificates',
            to: '/digital-certificates'
          }
        ]
      }
    },
    {
      path: '/edge-firewall',
      name: 'edge-firewall',
      component: () => import('@/views/EdgeFirewall/ListView.vue'),
      props: {
        listEdgeFirewallService: EdgeFirewall.listEdgeFirewallService,
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Firewall',
            to: '/edge-firewall'
          }
        ]
      }
    },
    {
      path: '/variables',
      name: 'variables',
      children: [
        {
          path: '',
          name: 'list-variables',
          component: () => import('@/views/Variables/ListView.vue'),
          props: {
            listVariablesService: VariablesService.listVariablesService,
            deleteVariablesService: VariablesService.deleteVariablesService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Variables',
                to: '/variables'
              }
            ]
          }
        }
        , {
          path: 'create',
          name: 'create-variables',
          component: () => import('@/views/Variables/CreateView.vue'),
          props: {
            createVariablesService: VariablesService.createVariablesService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Variables',
                to: '/variables'
              },
              {
                label: 'Create Variables',
                to: '/variables/create'
              }
            ]
          }
        }
        , {
          path: 'edit/:id',
          name: 'edit-variables',
          component: () => import('@/views/Variables/EditView.vue'),
          props: {
            editVariableService: VariablesService.editVariableService,
            loadVariableService: VariablesService.loadVariableService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Variables',
                to: '/variables'
              },
              {
                label: 'Edit Variables',
              }
            ]
          }
        }
      ]
    },
    {
      path: '/intelligent-dns',
      name: 'intelligent-dns',
      children: [
        {
          path: '',
          name: 'list-intelligent-dns',
          component: () => import('@/views/IntelligentDNS/ListView.vue'),
          props: {
            listIntelligentDNSService: IntelligentDNSService.listIntelligentDNSService,
            deleteIntelligentDNSService: IntelligentDNSService.deleteIntelligentDNSService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Intelligent DNS',
                to: '/intelligent-dns'
              }
            ]
          }
        },
        {
          path: 'create',
          name: 'create-intelligent-dns',
          component: () => import('@/views/IntelligentDNS/CreateView.vue'),
          props: {
            createIntelligentDNSService: IntelligentDNSService.createIntelligentDNSService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Intelligent DNS',
                to: '/intelligent-dns'
              },
              {
                label: 'Create Intelligent DNS',
                to: '/intelligent-dns/create'
              }
            ]
          }
        },
        {
          path: 'edit/:id',
          name: 'edit-intelligent-dns',
          component: () => import('@/views/IntelligentDNS/EditView.vue'),
          props: {
            editIntelligentDNSService: IntelligentDNSService.editIntelligentDNSService,
            loadIntelligentDNSService: IntelligentDNSService.loadIntelligentDNSService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Intelligent DNS',
                to: '/intelligent-dns'
              },
              {
                label: 'Edit Intelligent DNS',
              }
            ]
          }
        }
      ]
    },
    {
      path: '/network-list',
      name: 'network-list',
      children: [
        {
          path: '',
          name: 'list-network-list',
          component: () => import('@/views/NetworkList/ListView.vue'),
          props: {
            listNetworkListService: NetworkListService.listNetworkListService,
            deleteNetworkListService: NetworkListService.deleteNetworkListService,
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Network List',
                to: '/network-list'
              }
            ]
          }
        },
        {
          path: 'create',
          name: 'create-network-list',
          component: () => import('@/views/NetworkList/CreateView.vue'),
          props: {
            createNetworkListService: NetworkListService.createNetworkListService,
            listCountriesService: NetworkListService.listCountriesService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Network List',
                to: '/network-list'
              },
              {
                label: 'Create Network',
                to: '/network-list/create'
              }
            ]
          }
        }
      ]
    },
    {
      path: '/edge-functions',
      name: 'edge-functions',
      children:[
        {
          path:'',
          name:'list-edge-functions',
          component: () => import('@/views/EdgeFunctions/ListView.vue'),
          props: {
            listEdgeFunctionsService: EdgeFunctionsService.listEdgeFunctionsService,
          }
        }
      ]
    },
    {
      path: '/data-streaming',
      name: 'data-streaming',
      children:[
        {
          path:'',
          name:'list-data-streaming',
          component: () => import('@/views/DataStreaming/ListView.vue'),
          props: {
            listDataStreamingService: DataStreamingService.listDataStreamingService,
          }
        }
      ]
    },
    {
      path: '/edge-services',
      name: 'edge-services',
      children:[
        {
          path:'',
          name:'list-edge-services',
          component: () => import('@/views/EdgeServices/ListView.vue'),
          props: {
            listEdgeServicesService: EdgeServicesService.listEdgeServicesService,
          }
        }
      ]
    }
    // example of lazy route
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (Home.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/HomeView.vue')
    // }
  ]
})

export default router
