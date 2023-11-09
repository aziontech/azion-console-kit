import { createRouter, createWebHistory } from 'vue-router'
import { dataStreamingRoutes } from '@routes/data-streaming-routes'
import { digitalCertificatesRoutes } from '@routes/digital-certificates-routes'
import { domainsRoutes } from '@routes/domains-routes'
import { homeRoutes } from '@routes/home-routes'
import { edgeApplicationRoutes } from '@routes/edge-application-routes'
import { edgeFirewallRoutes } from '@routes/edge-firewall-routes'
import { edgeFunctionsRoutes } from '@routes/edge-functions-routes'
import { edgePulseRoutes } from '@routes/edge-pulse-routes'
import { edgeServicesRoutes } from '@routes/edge-services-routes'
import { intelligentDnsRoutes } from '@routes/intelligent-dns-routes'
import { loginRoutes } from '@routes/login-routes'
import { networkListsRoutes } from '@routes/network-lists-routes'
import { personalTokensRoutes } from '@routes/personal-tokens-routes'
import { variablesRoutes } from '@routes/variables-routes'
import { edgeNodeRoutes } from '@routes/edge-node-routes'
import { credentialsRoutes } from '@routes/credentials-routes'
import { teamsPermissionRoutes } from './routes/team-permission'
import { usersListsRoutes } from '@routes/users-routes'
import { passwordRoutes } from '@routes/password-routes'
import { playgroundRoutes } from './routes/playground-routes'
import { activityHistoryRoutes } from './routes/activity-history-routes'
import { errorRoutes } from '@routes/error-routes'
import beforeEachRoute from './hooks/beforeEachRoute'
import { signupRoutes } from './routes/signup-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    dataStreamingRoutes,
    digitalCertificatesRoutes,
    domainsRoutes,
    edgeApplicationRoutes,
    edgeFirewallRoutes,
    edgeFunctionsRoutes,
    edgePulseRoutes,
    edgeServicesRoutes,
    homeRoutes,
    intelligentDnsRoutes,
    loginRoutes,
    networkListsRoutes,
    personalTokensRoutes,
    variablesRoutes,
    edgeNodeRoutes,
    credentialsRoutes,
    usersListsRoutes,
    passwordRoutes,
    playgroundRoutes,
    activityHistoryRoutes,
    signupRoutes,
    teamsPermissionRoutes
  ].concat(errorRoutes)
})

router.beforeEach(beforeEachRoute)

export default router
