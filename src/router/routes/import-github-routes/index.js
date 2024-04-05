/** @type {import('vue-router').RouteRecordRaw} */
export const githubRoutes = {
  path: '/import-github',
  name: 'import-github',
  children: [
    {
      path: 'static',
      name: 'github-static',
      component: () => import('@views/ImportGitHub/ImportStaticView.vue'),
      props: {},
      meta: {
        breadCrumbs: [
          {
            label: 'Import Static Site from GitHub',
            to: '/import-github'
          }
        ]
      }
    }
  ]
}
