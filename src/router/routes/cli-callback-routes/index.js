/** @type {import('vue-router').RouteRecordRaw} */
export const cliCallbackRoutes = {
  children: [
    {
      path: '/cli-callback-success',
      name: 'cli-callback-success-page',
      component: () => import('@views/CliCallback/SuccessView.vue'),
      meta: {
        isPublic: true
      }
    },
    {
      path: '/cli-callback-fail',
      name: 'cli-callback-fail-page',
      component: () => import('@views/CliCallback/FailView.vue'),
      meta: {
        isPublic: true
      }
    }
  ]
}
