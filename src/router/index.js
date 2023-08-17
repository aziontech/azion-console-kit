import { createRouter, createWebHistory } from 'vue-router'
import VariablesView from '@/views/Variables/ListView.vue'
import { listVariablesService } from '@/services/variables-services'
import EdgeApplicationsListView from '@/views/EdgeApplications/ListView.vue'
import DomainsListView from '@/views/Domains/ListView.vue'
import { listEdgeApplicationsService, deleteEdgeApplicationService } from '@/services/edge-application-services'
import { listDomainsService, deleteDomainService } from '@/services/domains-services'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EdgeApplicationsListView,
      props: {
        listEdgeApplicationsService: listEdgeApplicationsService,
        deleteEdgeApplicationService: deleteEdgeApplicationService
      }
    },
    {
      path: '/edge-applications',
      name: 'edge-applications',
      component: EdgeApplicationsListView,
      props: {
        listEdgeApplicationsService: listEdgeApplicationsService,
        deleteEdgeApplicationService: deleteEdgeApplicationService
      }
    },
    {
      path: '/domains',
      name: 'domains',
      component: DomainsListView,
      props: {
        listDomainsService: listDomainsService,
        deleteDomainsService: deleteDomainService,
      }
    },
    {
      path: '/variables',
      name: 'variables',
      component: VariablesView,
      props: {
        listVariablesService: listVariablesService,
      }
    },
    // {
    //   path: '/edge-application',
    //   name: 'edge-application',
    //   // route level code-splitting
    //   // this generates a separate chunk (Home.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/HomeView'),
    //   props:{
    //     listService:listEdgeApplicationsService
    //   }
    // },
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
