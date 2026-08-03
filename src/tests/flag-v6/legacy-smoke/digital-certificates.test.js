import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'digital-certificates',
  routeFile: 'src/router/routes/digital-certificates-routes/index.js',
  routeName: 'edit-digital-certificates',
  loadUrlFragment: 'certificates/123',
  fixtureRoutes: [
    [
      'certificates/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_CERTIFICATE',
            type: 'edge_certificate',
            csr: null,
            managed: false,
            last_editor: 'smoke@azion.com',
            last_modified: '2026-07-22T10:00:00Z'
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_CERTIFICATE'
})
