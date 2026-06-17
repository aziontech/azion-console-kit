## Edge Connectors API

> Endpoints para gerenciar Edge Connectors e suas versões. Extraído de `openapi-schema.yml`.

Autenticação: `TokenAuth` (header `Authorization: Token <token>`) ou `BearerAuth` (`Authorization: Bearer <token>`).

Base path: `/v4`

Tipos de connector suportados (campo `type`):
- `http` - origem HTTP/HTTPS
- `storage` - bucket de Edge Storage
- `live_ingest` - ingest de mídia ao vivo

## Sumário

- [Connectors](#connectors)
  - [GET /connectors](#get-edge_connectorapiconnectors)
  - [POST /connectors](#post-edge_connectorapiconnectors)
  - [GET /connectors/{connector_id}](#get-edge_connectorapiconnectorsconnector_id)
  - [PUT /connectors/{connector_id}](#put-edge_connectorapiconnectorsconnector_id)
  - [PATCH /connectors/{connector_id}](#patch-edge_connectorapiconnectorsconnector_id)
  - [DELETE /connectors/{connector_id}](#delete-edge_connectorapiconnectorsconnector_id)
- [Versions (versionamento)](#versions-versionamento)
  - [GET /connectors/{connector_id}/versions](#get-edge_connectorapiconnectorsconnector_idversions)
  - [POST /connectors/{connector_id}/versions](#post-edge_connectorapiconnectorsconnector_idversions)
  - [GET /connectors/{connector_id}/versions/{version_id}](#get-edge_connectorapiconnectorsconnector_idversionsversion_id)
  - [PUT /connectors/{connector_id}/versions/{version_id}](#put-edge_connectorapiconnectorsconnector_idversionsversion_id)
  - [PATCH /connectors/{connector_id}/versions/{version_id}](#patch-edge_connectorapiconnectorsconnector_idversionsversion_id)
  - [DELETE /connectors/{connector_id}/versions/{version_id}](#delete-edge_connectorapiconnectorsconnector_idversionsversion_id)
- [Version Actions](#version-actions)
  - [POST /connectors/{connector_id}/versions/{version_id}/archive](#post-edge_connectorapiconnectorsconnector_idversionsversion_idarchive)
  - [POST /connectors/{connector_id}/versions/{version_id}/build](#post-edge_connectorapiconnectorsconnector_idversionsversion_idbuild)
  - [POST /connectors/{connector_id}/versions/{version_id}/cancel](#post-edge_connectorapiconnectorsconnector_idversionsversion_idcancel)

---

## Connectors

### `GET /v4/workspace/connectors`

- **operationId**: `list_connectors`
- **Summary**: List Connectors
- **Description**: Lista todos os Connectors da conta autenticada. Suporta filtros, paginação, ordenação e seleção de campos (`fields`).

**Query parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `active` | boolean | Filtra por status ativo. |
| `fields` | string | Lista separada por vírgulas dos campos a incluir. |
| `id` | integer | Filtra por id (aceita CSV). |
| `last_editor` | string | Filtra por último editor (case-insensitive, parcial). |
| `last_modified__gte` | date-time | Modificado em (>=). |
| `last_modified__lte` | date-time | Modificado em (<=). |
| `name` | string | Filtra por nome (case-insensitive, parcial). |
| `ordering` | string | Campo de ordenação. Valores: `id`, `name`, `type`, `last_editor`, `last_modified`, `active`. |
| `page` | integer | Número da página. |
| `page_size` | integer | Tamanho da página. |
| `search` | string | Busca em `id`, `name`, `type`, `last_editor`, `last_modified`, `active`. |
| `type__in` | string | Filtra por type (CSV). Valores: `http`, `storage`, `live_ingest`. |

**Response `200 OK`** - `PaginatedConnectorPolymorphicList`

```json
{
  "count": 2,
  "next": "https://api.azion.com/v4/workspace/connectors?page=2",
  "previous": null,
  "results": [
    {
      "id": 8421,
      "name": "origin-http-prod",
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-05-22T14:31:09Z",
      "created_at": "2026-04-10T09:12:44Z",
      "active": true,
      "product_version": "1.0",
      "type": "http",
      "state": "ready",
      "version_id": "v_01HZK4M9QF3T2X",
      "attributes": {
        "addresses": [
          {
            "address": "origin.example.com",
            "plain_port": 80,
            "tls_port": 443,
            "server_role": "primary",
            "weight": 1,
            "active": true,
            "max_conns": 0,
            "max_fails": 1,
            "fail_timeout": 10
          }
        ],
        "connection_options": {
          "dns_resolution": "both",
          "transport_policy": "preserve",
          "http_version_policy": "http1_1",
          "host": "${host}",
          "path_prefix": "",
          "following_redirect": false,
          "real_ip_header": "X-Real-IP",
          "real_port_header": "X-Real-PORT"
        },
        "modules": {
          "load_balancer": { "enabled": false, "config": null },
          "origin_shield": { "enabled": false, "config": null }
        }
      }
    },
    {
      "id": 8422,
      "name": "assets-storage",
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-06-01T18:04:00Z",
      "created_at": "2026-05-30T11:00:00Z",
      "active": true,
      "product_version": "1.0",
      "type": "storage",
      "state": "ready",
      "version_id": "v_01HZQ8N2RA4PWB",
      "attributes": {
        "bucket": "static-assets-prod",
        "prefix": "images/"
      }
    }
  ]
}
```

---

### `POST /v4/workspace/connectors`

- **operationId**: `create_connector`
- **Summary**: Create a Connector
- **Description**: Cria um novo Connector na conta. O corpo é polimórfico, discriminado pelo campo `type`.

**Request body** - `ConnectorPolymorphicRequest` (exemplo do tipo `http`)

```json
{
  "name": "origin-http-prod",
  "active": true,
  "type": "http",
  "attributes": {
    "addresses": [
      {
        "address": "origin.example.com",
        "plain_port": 80,
        "tls_port": 443,
        "server_role": "primary",
        "weight": 1,
        "active": true
      }
    ],
    "connection_options": {
      "dns_resolution": "both",
      "transport_policy": "preserve",
      "http_version_policy": "http1_1",
      "host": "${host}",
      "path_prefix": "",
      "following_redirect": false,
      "real_ip_header": "X-Real-IP",
      "real_port_header": "X-Real-PORT"
    },
    "modules": {
      "load_balancer": { "enabled": false, "config": null },
      "origin_shield": { "enabled": false, "config": null }
    }
  }
}
```

Exemplo para `type: storage`:

```json
{
  "name": "assets-storage",
  "active": true,
  "type": "storage",
  "attributes": {
    "bucket": "static-assets-prod",
    "prefix": "images/"
  }
}
```

Exemplo para `type: live_ingest`:

```json
{
  "name": "live-ingest-sa-east-1",
  "active": true,
  "type": "live_ingest",
  "attributes": {
    "region": "sa-east-1"
  }
}
```

**Response `201 Created`** - `ConnectorPolymorphicResponse`

```json
{
  "state": "executed",
  "data": {
    "id": 8423,
    "name": "origin-http-prod",
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T13:22:08Z",
    "created_at": "2026-06-10T13:22:08Z",
    "active": true,
    "product_version": "1.0",
    "type": "http",
    "state": "draft",
    "version_id": "v_01J0AB7XF5N9QK",
    "attributes": {
      "addresses": [
        {
          "address": "origin.example.com",
          "plain_port": 80,
          "tls_port": 443,
          "server_role": "primary",
          "weight": 1,
          "active": true
        }
      ],
      "connection_options": {
        "dns_resolution": "both",
        "transport_policy": "preserve",
        "http_version_policy": "http1_1",
        "host": "${host}",
        "path_prefix": "",
        "following_redirect": false,
        "real_ip_header": "X-Real-IP",
        "real_port_header": "X-Real-PORT"
      },
      "modules": {
        "load_balancer": { "enabled": false, "config": null },
        "origin_shield": { "enabled": false, "config": null }
      }
    }
  }
}
```

---

### `GET /v4/workspace/connectors/{connector_id}`

- **operationId**: `retrieve_connector`
- **Summary**: Retrieve details of a Connector
- **Description**: Retorna detalhes de um Connector específico.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID inteiro único do Connector. |

**Query parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista separada por vírgulas dos campos a incluir. |

**Response `200 OK`** - `ConnectorPolymorphicResponse`

```json
{
  "state": "executed",
  "data": {
    "id": 8421,
    "name": "origin-http-prod",
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-05-22T14:31:09Z",
    "created_at": "2026-04-10T09:12:44Z",
    "active": true,
    "product_version": "1.0",
    "type": "http",
    "state": "ready",
    "version_id": "v_01HZK4M9QF3T2X",
    "attributes": {
      "addresses": [
        {
          "address": "origin.example.com",
          "plain_port": 80,
          "tls_port": 443,
          "server_role": "primary",
          "weight": 1,
          "active": true
        }
      ],
      "connection_options": {
        "dns_resolution": "both",
        "transport_policy": "preserve",
        "http_version_policy": "http1_1",
        "host": "${host}",
        "path_prefix": "",
        "following_redirect": false,
        "real_ip_header": "X-Real-IP",
        "real_port_header": "X-Real-PORT"
      },
      "modules": {
        "load_balancer": { "enabled": false, "config": null },
        "origin_shield": { "enabled": false, "config": null }
      }
    }
  }
}
```

---

### `PUT /v4/workspace/connectors/{connector_id}`

- **operationId**: `update_connector`
- **Summary**: Update a Connector
- **Description**: Substitui o Connector inteiro pelos dados fornecidos. Campos não enviados voltam a defaults.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID inteiro único do Connector. |

**Request body** - `ConnectorPolymorphicRequest`

```json
{
  "name": "origin-http-prod-v2",
  "active": true,
  "type": "http",
  "attributes": {
    "addresses": [
      {
        "address": "origin-v2.example.com",
        "plain_port": 80,
        "tls_port": 443,
        "server_role": "primary",
        "weight": 1,
        "active": true
      }
    ],
    "connection_options": {
      "dns_resolution": "ipv4only",
      "transport_policy": "preserve",
      "http_version_policy": "http1_1",
      "host": "${host}",
      "path_prefix": "/api",
      "following_redirect": true,
      "real_ip_header": "X-Real-IP",
      "real_port_header": "X-Real-PORT"
    }
  }
}
```

**Response `200 OK`** - `ConnectorPolymorphicResponse`

```json
{
  "state": "executed",
  "data": {
    "id": 8421,
    "name": "origin-http-prod-v2",
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T13:30:00Z",
    "created_at": "2026-04-10T09:12:44Z",
    "active": true,
    "product_version": "1.0",
    "type": "http",
    "state": "draft",
    "version_id": "v_01J0AB7XF5N9QK",
    "attributes": {
      "addresses": [
        {
          "address": "origin-v2.example.com",
          "plain_port": 80,
          "tls_port": 443,
          "server_role": "primary",
          "weight": 1,
          "active": true
        }
      ],
      "connection_options": {
        "dns_resolution": "ipv4only",
        "transport_policy": "preserve",
        "http_version_policy": "http1_1",
        "host": "${host}",
        "path_prefix": "/api",
        "following_redirect": true,
        "real_ip_header": "X-Real-IP",
        "real_port_header": "X-Real-PORT"
      },
      "modules": {
        "load_balancer": { "enabled": false, "config": null },
        "origin_shield": { "enabled": false, "config": null }
      }
    }
  }
}
```

---

### `PATCH /v4/workspace/connectors/{connector_id}`

- **operationId**: `partial_update_connector`
- **Summary**: Partially update a Connector
- **Description**: Atualiza apenas os campos enviados, sem afetar os demais.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID inteiro único do Connector. |

**Request body** - `PatchedConnectorPolymorphicRequest`

```json
{
  "active": false,
  "type": "http"
}
```

**Response `200 OK`** - `ConnectorPolymorphicResponse`

```json
{
  "state": "executed",
  "data": {
    "id": 8421,
    "name": "origin-http-prod",
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T13:35:12Z",
    "created_at": "2026-04-10T09:12:44Z",
    "active": false,
    "product_version": "1.0",
    "type": "http",
    "state": "draft",
    "version_id": "v_01J0AB7XF5N9QK",
    "attributes": {
      "addresses": [
        {
          "address": "origin.example.com",
          "plain_port": 80,
          "tls_port": 443,
          "server_role": "primary",
          "weight": 1,
          "active": true
        }
      ],
      "connection_options": {
        "dns_resolution": "both",
        "transport_policy": "preserve",
        "http_version_policy": "http1_1",
        "host": "${host}",
        "path_prefix": "",
        "following_redirect": false,
        "real_ip_header": "X-Real-IP",
        "real_port_header": "X-Real-PORT"
      },
      "modules": {
        "load_balancer": { "enabled": false, "config": null },
        "origin_shield": { "enabled": false, "config": null }
      }
    }
  }
}
```

---

### `DELETE /v4/workspace/connectors/{connector_id}`

- **operationId**: `delete_connector`
- **Summary**: Delete a Connector
- **Description**: Remove definitivamente um Connector da conta.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID inteiro único do Connector. |

**Response `200 OK`** - `DeleteResponse`

```json
{
  "state": "executed"
}
```

---

## Versions (versionamento)

Cada Connector pode possuir múltiplas versões. Versões fluem por estados como `draft`, `building`, `ready`, `archived`. Ações específicas (`build`, `cancel`, `archive`) controlam transições. Identificadores de versão são strings (ex.: `v_01J0AB7XF5N9QK`).

### `GET /v4/workspace/connectors/{connector_id}/versions`

- **operationId**: `list_connector_versions`
- **Summary**: List Connector versions
- **Description**: Lista todas as versões do Connector informado.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |

**Query parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista separada por vírgulas dos campos a incluir. |

**Response `200 OK`** (formato esperado, derivado de `ConnectorPolymorphic`)

```json
{
  "count": 2,
  "results": [
    {
      "version_id": "v_01HZK4M9QF3T2X",
      "state": "ready",
      "type": "http",
      "name": "origin-http-prod",
      "last_modified": "2026-05-22T14:31:09Z",
      "last_editor": "guilherme.santana@azion.com",
      "product_version": "1.0"
    },
    {
      "version_id": "v_01J0AB7XF5N9QK",
      "state": "draft",
      "type": "http",
      "name": "origin-http-prod",
      "last_modified": "2026-06-10T13:22:08Z",
      "last_editor": "guilherme.santana@azion.com",
      "product_version": "1.0"
    }
  ]
}
```

---

### `POST /v4/workspace/connectors/{connector_id}/versions`

- **operationId**: `create_connector_version`
- **Summary**: Create a new Connector version
- **Description**: Cria uma nova versão clonando uma existente. Se `source_version` for omitido, clona a última versão `ready`. `override` permite ajustar campos antes de salvar.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |

**Request body** - `VersionCreateRequest`

```json
{
  "source_version": "v_01HZK4M9QF3T2X",
  "comment": "Atualiza endpoint do upstream para domínio v2",
  "override": {
    "name": "origin-http-prod-v2",
    "attributes": {
      "connection_options": {
        "path_prefix": "/api"
      }
    }
  }
}
```

**Response `201 Created`** (formato esperado, derivado de `ConnectorPolymorphic`)

```json
{
  "state": "executed",
  "data": {
    "version_id": "v_01J0AB7XF5N9QK",
    "state": "draft",
    "type": "http",
    "name": "origin-http-prod-v2",
    "last_modified": "2026-06-10T13:40:01Z",
    "last_editor": "guilherme.santana@azion.com",
    "product_version": "1.0"
  }
}
```

---

### `GET /v4/workspace/connectors/{connector_id}/versions/{version_id}`

- **operationId**: `retrieve_connector_version`
- **Summary**: Retrieve a Connector version
- **Description**: Retorna detalhes de uma versão específica do Connector.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |
| `version_id` | string | Identificador da versão. |

**Query parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista separada por vírgulas dos campos a incluir. |

**Response `200 OK`** (formato esperado)

```json
{
  "state": "executed",
  "data": {
    "version_id": "v_01J0AB7XF5N9QK",
    "state": "ready",
    "type": "http",
    "name": "origin-http-prod-v2",
    "active": true,
    "product_version": "1.0",
    "last_modified": "2026-06-10T13:55:00Z",
    "last_editor": "guilherme.santana@azion.com",
    "created_at": "2026-06-10T13:40:01Z",
    "attributes": {
      "addresses": [
        {
          "address": "origin-v2.example.com",
          "plain_port": 80,
          "tls_port": 443,
          "server_role": "primary",
          "weight": 1,
          "active": true
        }
      ],
      "connection_options": {
        "dns_resolution": "both",
        "transport_policy": "preserve",
        "http_version_policy": "http1_1",
        "host": "${host}",
        "path_prefix": "/api",
        "following_redirect": false,
        "real_ip_header": "X-Real-IP",
        "real_port_header": "X-Real-PORT"
      }
    }
  }
}
```

---

### `PUT /v4/workspace/connectors/{connector_id}/versions/{version_id}`

- **operationId**: `update_connector_version`
- **Summary**: Update a Connector version
- **Description**: Atualiza uma versão em estado `draft`. Versões já promovidas (`ready`, `building`) tipicamente não aceitam alteração.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |
| `version_id` | string | Identificador da versão. |

**Request body** - `ConnectorPolymorphicRequest` (same shape as updating the base resource)

```json
{
  "name": "origin-http-prod-v2",
  "type": "http",
  "active": true,
  "attributes": {
    "addresses": [
      { "active": true, "address": "origin.example.com" }
    ],
    "connection_options": {
      "dns_resolution": "preserve",
      "transport_policy": "preserve",
      "http_version_policy": "http1_1",
      "host": "origin.example.com",
      "path_prefix": "",
      "following_redirect": true,
      "real_ip_header": "X-Real-IP",
      "real_port_header": "X-Real-PORT"
    }
  }
}
```

**Response `200 OK`** (formato esperado)

```json
{
  "state": "executed",
  "data": {
    "version_id": "v_01J0AB7XF5N9QK",
    "state": "draft",
    "type": "http",
    "name": "origin-http-prod-v2",
    "last_modified": "2026-06-10T13:48:22Z"
  }
}
```

---

### `PATCH /v4/workspace/connectors/{connector_id}/versions/{version_id}`

- **operationId**: `partial_update_connector_version`
- **Summary**: Partially update a Connector version
- **Description**: Atualiza parcialmente uma versão em estado `draft`.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |
| `version_id` | string | Identificador da versão. |

**Request body** - `PatchedConnectorPolymorphicRequest` (any subset of resource fields)

```json
{
  "active": false
}
```

**Response `200 OK`** (formato esperado)

```json
{
  "state": "executed",
  "data": {
    "version_id": "v_01J0AB7XF5N9QK",
    "state": "draft",
    "last_modified": "2026-06-10T13:50:00Z"
  }
}
```

---

### `DELETE /v4/workspace/connectors/{connector_id}/versions/{version_id}`

- **operationId**: `delete_connector_version`
- **Summary**: Delete a Connector version
- **Description**: Remove uma versão do Connector. Operação assíncrona.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |
| `version_id` | string | Identificador da versão. |

**Response `202 Accepted`** (sem corpo)

```json
{
  "state": "pending"
}
```

---

## Version Actions

Ações disparam transições de estado e tipicamente são assíncronas (status `202 Accepted`). Use `GET /versions/{version_id}` para acompanhar `version_state`.

### `POST /v4/workspace/connectors/{connector_id}/versions/{version_id}/archive`

- **operationId**: `archive_connector_version`
- **Summary**: Archive a Connector version
- **Description**: Arquiva (soft-delete) uma versão em estado `ready`. A versão permanece auditável, porém indisponível para promoção.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |
| `version_id` | string | Identificador da versão. |

**Request body** - `VersionArchiveRequest`

```json
{
  "comment": "Substituída pela versão v_01J0AB7XF5N9QK"
}
```

**Response `202 Accepted`** (sem corpo)

```json
{
  "state": "pending"
}
```

---

### `POST /v4/workspace/connectors/{connector_id}/versions/{version_id}/build`

- **operationId**: `build_connector_version`
- **Summary**: Build a Connector version
- **Description**: Dispara o build de uma versão em `draft`. Transição esperada: `draft` -> `building` -> `ready` (ou `failed`).

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |
| `version_id` | string | Identificador da versão. |

**Request body** - `VersionBuildRequest`

```json
{
  "trace_id": "9f2c1c1a-2d7d-4f1c-9c39-2c1f7b2c4ab1",
  "comment": "Build de produção"
}
```

**Response `202 Accepted`** (sem corpo)

```json
{
  "state": "pending"
}
```

---

### `POST /v4/workspace/connectors/{connector_id}/versions/{version_id}/cancel`

- **operationId**: `cancel_connector_version_build`
- **Summary**: Cancel a Connector version build
- **Description**: Cancela uma versão em estado `queued` ou `building`. Transição esperada: para `cancelled`.

**Path parameters**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `connector_id` | integer | ID do Connector. |
| `version_id` | string | Identificador da versão. |

**Request body** - `VersionCancelRequest`

```json
{
  "comment": "Cancelando build após detectar regressão"
}
```

**Response `202 Accepted`** (sem corpo)

```json
{
  "state": "pending"
}
```

---

## Códigos de erro comuns

Todas as respostas de erro seguem o formato `JSONAPIErrorResponse`:

```json
{
  "errors": [
    {
      "status": "400",
      "code": "10000",
      "title": "Validation Error",
      "detail": "Invalid data provided in the request."
    }
  ]
}
```

| Status | Code | Title |
|--------|------|-------|
| 400 | 10000 | Validation Error |
| 401 | 10001 | Authentication Failed |
| 403 | 10003 | Permission Denied |
| 404 | 10004 | Not Found |
| 405 | 10007 | Method Not Allowed |
| 406 | 10005 | Not Acceptable |
| 429 | 10010 | Throttled |
