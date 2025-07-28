import * as Helpers from '@/helpers'
import * as WafRulesService from '@/services/waf-rules-services'
import * as DomainsService from '@/services/domains-services'

import { listCountriesService } from '@/services/network-lists-services'

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
        documentationService: Helpers.documentationCatalog.waf
      },
      meta: {
        breadCrumbs: [
          {
            label: 'WAF Rules',
            to: '/waf'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-waf-rules',
      component: () => import('@views/WafRules/CreateView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'WAF Rules',
            to: '/waf'
          },
          {
            label: 'Create WAF Rule',
            to: '/waf/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-waf-rules',
      component: () => import('@views/WafRules/TabsView.vue'),
      props: {
        wafRulesAllowed: {
          documentationServiceAllowed: Helpers.documentationCatalog.wafAllowed
        },
        wafServices: {
          updatedRedirect: 'list-waf-rules'
        },
        wafTuning: {
          documentationServiceTuning: Helpers.documentationCatalog.wafTuning,
          listWafRulesTuningService: WafRulesService.listWafRulesTuningService,
          listCountriesService: listCountriesService,
          listWafRulesDomainsService: WafRulesService.listWafRulesDomainsService,
          listWafRulesTuningAttacksService: WafRulesService.listWafRulesTuningAttacksService,
          listDomainsService: WafRulesService.listWafRulesDomainsService,
          loadDomainService: DomainsService.loadDomainService
        }
      },
      meta: {
        breadCrumbs: [
          {
            label: 'WAF Rules',
            to: '/waf'
          },
          {
            label: 'Edit WAF Rule'
          }
        ]
      }
    }
  ]
}
