import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DomainsView from '@/views/DomainsView.vue'
import VariablesView from '@/views/VariablesView.vue'
import { listVariablesService } from '@/services/variables-services'
import { listEdgeApplicationsService, deleteEdgeApplicationService } from '@/services/edge-application-services'
import { listDomainsService } from '@/services/domains-services'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      props: {
        listEdgeApplicationsService: listEdgeApplicationsService,
        deleteEdgeApplicationService: deleteEdgeApplicationService
      }
    },
    {
      path: '/domains',
      name: 'domains',
      component: DomainsView,
      props: {
        listDomainsService: listDomainsService
      }
    },
    {
      path: '/variables',
      name: 'variables',
      component: VariablesView,
      props: {
        listVariablesService: listVariablesService
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
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (Home.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/HomeView.vue')
    }
  ]
})

export default router
