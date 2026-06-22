import { hasFlagUseV6Configurations } from '@/composables/user-flag'
import { documentationSecureProducts } from '@/helpers/azion-documentation-catalog'

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
        documentationService: documentationSecureProducts.customPages
      },
      meta: {
        title: 'Custom Pages',
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
      component: () => import('@views/CustomPages/View.vue'),
      meta: {
        title: 'Create Custom Page',
        breadCrumbs: [
          {
            label: 'Custom Pages',
            to: '/custom-pages'
          },
          {
            label: 'Create',
            to: '/custom-pages/create'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-custom-pages',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/CustomPages/v6/EditView.vue')
          : import('@views/CustomPages/View.vue'),
      props: {
        updatedRedirect: 'list-custom-pages',
        mode: 'edit'
      },
      meta: {
        title: 'Edit Custom Page',
        breadCrumbs: [
          {
            label: 'Custom Pages',
            to: '/custom-pages'
          },
          {
            label: 'Edit Page',
            to: '/custom-pages/edit',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-custom-pages', params: ['id'] }
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'edit/:id/versions/:versionId/:tab?',
      name: 'edit-custom-pages-version',
      component: () => import('@views/CustomPages/v6/VersionEditView.vue'),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Custom Pages',
            to: '/custom-pages'
          },
          {
            label: 'Edit Page',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-custom-pages', params: ['id'] }
          },
          {
            label: 'Version',
            dynamic: true,
            routeParam: 'versionId',
            useParamValue: true
          }
        ]
      }
    }
  ]
}
