import { createRouter, createWebHistory } from 'vue-router'
import { homeRoute } from '@routes/home-routes'
import { edgeApplicationRoutes } from '@routes/edge-application-routes'
import { domainsRoutes } from '@routes/domains-routes'
import { digitalCertificatesRoutes } from '@routes/digital-certificates-routes'
import { variablesRoutes } from '@routes/variables-routes'
import { intelligentDnsRoutes } from '@routes/intelligent-dns-routes'
import { networkListsRoutes } from '@routes/network-lists-routes'
import { edgeFunctionsRoutes } from '@routes/edge-functions-routes'
import { dataStreamingRoutes } from '@routes/data-streaming-routes'
import { edgeServicesRoutes } from '@routes/edge-services-routes'
import { edgeFirewallRoutes } from '@routes/edge-firewall-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    homeRoute,
    edgeApplicationRoutes,
    domainsRoutes,
    digitalCertificatesRoutes,
    variablesRoutes,
    intelligentDnsRoutes,
    networkListsRoutes,
    edgeFunctionsRoutes,
    dataStreamingRoutes,
    edgeServicesRoutes,
    edgeFirewallRoutes
  ]
})

export default router
