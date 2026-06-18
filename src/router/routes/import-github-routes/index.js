/** @type {import('vue-router').RouteRecordRaw} */
export const importGithubRoutes = {
  path: '/github',
  name: 'import-github',
  children: [
    {
      path: ':vendor/:solution',
      name: 'github-repository-import',
      component: () => import('@/views/ImportGitHub/ImportGithubView.vue'),
      meta: {
        title: 'Import from GitHub',
        breadCrumbs: [
          {
            label: 'Import from GitHub',
            to: '/github/azion/import-from-github'
          }
        ]
      }
    }
  ]
}
