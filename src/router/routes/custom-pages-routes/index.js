import * as Helpers from '@/helpers'

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
        documentationService: Helpers.documentationGuideProducts.customPages
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Custom Pages',
            to: '/custom-pages'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'create',
      name: 'create-custom-pages',
      component: () => import('@views/CustomPages/CreateView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Custom Pages',
            to: '/custom-pages'
          },
          {
            label: 'Create Page',
            to: '/custom-pages/create'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-custom-pages',
      component: () => import('@views/CustomPages/EditView.vue'),
      props: {
        updatedRedirect: 'list-custom-pages'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Custom Pages',
            to: '/custom-pages'
          },
          {
            label: 'Edit Page',
            to: '/custom-pages/edit'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    }
  ]
}
