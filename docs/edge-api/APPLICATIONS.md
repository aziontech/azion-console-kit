# Edge Applications API

> Endpoints para gerenciar Edge Applications, sub-recursos (cache settings, device groups, functions, rules) e versões. Extraído de `openapi-schema.yml`.

Todos os endpoints exigem autenticação via `TokenAuth` ou `BearerAuth` no header `Authorization`.

## Sumário

- [Applications](#applications)
- [Clone](#clone)
- [Cache Settings](#cache-settings)
- [Device Groups](#device-groups)
- [Functions](#functions)
- [Request Rules](#request-rules)
- [Response Rules](#response-rules)
- [Versions (versionamento)](#versions-versionamento)
- [Version Actions](#version-actions)
- [Versioned Sub-resources](#versioned-sub-resources)

### Convenções comuns

- Todas as respostas de erro seguem o formato `JSONAPIErrorResponse`:

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

- Códigos de erro padrão: `400` (Validation), `401` (Authentication), `403` (Permission), `404` (Not Found), `405` (Method Not Allowed), `406` (Not Acceptable), `429` (Throttled).
- Respostas de leitura/escrita em recursos retornam um envelope `{ "state": "executed", "data": { ... } }`.
- Listagens retornam paginação no formato `{ count, total_pages, page, page_size, next, previous, results }`.

---

## Applications

### `GET /v4/workspace/applications`

List all Applications owned by your account. `operationId: list_applications`.

**Query params:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `active` | boolean | Filter by active status |
| `fields` | string | CSV list of fields to include |
| `id` | integer | Filter by id (CSV accepted) |
| `last_editor` | string | Partial, case-insensitive match |
| `last_modified__gte` | date-time | Date filter (>=) |
| `last_modified__lte` | date-time | Date filter (<=) |
| `name` | string | Partial, case-insensitive match |
| `ordering` | string | One of: `name`, `id`, `last_editor`, `last_modified`, `active`, `debug`, `product_version` |
| `page` | integer | Page number |
| `page_size` | integer | Items per page |
| `search` | string | Search across `id`, `name`, `last_editor`, `last_modified`, `active` |

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
      "id": 1234,
      "name": "My Application",
      "last_editor": "user@example.com",
      "last_modified": "2026-06-10T12:34:56Z",
      "modules": {
        "cache": { "enabled": true },
        "functions": { "enabled": true },
        "application_accelerator": { "enabled": false },
        "image_processor": { "enabled": false }
      },
      "active": true,
      "debug": false,
      "product_version": "2.0",
      "is_versioned": true,
      "version_state": "ready",
      "version_id": "01HZX9P3K2A7B4C5D6E7F8G9H0"
    },
    {
      "id": 1235,
      "name": "Staging App",
      "last_editor": "ops@example.com",
      "last_modified": "2026-06-09T10:00:00Z",
      "modules": {
        "cache": { "enabled": true },
        "functions": { "enabled": false },
        "application_accelerator": { "enabled": true },
        "image_processor": { "enabled": false }
      },
      "active": true,
      "debug": true,
      "product_version": "2.0",
      "is_versioned": false,
      "version_state": null,
      "version_id": null
    }
  ]
}
```

### `POST /v4/workspace/applications`

Create a new Application. `operationId: create_application`.

**Request body:**

```json
{
  "name": "My Application",
  "modules": {
    "cache": { "enabled": true },
    "functions": { "enabled": true },
    "application_accelerator": { "enabled": false },
    "image_processor": { "enabled": false }
  },
  "active": true,
  "debug": false
}
```

**Response 201:**

```json
{
  "state": "executed",
  "data": {
    "id": 1234,
    "name": "My Application",
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T12:34:56Z",
    "modules": {
      "cache": { "enabled": true },
      "functions": { "enabled": true },
      "application_accelerator": { "enabled": false },
      "image_processor": { "enabled": false }
    },
    "active": true,
    "debug": false,
    "product_version": "2.0",
    "is_versioned": false,
    "version_state": null,
    "version_id": null
  }
}
```

### `GET /v4/workspace/applications/{application_id}`

Retrieve a specific Application. `operationId: retrieve_application`.

**Path params:** `application_id` (integer, required). **Query params:** `fields`.

**Response 200:** Same envelope as the create response.

### `PUT /v4/workspace/applications/{application_id}`

Replace an existing Application (full update). `operationId: update_application`.

**Request body:** Same as `ApplicationRequest` shown above.

**Response 200:** `ApplicationResponse` envelope.

### `PATCH /v4/workspace/applications/{application_id}`

Partially update an Application. `operationId: partial_update_application`.

**Request body (any subset of fields):**

```json
{
  "name": "My Renamed App",
  "active": false
}
```

**Response 200:** `ApplicationResponse` envelope.

### `DELETE /v4/workspace/applications/{application_id}`

Delete an Application. `operationId: destroy_application`.

**Response 204:** No content.

---

## Clone

### `POST /v4/workspace/applications/{application_id}/clone`

Deep-copy an existing Application (Cache Settings, Origins, Error Responses, Function Instances, Rules Engine). `operationId: clone_application`.

**Request body:**

```json
{
  "name": "My Application - Copy"
}
```

**Response 201:** `ApplicationResponse` envelope with the new Application.

---

## Cache Settings

### `GET /v4/workspace/applications/{application_id}/cache_settings`

List Cache Settings. `operationId: list_cache_settings`.

**Query params:** `fields`, `id`, `name`, `ordering`, `page`, `page_size`, `search`.

**Response 200:**

```json
{
  "count": 1,
  "total_pages": 1,
  "page": 1,
  "page_size": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 9876,
      "name": "Default Cache Policy",
      "browser_cache": { "behavior": "honor", "max_age": 0 },
      "modules": {
        "cache": {
          "behavior": "honor",
          "max_age": 60,
          "stale_cache": { "enabled": true },
          "large_file_cache": { "enabled": false, "offset": 1048576 },
          "tiered_cache": { "topology": "near-edge", "enabled": true }
        },
        "application_accelerator": {
          "cache_vary_by_method": ["options", "post"],
          "cache_vary_by_querystring": { "behavior": "ignore", "fields": [], "sort_enabled": false },
          "cache_vary_by_cookies": { "behavior": "ignore", "cookie_names": [] },
          "cache_vary_by_devices": { "behavior": "ignore", "device_group": [] }
        }
      },
      "created_at": "2026-06-10T12:00:00Z"
    }
  ]
}
```

### `POST /v4/workspace/applications/{application_id}/cache_settings`

Create a Cache Setting. `operationId: create_cache_setting`.

**Request body:**

```json
{
  "name": "Default Cache Policy",
  "browser_cache": { "behavior": "honor", "max_age": 0 },
  "modules": {
    "cache": {
      "behavior": "override",
      "max_age": 3600,
      "stale_cache": { "enabled": true },
      "tiered_cache": { "topology": "near-edge", "enabled": true }
    },
    "application_accelerator": {
      "cache_vary_by_method": ["post"],
      "cache_vary_by_querystring": { "behavior": "allowlist", "fields": ["lang"], "sort_enabled": true }
    }
  }
}
```

`behavior` enum (Edge Cache): `honor`, `override`. `cache_vary_by_method` enum values: `options`, `post`.

**Response 201:**

```json
{
  "state": "executed",
  "data": {
    "id": 9876,
    "name": "Default Cache Policy",
    "browser_cache": { "behavior": "honor", "max_age": 0 },
    "modules": { "cache": { "behavior": "override", "max_age": 3600 } },
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

### `GET /v4/workspace/applications/{application_id}/cache_settings/{cache_setting_id}`

Retrieve a Cache Setting. `operationId: retrieve_cache_setting`.

**Response 200:** Same `CacheSettingResponse` envelope.

### `PUT /v4/workspace/applications/{application_id}/cache_settings/{cache_setting_id}`

Replace a Cache Setting. `operationId: update_cache_setting`. **Request body:** `CacheSettingRequest`. **Response 200:** envelope.

### `PATCH /v4/workspace/applications/{application_id}/cache_settings/{cache_setting_id}`

Partially update a Cache Setting. `operationId: partial_update_cache_setting`.

```json
{ "name": "Updated Cache Policy" }
```

**Response 200:** envelope.

### `DELETE /v4/workspace/applications/{application_id}/cache_settings/{cache_setting_id}`

Delete a Cache Setting. `operationId: destroy_cache_setting`. **Response 204:** No content.

---

## Device Groups

### `GET /v4/workspace/applications/{application_id}/device_groups`

List Device Groups. `operationId: list_device_groups`.

**Query params:** `fields`, `id`, `name`, `ordering`, `page`, `page_size`, `search`.

**Response 200:**

```json
{
  "count": 1,
  "total_pages": 1,
  "page": 1,
  "page_size": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 4321,
      "name": "Mobile Devices",
      "user_agent": "(Mobile|iPhone|Android)",
      "created_at": "2026-06-10T12:00:00Z"
    }
  ]
}
```

### `POST /v4/workspace/applications/{application_id}/device_groups`

Create a Device Group. `operationId: create_device_group`.

**Request body:**

```json
{
  "name": "Mobile Devices",
  "user_agent": "(Mobile|iPhone|Android)"
}
```

**Response 201:**

```json
{
  "state": "executed",
  "data": {
    "id": 4321,
    "name": "Mobile Devices",
    "user_agent": "(Mobile|iPhone|Android)",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

### `GET /v4/workspace/applications/{application_id}/device_groups/{device_group_id}`

Retrieve a Device Group. `operationId: retrieve_device_group`. **Response 200:** `DeviceGroupResponse` envelope.

### `PUT /v4/workspace/applications/{application_id}/device_groups/{device_group_id}`

Replace a Device Group. `operationId: update_device_group`. **Body:** `DeviceGroupRequest`. **Response 200:** envelope.

### `PATCH /v4/workspace/applications/{application_id}/device_groups/{device_group_id}`

Partially update a Device Group. `operationId: partial_update_device_group`.

```json
{ "user_agent": "(Mobile|iPad)" }
```

**Response 200:** envelope.

### `DELETE /v4/workspace/applications/{application_id}/device_groups/{device_group_id}`

Delete a Device Group. `operationId: destroy_device_group`. **Response 204:** No content.

---

## Functions

Manages Function Instances (instances of Edge Functions attached to an Application).

### `GET /v4/workspace/applications/{application_id}/functions`

List Function Instances. `operationId: list_application_functions`.

**Query params:** `fields`, `id`, `name`, `ordering`, `page`, `page_size`, `search`.

**Response 200:**

```json
{
  "count": 1,
  "total_pages": 1,
  "page": 1,
  "page_size": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5678,
      "name": "AB Test Cookie",
      "args": { "arg_01": "value_01" },
      "azion_form": {},
      "function": 12345,
      "active": true,
      "last_editor": "user@example.com",
      "last_modified": "2026-06-10T12:34:56Z",
      "created_at": "2026-06-09T10:00:00Z"
    }
  ]
}
```

### `POST /v4/workspace/applications/{application_id}/functions`

Create a Function Instance. `operationId: create_application_function`.

**Request body:**

```json
{
  "name": "AB Test Cookie",
  "args": { "domain": ".azion.com", "max_age": 180 },
  "function": 12345,
  "active": true
}
```

**Response 201:**

```json
{
  "state": "executed",
  "data": {
    "id": 5678,
    "name": "AB Test Cookie",
    "args": { "domain": ".azion.com", "max_age": 180 },
    "function": 12345,
    "active": true,
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T12:34:56Z",
    "created_at": "2026-06-10T12:34:56Z"
  }
}
```

### `GET /v4/workspace/applications/{application_id}/functions/{function_id}`

Retrieve a Function Instance. `operationId: retrieve_application_function`. **Response 200:** `FunctionInstanceResponse` envelope.

### `PUT /v4/workspace/applications/{application_id}/functions/{function_id}`

Replace a Function Instance. `operationId: update_application_function`. **Body:** `FunctionInstanceRequest`. **Response 200:** envelope.

### `PATCH /v4/workspace/applications/{application_id}/functions/{function_id}`

Partially update a Function Instance. `operationId: partial_update_application_function`.

```json
{ "active": false }
```

**Response 200:** envelope.

### `DELETE /v4/workspace/applications/{application_id}/functions/{function_id}`

Delete a Function Instance. `operationId: destroy_application_function`. **Response 204:** No content.

---

## Request Rules

Rules Engine for the request phase.

### `GET /v4/workspace/applications/{application_id}/request_rules`

List Request Phase Rules. `operationId: list_application_request_rules`.

**Query params:** `fields`, `id`, `name`, `ordering`, `page`, `page_size`, `search`.

**Response 200:**

```json
{
  "count": 1,
  "total_pages": 1,
  "page": 1,
  "page_size": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 7777,
      "name": "Redirect legacy paths",
      "active": true,
      "criteria": [
        [
          {
            "variable": "${uri}",
            "operator": "starts_with",
            "conditional": "if",
            "argument": "/legacy/"
          }
        ]
      ],
      "behaviors": [
        {
          "type": "redirect_to_301",
          "attributes": { "value": "https://example.com/new/" }
        }
      ],
      "description": "Redirect legacy URLs to new paths",
      "order": 1,
      "last_editor": "user@example.com",
      "last_modified": "2026-06-10T12:34:56Z",
      "created_at": "2026-06-09T10:00:00Z"
    }
  ]
}
```

### `POST /v4/workspace/applications/{application_id}/request_rules`

Create a Request Phase Rule. `operationId: create_application_request_rule`.

**Request body:**

```json
{
  "name": "Redirect legacy paths",
  "active": true,
  "criteria": [
    [
      {
        "variable": "${uri}",
        "operator": "starts_with",
        "conditional": "if",
        "argument": "/legacy/"
      }
    ]
  ],
  "behaviors": [
    {
      "type": "redirect_to_301",
      "attributes": { "value": "https://example.com/new/" }
    }
  ],
  "description": "Redirect legacy URLs"
}
```

Common behavior `type` values: `deny`, `no_content`, `deliver`, `finish_request_phase`, `forward_cookies`, `optimize_images`, `bypass_cache`, `enable_gzip`, `redirect_http_to_https`, `redirect_to_301`, `redirect_to_302`, `rewrite_request`, `add_request_header`, `filter_request_header`, `add_request_cookie`, `filter_request_cookie`, `set_origin`, `run_function`, `set_connector`, `set_cache_policy`, `capture_match_groups`.

**Response 201:** `RequestPhaseRuleResponse` envelope.

### `GET /v4/workspace/applications/{application_id}/request_rules/{request_rule_id}`

Retrieve a Request Phase Rule. `operationId: retrieve_application_request_rule`. **Response 200:** envelope.

### `PUT /v4/workspace/applications/{application_id}/request_rules/{request_rule_id}`

Replace a Request Phase Rule. `operationId: update_application_request_rule`. **Body:** `RequestPhaseRuleRequest`. **Response 200:** envelope.

### `PATCH /v4/workspace/applications/{application_id}/request_rules/{request_rule_id}`

Partially update a Request Phase Rule. `operationId: partial_update_application_request_rule`.

```json
{ "active": false }
```

**Response 200:** envelope.

### `DELETE /v4/workspace/applications/{application_id}/request_rules/{request_rule_id}`

Delete a Request Phase Rule. `operationId: destroy_application_request_rule`. **Response 204:** No content.

### `PUT /v4/workspace/applications/{application_id}/request_rules/order`

Reorder all Request Rules. `operationId: update_application_request_rules_order`.

**Request body:**

```json
{
  "order": [7777, 7778, 7779]
}
```

The array sequence defines the new execution order. **Response 200:** Paginated list of rules in the new order (`PaginatedRequestPhaseRuleList`).

---

## Response Rules

Rules Engine for the response phase. The structure mirrors Request Rules.

### `GET /v4/workspace/applications/{application_id}/response_rules`

List Response Phase Rules. `operationId: list_application_response_rules`. Same query params as request rules. **Response 200:** Paginated `ResponsePhaseRule` list.

```json
{
  "count": 1,
  "total_pages": 1,
  "page": 1,
  "page_size": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 8888,
      "name": "Add HSTS header",
      "active": true,
      "criteria": [
        [
          {
            "variable": "${status}",
            "operator": "is_equal",
            "conditional": "if",
            "argument": "200"
          }
        ]
      ],
      "behaviors": [
        {
          "type": "add_response_header",
          "attributes": { "value": "Strict-Transport-Security: max-age=31536000" }
        }
      ],
      "description": "Enforce HSTS",
      "order": 1,
      "last_editor": "user@example.com",
      "last_modified": "2026-06-10T12:34:56Z",
      "created_at": "2026-06-09T10:00:00Z"
    }
  ]
}
```

### `POST /v4/workspace/applications/{application_id}/response_rules`

Create a Response Phase Rule. `operationId: create_application_response_rule`.

**Request body:**

```json
{
  "name": "Add HSTS header",
  "active": true,
  "criteria": [
    [
      {
        "variable": "${status}",
        "operator": "is_equal",
        "conditional": "if",
        "argument": "200"
      }
    ]
  ],
  "behaviors": [
    {
      "type": "add_response_header",
      "attributes": { "value": "Strict-Transport-Security: max-age=31536000" }
    }
  ],
  "description": "Enforce HSTS"
}
```

**Response 201:** `ResponsePhaseRuleResponse` envelope.

### `GET /v4/workspace/applications/{application_id}/response_rules/{response_rule_id}`

Retrieve a Response Phase Rule. `operationId: retrieve_application_response_rule`. **Response 200:** envelope.

### `PUT /v4/workspace/applications/{application_id}/response_rules/{response_rule_id}`

Replace a Response Phase Rule. `operationId: update_application_response_rule`. **Body:** `ResponsePhaseRuleRequest`. **Response 200:** envelope.

### `PATCH /v4/workspace/applications/{application_id}/response_rules/{response_rule_id}`

Partially update a Response Phase Rule. `operationId: partial_update_application_response_rule`. **Response 200:** envelope.

### `DELETE /v4/workspace/applications/{application_id}/response_rules/{response_rule_id}`

Delete a Response Phase Rule. `operationId: destroy_application_response_rule`. **Response 204:** No content.

### `PUT /v4/workspace/applications/{application_id}/response_rules/order`

Reorder Response Rules. `operationId: update_application_response_rules_order`.

**Request body:**

```json
{
  "order": [8888, 8889, 8890]
}
```

**Response 200:** `PaginatedResponsePhaseRuleList` reflecting the new order.

---

## Versions (versionamento)

Application Versions allow staged changes through a clone, edit, build, ready/active lifecycle. Each version has a ULID `version_id`.

### `GET /v4/workspace/applications/{application_id}/versions`

List versions of an Application. `operationId: list_application_versions`.

**Query params:** `fields`.

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
      "id": "01HZX9P3K2A7B4C5D6E7F8G9H0",
      "state": "ready",
      "comment": "Initial version",
      "created_at": "2026-06-09T10:00:00Z",
      "last_modified": "2026-06-09T10:00:00Z"
    },
    {
      "id": "01HZX9Q4L3B8C5D6E7F8G9H0J1",
      "state": "draft",
      "comment": "Add HSTS header rule",
      "created_at": "2026-06-10T12:34:56Z",
      "last_modified": "2026-06-10T12:34:56Z"
    }
  ]
}
```

Possible `state` values include `draft`, `building`, `ready`, `active`, `archived`, `cancelled`, `failed`.

### `POST /v4/workspace/applications/{application_id}/versions`

Create a new version by cloning an existing one. `operationId: create_application_version`.

> **Contrato confirmado com o time de API (2026-06-12):** os campos da Application
> (`name`, `active`, `debug`, `modules`) vão no **nível raiz** do body, ao lado de
> `source_version` e `comment` — **não** há campo `override`. Omitir um campo mantém
> o valor clonado da `source_version`.

**Request body (`VersionCreateRequest`):**

Clone puro (sem alterações):

```json
{
  "source_version": "A6MIAEPU"
}
```

Clone com alterações (campos da Application no nível raiz):

```json
{
  "source_version": "A6MIAEPU",
  "comment": "versao com debug habilitado",
  "name": "app-nova-versao",
  "active": true,
  "debug": true,
  "modules": {
    "cache": { "enabled": true },
    "functions": { "enabled": true },
    "application_accelerator": { "enabled": false },
    "image_processor": { "enabled": false }
  }
}
```

If `source_version` is omitted, the latest `ready` version is cloned.

**Response 201:** Newly created version representation.

```json
{
  "state": "executed",
  "data": {
    "id": "01HZX9Q4L3B8C5D6E7F8G9H0J1",
    "state": "draft",
    "comment": "versao com debug habilitado",
    "created_at": "2026-06-10T12:34:56Z",
    "last_modified": "2026-06-10T12:34:56Z"
  }
}
```

### `GET /v4/workspace/applications/{application_id}/versions/{version_id}`

Retrieve a specific version. `operationId: retrieve_application_version`. **Response 200:** version object envelope.

### `PUT /v4/workspace/applications/{application_id}/versions/{version_id}`

Update a draft version (full replace). `operationId: update_application_version`. **Body:** `VersionCreateRequest`.

> Os campos da Application vão no **nível raiz** (mesmo contrato do `POST`). Como é
> um replace completo, envie o conjunto inteiro de campos editáveis do draft.

**Request body:**

```json
{
  "name": "app-atualizada",
  "active": true,
  "debug": false,
  "modules": {
    "cache": { "enabled": true },
    "functions": { "enabled": true },
    "application_accelerator": { "enabled": false },
    "image_processor": { "enabled": false }
  }
}
```

**Response 200:** envelope.

### `PATCH /v4/workspace/applications/{application_id}/versions/{version_id}`

Partially update a draft version. `operationId: partial_update_application_version`. **Body:** `PatchedVersionCreateRequest`.

> Qualquer subconjunto dos campos do nível raiz. Campos omitidos permanecem
> inalterados.

```json
{ "debug": true }
```

```json
{ "comment": "Updated rationale" }
```

**Response 200:** envelope.

### `DELETE /v4/workspace/applications/{application_id}/versions/{version_id}`

Delete a version. `operationId: delete_application_version`. **Response 202:** Accepted (asynchronous delete).

---

## Version Actions

Action endpoints respond `202 Accepted` because operations run asynchronously.

### `POST /v4/workspace/applications/{application_id}/versions/{version_id}/archive`

Archive a `ready` version (soft-delete). `operationId: archive_application_version`.

**Request body (`VersionArchiveRequest`):**

```json
{
  "comment": "Replaced by v2026-06-10"
}
```

**Response 202:** No body. The version transitions to `archived`.

### `POST /v4/workspace/applications/{application_id}/versions/{version_id}/build`

Trigger a build for a draft version. `operationId: build_application_version`.

**Request body (`VersionBuildRequest`):**

```json
{
  "trace_id": "trace-9f3b8a2c-1d4e-4a5b-9c8d-7e6f5a4b3c2d",
  "comment": "Promoting hotfix to ready"
}
```

**Response 202:** No body. The version transitions to `building`, then `ready` (or `failed`).

### `POST /v4/workspace/applications/{application_id}/versions/{version_id}/cancel`

Cancel a queued or in-progress build. `operationId: cancel_application_version_build`.

**Request body (`VersionBuildRequest`-shaped, optional fields):**

```json
{
  "comment": "Detected misconfiguration before promotion"
}
```

**Response 202:** No body. The version transitions to `cancelled`.

---

## Versioned Sub-resources

The same sub-resource operations available at the Application level (cache settings, device groups, functions, request rules, response rules) are also exposed under a specific version. They operate on the draft/ready version's snapshot rather than on the live Application.

Path pattern: `/v4/workspace/applications/{application_id}/versions/{version_id}/<sub_resource>`.

Request and response schemas are identical to the unversioned counterparts described above. Only the path parameter `version_id` (ULID string) is additionally required.

### Cache Settings (versioned)

- `GET    .../versions/{version_id}/cache_settings` - `list_cache_settings_2`
- `POST   .../versions/{version_id}/cache_settings` - `create_cache_setting_2`
- `GET    .../versions/{version_id}/cache_settings/{cache_setting_id}` - `retrieve_cache_setting_2`
- `PUT    .../versions/{version_id}/cache_settings/{cache_setting_id}` - `update_cache_setting_2`
- `PATCH  .../versions/{version_id}/cache_settings/{cache_setting_id}` - `partial_update_cache_setting_2`
- `DELETE .../versions/{version_id}/cache_settings/{cache_setting_id}` - `destroy_cache_setting_2`

Request/response bodies: `CacheSettingRequest` / `CacheSettingResponse` / `PaginatedCacheSettingList` (see [Cache Settings](#cache-settings)).

### Device Groups (versioned)

- `GET    .../versions/{version_id}/device_groups` - `list_device_groups_2`
- `POST   .../versions/{version_id}/device_groups` - `create_device_group_2`
- `GET    .../versions/{version_id}/device_groups/{device_group_id}` - `retrieve_device_group_2`
- `PUT    .../versions/{version_id}/device_groups/{device_group_id}` - `update_device_group_2`
- `PATCH  .../versions/{version_id}/device_groups/{device_group_id}` - `partial_update_device_group_2`
- `DELETE .../versions/{version_id}/device_groups/{device_group_id}` - `destroy_device_group_2`

Bodies: `DeviceGroupRequest` / `DeviceGroupResponse` / `PaginatedDeviceGroupList` (see [Device Groups](#device-groups)).

### Functions (versioned)

- `GET    .../versions/{version_id}/functions` - `list_application_functions_2`
- `POST   .../versions/{version_id}/functions` - `create_application_function_2`
- `GET    .../versions/{version_id}/functions/{function_id}` - `retrieve_application_function_2`
- `PUT    .../versions/{version_id}/functions/{function_id}` - `update_application_function_2`
- `PATCH  .../versions/{version_id}/functions/{function_id}` - `partial_update_application_function_2`
- `DELETE .../versions/{version_id}/functions/{function_id}` - `destroy_application_function_2`

Bodies: `FunctionInstanceRequest` / `FunctionInstanceResponse` / `PaginatedFunctionInstanceList` (see [Functions](#functions)).

### Request Rules (versioned)

- `GET    .../versions/{version_id}/request_rules` - `list_application_request_rules_2`
- `POST   .../versions/{version_id}/request_rules` - `create_application_request_rule_2`
- `GET    .../versions/{version_id}/request_rules/{request_rule_id}` - `retrieve_application_request_rule_2`
- `PUT    .../versions/{version_id}/request_rules/{request_rule_id}` - `update_application_request_rule_2`
- `PATCH  .../versions/{version_id}/request_rules/{request_rule_id}` - `partial_update_application_request_rule_2`
- `DELETE .../versions/{version_id}/request_rules/{request_rule_id}` - `destroy_application_request_rule_2`
- `PUT    .../versions/{version_id}/request_rules/order` - `update_application_request_rules_order_2`

Bodies: `RequestPhaseRuleRequest` / `RequestPhaseRuleResponse` / `PaginatedRequestPhaseRuleList` / `ApplicationRequestPhaseRuleEngineOrderRequest` (see [Request Rules](#request-rules)).

Order body example:

```json
{ "order": [7777, 7778, 7779] }
```

### Response Rules (versioned)

- `GET    .../versions/{version_id}/response_rules` - `list_application_response_rules_2`
- `POST   .../versions/{version_id}/response_rules` - `create_application_response_rule_2`
- `GET    .../versions/{version_id}/response_rules/{response_rule_id}` - `retrieve_application_response_rule_2`
- `PUT    .../versions/{version_id}/response_rules/{response_rule_id}` - `update_application_response_rule_2`
- `PATCH  .../versions/{version_id}/response_rules/{response_rule_id}` - `partial_update_application_response_rule_2`
- `DELETE .../versions/{version_id}/response_rules/{response_rule_id}` - `destroy_application_response_rule_2`
- `PUT    .../versions/{version_id}/response_rules/order` - `update_application_response_rules_order_2`

Bodies: `ResponsePhaseRuleRequest` / `ResponsePhaseRuleResponse` / `PaginatedResponsePhaseRuleList` / `ApplicationResponsePhaseRuleEngineOrderRequest` (see [Response Rules](#response-rules)).

Order body example:

```json
{ "order": [8888, 8889, 8890] }
```

---

## Schema reference quick map

| Schema | Used in |
|--------|---------|
| `Application` / `ApplicationRequest` / `ApplicationResponse` / `PaginatedApplicationList` / `PatchedApplicationRequest` | `/applications` |
| `CloneApplicationRequest` | `/applications/{id}/clone` |
| `CacheSetting` / `CacheSettingRequest` / `CacheSettingResponse` / `PaginatedCacheSettingList` / `PatchedCacheSettingRequest` | `cache_settings` |
| `DeviceGroup` / `DeviceGroupRequest` / `DeviceGroupResponse` / `PaginatedDeviceGroupList` / `PatchedDeviceGroupRequest` | `device_groups` |
| `FunctionInstance` / `FunctionInstanceRequest` / `FunctionInstanceResponse` / `PaginatedFunctionInstanceList` / `PatchedFunctionInstanceRequest` | `functions` |
| `RequestPhaseRule` / `RequestPhaseRuleRequest` / `RequestPhaseRuleResponse` / `PaginatedRequestPhaseRuleList` / `PatchedRequestPhaseRuleRequest` / `ApplicationRequestPhaseRuleEngineOrderRequest` | `request_rules` |
| `ResponsePhaseRule` / `ResponsePhaseRuleRequest` / `ResponsePhaseRuleResponse` / `PaginatedResponsePhaseRuleList` / `PatchedResponsePhaseRuleRequest` / `ApplicationResponsePhaseRuleEngineOrderRequest` | `response_rules` |
| `VersionCreateRequest` / `PatchedVersionCreateRequest` / `VersionArchiveRequest` / `VersionBuildRequest` / `VersionCancelRequest` | `versions` (and actions) |
| `JSONAPIErrorResponse` | All error responses |
