import * as Helpers from '@/helpers'
import * as WafRulesService from '@/services/waf-rules-services'
import * as WafRulesServiceV4 from '@/services/waf-rules-services/v4'
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
          editWafRulesService: WafRulesServiceV4.editWafRulesService,
          loadWafRulesService: WafRulesServiceV4.loadWafRulesService
        },
        wafTuning: {
          documentationServiceTuning: Helpers.documentationCatalog.wafTuning,
          listWafRulesTuningService: WafRulesService.listWafRulesTuningService,
          listNetworkListService: WafRulesServiceV4.listNetworkListService,
          listCountriesService: listCountriesService,
          listWafRulesDomainsService: WafRulesService.listWafRulesDomainsService,
          createWafRulesAllowedTuningService: WafRulesService.createWafRulesAllowedTuningService,
          listWafRulesTuningAttacksService: WafRulesService.listWafRulesTuningAttacksService,
          listDomainsService: DomainsService.listDomainsService,
          loadDomainService: DomainsService.loadDomainService,
          loadNetworkListService: WafRulesServiceV4.loadNetworkListService
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
