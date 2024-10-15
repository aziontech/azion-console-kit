import { inject } from 'vue'
import { accountRoutes } from '@routes/account-routes'
import { activityHistoryRoutes } from '@routes/activity-history-routes'
import { azionAiRoutes } from '@routes/azion-ai-routes'

import { cliCallbackRoutes } from '@routes/cli-callback-routes'
import { createNewRoutes } from '@routes/create-new-routes'
import { compareWithAzionRoutes } from '@routes/compare-with-azion'
import { dataStreamRoutes } from '@/router/routes/data-stream-routes'
import { digitalCertificatesRoutes } from '@routes/digital-certificates-routes'
import { domainsRoutes } from '@routes/domains-routes'
import { edgeApplicationRoutes } from '@routes/edge-application-routes'
import { edgeFirewallRoutes } from '@routes/edge-firewall-routes'
import { edgeFunctionsRoutes } from '@routes/edge-functions-routes'
import { edgeNodeRoutes } from '@routes/edge-node-routes'
import { edgePulseRoutes } from '@routes/edge-pulse-routes'
import { edgeServicesRoutes } from '@routes/edge-services-routes'
import { errorRoutes } from '@routes/error-routes'
import { homeRoutes } from '@routes/home-routes'
import { edgeDnsRoutes } from '@/router/routes/edge-dns-routes'
import { loginRoutes } from '@routes/login-routes'
import { marketplaceRoutes } from '@routes/marketplace-routes'
import { realTimeMetricsRoutes } from '@routes/real-time-metrics-routes'
import { realTimeEventsRoutes } from '@/router/routes/real-time-events-routes'
import { mfaRoutes } from '@routes/mfa-routes'
import { networkListsRoutes } from '@routes/network-lists-routes'
import { passwordRoutes } from '@routes/password-routes'
import { personalTokensRoutes } from '@routes/personal-tokens-routes'
import { playgroundRoutes } from '@routes/playground-routes'
import { realTimePurgeRoutes } from '@routes/real-time-purge'
import { signupRoutes } from '@routes/signup-routes'
import { switchAccountRoutes } from '@routes/switch-account-routes'
import { teamsPermissionRoutes } from '@routes/team-permission'
import { usersListsRoutes } from '@routes/users-routes'
import { variablesRoutes } from '@routes/variables-routes'
import { wafRulesRoutes } from '@routes/waf-rules-routes'
import { settingsRoutes } from '@routes/your-settings-routes'
import { githubRoutes } from '@routes/github-routes'
import { importGithubRoutes } from '@routes/import-github-routes'
import { billingRoutes } from '@/router/routes/billing-routes'
import { createRouter, createWebHistory } from 'vue-router'
import afterEachRouteGuard from './hooks/afterEachRoute'
import beforeEachRoute from './hooks/beforeEachRoute'
import { useAccountStore } from '@/stores/account'
import { loadContractServicePlan } from '@/services/contract-services'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    cliCallbackRoutes,
    dataStreamRoutes,
    digitalCertificatesRoutes,
    domainsRoutes,
    edgeApplicationRoutes,
    edgeFirewallRoutes,
    edgeFunctionsRoutes,
    edgePulseRoutes,
    edgeServicesRoutes,
    homeRoutes,
    edgeDnsRoutes,
    loginRoutes,
    networkListsRoutes,
    personalTokensRoutes,
    variablesRoutes,
    edgeNodeRoutes,
    usersListsRoutes,
    passwordRoutes,
    playgroundRoutes,
    createNewRoutes,
    mfaRoutes,
    activityHistoryRoutes,
    realTimePurgeRoutes,
    teamsPermissionRoutes,
    signupRoutes,
    switchAccountRoutes,
    marketplaceRoutes,
    accountRoutes,
    settingsRoutes,
    wafRulesRoutes,
    realTimeMetricsRoutes,
    realTimeEventsRoutes,
    githubRoutes,
    billingRoutes,
    importGithubRoutes,
    azionAiRoutes,
    compareWithAzionRoutes
  ].concat(errorRoutes)
})

router.beforeEach(async (to, from, next) => {
  const accountStore = useAccountStore()
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  await beforeEachRoute({
    to,
    from,
    next,
    accountStore,
    loadContractServicePlan,
    tracker
  })
})

router.afterEach(afterEachRouteGuard)

export default router
