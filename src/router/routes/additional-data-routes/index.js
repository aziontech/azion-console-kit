/** @type {import('vue-router').RouteRecordRaw} */
export const additionalDataRoutes = {
  path: '/additional-data',
  name: 'additional-data',
  component: () => import('@views/AdditionalData/AdditionalDataView.vue'),
  props: {},
  meta: {
    hideNavigation: true
  }
}
