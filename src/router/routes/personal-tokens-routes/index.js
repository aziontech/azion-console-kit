import * as PersonalTokensService from '@/services/personal-tokens-services'

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
        deletePersonalTokenService: PersonalTokensService.deletePersonalToken
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Personal Tokens',
            to: '/personal-tokens'
          }
        ]
      }
    }
  ]
}
