import * as Helpers from '@/helpers'
import { documentationSecureProducts } from '@/helpers/azion-documentation-catalog'
import * as WafRulesService from '@/services/waf-rules-services'
import * as DomainsService from '@/services/domains-services'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

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
        documentationService: documentationSecureProducts.wafRules
      },
      meta: {
        title: 'WAF Rules',
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
        title: 'Create WAF Rule',
        breadCrumbs: [
          {
            label: 'WAF Rules',
            to: '/waf'
          },
          {
            label: 'Create',
            to: '/waf/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-waf-rules',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/WafRules/v6/EditView.vue')
          : import('@views/WafRules/TabsView.vue'),
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
        title: 'Edit WAF Rule',
        breadCrumbs: [
          {
            label: 'WAF Rules',
            to: '/waf'
          },
          {
            label: 'Edit WAF Rule',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-waf-rules', params: ['id'] }
          }
        ]
      }
    },
    {
      path: 'edit/:id/versions/:versionId/:tab?',
      name: 'edit-waf-rules-version',
      component: () => import('@views/WafRules/v6/VersionEditView.vue'),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'WAF Rules',
            to: '/waf'
          },
          {
            label: 'Edit WAF Rule',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-waf-rules', params: ['id'] }
          },
          {
            label: 'Version',
            dynamic: true,
            routeParam: 'versionId',
            useParamValue: true
          }
        ]
      }
    }
  ]
}
