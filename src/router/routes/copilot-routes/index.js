/** @type {import('vue-router').RouteRecordRaw} */
export const copilotRoutes = {
  path: '/copilot',
  name: 'copilot',
  component: () => import('@views/Copilot/index.vue'),
  meta: {
    breadCrumbs: [
      {
        label: 'Copilot',
        to: '/copilot'
      }
    ]
  }
}
