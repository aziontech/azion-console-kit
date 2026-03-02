import * as Helpers from '@/helpers'
import { documentationSecureProducts } from '@/helpers/azion-documentation-catalog'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeDnsRoutes = {
  path: '/edge-dns',
  name: 'edge-dns',
  children: [
    {
      path: '',
      name: 'list-edge-dns',
      component: () => import('@views/EdgeDNS/ListView.vue'),
      props: {
        documentationService: documentationSecureProducts.edgeDNS,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        title: 'Edge DNS',
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-edge-dns',
      component: () => import('@views/EdgeDNS/CreateView.vue'),
      props: {
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        title: 'Create Zone',
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Zone',
            to: '/edge-dns'
          },
          {
            label: 'Create',
            to: '/edge-dns/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-edge-dns',
      component: () => import('@views/EdgeDNS/TabsView.vue'),
      props: {
        clipboardWrite: Helpers.clipboardWrite,
        updatedRedirect: 'list-edge-dns',
        documentationService: Helpers.documentationCatalog.records
      },
      meta: {
        title: 'Edit Zone',
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Zone',
            to: '/edge-dns'
          },
          {
            label: 'Edit Zone',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
