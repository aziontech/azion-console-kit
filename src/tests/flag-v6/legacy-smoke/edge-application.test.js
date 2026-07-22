import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

// AUDIT NOTE: the legacy TabsView loads through the V2 service layer
// (v4/workspace/applications) — the route props already inject v2-backed
// services even in the legacy flow. Observed at the HTTP boundary.
describeLegacySmoke({
  resource: 'edge-application',
  routeFile: 'src/router/routes/edge-application-routes/index.js',
  routeName: 'edit-application',
  loadUrlFragment: 'applications/123',
  fixtureRoutes: [
    ['applications/123/request_rules', { data: { results: [], count: 0 } }],
    [
      'applications/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_EDGE_APP',
            active: true,
            debug: false,
            product_version: '1.0',
            modules: {
              cache: { enabled: true },
              functions: { enabled: false },
              application_accelerator: { enabled: false },
              image_processor: { enabled: false },
              tiered_cache: { enabled: false }
            }
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_EDGE_APP'
})
