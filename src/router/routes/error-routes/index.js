import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const errorRoutes = [
  {
    path: '/forbidden',
    name: '403',
    component: () => import('@views/Error/ErrorPage.vue'),
    props: {
      statusCode: 403,
      title: 'Forbidden',
      description:
        "You don't have permission to access this section. If you need access, please contact your administrator.",
      documentationService: Helpers.documentationCatalog.resources
    },
    meta: {
      title: '403 Forbidden'
    }
  },
  {
    path: '/:catchAll(.*)',
    name: '404',
    component: () => import('@views/Error/ErrorPage.vue'),
    props: {
      statusCode: 404,
      title: 'Not Found',
      description:
        "This page doesn't exist yet, usually occurs due to an incorrect or outdated link. Refresh this page and trying again, or you can navigate to a different section of the website.",
      documentationService: Helpers.documentationCatalog.resources
    },
    meta: {
      title: '404 Not Found'
    }
  }
]
