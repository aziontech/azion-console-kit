import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'edge-functions',
  routeFile: 'src/router/routes/edge-functions-routes/index.js',
  routeName: 'edit-functions',
  loadUrlFragment: 'functions/123',
  fixtureRoutes: [
    [
      'functions/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_FUNCTION',
            active: true,
            language: 'javascript',
            code: 'async function handleRequest() {}',
            json_args: {},
            initiator_type: 'edge_application',
            execution_environment: 'application',
            last_editor: 'smoke@azion.com',
            last_modified: '2026-07-22T10:00:00Z',
            version: null,
            vendor: null,
            reference_count: 0
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_FUNCTION'
})
