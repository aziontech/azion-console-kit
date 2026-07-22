import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'variables',
  routeFile: 'src/router/routes/variables-routes/index.js',
  routeName: 'edit-variables',
  loadUrlFragment: 'variables/123',
  fixtureRoutes: [
    [
      'variables/123',
      { data: { uuid: '123', key: 'SMOKE_LEGACY_KEY', value: 'smoke-value', secret: false } }
    ]
  ],
  expectRendered: 'SMOKE_LEGACY_KEY'
})
