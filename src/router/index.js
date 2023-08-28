import { createRouter, createWebHistory } from 'vue-router'
import * as VariablesService from '@/services/variables-services'
import { listEdgeApplicationsService, deleteEdgeApplicationService } from '@/services/edge-application-services'
import { listDomainsService, deleteDomainService } from '@/services/domains-services'
import * as DigitalCertificatesService  from '@/services/digital-certificates'


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
      children: [
        {
          path: '',
          name: 'list-digital-certificates',
          component: () => import('@/views/DigitalCertificates/ListView.vue'),
          props: {
            listDigitalCertificatesService: DigitalCertificatesService.listDigitalCertificatesService,
            deleteDigitalCertificatesService:
            DigitalCertificatesService.deleteDigitalCertificatesService,
          },
          meta:{
            breadCrumbs:[
              {
                label: 'Digital Certificates',
                to: '/digital-certificates'
              }
            ]
          }
        },
        {
          path: 'create',
          name: 'create-digital-certificates',
          component: () => import('@/views/DigitalCertificates/CreateView.vue'),
          props: {
            createDigitalCertificatesService: DigitalCertificatesService.createDigitalCertificatesService
          },
          meta:{
            breadCrumbs:[
              {
                label:'Digital Certificates',
                to:'/digital-certificates'
              },
              {
                label:'Create Digital Certificates',
                to:'/digital-certificates/create'
              }
            ]
          }
        },
      ],
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
