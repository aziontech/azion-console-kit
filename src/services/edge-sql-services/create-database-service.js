import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const createDatabaseService = async ({ name }) => {
  if (!name || name.trim().length === 0) {
    return {
      body: null,
      statusCode: 400,
      error: 'Database name is required'
    }
  }

  try {
    const httpResponse = await AxiosHttpClientAdapter.request({
      url: '/v4/edge_sql/databases',
      method: 'POST',
      body: { name: name.trim() }
    })

    if (httpResponse.body?.errors?.length > 0) {
      const apiError = httpResponse.body.errors[0]
      throw new Error(apiError.detail || apiError.title || 'Error creating database')
    }

    const isSuccess =
      httpResponse.statusCode === 201 ||
      httpResponse.statusCode === 200 ||
      httpResponse.body?.state === 'pending' ||
      httpResponse.body?.state === 'created'

    if (isSuccess) {
      const adaptedData = adapt(httpResponse)

      const urlToEditView = '/edge-sql'

      return {
        feedback: `Database "${adaptedData.name}" is being created...`,
        urlToEditView,
        databaseId: adaptedData.id,
        body: adaptedData,
        statusCode: httpResponse.statusCode || 200,
        shouldMonitor: true,
        databaseName: adaptedData.name
      }
    } else {
      throw new Error('Error creating database')
    }
  } catch (error) {
    throw new Error(error.message || 'Error creating database')
  }
}

const adapt = (httpResponse) => {
  const database = httpResponse.body.data || httpResponse.body
  return {
    id: database.id,
    name: database.name,
    clientId: database.client_id,
    status: database.status || 'creating',
    createdAt: database.created_at,
    updatedAt: database.updated_at,
    isActive: database.is_active
  }
}
