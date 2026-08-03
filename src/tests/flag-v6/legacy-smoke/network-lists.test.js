import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'network-lists',
  routeFile: 'src/router/routes/network-lists-routes/index.js',
  routeName: 'edit-network-lists',
  loadUrlFragment: 'network_lists/123',
  fixtureRoutes: [
    [
      'network_lists/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_NETWORK_LIST',
            last_editor: 'smoke@azion.com',
            type: 'ip_cidr',
            items: ['192.168.0.1'],
            last_modified: '2026-07-22T10:00:00Z'
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_NETWORK_LIST'
})
