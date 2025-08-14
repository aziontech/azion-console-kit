import * as PersonalTokensService from '@/services/personal-tokens-services'
import * as Helpers from '@/helpers'

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
        listPersonalTokensService: PersonalTokensService.listPersonalTokens,
        deletePersonalTokenService: PersonalTokensService.deletePersonalToken,
        documentationService: Helpers.documentationCatalog.personalTokens
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
        createPersonalTokenService: PersonalTokensService.createPersonalToken,
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
            label: 'Create Personal Token',
            to: '/personal-tokens/create'
          }
        ]
      }
    }
  ]
}
