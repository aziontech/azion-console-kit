import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const listDatabasesService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 20,
  search = ''
}) => {
  try {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ordering: sort === 'desc' ? `-${orderBy}` : orderBy
    })

    if (search) {
      searchParams.set('search', search)
    }

    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `/v4/edge_sql/databases?${searchParams.toString()}`,
      method: 'GET'
    })

    if (httpResponse.statusCode === 200) {
      return adapt(httpResponse)
    } else {
      throw new Error('Error loading databases')
    }
  } catch (error) {
    return {
      body: [],
      count: 0,
      statusCode: 500,
      error: error.message
    }
  }
}

const adapt = (httpResponse) => {
  // Verificar se a resposta tem a estrutura esperada
  if (!httpResponse.body || !Array.isArray(httpResponse.body.results)) {
    return {
      count: 0,
      body: []
    }
  }

  const parsedDatabases = httpResponse.body.results
    .map((database) => {
      if (!database || typeof database !== 'object') {
        return null
      }

      return {
        id: String(database.id || ''),
        name: {
          text: database.name || '',
          tagProps: {}
        },
        clientId: database.client_id,
        status: {
          content: String(database.status || 'unknown'),
          severity: getStatusSeverity(database.status)
        },
        createdAt: new Date(database.created_at).toLocaleString(),
        updatedAt: formatDate(database.updated_at),
        lastModify: new Date(database.updated_at).toLocaleString(),
        lastModifyDate: String(database.updated_at || '')
      }
    })
    .filter(Boolean) // Remove entradas null

  // Retorna no formato que o FetchListTableBlock espera
  return {
    count: parseInt(httpResponse.body.count || 0),
    body: parsedDatabases
  }
}

const getStatusSeverity = (status) => {
  switch (status) {
    case 'created':
      return 'success'
    case 'creating':
      return 'info'
    case 'deletion_failed':
      return 'danger'
    case 'deleting':
      return 'warning'
    case 'unknown':
      return 'warning'
    case 'pending':
      return 'info'
    default:
      return 'info'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString))
}
