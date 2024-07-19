/** @type {import('vue-router').RouteRecordRaw} */
export const azionAiRoutes = {
  path: '/azion-ai-chat',
  name: 'azion-ai-chat',
  component: () => import('@modules/azion-ai-chat/index.vue'),
  meta: {
    breadCrumbs: [
      {
        label: 'Azion AI',
        to: '/azion-ai-chat'
      }
    ]
  }
}
