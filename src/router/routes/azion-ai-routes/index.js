/** @type {import('vue-router').RouteRecordRaw} */
export const azionAiRoutes = {
  path: '/azion-ai-chat',
  name: 'azion-ai-chat',
  component: () => import('@views/AzionAI/AzionAiView.vue'),
  meta: {
    breadCrumbs: [
      {
        label: 'Azion AI',
        to: '/azion-ai-chat'
      }
    ]
  }
}
