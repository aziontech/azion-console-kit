import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'edge-firewall',
  routeFile: 'src/router/routes/firewall-routes/index.js',
  routeName: 'edit-firewall',
  loadUrlFragment: 'firewalls/123',
  fixtureRoutes: [
    [
      'firewalls/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_FIREWALL',
            active: true,
            debug: false,
            domains: [],
            modules: {
              functions: { enabled: false },
              network_protection: { enabled: false },
              waf: { enabled: false },
              ddos_protection: { enabled: true }
            }
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_FIREWALL'
})
