import * as Helpers from '@/helpers'

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
        documentationService: Helpers.documentationCatalog.edgeDNS,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
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
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Create Zone',
            to: '/edge-dns/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-edge-dns',
      component: () => import('@views/EdgeDNS/EditView.vue'),
      props: {
        clipboardWrite: Helpers.clipboardWrite,
        updatedRedirect: 'list-edge-dns'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Edit Zone'
          }
        ]
      }
    },
    {
      path: 'edit/:id/records',
      name: 'edge-dns-records',
      component: () => import('@views/EdgeDNS/EditView.vue'),
      props: {
        clipboardWrite: Helpers.clipboardWrite,
        documentationService: Helpers.documentationCatalog.records
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Edit Record'
          }
        ]
      }
    }
  ]
}
