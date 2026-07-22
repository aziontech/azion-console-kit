import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'edge-connectors',
  routeFile: 'src/router/routes/edge-connectors-routes/index.js',
  routeName: 'edit-connectors',
  loadUrlFragment: 'connectors/123',
  fixtureRoutes: [
    [
      'connectors/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_CONNECTOR',
            active: true,
            type: 'http',
            attributes: {
              addresses: [
                { address: 'origin.example.com', plain_port: 80, tls_port: 443, weight: 1 }
              ],
              connection_options: { host: '${host}', path_prefix: '' },
              modules: {}
            },
            tls: { policy: 'preserve' },
            load_balance_method: 'off',
            connection_preference: ['IPv6', 'IPv4'],
            connection_timeout: 60,
            read_write_timeout: 120,
            max_retries: 0
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_CONNECTOR'
})
