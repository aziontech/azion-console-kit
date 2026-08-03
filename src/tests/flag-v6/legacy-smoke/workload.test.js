import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'workload',
  routeFile: 'src/router/routes/workload-routes/index.js',
  routeName: 'edit-workload',
  loadUrlFragment: 'workloads/123',
  fixtureRoutes: [
    ['/123/deployments', { data: { results: [] } }],
    [
      'workloads/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_WORKLOAD',
            active: true,
            infrastructure: 1,
            workload_domain: 'smoke.azion.app',
            workload_domain_allow_access: true,
            domains: ['smoke.example.com'],
            bindings: [],
            protocols: {
              http: { versions: ['http1'], http_ports: [80], https_ports: null, quic_ports: null }
            },
            tls: { certificate: null, minimum_version: 'tls_1_2', ciphers: null },
            mtls: { enabled: false, config: { verification: null, certificate: null, crl: null } },
            last_editor: 'smoke@azion.com',
            last_modified: '2026-07-22T10:00:00Z'
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_WORKLOAD'
})
