import * as Helpers from '@/helpers'
import { documentationAccountsProducts } from '@/helpers/azion-documentation-catalog'

/** @type {import('vue-router').RouteRecordRaw} */
export const personalTokensRoutes = {
  path: '/personal-tokens',
  name: 'personal-tokens',
  children: [
    {
      path: '',
      name: 'list-personal-tokens',
      component: () => import('@views/PersonalTokens/ListView.vue'),
      props: {
        documentationService: documentationAccountsProducts.personalTokens
      },
      meta: {
        title: 'Personal Tokens',
        breadCrumbs: [
          {
            label: 'Personal Tokens',
            to: '/personal-tokens'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-personal-token',
      component: () => import('@views/PersonalTokens/CreateView.vue'),
      props: {
        clipboardWrite: Helpers.clipboardWrite,
        convertDateToLocalTimezone: Helpers.convertDateToLocalTimezone
      },
      meta: {
        title: 'Create Personal Token',
        breadCrumbs: [
          {
            label: 'Personal Tokens',
            to: '/personal-tokens'
          },
          {
            label: 'Create',
            to: '/personal-tokens/create'
          }
        ]
      }
    }
  ]
}
