import * as Helpers from '@/helpers'
import * as WafRulesService from '@/services/waf-rules-services'
import * as WafRulesServiceV4 from '@/services/waf-rules-services/v4'

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
        listWafRulesService: WafRulesServiceV4.listWafRulesService,
        deleteWafRulesService: WafRulesServiceV4.deleteWafRulesService,
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
      props: {
        createWafRulesService: WafRulesServiceV4.createWafRulesService
      },
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
          deleteWafRulesAllowedService: WafRulesService.deleteWafRulesAllowedService,
          createWafRulesAllowedService: WafRulesService.createWafRulesAllowedService,
          loadWafRulesAllowedService: WafRulesService.loadWafRulesAllowedService,
          editWafRulesAllowedService: WafRulesService.editWafRulesAllowedService,
          documentationServiceAllowed: Helpers.documentationCatalog.wafAllowed,
          listWafRulesAllowedService: WafRulesService.listWafRulesAllowedService,
          optionsRuleIds: WafRulesService.optionsRuleIds
        },
        wafServices: {
          updatedRedirect: 'list-waf-rules',
          editWafRulesService: WafRulesService.editWafRulesService,
          loadWafRulesService: WafRulesService.loadWafRulesService
        },
        wafTuning: {
          documentationServiceTuning: Helpers.documentationCatalog.wafTuning,
          listWafRulesTuningService: WafRulesService.listWafRulesTuningService,
          listNetworkListService: WafRulesService.listNetworkListService,
          listCountriesService: listCountriesService,
          listWafRulesDomainsService: WafRulesService.listWafRulesDomainsService,
          createWafRulesAllowedTuningService: WafRulesService.createWafRulesAllowedTuningService,
          listWafRulesTuningAttacksService: WafRulesService.listWafRulesTuningAttacksService
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
