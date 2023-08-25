import { createRouter, createWebHistory } from 'vue-router'
import * as VariablesService from '@/services/variables-services'
import * as IntelligentDNSService from '@/services/intelligent-dns-services'
import { listEdgeApplicationsService, deleteEdgeApplicationService } from '@/services/edge-application-services'
import { listDomainsService, deleteDomainService } from '@/services/domains-services'
import { listDigitalCertificatesService,deleteDigitalCertificatesService } from '@/services/digital-certificates'
import * as NetworkListService  from '@/services/network-list-services'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/EdgeApplications/ListView.vue'),
      props: {
        listEdgeApplicationsService: listEdgeApplicationsService,
        deleteEdgeApplicationService: deleteEdgeApplicationService
      },
      meta:{
        breadCrumbs:[
          {
            label:'Edge Applications',
            to:'/edge-applications'
          }
        ]
      }
    },
    {
      path: '/edge-applications',
      name: 'edge-applications',
      component: () => import('@/views/EdgeApplications/ListView.vue'),
      props: {
        listEdgeApplicationsService: listEdgeApplicationsService,
        deleteEdgeApplicationService: deleteEdgeApplicationService
      },
      meta:{
        breadCrumbs:[
          {
            label:'Edge Applications',
            to:'/edge-applications'
          }
        ]
      }
    },
    {
      path: '/domains',
      name: 'domains',
      component: () => import('@/views/Domains/ListView.vue'),
      props: {
        listDomainsService: listDomainsService,
        deleteDomainsService: deleteDomainService,
      },
      meta:{
        breadCrumbs:[
          {
            label:'Domains',
            to:'/domains'
          }
        ]
      }
    },
    {
      path: '/digital-certificates',
      name: 'digital-certificates',
      component: () => import('@/views/DigitalCertificates/ListView.vue'),
      props: {
        listDigitalCertificatesService: listDigitalCertificatesService,
        deleteDigitalCertificatesService:
        deleteDigitalCertificatesService,
      },
      meta:{
        breadCrumbs:[
          {
            label:'Digital Certificates',
            to:'/digital-certificates'
          }
        ]
      }
    },
    {
      path: '/variables',
      name: 'variables',
      children:[
        {
          path:'',
          name:'list-variables',
          component: () => import('@/views/Variables/ListView.vue'),
          props: {
            listVariablesService: VariablesService.listVariablesService,
            deleteVariablesService:VariablesService.deleteVariablesService
          },
          meta:{
            breadCrumbs:[
              {
                label:'Variables',
                to:'/variables'
              }
            ]
          }
        }
        ,{
          path: 'create',
          name: 'create-variables',
          component: () => import('@/views/Variables/CreateView.vue'),
          props: {
            createVariablesService: VariablesService.createVariablesService
          },
          meta:{
            breadCrumbs:[
              {
                label:'Variables',
                to:'/variables'
              },
              {
                label:'Create Variables',
                to:'/variables/create'
              }
            ]
          }
        }
        ,{
          path: 'edit/:id',
          name: 'edit-variables',
          component: () => import('@/views/Variables/EditView.vue'),
          props: {
            editVariableService: VariablesService.editVariableService,
            loadVariableService: VariablesService.loadVariableService
          },
          meta:{
            breadCrumbs:[
              {
                label:'Variables',
                to:'/variables'
              },
              {
                label:'Edit Variables',
              }
            ]
          }
        }
      ]
    },
    {
      path: '/intelligent-dns',
      name: 'intelligent-dns',
      children:[
        {
          path:'',
          name:'list-intelligent-dns',
          component: () => import('@/views/IntelligentDNS/ListView.vue'),
          props: {
            listIntelligentDNSService: IntelligentDNSService.listIntelligentDNSService,
            deleteIntelligentDNSService: IntelligentDNSService.deleteIntelligentDNSService
          },
          meta:{
            breadCrumbs:[
              {
                label:'Intelligent DNS',
                to:'/intelligent-dns'
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
          meta:{
            breadCrumbs:[
              {
                label:'Intelligent DNS',
                to:'/intelligent-dns'
              },
              {
                label:'Create Intelligent DNS',
                to:'/intelligent-dns/create'
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
          meta:{
            breadCrumbs:[
              {
                label:'Intelligent DNS',
                to:'/intelligent-dns'
              },
              {
                label:'Edit Intelligent DNS',
              }
            ]
          }
        }
      ]
    },
    {
      path: '/network-list',
      name: 'network-list',
      children:[
        {
          path:'',
          name:'list-network-list',
          component: () => import('@/views/NetworkList/ListView.vue'),
          props: {
            listNetworkListService: NetworkListService.listNetworkListService,
            deleteNetworkListService: NetworkListService.deleteNetworkListService,
          },
          meta:{
            breadCrumbs:[
              {
                label:'Network List',
                to:'/network-list'
              }
            ]
          }
        },
        {
          path:'create',
          name:'create-network-list',
          component: () => import('@/views/NetworkList/CreateView.vue'),
          props: {
            createNetworkListService: NetworkListService.createNetworkListService,
            listCountriesService: NetworkListService.listCountriesService
          },
          meta:{
            breadCrumbs:[
              {
                label:'Create Network List',
                to:'/network-list/list/create'
              }
            ]
          }
        }
      ]
    },
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
