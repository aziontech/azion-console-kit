import {
  adaptServiceDataResponseToLoad
} from '@/services/v2/utils/adaptServiceDataResponse'

const EMBEDDING_MODEL_DISPLAY = {
  'text-embedding-3-small': {
    content: 'text-embedding-3-small',
    icon: 'pi pi-microchip'
  }
}

const transformMap = {
  id: (value) => value.kb_id,
  name: (value) => value.name,
  description: (value) => value.description,
  embeddingModel: (value) => value.embedding_model,
  edgesqlDbId: (value) => value.edgesql_db_id,
  createdBy: (value) => value.created_by,
  updatedBy: (value) => value.updated_by,
  createdAt: (value) => value.created_at,
  updatedAt: (value) => value.updated_at,
  accountId: (value) => value.account_id
}

export const KnowledgeBaseAdapter = {
  transformLoadKnowledgeBase(data, fields) {
    return adaptServiceDataResponseToLoad(data, fields, transformMap)
  },

  transformListKnowledgeBase(data) {
    return (
      data?.map((kb) => {
        return {
          id: kb.kb_id,
          name: kb.name,
          description: kb.description,
          embeddingModel: EMBEDDING_MODEL_DISPLAY[kb.embedding_model] || {
            content: kb.embedding_model,
            icon: 'pi pi-microchip'
          },
          lastEditor: kb.updated_by || kb.created_by || 'System',
          updatedAt: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(kb.updated_at || kb.created_at)
          ),
          updatedAtDate: kb.updated_at || kb.created_at,
          createdAt: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(kb.created_at)
          )
        }
      }) || []
    )
  },

  transformPayloadKnowledgeBase(payload) {
    return {
      name: payload.name,
      description: payload.description,
      embedding_model: payload.embeddingModel || 'text-embedding-3-small'
    }
  }
}