import { createRouter, createWebHistory } from 'vue-router'
import beforeEachRoute from './hooks/beforeEachRoute'

import { accountRoutes } from '@routes/account-routes'
import { dataStreamingRoutes } from '@routes/data-streaming-routes'
import { digitalCertificatesRoutes } from '@routes/digital-certificates-routes'
import { domainsRoutes } from '@routes/domains-routes'
import { edgeApplicationRoutes } from '@routes/edge-application-routes'
import { edgeFirewallRoutes } from '@routes/edge-firewall-routes'
import { edgeFunctionsRoutes } from '@routes/edge-functions-routes'
import { edgeNodeRoutes } from '@routes/edge-node-routes'
import { edgePulseRoutes } from '@routes/edge-pulse-routes'
import { edgeServicesRoutes } from '@routes/edge-services-routes'
import { homeRoutes } from '@routes/home-routes'
import { intelligentDnsRoutes } from '@routes/intelligent-dns-routes'
import { loginRoutes } from '@routes/login-routes'
import { networkListsRoutes } from '@routes/network-lists-routes'
import { personalTokensRoutes } from '@routes/personal-tokens-routes'
import { underDevelopmentRoutes } from '@routes/under-development-routes'
import { usersListsRoutes } from '@routes/users-routes'
import { variablesRoutes } from '@routes/variables-routes'
import { playgroundRoutes } from './routes/playground-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    accountRoutes,
    dataStreamingRoutes,
    digitalCertificatesRoutes,
    domainsRoutes,
    edgeApplicationRoutes,
    edgeFirewallRoutes,
    edgeFunctionsRoutes,
    edgeNodeRoutes,
    edgePulseRoutes,
    edgeServicesRoutes,
    homeRoutes,
    intelligentDnsRoutes,
    loginRoutes,
    networkListsRoutes,
    personalTokensRoutes,
    underDevelopmentRoutes,
    usersListsRoutes,
    variablesRoutes
    underDevelopmentRoutes,
    playgroundRoutes
  ]
})

router.beforeEach(beforeEachRoute)

export default router
