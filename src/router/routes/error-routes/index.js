import * as Helpers from '@/helpers'
/** @type {import('vue-router').RouteRecordRaw} */
export const errorRoutes = [
  {
    path: '/forbidden',
    name: '403',
    component: () => import('@views/Error/ForbiddenView.vue'),
    props: {
      documentationService: Helpers.documentationCatalog.resources
    }
  },
  {
    path: '/:catchAll(.*)',
    name: '404',
    component: () => import('@views/Error/NotFoundView.vue'),
    props: {
      documentationService: Helpers.documentationCatalog.resources
    }
  }
]
