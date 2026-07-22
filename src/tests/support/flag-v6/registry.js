/**
 * FLAG_FORK_INVENTORY — the single source of truth for every place where the
 * `use_v6_configurations` feature flag forks behavior (spec flag-v6-coverage,
 * req 2.3/7.1). Three readers:
 *
 *   1. Parametrized suites (route-fork, legacy-smoke, services, views) generate
 *      the ON/OFF cases from these descriptors.
 *   2. The completeness guard (fork-inventory-guard.test.js) scans src/ and
 *      fails when a flag usage exists outside this inventory — a new fork can
 *      never ship untested.
 *   3. Humans: this file IS the map of "where the flag switches the console".
 *
 * Audited 2026-07-22 on feat/versioning: 18 occurrences in route files
 * (15 component forks + 3 extras), 3 service files, 8 view files, 1 menu item.
 */

export const FLAG_NAME = 'use_v6_configurations'

// Real account payload shapes (the same the app receives — spec req 8.1/8.3).
export const ACCOUNT_WITH_FLAG = Object.freeze({ client_flags: [FLAG_NAME] })
export const ACCOUNT_LEGACY = Object.freeze({ client_flags: [] })

export const FLAG_FORK_INVENTORY = {
  /**
   * Route component forks: `component: () => hasFlagUseV6Configurations()
   * ? import(v6View) : import(legacyView)`. Paths are the literal import
   * specifiers used in the route file. NOTE workload: the fork is INVERTED in
   * directory naming — the flag-ON view is NOT under /v6/ (legacy moved to
   * /legacy/ instead).
   */
  routes: [
    {
      resource: 'custom-pages',
      routeFile: 'src/router/routes/custom-pages-routes/index.js',
      forks: [
        {
          routeName: 'edit-custom-pages',
          v6View: '@views/CustomPages/v6/EditView.vue',
          legacyView: '@views/CustomPages/View.vue'
        }
      ]
    },
    {
      resource: 'digital-certificates',
      routeFile: 'src/router/routes/digital-certificates-routes/index.js',
      forks: [
        {
          routeName: 'list-digital-certificates',
          v6View: '@views/DigitalCertificates/v6/ListView.vue',
          legacyView: '@views/DigitalCertificates/ListView.vue'
        },
        {
          routeName: 'create-digital-certificates',
          v6View: '@views/DigitalCertificates/v6/CreateView.vue',
          legacyView: '@views/DigitalCertificates/CreateView.vue'
        },
        {
          routeName: 'edit-digital-certificates',
          v6View: '@views/DigitalCertificates/v6/EditView.vue',
          legacyView: '@views/DigitalCertificates/EditView.vue'
        }
      ],
      extras: [
        {
          kind: 'tab-param-redirect',
          detail: 'redirects when a :tab param is present and the flag is OFF (file top-level fn)'
        }
      ]
    },
    {
      resource: 'edge-application',
      routeFile: 'src/router/routes/edge-application-routes/index.js',
      forks: [
        {
          routeName: 'edit-application',
          v6View: '@views/EdgeApplications/v6/EditView.vue',
          legacyView: '@views/EdgeApplications/TabsView.vue'
        }
      ]
    },
    {
      resource: 'edge-connectors',
      routeFile: 'src/router/routes/edge-connectors-routes/index.js',
      forks: [
        {
          routeName: 'edit-connectors',
          v6View: '@views/EdgeConnectors/v6/EditView.vue',
          legacyView: '@views/EdgeConnectors/EditView.vue'
        }
      ]
    },
    {
      resource: 'edge-functions',
      routeFile: 'src/router/routes/edge-functions-routes/index.js',
      forks: [
        {
          routeName: 'edit-functions',
          v6View: '@views/EdgeFunctions/v6/EditView.vue',
          legacyView: '@views/EdgeFunctions/EditView.vue'
        }
      ]
    },
    {
      resource: 'edge-firewall',
      routeFile: 'src/router/routes/firewall-routes/index.js',
      forks: [
        {
          routeName: 'edit-firewall',
          v6View: '@views/EdgeFirewall/v6/EditView.vue',
          legacyView: '@/views/EdgeFirewall/TabsView.vue'
        }
      ]
    },
    {
      resource: 'network-lists',
      routeFile: 'src/router/routes/network-lists-routes/index.js',
      forks: [
        {
          routeName: 'edit-network-lists',
          v6View: '@views/NetworkLists/v6/EditView.vue',
          legacyView: '@views/NetworkLists/EditView.vue'
        }
      ]
    },
    {
      resource: 'variables',
      routeFile: 'src/router/routes/variables-routes/index.js',
      forks: [
        {
          routeName: 'list-variables',
          v6View: '@views/Variables/v6/ListView.vue',
          legacyView: '@views/Variables/ListView.vue'
        },
        {
          routeName: 'create-variables',
          v6View: '@views/Variables/v6/CreateView.vue',
          legacyView: '@views/Variables/CreateView.vue'
        },
        {
          routeName: 'edit-variables',
          v6View: '@views/Variables/v6/EditView.vue',
          legacyView: '@views/Variables/EditView.vue'
        }
      ],
      extras: [
        {
          kind: 'tab-param-redirect',
          detail: 'redirects when a :tab param is present and the flag is OFF (file top-level fn)'
        }
      ]
    },
    {
      resource: 'waf-rules',
      routeFile: 'src/router/routes/waf-rules-routes/index.js',
      forks: [
        {
          routeName: 'edit-waf-rules',
          v6View: '@views/WafRules/v6/EditView.vue',
          legacyView: '@views/WafRules/TabsView.vue'
        }
      ]
    },
    {
      resource: 'workload',
      routeFile: 'src/router/routes/workload-routes/index.js',
      forks: [
        {
          routeName: 'create-workload',
          v6View: '@views/Workload/CreateView.vue',
          legacyView: '@views/Workload/legacy/CreateView.vue',
          inverted: true
        },
        {
          routeName: 'edit-workload',
          v6View: '@views/Workload/TabsView.vue',
          legacyView: '@views/Workload/legacy/EditView.vue',
          inverted: true
        }
      ],
      extras: [
        {
          kind: 'props-fork',
          routeName: 'list-workloads',
          detail: 'props: () => ({ isV6: hasFlagUseV6Configurations() })'
        }
      ]
    }
  ],

  /** Services/adapters whose behavior forks on the flag (spec req 4). */
  services: [
    {
      file: 'src/services/v2/workload/workload-service.js',
      behavior: 'skip-deployment-call',
      detail: 'flag ON: #fetchOne does NOT call listWorkloadDeployment (resolves null)'
    },
    {
      file: 'src/services/v2/workload/workload-adapter.js',
      behavior: 'adapter-branch'
    },
    {
      file: 'src/services/v2/variables/variables-service.js',
      behavior: 'payload-transform',
      detail: 'flag ON: transformPayloadV6; OFF: transformPayload'
    }
  ],

  /** Views/components with an internal fork (spec req 5). */
  views: [
    { file: 'src/views/Variables/ListView.vue', kind: 'behavior' },
    { file: 'src/views/Variables/CreateView.vue', kind: 'behavior' },
    { file: 'src/views/Variables/EditView.vue', kind: 'behavior' },
    { file: 'src/views/Variables/FormFields/FormFieldsVariables.vue', kind: 'behavior' },
    {
      file: 'src/views/Environments/FormFields/FormFieldsEnvironment.vue',
      kind: 'request-params',
      detail: "flag ON: variables list with { scope_type: 'global', skipCache: true }; OFF: {}"
    },
    { file: 'src/views/Environments/Config/adapters.js', kind: 'adapter-branch' },
    {
      file: 'src/views/EdgeApplicationsFunctions/FormFields/FormFieldsEdgeApplicationsFunctions.vue',
      kind: 'behavior'
    },
    {
      file: 'src/views/EdgeFirewallFunctions/FormFields/FormFieldsEdgeApplicationsFunctions.vue',
      kind: 'behavior'
    }
  ],

  /** Menu visibility fork (spec req 5.3). */
  menu: [
    {
      file: 'src/services/sidebar-menus-services/menus.js',
      consumer: 'src/layout/components/menu-production/index.vue',
      kind: 'clientFlag-visibility',
      detail: "menu item with clientFlag: 'use_v6_configurations' only visible when flag ON"
    }
  ],

  /**
   * Legitimate flag usages that are NOT individually-tested fork points. Every
   * entry needs a reason — the completeness guard accepts these and nothing
   * else.
   */
  allowlist: [
    {
      file: 'src/composables/user-flag.js',
      reason: 'the flag definition itself — covered by user-flag-behavior.test.js (req 1)'
    },
    {
      file: 'src/router/hooks/guards/flagGuard.js',
      reason: 'central guard — covered by gated-routes-guard.test.js (req 3)'
    },
    {
      file: 'src/layout/components/menu-profile/index.vue',
      reason: 'reads the flag for profile menu composition — covered with the menu fork (req 5.3)'
    },
    {
      file: 'src/services/sidebar-menus-services/menus.js',
      reason:
        'declares clientFlag on menu items — the fork is resolved by menu-production (req 5.3)'
    },
    {
      file: 'src/views/EdgeApplications/v6/EditView.vue',
      reason:
        'v6-only view behind the route fork/gate — v6 flow covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/EdgeApplications/v6/VersionEditView.vue',
      reason: 'v6-only view behind meta.flag gate — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/EdgeFirewall/v6/VersionEditView.vue',
      reason: 'v6-only view behind meta.flag gate — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/WafRules/v6/VersionEditView.vue',
      reason: 'v6-only view behind meta.flag gate — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/NetworkLists/v6/EditView.vue',
      reason: 'v6-only view behind the route fork — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/NetworkLists/v6/VersionEditView.vue',
      reason: 'v6-only view behind meta.flag gate — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/EdgeConnectors/v6/EditView.vue',
      reason: 'v6-only view behind the route fork — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/EdgeConnectors/v6/VersionEditView.vue',
      reason: 'v6-only view behind meta.flag gate — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/CustomPages/v6/VersionEditView.vue',
      reason: 'v6-only view behind meta.flag gate — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/EdgeFunctions/v6/EditView.vue',
      reason: 'v6-only view behind the route fork — covered by spec versioning-test-coverage'
    },
    {
      file: 'src/views/EdgeFunctions/v6/VersionEditView.vue',
      reason: 'v6-only view behind meta.flag gate — covered by spec versioning-test-coverage'
    }
  ]
}
