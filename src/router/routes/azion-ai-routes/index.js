/** @type {import('vue-router').RouteRecordRaw} */
export const azionAiRoutes = {
  path: '/copilot',
  name: 'copilot',
  component: () => import('@views/AzionAI/AzionAiView.vue'),
  meta: {
    breadCrumbs: [
      {
        label: 'Copilot',
        to: '/copilot'
      }
    ]
  }
}
