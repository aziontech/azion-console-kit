/** @type {import('vue-router').RouteRecordRaw} */
export const signupRoutes = {
  path: '/signup',
  name: 'signup',
  children: [
    {
      path: '',
      name: 'signup-online-sales',
      component: () => import('@views/Signup/SignupView.vue')
    },
    {
      path: 'brasil',
      name: 'signup-brasil'
      // component: () => import('@views/Signup/SignupBrasilView.vue'),
    },
    {
      path: 'activation/:email',
      name: 'signup-activation'
      // component: () => import('@views/Signup/SignupActivationView.vue'),
    }
  ]
}
