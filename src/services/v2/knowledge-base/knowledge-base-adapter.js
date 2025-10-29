import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'
import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

const transformMap = {
  id: (value) => value.kb_id,
  kbId: (value) => value.kb_id,
  accountId: (value) => value.account_id,
  name: (value) => value.name,
  description: (value) => value.description,
  embeddingModel: (value) => value.embedding_model,
  sqlId: (value) => value.sql_id,
  sqlDbName: (value) => value.sql_db_name,
  storageName: (value) => value.storage_name,
  storage: (value) => value.storage_name,
  lastModified: (value) => formatDateToDayMonthYearHour(value.last_modified),
  lastEditor: (value) => value.last_editor
}

const documentTransformMap = {
  id: (value) => value.document_id,
  documentId: (value) => value.document_id,
  name: (value) => value.name,
  filename: (value) => value.filename,
  type: (value) => value.type,
  status: (value) => value.status,
  size: (value) => value.size,
  createdAt: (value) => formatDateToDayMonthYearHour(value.created_at),
  uploadedAt: (value) => formatDateToDayMonthYearHour(value.uploaded_at),
  processedAt: (value) => formatDateToDayMonthYearHour(value.processed_at),
  lastModified: (value) => formatDateToDayMonthYearHour(value.last_modified),
  lastEditor: (value) => value.last_editor
}

export const KnowledgeBaseAdapter = {
  transformListKnowledgeBases(data, fields) {
    const { results, count } = data
    const adapt = adaptServiceDataResponse(results, fields, transformMap)

    return {
      count,
      body: adapt
    }
  },

  transformLoadKnowledgeBase(data) {
    return {
      id: data.kb_id,
      name: data.name,
      description: data.description,
      embedding_model: data.embedding_model,
      sqlId: data.sql_id,
      sqlDbName: data.sql_db_name,
      storageName: data.storage_name,
      lastModified: data.last_modified,
      lastEditor: data.last_editor
    }
  },

  transformListDocuments(data, fields) {
    const { results, count } = data
    const adapt = adaptServiceDataResponse(results, fields, documentTransformMap)

    return {
      count,
      body: adapt
    }
  }
}
