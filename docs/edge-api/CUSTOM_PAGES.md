# Custom Pages API

> Endpoints para gerenciar Custom Pages e suas versões. Extraído de `openapi-schema.yml`.

Todos os endpoints exigem autenticação via `TokenAuth` ou `BearerAuth`.

Base path: `/v4`

## Sumário

- [Custom Pages](#custom-pages)
  - [GET /v4/workspace/custom_pages](#get-workspaceapicustom_pages)
  - [POST /v4/workspace/custom_pages](#post-workspaceapicustom_pages)
  - [GET /v4/workspace/custom_pages/{custom_page_id}](#get-workspaceapicustom_pagescustom_page_id)
  - [PUT /v4/workspace/custom_pages/{custom_page_id}](#put-workspaceapicustom_pagescustom_page_id)
  - [PATCH /v4/workspace/custom_pages/{custom_page_id}](#patch-workspaceapicustom_pagescustom_page_id)
  - [DELETE /v4/workspace/custom_pages/{custom_page_id}](#delete-workspaceapicustom_pagescustom_page_id)
- [Versions (versionamento)](#versions-versionamento)
  - [GET /v4/workspace/custom_pages/{custom_page_id}/versions](#get-workspaceapicustom_pagescustom_page_idversions)
  - [POST /v4/workspace/custom_pages/{custom_page_id}/versions](#post-workspaceapicustom_pagescustom_page_idversions)
  - [GET /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}](#get-workspaceapicustom_pagescustom_page_idversionsversion_id)
  - [PUT /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}](#put-workspaceapicustom_pagescustom_page_idversionsversion_id)
  - [PATCH /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}](#patch-workspaceapicustom_pagescustom_page_idversionsversion_id)
  - [DELETE /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}](#delete-workspaceapicustom_pagescustom_page_idversionsversion_id)
- [Version Actions](#version-actions)
  - [POST .../versions/{version_id}/archive](#post-workspaceapicustom_pagescustom_page_idversionsversion_idarchive)
  - [POST .../versions/{version_id}/build](#post-workspaceapicustom_pagescustom_page_idversionsversion_idbuild)
  - [POST .../versions/{version_id}/cancel](#post-workspaceapicustom_pagescustom_page_idversionsversion_idcancel)

---

## Custom Pages

### `GET /v4/workspace/custom_pages`

- **operationId:** `list_custom_pages`
- **Summary:** List Custom Pages

Lista todas as Custom Pages da conta.

**Query params:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `active` | boolean | Filtra por status ativo. |
| `fields` | string | Lista de campos a incluir na resposta (separados por vírgula). |
| `id` | integer | Filtra por id (aceita lista separada por vírgula). |
| `last_editor` | string | Filtra por último editor (case-insensitive, partial match). |
| `last_modified__gte` | date-time | Filtra por data da última modificação (>=). |
| `last_modified__lte` | date-time | Filtra por data da última modificação (<=). |
| `name` | string | Filtra por nome (case-insensitive, partial match). |
| `ordering` | string | Campo de ordenação. Válidos: `id`, `name`, `last_editor`, `last_modified`, `active`. |
| `page` | integer | Número da página. |
| `page_size` | integer | Quantidade de itens por página. |
| `search` | string | Termo de busca aplicado a `id`, `name`, `last_editor`, `last_modified`, `active`. |

**Response 200:**

```json
{
  "count": 2,
  "total_pages": 1,
  "page": 1,
  "page_size": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 12345,
      "name": "Default 404 Page",
      "last_editor": "user@example.com",
      "last_modified": "2026-06-01T14:32:11Z",
      "created_at": "2026-05-20T09:12:00Z",
      "active": true,
      "product_version": "1.0",
      "pages": [
        {
          "code": "404",
          "page": {
            "type": "page_connector",
            "attributes": {
              "connector": 9876,
              "ttl": 60,
              "uri": "/errors/404.html",
              "custom_status_code": 404
            }
          }
        }
      ],
      "state": "ready",
      "version_id": "v_01HZX9Q8K7C8D5"
    },
    {
      "id": 12346,
      "name": "Maintenance Page",
      "last_editor": "ops@example.com",
      "last_modified": "2026-06-02T10:05:00Z",
      "created_at": "2026-05-21T11:00:00Z",
      "active": true,
      "product_version": "1.0",
      "pages": [
        {
          "code": "503",
          "page": {
            "type": "page_connector",
            "attributes": {
              "connector": 9876,
              "ttl": 0,
              "uri": "/errors/503.html",
              "custom_status_code": 503
            }
          }
        }
      ],
      "state": null,
      "version_id": null
    }
  ]
}
```

**Erros possíveis:** `400`, `401`, `403`, `404`, `405`, `406`, `429` (formato `JSONAPIErrorResponse`).

---

### `POST /v4/workspace/custom_pages`

- **operationId:** `create_custom_page`
- **Summary:** Create a Custom Page

Cria uma nova Custom Page.

**Request body** (`CustomPageRequest`):

```json
{
  "name": "Default 404 Page",
  "active": true,
  "pages": [
    {
      "code": "404",
      "page": {
        "type": "page_connector",
        "attributes": {
          "connector": 9876,
          "ttl": 60,
          "uri": "/errors/404.html",
          "custom_status_code": 404
        }
      }
    }
  ]
}
```

Notas sobre campos:

- `name` (obrigatório): 1..255 chars.
- `active` (default `true`).
- `pages` (obrigatório): array de páginas. Cada item tem `code` (enum) e `page` (polymorphic).
- `code` enum: `default`, `400`, `401`, `403`, `404`, `405`, `406`, `408`, `409`, `410`, `411`, `414`, `415`, `416`, `426`, `429`, `431`, `500`, `501`, `502`, `503`, `504`, `505`.
- `page.type` discriminator: atualmente `page_connector`.
- `page.attributes.connector` (obrigatório): id do Edge Connector.
- `page.attributes.ttl`: 0..31536000 (default 0).
- `page.attributes.uri`: até 250 chars, nullable.
- `page.attributes.custom_status_code`: 100..599, nullable.

**Response 201** (`CustomPageResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 12347,
    "name": "Default 404 Page",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T13:00:00Z",
    "created_at": "2026-06-10T13:00:00Z",
    "active": true,
    "product_version": "1.0",
    "pages": [
      {
        "code": "404",
        "page": {
          "type": "page_connector",
          "attributes": {
            "connector": 9876,
            "ttl": 60,
            "uri": "/errors/404.html",
            "custom_status_code": 404
          }
        }
      }
    ],
    "state": null,
    "version_id": null
  }
}
```

**Erros possíveis:** `400`, `401`, `403`, `404`, `405`, `406`, `429`.

---

### `GET /v4/workspace/custom_pages/{custom_page_id}`

- **operationId:** `retrieve_custom_page`
- **Summary:** Retrieve details of a Custom Page

Retorna detalhes de uma Custom Page específica.

**Path params:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `custom_page_id` | integer | ID da Custom Page. |

**Query params:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista de campos a incluir. |

**Response 200** (`CustomPageResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 12345,
    "name": "Default 404 Page",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-01T14:32:11Z",
    "created_at": "2026-05-20T09:12:00Z",
    "active": true,
    "product_version": "1.0",
    "pages": [
      {
        "code": "404",
        "page": {
          "type": "page_connector",
          "attributes": {
            "connector": 9876,
            "ttl": 60,
            "uri": "/errors/404.html",
            "custom_status_code": 404
          }
        }
      }
    ],
    "state": "ready",
    "version_id": "v_01HZX9Q8K7C8D5"
  }
}
```

**Erros possíveis:** `400`, `401`, `403`, `404`, `405`, `406`, `429`.

---

### `PUT /v4/workspace/custom_pages/{custom_page_id}`

- **operationId:** `update_custom_page`
- **Summary:** Update a Custom Page

Substitui completamente a Custom Page com os dados informados.

**Path params:** `custom_page_id` (integer, obrigatório).

**Request body** (`CustomPageRequest`):

```json
{
  "name": "Updated 404 Page",
  "active": true,
  "pages": [
    {
      "code": "404",
      "page": {
        "type": "page_connector",
        "attributes": {
          "connector": 9876,
          "ttl": 120,
          "uri": "/errors/v2/404.html",
          "custom_status_code": 404
        }
      }
    }
  ]
}
```

**Response 200** (`CustomPageResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 12345,
    "name": "Updated 404 Page",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T13:10:00Z",
    "created_at": "2026-05-20T09:12:00Z",
    "active": true,
    "product_version": "1.0",
    "pages": [
      {
        "code": "404",
        "page": {
          "type": "page_connector",
          "attributes": {
            "connector": 9876,
            "ttl": 120,
            "uri": "/errors/v2/404.html",
            "custom_status_code": 404
          }
        }
      }
    ],
    "state": "draft",
    "version_id": "v_01HZX9Q8K7C8D6"
  }
}
```

**Erros possíveis:** `400`, `401`, `403`, `404`, `405`, `406`, `429`.

---

### `PATCH /v4/workspace/custom_pages/{custom_page_id}`

- **operationId:** `partial_update_custom_page`
- **Summary:** Partially update a Custom Page

Atualiza parcialmente os campos de uma Custom Page. Todos os campos do body são opcionais.

**Path params:** `custom_page_id` (integer, obrigatório).

**Request body** (`PatchedCustomPageRequest`):

```json
{
  "active": false
}
```

Outros exemplos:

```json
{
  "name": "Renamed Custom Page"
}
```

```json
{
  "pages": [
    {
      "code": "500",
      "page": {
        "type": "page_connector",
        "attributes": {
          "connector": 9876,
          "ttl": 30,
          "uri": "/errors/500.html",
          "custom_status_code": 500
        }
      }
    }
  ]
}
```

**Response 200** (`CustomPageResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 12345,
    "name": "Default 404 Page",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T13:20:00Z",
    "created_at": "2026-05-20T09:12:00Z",
    "active": false,
    "product_version": "1.0",
    "pages": [
      {
        "code": "404",
        "page": {
          "type": "page_connector",
          "attributes": {
            "connector": 9876,
            "ttl": 60,
            "uri": "/errors/404.html",
            "custom_status_code": 404
          }
        }
      }
    ],
    "state": "draft",
    "version_id": "v_01HZX9Q8K7C8D7"
  }
}
```

**Erros possíveis:** `400`, `401`, `403`, `404`, `405`, `406`, `429`.

---

### `DELETE /v4/workspace/custom_pages/{custom_page_id}`

- **operationId:** `delete_custom_page`
- **Summary:** Delete a Custom Page

Remove uma Custom Page específica.

**Path params:** `custom_page_id` (integer, obrigatório).

**Response 200** (`DeleteResponse`):

```json
{
  "state": "executed"
}
```

**Erros possíveis:** `400`, `401`, `403`, `404`, `405`, `406`, `429`.

---

## Versions (versionamento)

Endpoints para gerenciar versões (drafts, ready, archived) de uma Custom Page. Uma Custom Page pode estar versionada (`is_versioned: true`), e cada versão é identificada por um `version_id` string.

### `GET /v4/workspace/custom_pages/{custom_page_id}/versions`

- **operationId:** `list_custom_page_versions`
- **Summary:** List Custom Page versions

Lista todas as versões de uma Custom Page.

**Path params:** `custom_page_id` (integer, obrigatório).

**Query params:** `fields` (string).

**Response 200:**

```json
{
  "results": [
    {
      "version_id": "v_01HZX9Q8K7C8D5",
      "state": "ready",
      "comment": "Initial ready version",
      "created_at": "2026-05-20T09:12:00Z",
      "last_modified": "2026-05-20T09:15:00Z",
      "last_editor": "user@example.com"
    },
    {
      "version_id": "v_01HZX9Q8K7C8D6",
      "state": "draft",
      "comment": "Tweaking 404 uri",
      "created_at": "2026-06-10T13:10:00Z",
      "last_modified": "2026-06-10T13:10:00Z",
      "last_editor": "user@example.com"
    }
  ]
}
```

> Nota: o schema OpenAPI marca esta resposta como "No response body"; o exemplo acima é ilustrativo e representa o formato esperado de listagem de versões.

---

### `POST /v4/workspace/custom_pages/{custom_page_id}/versions`

- **operationId:** `create_custom_page_version`
- **Summary:** Create a new Custom Page version

Cria uma nova versão clonando uma versão existente. Se `source_version` for omitido, clona a última versão `ready`.

**Path params:** `custom_page_id` (integer, obrigatório).

**Request body** (`VersionCreateRequest`):

```json
{
  "source_version": "v_01HZX9Q8K7C8D5",
  "comment": "Clone from ready, adjusting TTLs",
  "override": {
    "pages": [
      {
        "code": "404",
        "page": {
          "type": "page_connector",
          "attributes": {
            "connector": 9876,
            "ttl": 300,
            "uri": "/errors/404.html",
            "custom_status_code": 404
          }
        }
      }
    ]
  }
}
```

Campos:

- `source_version` (opcional, nullable): ID da versão a ser clonada. Default: última `ready`.
- `comment` (default `""`): descrição livre.
- `override` (opcional): object com campos da Custom Page a sobrescrever após o clone.

**Response 201:** Cria a versão em estado `draft`. Exemplo ilustrativo:

```json
{
  "state": "executed",
  "data": {
    "version_id": "v_01HZX9Q8K7C8D8",
    "state": "draft",
    "source_version": "v_01HZX9Q8K7C8D5",
    "comment": "Clone from ready, adjusting TTLs",
    "created_at": "2026-06-10T13:30:00Z"
  }
}
```

---

### `GET /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}`

- **operationId:** `retrieve_custom_page_version`
- **Summary:** Retrieve a Custom Page version

Retorna detalhes de uma versão específica.

**Path params:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `custom_page_id` | integer | ID da Custom Page. |
| `version_id` | string | Identificador da versão. |

**Query params:** `fields` (string).

**Response 200:** (exemplo ilustrativo - schema marca como "No response body")

```json
{
  "state": "executed",
  "data": {
    "version_id": "v_01HZX9Q8K7C8D8",
    "state": "draft",
    "comment": "Clone from ready, adjusting TTLs",
    "created_at": "2026-06-10T13:30:00Z",
    "last_modified": "2026-06-10T13:30:00Z",
    "last_editor": "user@example.com",
    "custom_page": {
      "id": 12345,
      "name": "Default 404 Page",
      "active": true,
      "product_version": "1.0",
      "pages": [
        {
          "code": "404",
          "page": {
            "type": "page_connector",
            "attributes": {
              "connector": 9876,
              "ttl": 300,
              "uri": "/errors/404.html",
              "custom_status_code": 404
            }
          }
        }
      ]
    }
  }
}
```

---

### `PUT /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}`

- **operationId:** `update_custom_page_version`
- **Summary:** Update a Custom Page version

Atualiza completamente uma versão em estado `draft`. Não pode ser usado em versões `ready`, `archived` ou em build.

**Path params:** `custom_page_id` (integer), `version_id` (string).

**Request body** (`CustomPageRequest` — mesma forma do PUT do recurso base):

```json
{
  "name": "Default 404 Page (draft)",
  "active": true,
  "pages": [
    {
      "code": "default",
      "page": {
        "type": "page_connector",
        "attributes": {
          "connector": 4321,
          "ttl": 60,
          "uri": "/errors/404.html",
          "custom_status_code": 404
        }
      }
    }
  ]
}
```

**Response 200:** Retorna a versão atualizada (schema marca como "No response body"; veja exemplo do GET).

---

### `PATCH /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}`

- **operationId:** `partial_update_custom_page_version`
- **Summary:** Partially update a Custom Page version

Atualiza parcialmente uma versão em `draft`.

**Path params:** `custom_page_id` (integer), `version_id` (string).

**Request body** (`PatchedCustomPageRequest` — qualquer subconjunto dos campos do recurso):

```json
{
  "active": false
}
```

**Response 200:** Retorna a versão atualizada (schema marca como "No response body").

---

### `DELETE /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}`

- **operationId:** `delete_custom_page_version`
- **Summary:** Delete a Custom Page version

Remove uma versão específica. Operação assíncrona.

**Path params:** `custom_page_id` (integer), `version_id` (string).

**Response 202:** Aceito, sem corpo. A remoção é processada em background.

---

## Version Actions

Ações sobre versões. Todas retornam `202 Accepted` (processamento assíncrono) e aceitam um body opcional para metadata.

### `POST /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}/archive`

- **operationId:** `archive_custom_page_version`
- **Summary:** Archive a Custom Page version

Arquiva (soft-delete) uma versão `ready`. A versão deixa de ser elegível para uso, mas é mantida para histórico.

**Path params:** `custom_page_id` (integer), `version_id` (string).

**Request body** (`VersionArchiveRequest`, opcional):

```json
{
  "comment": "Superseded by v_01HZX9Q8K7C8D8"
}
```

**Response 202:** Sem corpo. A operação foi aceita para processamento.

---

### `POST /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}/build`

- **operationId:** `build_custom_page_version`
- **Summary:** Build a Custom Page version

Dispara o build de uma versão em `draft`. Após o build bem-sucedido, a versão transita para `ready` e fica disponível para uso em produção.

**Path params:** `custom_page_id` (integer), `version_id` (string).

**Request body** (`VersionBuildRequest`, opcional):

```json
{
  "trace_id": "trace-7f3c1e2a-2026-06-10",
  "comment": "Promote 404 TTL change to ready"
}
```

Campos:

- `trace_id` (default `""`): identificador para observabilidade/rastreio.
- `comment` (default `""`): comentário do build.

**Response 202:** Sem corpo. Build enfileirado.

---

### `POST /v4/workspace/custom_pages/{custom_page_id}/versions/{version_id}/cancel`

- **operationId:** `cancel_custom_page_version_build`
- **Summary:** Cancel a Custom Page version build

Cancela um build em andamento (`queued` ou `building`) de uma versão.

**Path params:** `custom_page_id` (integer), `version_id` (string).

**Request body** (`VersionCancelRequest`, opcional):

```json
{
  "comment": "Cancelling: connector misconfigured"
}
```

**Response 202:** Sem corpo. Cancelamento enfileirado.

---

## Apêndice: Schemas referenciados

### `CustomPage` (response)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | integer | readOnly. |
| `name` | string | 1..255. |
| `last_editor` | string | readOnly. |
| `last_modified` | date-time | readOnly. |
| `created_at` | date-time | readOnly. |
| `active` | boolean | default `true`. |
| `product_version` | string | readOnly, default `"1.0"`, padrão `\d+\.\d+`. |
| `pages` | array<Page> | obrigatório. |
| `is_versioned` | boolean | readOnly. |
| `version_state` | string \| null | readOnly. Estados típicos: `draft`, `ready`, `building`, `archived`. |
| `version_id` | string \| null | readOnly. |

### `CustomPageRequest`

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `name` | string | sim | 1..255. |
| `active` | boolean | não | default `true`. |
| `pages` | array<PageRequest> | sim | |

### `Page` / `PageRequest`

| Campo | Tipo | Notas |
|-------|------|-------|
| `code` | enum (`CodeEnum`) | Códigos HTTP suportados + `default`. |
| `page` | polymorphic (`PagePolymorphic`) | Discriminator `type`. |

Valores de `code`: `default`, `400`, `401`, `403`, `404`, `405`, `406`, `408`, `409`, `410`, `411`, `414`, `415`, `416`, `426`, `429`, `431`, `500`, `501`, `502`, `503`, `504`, `505`.

### `PageConnector` (variante `type: page_connector`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `attributes.connector` | integer | obrigatório. ID do Edge Connector. |
| `attributes.ttl` | integer | 0..31536000, default 0. |
| `attributes.uri` | string \| null | até 250 chars. |
| `attributes.custom_status_code` | integer \| null | 100..599. |

### `VersionCreateRequest`

| Campo | Tipo | Notas |
|-------|------|-------|
| `source_version` | string \| null | ID da versão a clonar (default: última ready). |
| `comment` | string | default `""`. |
| `override` | object | overrides aplicados após o clone. |

### `VersionArchiveRequest` / `VersionBuildRequest` / `VersionCancelRequest`

Aceitam metadata opcional para a ação (`comment`, e adicionalmente `trace_id` no build).

### Erros (`JSONAPIErrorResponse`)

Formato JSON:API. Exemplo:

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

Códigos comuns:

| HTTP | Code | Title |
|------|------|-------|
| 400 | 10000 | Validation Error |
| 401 | 10001 | Authentication Failed |
| 403 | 10003 | Permission Denied |
| 404 | 10004 | Not Found |
| 405 | 10007 | Method Not Allowed |
| 406 | 10005 | Not Acceptable |
| 429 | 10010 | Throttled |
