import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'waf-rules',
  routeFile: 'src/router/routes/waf-rules-routes/index.js',
  routeName: 'edit-waf-rules',
  loadUrlFragment: 'wafs/123',
  fixtureRoutes: [
    [
      'wafs/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_WAF_RULE',
            active: true,
            engine_settings: { attributes: { thresholds: [] } }
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_WAF_RULE'
})
