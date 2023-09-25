import { createRouter, createWebHistory } from 'vue-router'
import { dataStreamingRoutes } from '@routes/data-streaming-routes'
import { digitalCertificatesRoutes } from '@routes/digital-certificates-routes'
import { domainsRoutes } from '@routes/domains-routes'
import { homeRoutes } from '@routes/home-routes'
import { edgeApplicationRoutes } from '@routes/edge-application-routes'
import { edgeFirewallRoutes } from '@routes/edge-firewall-routes'
import { edgeFunctionsRoutes } from '@routes/edge-functions-routes'
import { edgeServicesRoutes } from '@routes/edge-services-routes'
import { intelligentDnsRoutes } from '@routes/intelligent-dns-routes'
import { loginRoutes } from '@routes/login-routes'
import { networkListsRoutes } from '@routes/network-lists-routes'
import { variablesRoutes } from '@routes/variables-routes'
import { usersListsRoutes } from '@routes/users-routes'
import beforeEachRoute from './hooks/beforeEachRoute'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    dataStreamingRoutes,
    digitalCertificatesRoutes,
    domainsRoutes,
    edgeApplicationRoutes,
    edgeFirewallRoutes,
    edgeFunctionsRoutes,
    edgeServicesRoutes,
    homeRoutes,
    intelligentDnsRoutes,
    loginRoutes,
    networkListsRoutes,
    variablesRoutes,
    usersListsRoutes
  ]
})

router.beforeEach(beforeEachRoute)

export default router
