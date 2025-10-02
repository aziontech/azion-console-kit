import * as Helpers from '@/helpers'
import * as KnowledgeBaseService from '@/services/knowledge-base-services'

/** @type {import('vue-router').RouteRecordRaw[]} */

export const azionAiRoutes = [
  {
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
  },
  {
    path: '/ai/knowledge-base',
    name: 'knowledge-base',
    component: () => import('@views/KnowledgeBase/ListView.vue'),
    props: {
      listKnowledgeBaseService: KnowledgeBaseService.listKnowledgeBaseService,
      deleteKnowledgeBaseService: KnowledgeBaseService.deleteKnowledgeBaseService,
      documentationService: Helpers.documentationCatalog.ai || (() => Promise.resolve({}))
    },
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
    path: '/ai/knowledge-base/create',
    name: 'create-knowledge-base',
    component: () => import('@views/KnowledgeBase/CreateView.vue'),
    props: {
      createKnowledgeBaseService: KnowledgeBaseService.createKnowledgeBaseService
    },
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
    path: '/ai/knowledge-base/:id',
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
    path: '/ai/knowledge-base/edit/:id',
    name: 'edit-knowledge-base',
    component: () => import('@views/KnowledgeBase/EditView.vue'),
    props: {
      editKnowledgeBaseService: KnowledgeBaseService.editKnowledgeBaseService,
      loadKnowledgeBaseService: KnowledgeBaseService.loadKnowledgeBaseService,
      updatedRedirect: 'knowledge-base'
    },
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
