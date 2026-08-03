import { describeLegacySmoke } from '../../shared/flag-v6/legacy-smoke.contract'

describeLegacySmoke({
  resource: 'custom-pages',
  routeFile: 'src/router/routes/custom-pages-routes/index.js',
  routeName: 'edit-custom-pages',
  loadUrlFragment: 'custom_pages/123',
  fixtureRoutes: [
    [
      'custom_pages/123',
      {
        data: {
          data: {
            id: 123,
            name: 'SMOKE_CUSTOM_PAGE',
            active: true,
            default: false,
            last_editor: 'smoke@azion.com',
            last_modified: '2026-07-22T10:00:00Z',
            pages: []
          }
        }
      }
    ]
  ],
  expectRendered: 'SMOKE_CUSTOM_PAGE'
})
