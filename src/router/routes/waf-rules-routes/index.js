import * as Helpers from '@/helpers'
import * as WafRulesService from '@/services/waf-rules-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const wafRulesRoutes = {
  path: '/waf',
  name: 'waf',
  children: [
    {
      path: '',
      name: 'list-waf-rules',
      component: () => import('@views/WafRules/ListView.vue'),
      props: {
        listWafRulesService: WafRulesService.listWafRulesService,
        deleteWafRulesService: WafRulesService.deleteWafRulesService,
        documentationService: Helpers.documentationCatalog.waf
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Waf Rules',
            to: '/waf'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-waf-rules',
      component: () => import('@views/WafRules/CreateView.vue'),
      props: {
        createWafRulesService: WafRulesService.createWafRulesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Waf Rules',
            to: '/waf'
          },
          {
            label: 'New WAF Rules',
            to: '/waf/create'
          }
        ]
      }
    }
  ]
}
