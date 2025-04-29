import * as Helpers from '@/helpers'
import * as CustomPagesServiceV4 from '@/services/custom-pages-services/v4'

/** @type {import('vue-router').RouteRecordRaw} */
export const customPagesRoutes = {
  path: '/custom-pages',
  name: 'custom-pages',
  children: [
    {
      path: '',
      name: 'list-custom-pages',
      component: () => import('@views/CustomPages/ListView.vue'),
      props: {
        listCustomPagesService: CustomPagesServiceV4.listCustomPagesService,
        deleteCustomPagesService: CustomPagesServiceV4.deleteCustomPagesService,
        createCustomPagesService: CustomPagesServiceV4.createCustomPagesService,
        documentationService: Helpers.documentationCatalog.customPages
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Custom Pages',
            to: '/custom-pages'
          }
        ]
      }
    }
  ]
}
