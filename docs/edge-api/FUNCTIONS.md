# Edge Functions API

> Endpoints para gerenciar Edge Functions e suas versões. Extraído de `openapi-schema.yml`.

Autenticação: `Authorization: Token <token>` ou `Authorization: Bearer <token>`.

Todos os endpoints retornam `JSONAPIErrorResponse` para os status `400`, `401`, `403`, `404`, `405`, `406` e `429`. Exemplo:

```json
{
  "errors": [
    {
      "status": "401",
      "code": "10001",
      "title": "Authentication Failed",
      "detail": "Invalid authentication credentials."
    }
  ]
}
```

## Sumário

- [Functions](#functions)
  - [List Functions](#get-edge_functionsapifunctions)
  - [Create Function](#post-edge_functionsapifunctions)
  - [Retrieve Function](#get-edge_functionsapifunctionsfunction_id)
  - [Update Function](#put-edge_functionsapifunctionsfunction_id)
  - [Partially Update Function](#patch-edge_functionsapifunctionsfunction_id)
  - [Delete Function](#delete-edge_functionsapifunctionsfunction_id)
- [Versions (versionamento)](#versions-versionamento)
  - [List Function Versions](#get-edge_functionsapifunctionsfunction_idversions)
  - [Create Function Version](#post-edge_functionsapifunctionsfunction_idversions)
  - [Retrieve Function Version](#get-edge_functionsapifunctionsfunction_idversionsversion_id)
  - [Update Function Version](#put-edge_functionsapifunctionsfunction_idversionsversion_id)
  - [Partially Update Function Version](#patch-edge_functionsapifunctionsfunction_idversionsversion_id)
  - [Delete Function Version](#delete-edge_functionsapifunctionsfunction_idversionsversion_id)
- [Version Actions](#version-actions)
  - [Archive Version](#post-edge_functionsapifunctionsfunction_idversionsversion_idarchive)
  - [Build Version](#post-edge_functionsapifunctionsfunction_idversionsversion_idbuild)
  - [Cancel Version Build](#post-edge_functionsapifunctionsfunction_idversionsversion_idcancel)

---

## Functions

### `GET /edge_functions/api/functions`

- **operationId**: `list_functions`
- **Summary**: List Functions
- **Description**: List all Functions owned by your account.

#### Query parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `active` | boolean | Filtrar por status ativo. |
| `fields` | string | Lista separada por vírgulas dos campos a incluir na resposta. |
| `id` | integer | Filtrar por id (aceita valores separados por vírgula). |
| `language__in` | string | Filtrar por linguagem (aceita valores separados por vírgula). |
| `last_editor` | string | Filtrar por último editor (case-insensitive, partial match). |
| `last_modified__gte` | string (date-time) | Filtrar por data de última modificação (maior ou igual). |
| `last_modified__lte` | string (date-time) | Filtrar por data de última modificação (menor ou igual). |
| `name` | string | Filtrar por nome (case-insensitive, partial match). |
| `ordering` | string | Campo de ordenação. Válidos: `id`, `name`, `language`, `runtime_environment`, `active`, `last_editor`, `last_modified`. |
| `page` | integer | Página da paginação. |
| `page_size` | integer | Itens por página. |
| `runtime_environment__in` | string | Filtrar por runtime environment (CSV). |
| `search` | string | Termo de busca em `name`, `last_editor`, `language`, `runtime_environment`, `active`. |

#### Response `200 OK`

```json
{
  "count": 2,
  "next": "https://api.azion.com/edge_functions/api/functions?page=2",
  "previous": null,
  "results": [
    {
      "id": 12345,
      "name": "ab-testing-cookie",
      "last_editor": "user@example.com",
      "last_modified": "2026-06-01T12:34:56Z",
      "product_version": "1.0",
      "active": true,
      "runtime": "azion_js",
      "execution_environment": "application",
      "default_args": { "arg_01": "value_01" },
      "azion_form": {},
      "reference_count": 3,
      "version": "1.0.0",
      "vendor": "azion",
      "is_versioned": true,
      "version_state": "ready",
      "version_id": "01HZX9K8E6Q2A7N4T1Y5R3W8P0"
    },
    {
      "id": 12346,
      "name": "redirect-handler",
      "last_editor": "user@example.com",
      "last_modified": "2026-05-22T09:12:00Z",
      "product_version": "1.0",
      "active": true,
      "runtime": "azion_js",
      "execution_environment": "application",
      "default_args": {},
      "azion_form": {},
      "reference_count": 0,
      "version": "1.0.0",
      "vendor": "azion",
      "is_versioned": false,
      "version_state": null,
      "version_id": null
    }
  ]
}
```

---

### `POST /edge_functions/api/functions`

- **operationId**: `create_function`
- **Summary**: Create a Function
- **Description**: Create a new Function in your account.

#### Request body (`EdgeFunctionsRequest`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string (1..250) | sim | Nome da função. |
| `active` | boolean | não | Default `true`. |
| `runtime` | enum (`RuntimeEnum`) | não | Valor válido: `azion_js`. Default `azion_js`. |
| `execution_environment` | enum (`ExecutionEnvironmentEnum`) | não | Valores: `firewall`, `application`. Default `application`. |
| `default_args` | object | não | Argumentos JSON acessados pela função. |
| `azion_form` | object | não | JSON Schema para renderização de form de args. |
| `code` | string (1..52428800) | sim | Código da função (máx 50.0 MB). |

```json
{
  "name": "hello-world-edge",
  "active": true,
  "runtime": "azion_js",
  "execution_environment": "application",
  "default_args": {
    "greeting": "Hello",
    "target": "World"
  },
  "azion_form": {},
  "code": "async function handleRequest(event) {\n  const args = JSON.parse(event.args || '{}');\n  const body = `${args.greeting || 'Hello'}, ${args.target || 'World'}!`;\n  return new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } });\n}\n\naddEventListener('fetch', (event) => event.respondWith(handleRequest(event)));"
}
```

#### Response `201 Created` (`FunctionResponse`)

```json
{
  "state": "executed",
  "data": {
    "id": 99876,
    "name": "hello-world-edge",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T14:22:31Z",
    "product_version": "1.0",
    "active": true,
    "runtime": "azion_js",
    "execution_environment": "application",
    "default_args": {
      "greeting": "Hello",
      "target": "World"
    },
    "azion_form": {},
    "reference_count": 0,
    "version": "1.0.0",
    "vendor": "azion",
    "is_versioned": false,
    "version_state": null,
    "version_id": null,
    "code": "async function handleRequest(event) {\n  const args = JSON.parse(event.args || '{}');\n  const body = `${args.greeting || 'Hello'}, ${args.target || 'World'}!`;\n  return new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } });\n}\n\naddEventListener('fetch', (event) => event.respondWith(handleRequest(event)));"
  }
}
```

---

### `GET /edge_functions/api/functions/{function_id}`

- **operationId**: `retrieve_function`
- **Summary**: Retrieve details of a Function
- **Description**: Retrieve details of a specific Function in your account.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | Identificador único da edge function. |

#### Query parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista CSV de campos a incluir na resposta. |

#### Response `200 OK` (`FunctionResponse`)

```json
{
  "state": "executed",
  "data": {
    "id": 99876,
    "name": "hello-world-edge",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T14:22:31Z",
    "product_version": "1.0",
    "active": true,
    "runtime": "azion_js",
    "execution_environment": "application",
    "default_args": { "greeting": "Hello", "target": "World" },
    "azion_form": {},
    "reference_count": 1,
    "version": "1.0.0",
    "vendor": "azion",
    "is_versioned": true,
    "version_state": "ready",
    "version_id": "01HZX9K8E6Q2A7N4T1Y5R3W8P0",
    "code": "addEventListener('fetch', (event) => event.respondWith(new Response('ok')));"
  }
}
```

---

### `PUT /edge_functions/api/functions/{function_id}`

- **operationId**: `update_function`
- **Summary**: Update a Function
- **Description**: Update an existing Function, substituindo todos os campos pelos novos dados informados.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | Identificador único da edge function. |

#### Request body (`EdgeFunctionsRequest`)

```json
{
  "name": "hello-world-edge-v2",
  "active": true,
  "runtime": "azion_js",
  "execution_environment": "application",
  "default_args": {
    "greeting": "Hi",
    "target": "Edge"
  },
  "azion_form": {},
  "code": "addEventListener('fetch', (event) => {\n  event.respondWith(new Response('Hi, Edge!', { status: 200 }));\n});"
}
```

#### Response `200 OK` (`FunctionResponse`)

```json
{
  "state": "executed",
  "data": {
    "id": 99876,
    "name": "hello-world-edge-v2",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T15:00:01Z",
    "product_version": "1.0",
    "active": true,
    "runtime": "azion_js",
    "execution_environment": "application",
    "default_args": { "greeting": "Hi", "target": "Edge" },
    "azion_form": {},
    "reference_count": 1,
    "version": "1.0.0",
    "vendor": "azion",
    "is_versioned": true,
    "version_state": "draft",
    "version_id": "01HZX9M2A8B7C6D5E4F3G2H1I0",
    "code": "addEventListener('fetch', (event) => {\n  event.respondWith(new Response('Hi, Edge!', { status: 200 }));\n});"
  }
}
```

---

### `PATCH /edge_functions/api/functions/{function_id}`

- **operationId**: `partial_update_function`
- **Summary**: Partially update a Function
- **Description**: Update one or more fields of an existing Function without affecting other fields.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | Identificador único da edge function. |

#### Request body (`PatchedEdgeFunctionsRequest`) - todos os campos opcionais

```json
{
  "active": false,
  "default_args": {
    "feature_flag": "beta"
  }
}
```

#### Response `200 OK` (`FunctionResponse`)

```json
{
  "state": "executed",
  "data": {
    "id": 99876,
    "name": "hello-world-edge-v2",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T15:10:42Z",
    "product_version": "1.0",
    "active": false,
    "runtime": "azion_js",
    "execution_environment": "application",
    "default_args": { "feature_flag": "beta" },
    "azion_form": {},
    "reference_count": 1,
    "version": "1.0.0",
    "vendor": "azion",
    "is_versioned": true,
    "version_state": "draft",
    "version_id": "01HZX9M2A8B7C6D5E4F3G2H1I0",
    "code": "addEventListener('fetch', (event) => event.respondWith(new Response('ok')));"
  }
}
```

---

### `DELETE /edge_functions/api/functions/{function_id}`

- **operationId**: `delete_function`
- **Summary**: Delete a Function
- **Description**: Delete a specific Function in your account.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | Identificador único da edge function. |

#### Response `200 OK` (`DeleteResponse`)

```json
{
  "state": "executed",
  "data": null
}
```

---

## Versions (versionamento)

Endpoints para gerenciar versões de uma Edge Function. Os `version_id` são identificadores opacos (string, geralmente ULID/UUID-like).

### `GET /edge_functions/api/functions/{function_id}/versions`

- **operationId**: `list_function_versions`
- **Summary**: List Function versions
- **Description**: List all versions of a specific Function.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |

#### Query parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista CSV de campos a incluir. |

#### Response `200 OK`

```json
{
  "count": 2,
  "results": [
    {
      "version_id": "01HZX9K8E6Q2A7N4T1Y5R3W8P0",
      "state": "ready",
      "comment": "Initial release",
      "created_at": "2026-05-01T10:00:00Z",
      "last_modified": "2026-05-01T10:05:12Z"
    },
    {
      "version_id": "01HZX9M2A8B7C6D5E4F3G2H1I0",
      "state": "draft",
      "comment": "Refactor greeting logic",
      "created_at": "2026-06-10T14:50:00Z",
      "last_modified": "2026-06-10T15:00:01Z"
    }
  ]
}
```

---

### `POST /edge_functions/api/functions/{function_id}/versions`

- **operationId**: `create_function_version`
- **Summary**: Create a new Function version
- **Description**: Create a new version by cloning.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |

#### Request body (`VersionCreateRequest`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `source_version` | string \| null | ID da versão a clonar. Se omitido, clona a última `ready`. |
| `comment` | string | Descrição da nova versão. |
| `override` | object | Field overrides aplicados ao clone antes do save. |

```json
{
  "source_version": "01HZX9K8E6Q2A7N4T1Y5R3W8P0",
  "comment": "Branch from production for canary test",
  "override": {
    "default_args": {
      "greeting": "Hola",
      "target": "Mundo"
    },
    "code": "addEventListener('fetch', (event) => event.respondWith(new Response('Hola, Mundo!')));"
  }
}
```

#### Response `201 Created`

```json
{
  "version_id": "01HZY1P3F4G5H6J7K8L9M0N1B2",
  "state": "draft",
  "source_version": "01HZX9K8E6Q2A7N4T1Y5R3W8P0",
  "comment": "Branch from production for canary test",
  "created_at": "2026-06-10T15:30:00Z"
}
```

---

### `GET /edge_functions/api/functions/{function_id}/versions/{version_id}`

- **operationId**: `retrieve_function_version`
- **Summary**: Retrieve a Function version
- **Description**: Retrieve details of a specific version.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |
| `version_id` | string | Identificador da versão. |

#### Query parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista CSV de campos a incluir. |

#### Response `200 OK`

```json
{
  "version_id": "01HZY1P3F4G5H6J7K8L9M0N1B2",
  "state": "draft",
  "comment": "Branch from production for canary test",
  "source_version": "01HZX9K8E6Q2A7N4T1Y5R3W8P0",
  "created_at": "2026-06-10T15:30:00Z",
  "last_modified": "2026-06-10T15:30:00Z",
  "data": {
    "name": "hello-world-edge",
    "active": true,
    "runtime": "azion_js",
    "execution_environment": "application",
    "default_args": { "greeting": "Hola", "target": "Mundo" },
    "code": "addEventListener('fetch', (event) => event.respondWith(new Response('Hola, Mundo!')));"
  }
}
```

---

### `PUT /edge_functions/api/functions/{function_id}/versions/{version_id}`

- **operationId**: `update_function_version`
- **Summary**: Update a Function version
- **Description**: Update a draft version. Versões em estados não-draft não podem ser atualizadas.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |
| `version_id` | string | Identificador da versão. |

#### Request body (`VersionCreateRequest`)

```json
{
  "comment": "Updated canary payload",
  "override": {
    "default_args": { "greeting": "Bonjour", "target": "Edge" },
    "code": "addEventListener('fetch', (event) => event.respondWith(new Response('Bonjour, Edge!')));"
  }
}
```

#### Response `200 OK`

```json
{
  "version_id": "01HZY1P3F4G5H6J7K8L9M0N1B2",
  "state": "draft",
  "comment": "Updated canary payload",
  "last_modified": "2026-06-10T16:00:11Z"
}
```

---

### `PATCH /edge_functions/api/functions/{function_id}/versions/{version_id}`

- **operationId**: `partial_update_function_version`
- **Summary**: Partially update a Function version
- **Description**: Partially update a draft version.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |
| `version_id` | string | Identificador da versão. |

#### Request body (`PatchedVersionCreateRequest`) - todos os campos opcionais

```json
{
  "comment": "Adjust comment only"
}
```

#### Response `200 OK`

```json
{
  "version_id": "01HZY1P3F4G5H6J7K8L9M0N1B2",
  "state": "draft",
  "comment": "Adjust comment only",
  "last_modified": "2026-06-10T16:05:22Z"
}
```

---

### `DELETE /edge_functions/api/functions/{function_id}/versions/{version_id}`

- **operationId**: `delete_function_version`
- **Summary**: Delete a Function version
- **Description**: Delete a specific version. A operação é assíncrona e retorna `202 Accepted`.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |
| `version_id` | string | Identificador da versão. |

#### Response `202 Accepted`

Sem corpo de resposta. A exclusão é processada de forma assíncrona.

---

## Version Actions

Operações de transição de estado em versões. Todas retornam `202 Accepted` indicando que a ação foi enfileirada para processamento assíncrono.

### `POST /edge_functions/api/functions/{function_id}/versions/{version_id}/archive`

- **operationId**: `archive_function_version`
- **Summary**: Archive a Function version
- **Description**: Arquiva (soft-delete) uma versão que esteja no estado `ready`. Versões arquivadas saem do conjunto utilizável mas permanecem persistidas para auditoria.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |
| `version_id` | string | Identificador da versão. |

#### Request body (`VersionArchiveRequest`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `comment` | string | Comentário opcional para este archive. |

```json
{
  "comment": "Deprecated in favor of v2"
}
```

#### Response `202 Accepted`

Sem corpo. A versão é movida para o estado `archived` de forma assíncrona.

---

### `POST /edge_functions/api/functions/{function_id}/versions/{version_id}/build`

- **operationId**: `build_function_version`
- **Summary**: Build a Function version
- **Description**: Dispara um build para uma versão em estado `draft`. Ao final, a versão transita para `ready` (sucesso) ou `failed`.

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |
| `version_id` | string | Identificador da versão. |

#### Request body (`VersionBuildRequest`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `trace_id` | string | Trace ID para observabilidade. |
| `comment` | string | Comentário opcional para este build. |

```json
{
  "trace_id": "trace-7f1c2b9a-2026-06-10",
  "comment": "Promote canary build"
}
```

#### Response `202 Accepted`

Sem corpo. O build é enfileirado. Consulte o endpoint de retrieve para acompanhar transições de estado (`draft` -> `building` -> `ready` | `failed`).

---

### `POST /edge_functions/api/functions/{function_id}/versions/{version_id}/cancel`

- **operationId**: `cancel_function_version_build`
- **Summary**: Cancel a Function version build
- **Description**: Cancela uma versão em estado `queued` ou `building`. Após o cancelamento, a versão volta para `draft` (ou estado equivalente conforme implementação).

#### Path parameters

| Nome | Tipo | Descrição |
|------|------|-----------|
| `function_id` | integer | ID da Function. |
| `version_id` | string | Identificador da versão. |

#### Request body (`VersionCancelRequest`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `comment` | string | Comentário opcional explicando o cancelamento. |

```json
{
  "comment": "Wrong source version selected"
}
```

#### Response `202 Accepted`

Sem corpo. O cancelamento é processado de forma assíncrona.
