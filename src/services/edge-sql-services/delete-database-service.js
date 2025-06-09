import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const deleteDatabaseService = async (id) => {
  if (!id) {
    throw new Error('Database ID is required')
  }

  try {
    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `/v4/edge_sql/databases/${id}`,
      method: 'DELETE'
    })

    return parseHttpResponse(httpResponse)
  } catch (error) {
    throw new Error(error.message || 'Error deleting database')
  }
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
    case 202:
    case 204:
      return 'Database is being deleted...'
    case 404:
      throw new Error('Database not found')
    case 500:
      throw new Error('Internal server error')
    default:
      throw new Error('Error deleting database')
  }
} 