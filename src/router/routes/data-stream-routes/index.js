import * as Helpers from '@/helpers'
import { listWorkloadsDynamicFieldsService } from '@/services/workloads-services'
import { useAccountStore } from '@/stores/account'
import { documentationObserveProducts } from '@/helpers/azion-documentation-catalog'

async function checkDomainsLimit(to, from, next) {
  const accountStore = useAccountStore()
  const { hasActiveUserId } = accountStore

  if (!hasActiveUserId) {
    return next()
  }

  try {
    const workloads = await listWorkloadsDynamicFieldsService({
      fields: 'id',
      ordering: 'id',
      page: 1,
      pageSize: 1
    })

    const isMaxDomainsReached = workloads.count >= 3000
    if (isMaxDomainsReached) {
      return next('/')
    }

    return next()
  } catch (error) {
    return next()
  }
}

/** @type {import('vue-router').RouteRecordRaw} */
export const dataStreamRoutes = {
  path: '/data-stream',
  name: 'data-stream',
  children: [
    {
      path: '',
      name: 'list-data-stream',
      component: () => import('@views/DataStream/ListView.vue'),
      props: {
        documentationService: documentationObserveProducts.dataStream
      },
      meta: {
        title: 'Data Stream',
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-stream'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-data-stream',
      component: () => import('@views/DataStream/CreateView.vue'),
      beforeEnter: checkDomainsLimit,
      meta: {
        title: 'Create Data Stream',
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-stream'
          },
          {
            label: 'Create',
            to: '/data-stream/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-data-stream',
      component: () => import('@views/DataStream/EditView.vue'),
      beforeEnter: checkDomainsLimit,
      props: {
        updatedRedirect: 'list-data-stream'
      },
      meta: {
        title: 'Edit Data Stream',
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-stream'
          },
          {
            label: 'Edit Stream',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
