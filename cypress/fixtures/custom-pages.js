const httpResponseCreate = {
  state: 'pending',
  data: {
    id: 103,
    name: 'teste1323321321213123123',
    last_editor: 'peterson.silva+2@azion.com',
    last_modified: '2025-05-12T19:08:46.506557Z',
    active: true,
    product_version: '1.0',
    default: false,
    connector_custom_pages: {
      edge_connector: null,
      pages: [
        {
          code: 'default',
          ttl: 132312,
          uri: null,
          custom_status_code: null
        }
      ]
    }
  }
}

const httpResponseGet = {
  data: {
    id: 103,
    name: 'teste1323321321213123123',
    last_editor: 'peterson.silva+2@azion.com',
    last_modified: '2025-05-12T19:08:46.506557Z',
    active: true,
    product_version: '1.0',
    default: false,
    connector_custom_pages: {
      edge_connector: null,
      pages: [
        {
          code: 'default',
          ttl: 132312,
          uri: null,
          custom_status_code: null
        }
      ]
    }
  }
}

export default {
  httpResponseCreate,
  httpResponseGet
}
