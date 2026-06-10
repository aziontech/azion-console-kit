# Edge Firewall API

> Endpoints para gerenciar Edge Firewalls, WAFs, sub-recursos (Functions, Request Rules, Exceptions) e versões. Extraído de `openapi-schema.yml`.

## Sumário

- [Convenções](#convencoes)
- [Firewalls](#firewalls)
- [Firewall - Functions](#firewall---functions)
- [Firewall - Request Rules](#firewall---request-rules)
- [Firewall - Versions](#firewall---versions)
- [Firewall - Versioned Sub-resources](#firewall---versioned-sub-resources)
- [WAFs](#wafs)
- [WAF - Exceptions](#waf---exceptions)
- [WAF - Versions](#waf---versions)
- [WAF - Versioned Sub-resources](#waf---versioned-sub-resources)

---

## Convencoes

- **Base URL:** `https://api.azion.com`
- **Autenticação:** `TokenAuth` (header `Authorization: Token <token>`) ou `BearerAuth` (header `Authorization: Bearer <jwt>`).
- **Content-Type:** `application/json` em todos os requests com body.
- **Paginação:** padrão `page` / `page_size`. Listas retornam `count`, `total_pages`, `links` (prev/next) e `results`.
- **Erros:** seguem JSON:API. Status codes comuns: 400 Validation, 401 Auth Failed, 403 Permission, 404 Not Found, 405 Method Not Allowed, 406 Not Acceptable, 429 Throttled.
- **Envelope de resposta de detalhe:** `{ "state": "executed", "data": { ... } }`.

```json
{
  "errors": [
    { "status": "400", "code": "10000", "title": "Validation Error", "detail": "Invalid data provided in the request." }
  ]
}
```

---

## Firewalls

### `GET /edge_firewall/api/firewalls`

**operationId:** `list_firewalls` - List all Firewalls owned by your account.

**Query params:** `active` (bool), `debug` (bool), `fields` (csv), `id` (int csv), `last_editor` (str), `last_modified__gte`, `last_modified__lte` (date-time), `name` (str), `ordering` (id|name|last_editor|last_modified|active|debug), `page`, `page_size`, `search`.

**Response 200:**
```json
{
  "count": 1,
  "total_pages": 1,
  "schema_version": 3,
  "links": { "previous": null, "next": null },
  "results": [
    {
      "id": 1234,
      "name": "production-firewall",
      "modules": {
        "ddos_protection": { "enabled": true },
        "functions": { "enabled": true },
        "network_protection": { "enabled": true },
        "waf": { "enabled": false }
      },
      "debug": false,
      "active": true,
      "last_editor": "user@example.com",
      "last_modified": "2026-06-01T12:34:56Z",
      "created_at": "2026-05-01T08:00:00Z",
      "product_version": "1.1",
      "is_versioned": true,
      "version_state": "ready",
      "version_id": "v_01HZ..."
    }
  ]
}
```

### `POST /edge_firewall/api/firewalls`

**operationId:** `create_firewall` - Create a new Firewall.

**Request body:**
```json
{
  "name": "production-firewall",
  "modules": {
    "functions": { "enabled": true },
    "network_protection": { "enabled": true },
    "waf": { "enabled": false }
  },
  "debug": false,
  "active": true
}
```

**Response 201:**
```json
{
  "state": "executed",
  "data": {
    "id": 1234,
    "name": "production-firewall",
    "modules": {
      "ddos_protection": { "enabled": true },
      "functions": { "enabled": true },
      "network_protection": { "enabled": true },
      "waf": { "enabled": false }
    },
    "debug": false,
    "active": true,
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T12:00:00Z",
    "created_at": "2026-06-10T12:00:00Z",
    "product_version": "1.1",
    "is_versioned": true,
    "version_state": "draft",
    "version_id": "v_01HZ..."
  }
}
```

### `GET /edge_firewall/api/firewalls/{firewall_id}`

**operationId:** `retrieve_firewall` - Retrieve details from a specific Firewall.

**Path params:** `firewall_id` (integer, required).
**Query params:** `fields`.

**Response 200:** envelope `FirewallResponse` (mesmo schema do POST 201 acima).

### `PUT /edge_firewall/api/firewalls/{firewall_id}`

**operationId:** `update_firewall` - Update a Firewall (full replace).

**Request body:** mesmo `FirewallRequest` do `POST`.

**Response 200:** envelope `FirewallResponse`.

### `PATCH /edge_firewall/api/firewalls/{firewall_id}`

**operationId:** `partial_update_firewall` - Partially update a Firewall.

**Request body (parcial):**
```json
{ "active": false, "debug": true }
```

**Response 200:** envelope `FirewallResponse`.

### `DELETE /edge_firewall/api/firewalls/{firewall_id}`

**operationId:** `delete_firewall` - Delete a Firewall.

**Response 200:**
```json
{ "state": "executed" }
```

### `POST /edge_firewall/api/firewalls/{firewall_id}/clone`

**operationId:** `clone_firewall` - Deep copy of an existing Firewall (Function Instances + Rules Engine).

**Request body:**
```json
{ "name": "production-firewall-copy" }
```

**Response 201:** envelope `FirewallResponse` com o novo recurso.

---

## Firewall - Functions

Function Instances vinculam uma Edge Function ao Firewall com argumentos específicos.

### `GET /edge_firewall/api/firewalls/{firewall_id}/functions`

**operationId:** `list_firewall_function`.

**Query params:** `fields`, `id`, `last_editor`, `last_modified__gte`, `last_modified__lte`, `name`, `ordering` (id|name|last_editor|last_modified), `page`, `page_size`, `search`.

**Response 200:**
```json
{
  "count": 1,
  "total_pages": 1,
  "schema_version": 3,
  "links": { "previous": null, "next": null },
  "results": [
    {
      "id": 9001,
      "name": "rate-limit-bot-detect",
      "args": { "threshold": 100, "window_seconds": 60 },
      "azion_form": {},
      "function": 4242,
      "active": true,
      "last_editor": "user@example.com",
      "last_modified": "2026-06-01T12:00:00Z",
      "created_at": "2026-05-01T08:00:00Z"
    }
  ]
}
```

### `POST /edge_firewall/api/firewalls/{firewall_id}/functions`

**operationId:** `create_firewall_function`.

**Request body:**
```json
{
  "name": "rate-limit-bot-detect",
  "args": { "threshold": 100, "window_seconds": 60 },
  "azion_form": {},
  "function": 4242,
  "active": true
}
```

**Response 201:**
```json
{
  "state": "executed",
  "data": {
    "id": 9001,
    "name": "rate-limit-bot-detect",
    "args": { "threshold": 100, "window_seconds": 60 },
    "azion_form": {},
    "function": 4242,
    "active": true,
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T12:00:00Z",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

### `GET /edge_firewall/api/firewalls/{firewall_id}/functions/{function_id}`

**operationId:** `retrieve_firewall_function`. Retorna envelope `FirewallFunctionInstanceResponse`.

### `PUT /edge_firewall/api/firewalls/{firewall_id}/functions/{function_id}`

**operationId:** `update_firewall_function`. Body igual ao `POST`. Retorna 200 com envelope.

### `PATCH /edge_firewall/api/firewalls/{firewall_id}/functions/{function_id}`

**operationId:** `partial_update_firewall_function`.

**Request body (parcial):**
```json
{ "active": false, "args": { "threshold": 200 } }
```

### `DELETE /edge_firewall/api/firewalls/{firewall_id}/functions/{function_id}`

**operationId:** `delete_firewall_function`.

**Response 200:**
```json
{ "state": "executed" }
```

---

## Firewall - Request Rules

Rules Engine: cada regra possui critérios e behaviors (deny, drop, run_function, set_custom_response, set_rate_limit, set_waf).

### `GET /edge_firewall/api/firewalls/{firewall_id}/request_rules`

**operationId:** `list_firewall_rules`.

**Query params:** `fields`, `id`, `name`, `description`, `last_editor`, `last_modified__gte`, `last_modified__lte`, `ordering`, `page`, `page_size`, `search`.

**Response 200:**
```json
{
  "count": 1,
  "total_pages": 1,
  "schema_version": 3,
  "links": { "previous": null, "next": null },
  "results": [
    {
      "id": 5001,
      "name": "block-bad-bots",
      "last_editor": "user@example.com",
      "last_modified": "2026-06-01T12:00:00Z",
      "created_at": "2026-05-01T08:00:00Z",
      "active": true,
      "criteria": [
        [
          {
            "variable": "${request_uri}",
            "operator": "matches",
            "conditional": "if",
            "input_value": "^/admin"
          }
        ]
      ],
      "behaviors": [
        { "type": "deny" }
      ],
      "description": "Block requests to /admin",
      "order": 0
    }
  ]
}
```

### `POST /edge_firewall/api/firewalls/{firewall_id}/request_rules`

**operationId:** `create_firewall_rule`.

**Request body:**
```json
{
  "name": "rate-limit-login",
  "active": true,
  "description": "Rate limit on /login",
  "criteria": [
    [
      {
        "variable": "${request_uri}",
        "operator": "starts_with",
        "conditional": "if",
        "input_value": "/login"
      }
    ]
  ],
  "behaviors": [
    {
      "type": "set_rate_limit",
      "attributes": {
        "type": "second",
        "limit_by": "client_ip",
        "average_rate_limit": 10,
        "maximum_burst_size": 20
      }
    }
  ]
}
```

Possíveis `behaviors[].type`: `deny`, `drop`, `run_function`, `set_custom_response`, `set_rate_limit`, `set_waf`.

**Response 201:** envelope `FirewallRuleResponse`.

### `GET /edge_firewall/api/firewalls/{firewall_id}/request_rules/{request_rule_id}`

**operationId:** `retrieve_firewall_rule`. Retorna envelope `FirewallRuleResponse`.

### `PUT /edge_firewall/api/firewalls/{firewall_id}/request_rules/{request_rule_id}`

**operationId:** `update_firewall_rule`. Body igual ao `POST`.

### `PATCH /edge_firewall/api/firewalls/{firewall_id}/request_rules/{request_rule_id}`

**operationId:** `partial_update_firewall_rule`.

**Request body (parcial):**
```json
{ "active": false }
```

### `DELETE /edge_firewall/api/firewalls/{firewall_id}/request_rules/{request_rule_id}`

**operationId:** `delete_firewall_rule`.

**Response 200:**
```json
{ "state": "executed" }
```

### `PUT /edge_firewall/api/firewalls/{firewall_id}/request_rules/order`

**operationId:** `reorder_firewall_rules` - Reordena as regras do Rules Engine para o Firewall.

**Request body:**
```json
{ "order": [5003, 5001, 5002] }
```

**Response 202:** Reordenação aceita. Os IDs informados definem a nova ordem (`order` 0..N-1).

---

## Firewall - Versions

Gerenciamento de versões (draft, building, ready, archived) de um Firewall.

### `GET /edge_firewall/api/firewalls/{firewall_id}/versions`

**operationId:** `list_firewall_versions` - Lista todas as versões de um Firewall.

**Query params:** `fields`.

**Response 200:**
```json
{
  "count": 2,
  "results": [
    { "version_id": "v_01HZAB...", "state": "ready", "comment": "initial release", "created_at": "2026-05-01T08:00:00Z" },
    { "version_id": "v_01HZAC...", "state": "draft", "comment": "wip changes", "created_at": "2026-06-05T10:00:00Z" }
  ]
}
```

### `POST /edge_firewall/api/firewalls/{firewall_id}/versions`

**operationId:** `create_firewall_version` - Cria uma nova versão clonando uma existente.

**Request body:**
```json
{
  "source_version": "v_01HZAB...",
  "comment": "tighten rate limits for /api",
  "override": {
    "name": "production-firewall-v2"
  }
}
```

Se `source_version` for omitido, clona a última versão `ready`.

**Response 201:** No response body (ou objeto contendo `version_id`).

### `GET /edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}`

**operationId:** `retrieve_firewall_version` - Detalhes de uma versão.

**Response 200:** estrutura do `Firewall` (snapshot da versão).

### `PUT /edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}`

**operationId:** `update_firewall_version` - Atualiza uma versão `draft`. Body igual ao `VersionCreateRequest`.

**Response 200.**

### `PATCH /edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}`

**operationId:** `partial_update_firewall_version` - Atualização parcial de versão `draft`.

**Request body:**
```json
{ "comment": "updated comment" }
```

### `DELETE /edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}`

**operationId:** `delete_firewall_version` - Remove uma versão.

**Response 202:** No response body.

### `POST /edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/archive`

**operationId:** `archive_firewall_version` - Arquiva (soft-delete) uma versão `ready`.

**Request body:**
```json
{ "comment": "deprecated by v3" }
```

**Response 202:** Pedido aceito; transição assíncrona para `archived`.

### `POST /edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/build`

**operationId:** `build_firewall_version` - Dispara o build de uma versão `draft`. Após sucesso, transita para `ready`.

**Request body:**
```json
{ "trace_id": "trace-9b1c0...", "comment": "build for prod release" }
```

**Response 202.**

### `POST /edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/cancel`

**operationId:** `cancel_firewall_version_build` - Cancela build em andamento ou enfileirado.

**Request body:**
```json
{ "comment": "wrong source version" }
```

**Response 202.**

---

## Firewall - Versioned Sub-resources

Estes endpoints expõem as mesmas operações de Functions e Request Rules, mas escopadas a uma versão específica (`{version_id}`). Útil para editar drafts ou inspecionar versões arquivadas/ready.

### Functions (versionado)

| Método | Path | operationId | Notas |
|---|---|---|---|
| GET | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/functions` | `list_firewall_function_2` | Lista paginada |
| POST | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/functions` | `create_firewall_function_2` | 201 |
| GET | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/functions/{function_id}` | `retrieve_firewall_function_2` | 200 |
| PUT | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/functions/{function_id}` | `update_firewall_function_2` | 200 |
| PATCH | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/functions/{function_id}` | `partial_update_firewall_function_2` | 200 |
| DELETE | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/functions/{function_id}` | `delete_firewall_function_2` | 200 `{ "state": "executed" }` |

Schemas idênticos a [Firewall - Functions](#firewall---functions).

Exemplo body POST:
```json
{
  "name": "rate-limit-bot-detect",
  "function": 4242,
  "args": { "threshold": 100 },
  "active": true
}
```

### Request Rules (versionado)

| Método | Path | operationId |
|---|---|---|
| GET | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/request_rules` | `list_firewall_rules_2` |
| POST | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/request_rules` | `create_firewall_rule_2` |
| GET | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/request_rules/{request_rule_id}` | `retrieve_firewall_rule_2` |
| PUT | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/request_rules/{request_rule_id}` | `update_firewall_rule_2` |
| PATCH | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/request_rules/{request_rule_id}` | `partial_update_firewall_rule_2` |
| DELETE | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/request_rules/{request_rule_id}` | `delete_firewall_rule_2` |
| PUT | `/edge_firewall/api/firewalls/{firewall_id}/versions/{version_id}/request_rules/order` | `reorder_firewall_rules_2` |

Schemas idênticos aos endpoints não versionados ([Firewall - Request Rules](#firewall---request-rules)).

Exemplo `PUT .../order`:
```json
{ "order": [5003, 5001, 5002] }
```

---

## WAFs

Web Application Firewalls compartilhados podem ser referenciados por Firewalls via behavior `set_waf`.

### `GET /edge_firewall/api/wafs`

**operationId:** `list_wafs`.

**Query params:** `active`, `fields`, `id`, `name`, `last_editor`, `last_modified__gte`, `last_modified__lte`, `ordering` (id|name|last_editor|last_modified|active), `page`, `page_size`, `search`.

**Response 200:**
```json
{
  "count": 1,
  "total_pages": 1,
  "schema_version": 3,
  "links": { "previous": null, "next": null },
  "results": [
    {
      "id": 7777,
      "active": true,
      "name": "default-waf",
      "last_editor": "user@example.com",
      "last_modified": "2026-06-01T12:00:00Z",
      "product_version": "1.1",
      "engine_settings": {
        "engine_version": "2021-Q3",
        "type": "score",
        "attributes": {
          "rulesets": [1],
          "thresholds": [
            { "threat": "sql_injection", "sensitivity": "medium" },
            { "threat": "cross_site_scripting", "sensitivity": "medium" }
          ]
        }
      },
      "is_versioned": true,
      "version_state": "ready",
      "version_id": "v_01HZW..."
    }
  ]
}
```

### `POST /edge_firewall/api/wafs`

**operationId:** `create_waf`.

**Request body:**
```json
{
  "active": true,
  "name": "default-waf",
  "product_version": "1.1",
  "engine_settings": {
    "engine_version": "2021-Q3",
    "type": "score",
    "attributes": {
      "rulesets": [1],
      "thresholds": [
        { "threat": "sql_injection", "sensitivity": "high" },
        { "threat": "cross_site_scripting", "sensitivity": "high" },
        { "threat": "directory_traversal", "sensitivity": "medium" },
        { "threat": "evading_tricks", "sensitivity": "medium" },
        { "threat": "file_upload", "sensitivity": "medium" },
        { "threat": "identified_attack", "sensitivity": "medium" },
        { "threat": "remote_file_inclusion", "sensitivity": "medium" },
        { "threat": "unwanted_access", "sensitivity": "medium" }
      ]
    }
  }
}
```

Valores válidos de `sensitivity`: `lowest`, `low`, `medium`, `high`, `highest`. Threats suportados (8): `cross_site_scripting`, `directory_traversal`, `evading_tricks`, `file_upload`, `identified_attack`, `remote_file_inclusion`, `sql_injection`, `unwanted_access`.

**Response 201:** envelope `WAFResponse`.

### `GET /edge_firewall/api/wafs/{waf_id}`

**operationId:** `retrieve_waf`. Retorna envelope `WAFResponse`.

### `PUT /edge_firewall/api/wafs/{waf_id}`

**operationId:** `update_waf`. Body igual ao `POST`. Retorna 200 com envelope.

### `PATCH /edge_firewall/api/wafs/{waf_id}`

**operationId:** `partial_update_waf`.

**Request body (parcial):**
```json
{ "active": false }
```

### `DELETE /edge_firewall/api/wafs/{waf_id}`

**operationId:** `delete_waf`.

**Response 200:**
```json
{ "state": "executed" }
```

### `POST /edge_firewall/api/wafs/{waf_id}/clone`

**operationId:** `clone_waf` - Cópia profunda incluindo exceções e settings.

**Request body:**
```json
{ "name": "default-waf-staging" }
```

**Response 201:** envelope `WAFResponse` do novo recurso.

---

## WAF - Exceptions

Exceções (WAF Rules) reduzem falsos positivos liberando regras específicas em paths/condições.

### `GET /edge_firewall/api/wafs/{waf_id}/exceptions`

**operationId:** `list_waf_exceptions`.

**Query params:** `created_at__gte`, `created_at__lte`, `description`, `fields`, `id`, `last_editor`, `last_modified__gte`, `last_modified__lte`, `ordering` (id|description|path|last_editor|last_modified|created_at), `page`, `page_size`, `path`, `search`.

**Response 200:**
```json
{
  "count": 1,
  "total_pages": 1,
  "schema_version": 3,
  "links": { "previous": null, "next": null },
  "results": [
    {
      "id": 8801,
      "rule_id": 1013,
      "name": "allow-apostrophe-on-login",
      "description": "Apostrophes are allowed inside login body",
      "path": "/api/login",
      "conditions": [
        { "match": "specific_body_form_field_name", "name": "username" }
      ],
      "operator": "contains",
      "active": true,
      "last_editor": "user@example.com",
      "last_modified": "2026-06-01T12:00:00Z",
      "created_at": "2026-05-15T09:00:00Z"
    }
  ]
}
```

### `POST /edge_firewall/api/wafs/{waf_id}/exceptions`

**operationId:** `create_waf_exception`.

**Request body:**
```json
{
  "rule_id": 1013,
  "name": "allow-apostrophe-on-login",
  "description": "Apostrophes are allowed inside login body",
  "path": "/api/login",
  "conditions": [
    { "match": "specific_body_form_field_name", "name": "username" },
    { "match": "any_query_string_value" }
  ],
  "operator": "contains",
  "active": true
}
```

`conditions[].match` aceita:
- Generic: `any_http_header_name`, `any_http_header_value`, `any_query_string_name`, `any_query_string_value`, `any_url`, `body_form_field_name`, `body_form_field_value`, `file_extension`, `raw_body`.
- Specific (requer `name`): `specific_body_form_field_name`, `specific_http_header_name`, `specific_query_string_name`.
- Specific (requer `value`): `specific_body_form_field_value`, `specific_http_header_value`, `specific_query_string_value`.

`operator` aceita valores como `contains`, `does_not_contain`, `matches`, `does_not_match`, `is_equal`, `is_not_equal`, `starts_with`, `does_not_start_with`, `exists`, `does_not_exist`.

**Response 201:** envelope `WAFRuleResponse`.

### `GET /edge_firewall/api/wafs/{waf_id}/exceptions/{exception_id}`

**operationId:** `retrieve_waf_exception`. Retorna envelope `WAFRuleResponse`.

### `PUT /edge_firewall/api/wafs/{waf_id}/exceptions/{exception_id}`

**operationId:** `update_waf_exception`. Body igual ao `POST`.

### `PATCH /edge_firewall/api/wafs/{waf_id}/exceptions/{exception_id}`

**operationId:** `partial_update_waf_exception`.

**Request body (parcial):**
```json
{ "active": false, "description": "deprecated" }
```

### `DELETE /edge_firewall/api/wafs/{waf_id}/exceptions/{exception_id}`

**operationId:** `delete_waf_exception`.

**Response 200:**
```json
{ "state": "executed" }
```

---

## WAF - Versions

Gerenciamento de versões (draft, building, ready, archived) de um WAF. Mesma máquina de estados do Firewall.

### `GET /edge_firewall/api/wafs/{waf_id}/versions`

**operationId:** `list_waf_versions`.

**Query params:** `fields`.

**Response 200:**
```json
{
  "count": 1,
  "results": [
    { "version_id": "v_01HZW...", "state": "ready", "comment": "initial", "created_at": "2026-05-01T08:00:00Z" }
  ]
}
```

### `POST /edge_firewall/api/wafs/{waf_id}/versions`

**operationId:** `create_waf_version` - Cria nova versão por clone (`VersionCreateRequest`).

**Request body:**
```json
{
  "source_version": "v_01HZW...",
  "comment": "raise XSS sensitivity to high",
  "override": { "name": "default-waf-v2" }
}
```

**Response 201:** No response body.

### `GET /edge_firewall/api/wafs/{waf_id}/versions/{version_id}`

**operationId:** `retrieve_waf_version`. Retorna snapshot da versão (estrutura do `WAF`).

### `PUT /edge_firewall/api/wafs/{waf_id}/versions/{version_id}`

**operationId:** `update_waf_version` - Atualiza draft (body `VersionCreateRequest`).

### `PATCH /edge_firewall/api/wafs/{waf_id}/versions/{version_id}`

**operationId:** `partial_update_waf_version`.

**Request body:**
```json
{ "comment": "minor tweak" }
```

### `DELETE /edge_firewall/api/wafs/{waf_id}/versions/{version_id}`

**operationId:** `delete_waf_version`.

**Response 202:** No response body.

### `POST /edge_firewall/api/wafs/{waf_id}/versions/{version_id}/archive`

**operationId:** `archive_waf_version` - Arquiva versão `ready`.

**Request body:**
```json
{ "comment": "superseded by v3" }
```

**Response 202.**

### `POST /edge_firewall/api/wafs/{waf_id}/versions/{version_id}/build`

**operationId:** `build_waf_version` - Build de versão `draft`.

**Request body:**
```json
{ "trace_id": "trace-1234", "comment": "promote to ready" }
```

**Response 202.**

### `POST /edge_firewall/api/wafs/{waf_id}/versions/{version_id}/cancel`

**operationId:** `cancel_waf_version_build` - Cancela build em andamento ou enfileirado.

**Request body:**
```json
{ "comment": "wrong settings" }
```

**Response 202.**

---

## WAF - Versioned Sub-resources

Exceptions também são acessíveis por versão. Schemas idênticos a [WAF - Exceptions](#waf---exceptions).

| Método | Path | operationId |
|---|---|---|
| GET | `/edge_firewall/api/wafs/{waf_id}/versions/{version_id}/exceptions` | `list_waf_exceptions_2` |
| POST | `/edge_firewall/api/wafs/{waf_id}/versions/{version_id}/exceptions` | `create_waf_exception_2` |
| GET | `/edge_firewall/api/wafs/{waf_id}/versions/{version_id}/exceptions/{exception_id}` | `retrieve_waf_exception_2` |
| PUT | `/edge_firewall/api/wafs/{waf_id}/versions/{version_id}/exceptions/{exception_id}` | `update_waf_exception_2` |
| PATCH | `/edge_firewall/api/wafs/{waf_id}/versions/{version_id}/exceptions/{exception_id}` | `partial_update_waf_exception_2` |
| DELETE | `/edge_firewall/api/wafs/{waf_id}/versions/{version_id}/exceptions/{exception_id}` | `delete_waf_exception_2` |

Exemplo POST body:
```json
{
  "rule_id": 1013,
  "name": "allow-apostrophe-on-login",
  "path": "/api/login",
  "conditions": [
    { "match": "specific_http_header_name", "name": "X-Internal-Trace" }
  ],
  "operator": "contains",
  "active": true
}
```

Response 200/201 envelope:
```json
{
  "state": "executed",
  "data": {
    "id": 8802,
    "rule_id": 1013,
    "name": "allow-apostrophe-on-login",
    "description": "",
    "path": "/api/login",
    "conditions": [
      { "match": "specific_http_header_name", "name": "X-Internal-Trace" }
    ],
    "operator": "contains",
    "active": true,
    "last_editor": "user@example.com",
    "last_modified": "2026-06-10T12:00:00Z",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

---

## Referências de schemas

Schemas principais (em `components.schemas` de `openapi-schema.yml`):

- `Firewall`, `FirewallRequest`, `FirewallResponse`, `PatchedFirewallRequest`, `PaginatedFirewallList`
- `FirewallModules`, `FirewallModule`
- `FirewallFunctionInstance`, `FirewallFunctionInstanceRequest`, `FirewallFunctionInstanceResponse`, `PaginatedFirewallFunctionInstanceList`, `PatchedFirewallFunctionInstanceRequest`
- `FirewallRule`, `FirewallRuleRequest`, `FirewallRuleResponse`, `PaginatedFirewallRuleList`, `PatchedFirewallRuleRequest`, `FirewallRuleEngineOrderRequest`
- `FirewallBehavior` (oneOf: `FirewallBehaviorNoArgs`, `FirewallBehaviorArgs`, `FirewallBehaviorObjectArgs`), com atributos: `FirewallBehaviorRunFunctionAttributes`, `FirewallBehaviorSetCustomResponseAttributes`, `FirewallBehaviorSetRateLimitAttributes`, `FirewallBehaviorSetWafAttributes`
- `CloneFirewallRequest`, `CloneWAFRequest`
- `WAF`, `WAFRequest`, `WAFResponse`, `PatchedWAFRequest`, `PaginatedWAFList`
- `WAFEngineSettingsField`, `WAFEngineSettingsAttributesField`
- `WAFRule`, `WAFRuleRequest`, `WAFRuleResponse`, `PaginatedWAFRuleList`, `PatchedWAFRuleRequest`
- `WAFExceptionPolymorphicCondition` (discriminator `match`), `WAFExceptionGenericCondition`, `WAFExceptionSpecificConditionOnName`, `WAFExceptionSpecificConditionOnValue`
- `VersionCreateRequest`, `PatchedVersionCreateRequest`, `VersionBuildRequest`, `VersionCancelRequest`, `VersionArchiveRequest`
- `DeleteResponse`, `JSONAPIErrorResponse`
