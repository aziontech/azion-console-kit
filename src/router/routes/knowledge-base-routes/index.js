/** @type {import('vue-router').RouteRecordRaw} */
export const knowledgeBaseRoutes = {
  path: '/ai/knowledge-base',
  name: 'knowledge-base',
  meta: {
    title: 'Knowledge Base'
  },
  children: [
    {
      path: '',
      name: 'knowledge-base-list',
      component: () => import('@views/KnowledgeBase/ListView.vue'),
      meta: {
        title: 'Knowledge Base',
        breadCrumbs: [
          {
            label: 'AI',
            to: '/ai'
          },
          {
            label: 'Knowledge Base',
            to: '/ai/knowledge-base'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-knowledge-base',
      component: () => import('@views/KnowledgeBase/View.vue'),
      meta: {
        title: 'Create Knowledge Base',
        breadCrumbs: [
          {
            label: 'AI',
            to: '/ai'
          },
          {
            label: 'Knowledge Base',
            to: '/ai/knowledge-base'
          },
          {
            label: 'Create',
            to: '/ai/knowledge-base/create'
          }
        ]
      }
    },
    {
      path: ':id',
      name: 'knowledge-base-detail',
      component: () => import('@views/KnowledgeBase/DetailView.vue'),
      meta: {
        title: 'Knowledge Base Details',
        breadCrumbs: [
          {
            label: 'AI',
            to: '/ai'
          },
          {
            label: 'Knowledge Base',
            to: '/ai/knowledge-base'
          },
          {
            label: 'Details'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-knowledge-base',
      component: () => import('@views/KnowledgeBase/View.vue'),
      props: { mode: 'edit' },
      meta: {
        title: 'Edit Knowledge Base',
        breadCrumbs: [
          {
            label: 'AI',
            to: '/ai'
          },
          {
            label: 'Knowledge Base',
            to: '/ai/knowledge-base'
          },
          {
            label: 'Edit'
          }
        ]
      }
    }
  ]
}
