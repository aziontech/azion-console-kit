# Network Lists API

> Endpoints para gerenciar Network Lists e suas versões. Extraído de `openapi-schema.yml`.

## Sumário

- [Network Lists](#network-lists)
  - [GET /workspace/api/network_lists](#get-workspaceapinetwork_lists)
  - [POST /workspace/api/network_lists](#post-workspaceapinetwork_lists)
  - [GET /workspace/api/network_lists/{network_list_id}](#get-workspaceapinetwork_listsnetwork_list_id)
  - [PUT /workspace/api/network_lists/{network_list_id}](#put-workspaceapinetwork_listsnetwork_list_id)
  - [PATCH /workspace/api/network_lists/{network_list_id}](#patch-workspaceapinetwork_listsnetwork_list_id)
  - [DELETE /workspace/api/network_lists/{network_list_id}](#delete-workspaceapinetwork_listsnetwork_list_id)
- [Versions (versionamento)](#versions-versionamento)
  - [GET /workspace/api/network_lists/{network_list_id}/versions](#get-workspaceapinetwork_listsnetwork_list_idversions)
  - [POST /workspace/api/network_lists/{network_list_id}/versions](#post-workspaceapinetwork_listsnetwork_list_idversions)
  - [GET /workspace/api/network_lists/{network_list_id}/versions/{version_id}](#get-workspaceapinetwork_listsnetwork_list_idversionsversion_id)
  - [PUT /workspace/api/network_lists/{network_list_id}/versions/{version_id}](#put-workspaceapinetwork_listsnetwork_list_idversionsversion_id)
  - [PATCH /workspace/api/network_lists/{network_list_id}/versions/{version_id}](#patch-workspaceapinetwork_listsnetwork_list_idversionsversion_id)
  - [DELETE /workspace/api/network_lists/{network_list_id}/versions/{version_id}](#delete-workspaceapinetwork_listsnetwork_list_idversionsversion_id)
- [Version Actions](#version-actions)
  - [POST .../archive](#post-workspaceapinetwork_listsnetwork_list_idversionsversion_idarchive)
  - [POST .../build](#post-workspaceapinetwork_listsnetwork_list_idversionsversion_idbuild)
  - [POST .../cancel](#post-workspaceapinetwork_listsnetwork_list_idversionsversion_idcancel)

---

## Visão Geral

Uma **Network List** é um agrupamento de itens (endereços IP/CIDR, códigos de país ou ASNs) que pode ser referenciado por outros recursos da Edge (ex.: WAF, Rules Engine) para permitir, bloquear ou diferenciar tráfego.

### Tipo da lista (`type` / `list_type`)

Enum `NetworkListTypeEnum`:

| Valor | Descrição | Exemplo de item |
|-------|-----------|-----------------|
| `ip_cidr` | Endereços IPv4/IPv6, com ou sem CIDR | `192.168.1.0/24`, `2001:db8::/32` |
| `countries` | Código de país ISO 3166-1 alpha-2 (duas letras maiúsculas) | `BR`, `US`, `JP` |
| `asn` | Autonomous System Number (apenas dígitos) | `13335`, `15169` |

### Formato dos itens (`items` / `items_values`)

- IPv4 simples: `192.168.0.1`
- IPv4 com CIDR: `192.168.0.0/24`
- IPv6 simples: `2001:db8:3333:4444:5555:6666:7777:8888`
- IPv6 com CIDR: `2001:db8::/32`
- IP com expiração: `192.168.0.1 --LT2025-05-29T12:25:23Z` (formato `--LT` + ISO8601 UTC)
- País: `BR`, `US`, `DE`, `JP`
- ASN: `13335`, `15169`

Limites:
- `items`: 1..20.000 elementos
- Cada item: 1..250 caracteres
- `name`: 1..250 caracteres

### Autenticação

Todos os endpoints suportam `TokenAuth` ou `BearerAuth`:

```http
Authorization: Token <api-token>
```

### Respostas de erro padrão

Todos os endpoints retornam o envelope JSON:API em caso de erro. Códigos típicos:

| Status | Code | Significado |
|--------|------|-------------|
| 400 | 10000 | Validation Error |
| 401 | 10001 | Authentication Failed |
| 403 | 10003 | Permission Denied |
| 404 | 10004 | Not Found |
| 405 | 10007 | Method Not Allowed |
| 406 | 10005 | Not Acceptable |
| 429 | 10010 | Throttled |

Exemplo de payload de erro:

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

---

## Network Lists

### `GET /workspace/api/network_lists`

- **operationId:** `list_network_lists`
- **Summary:** List Network Lists
- **Descrição:** Lista todas as Network Lists pertencentes à sua conta.

**Query parameters:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista de campos separados por vírgula a incluir na resposta. |
| `id` | integer | Filtra por id (aceita CSV). |
| `last_editor` | string | Filtra por último editor (case-insensitive, partial match). |
| `last_modified__gte` | date-time | Filtra por data de modificação >=. |
| `last_modified__lte` | date-time | Filtra por data de modificação <=. |
| `list_type__in` | string | Filtra por tipo de lista (CSV). Valores: `ip_cidr`, `countries`, `asn`. |
| `name` | string | Filtra por nome (case-insensitive, partial match). |
| `ordering` | string | Ordenação. Campos válidos: `id`, `name`, `last_editor`, `last_modified`, `list_type`. |
| `page` | integer | Número da página. |
| `page_size` | integer | Itens por página. |
| `search` | string | Termo de busca em `last_editor`, `list_type`, `name`. |

**Resposta `200 OK`** (`PaginatedNetworkListSummaryList`):

```json
{
  "count": 2,
  "total_pages": 1,
  "links": {
    "previous": null,
    "next": null
  },
  "results": [
    {
      "id": 1842,
      "name": "Blocked IPs - Office",
      "type": "ip_cidr",
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-06-09T18:32:11Z",
      "created_at": "2026-05-12T10:00:00Z",
      "active": true,
      "is_versioned": true,
      "version_state": "ready",
      "version_id": "01HZX9F7K3M8YQ4N2P6R5VT8AB"
    },
    {
      "id": 1843,
      "name": "Allowed Countries",
      "type": "countries",
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-06-08T14:20:00Z",
      "created_at": "2026-04-01T09:00:00Z",
      "active": true,
      "is_versioned": false,
      "version_state": null,
      "version_id": null
    }
  ]
}
```

---

### `POST /workspace/api/network_lists`

- **operationId:** `create_network_list`
- **Summary:** Create a Network List
- **Descrição:** Cria uma nova Network List na sua conta.

**Request body** (`NetworkListRequest`):

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `name` | string | sim | 1..250 chars. |
| `type` | enum | sim | `ip_cidr`, `countries`, `asn`. |
| `items` | string[] | sim | 1..20000 elementos, cada um 1..250 chars. |
| `active` | boolean | não | Default `true`. |

**Exemplo de request (IP CIDR):**

```json
{
  "name": "Blocked IPs - Office",
  "type": "ip_cidr",
  "active": true,
  "items": [
    "192.168.1.0/24",
    "10.0.0.0/8",
    "2001:db8::/32",
    "203.0.113.42 --LT2026-12-31T23:59:59Z"
  ]
}
```

**Exemplo de request (Countries):**

```json
{
  "name": "Allowed Countries",
  "type": "countries",
  "active": true,
  "items": ["BR", "US", "DE", "JP"]
}
```

**Exemplo de request (ASN):**

```json
{
  "name": "Cloudflare ASNs",
  "type": "asn",
  "active": true,
  "items": ["13335", "15169", "16509"]
}
```

**Resposta `201 Created`** (`NetworkListResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 1844,
    "name": "Blocked IPs - Office",
    "type": "ip_cidr",
    "active": true,
    "items": [
      "192.168.1.0/24",
      "10.0.0.0/8",
      "2001:db8::/32",
      "203.0.113.42 --LT2026-12-31T23:59:59Z"
    ],
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T12:00:00Z",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

---

### `GET /workspace/api/network_lists/{network_list_id}`

- **operationId:** `retrieve_network_list`
- **Summary:** Retrieve details of a Network List
- **Descrição:** Recupera os detalhes de uma Network List específica.

**Path parameters:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `network_list_id` | integer | ID único da network list. |

**Query parameters:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Lista de campos a incluir (CSV). |
| `ipv4` | boolean | Filtra apenas itens IPv4 (somente para `ip_cidr`). |
| `ipv6` | boolean | Filtra apenas itens IPv6 (somente para `ip_cidr`). |

**Resposta `200 OK`** (`NetworkListResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 1842,
    "name": "Blocked IPs - Office",
    "type": "ip_cidr",
    "active": true,
    "items": [
      "192.168.1.0/24",
      "10.0.0.0/8"
    ],
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-09T18:32:11Z",
    "created_at": "2026-05-12T10:00:00Z"
  }
}
```

---

### `PUT /workspace/api/network_lists/{network_list_id}`

- **operationId:** `update_network_list`
- **Summary:** Update a Network List
- **Descrição:** Atualiza uma Network List existente. Substitui completamente os dados pelos novos fornecidos.

**Path parameters:** `network_list_id` (integer).

**Request body** (`NetworkListRequest`): todos os campos obrigatórios (`name`, `type`, `items`).

**Exemplo de request:**

```json
{
  "name": "Blocked IPs - Office (updated)",
  "type": "ip_cidr",
  "active": true,
  "items": [
    "192.168.1.0/24",
    "10.0.0.0/8",
    "172.16.0.0/12"
  ]
}
```

**Resposta `200 OK`** (`NetworkListResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 1842,
    "name": "Blocked IPs - Office (updated)",
    "type": "ip_cidr",
    "active": true,
    "items": [
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12"
    ],
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T12:15:00Z",
    "created_at": "2026-05-12T10:00:00Z"
  }
}
```

---

### `PATCH /workspace/api/network_lists/{network_list_id}`

- **operationId:** `partial_update_network_list`
- **Summary:** Partially update a Network List
- **Descrição:** Atualiza um ou mais campos sem afetar os demais.

**Path parameters:** `network_list_id` (integer).

**Request body** (`PatchedNetworkListRequest`): todos os campos opcionais.

**Exemplo de request (apenas renomear e desativar):**

```json
{
  "name": "Blocked IPs - Office (archived)",
  "active": false
}
```

**Resposta `200 OK`** (`NetworkListResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 1842,
    "name": "Blocked IPs - Office (archived)",
    "type": "ip_cidr",
    "active": false,
    "items": [
      "192.168.1.0/24",
      "10.0.0.0/8"
    ],
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T12:30:00Z",
    "created_at": "2026-05-12T10:00:00Z"
  }
}
```

---

### `DELETE /workspace/api/network_lists/{network_list_id}`

- **operationId:** `delete_network_list`
- **Summary:** Delete a Network List
- **Descrição:** Remove uma Network List da sua conta.

**Path parameters:** `network_list_id` (integer).

**Resposta `200 OK`** (`DeleteResponse`):

```json
{
  "state": "executed",
  "data": null
}
```

---

## Versions (versionamento)

Versionamento de Network Lists permite criar revisões imutáveis ("snapshots") da lista, cada uma com seu próprio ciclo de vida (`draft` → `building` → `ready` → `archived`). Apenas versões `draft` podem ser editadas; para promover uma versão é necessário um **build**.

### Estados de versão

| Estado | Significado |
|--------|-------------|
| `draft` | Editável; pode receber PUT/PATCH e build. |
| `queued` | Build enfileirado, ainda não iniciado. Cancelável. |
| `building` | Build em execução. Cancelável. |
| `ready` | Build concluído com sucesso. Pode ser arquivado. |
| `failed` | Build falhou. |
| `archived` | Soft-deleted. |

---

### `GET /workspace/api/network_lists/{network_list_id}/versions`

- **operationId:** `list_network_list_versions`
- **Summary:** List Network List versions
- **Descrição:** Lista todas as versões de uma Network List específica.

**Path parameters:** `network_list_id` (integer).

**Query parameters:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `fields` | string | Campos a incluir (CSV). |

**Resposta `200 OK`** (exemplo representativo):

```json
{
  "count": 3,
  "results": [
    {
      "version_id": "01HZX9F7K3M8YQ4N2P6R5VT8AB",
      "network_list_id": 1842,
      "state": "ready",
      "comment": "Initial production version",
      "source_version": null,
      "created_at": "2026-05-12T10:00:00Z",
      "last_modified": "2026-05-12T10:05:00Z",
      "last_editor": "guilherme.santana@azion.com"
    },
    {
      "version_id": "01J2A4B6C8D0E2F4G6H8J0K2LM",
      "network_list_id": 1842,
      "state": "draft",
      "comment": "Add new office ranges",
      "source_version": "01HZX9F7K3M8YQ4N2P6R5VT8AB",
      "created_at": "2026-06-09T18:30:00Z",
      "last_modified": "2026-06-09T18:32:11Z",
      "last_editor": "guilherme.santana@azion.com"
    },
    {
      "version_id": "01HXC0D2E4F6G8H0J2K4L6M8NP",
      "network_list_id": 1842,
      "state": "archived",
      "comment": "Deprecated ranges",
      "source_version": null,
      "created_at": "2026-04-01T09:00:00Z",
      "last_modified": "2026-05-10T11:00:00Z",
      "last_editor": "guilherme.santana@azion.com"
    }
  ]
}
```

---

### `POST /workspace/api/network_lists/{network_list_id}/versions`

- **operationId:** `create_network_list_version`
- **Summary:** Create a new Network List version
- **Descrição:** Cria uma nova versão por clonagem. Se `source_version` for omitido, clona a última versão `ready`.

**Path parameters:** `network_list_id` (integer).

**Request body** (`VersionCreateRequest`):

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `source_version` | string \| null | não | ID da versão a clonar. Se omitido, usa a última `ready`. |
| `comment` | string | não | Descrição da nova versão. |
| `override` | object | não | Sobrescritas de campos a aplicar na versão clonada antes do save. |

**Exemplo de request:**

```json
{
  "source_version": "01HZX9F7K3M8YQ4N2P6R5VT8AB",
  "comment": "Add new office ranges",
  "override": {
    "items": [
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
      "198.51.100.0/24"
    ]
  }
}
```

**Resposta `201 Created`** (exemplo representativo):

```json
{
  "state": "executed",
  "data": {
    "version_id": "01J2A4B6C8D0E2F4G6H8J0K2LM",
    "network_list_id": 1842,
    "state": "draft",
    "comment": "Add new office ranges",
    "source_version": "01HZX9F7K3M8YQ4N2P6R5VT8AB",
    "items": [
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
      "198.51.100.0/24"
    ],
    "created_at": "2026-06-10T12:45:00Z",
    "last_modified": "2026-06-10T12:45:00Z",
    "last_editor": "guilherme.santana@azion.com"
  }
}
```

---

### `GET /workspace/api/network_lists/{network_list_id}/versions/{version_id}`

- **operationId:** `retrieve_network_list_version`
- **Summary:** Retrieve a Network List version
- **Descrição:** Recupera detalhes de uma versão específica.

**Path parameters:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `network_list_id` | integer | ID da Network List. |
| `version_id` | string | Identificador da versão (ULID). |

**Query parameters:** `fields` (CSV).

**Resposta `200 OK`** (exemplo representativo):

```json
{
  "state": "executed",
  "data": {
    "version_id": "01J2A4B6C8D0E2F4G6H8J0K2LM",
    "network_list_id": 1842,
    "state": "draft",
    "comment": "Add new office ranges",
    "source_version": "01HZX9F7K3M8YQ4N2P6R5VT8AB",
    "items": [
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12"
    ],
    "created_at": "2026-06-10T12:45:00Z",
    "last_modified": "2026-06-10T12:45:00Z",
    "last_editor": "guilherme.santana@azion.com"
  }
}
```

---

### `PUT /workspace/api/network_lists/{network_list_id}/versions/{version_id}`

- **operationId:** `update_network_list_version`
- **Summary:** Update a Network List version
- **Descrição:** Atualiza uma versão em estado `draft`. Não funciona para versões já promovidas (`ready`/`archived`).

**Path parameters:** `network_list_id`, `version_id`.

**Request body** (`VersionCreateRequest`):

```json
{
  "comment": "Updated draft with corrected ranges",
  "override": {
    "items": [
      "192.168.1.0/24",
      "172.16.0.0/12"
    ]
  }
}
```

**Resposta `200 OK`** (exemplo representativo):

```json
{
  "state": "executed",
  "data": {
    "version_id": "01J2A4B6C8D0E2F4G6H8J0K2LM",
    "network_list_id": 1842,
    "state": "draft",
    "comment": "Updated draft with corrected ranges",
    "items": [
      "192.168.1.0/24",
      "172.16.0.0/12"
    ],
    "last_modified": "2026-06-10T13:00:00Z",
    "last_editor": "guilherme.santana@azion.com"
  }
}
```

---

### `PATCH /workspace/api/network_lists/{network_list_id}/versions/{version_id}`

- **operationId:** `partial_update_network_list_version`
- **Summary:** Partially update a Network List version
- **Descrição:** Atualiza parcialmente uma versão `draft`.

**Path parameters:** `network_list_id`, `version_id`.

**Request body** (`PatchedVersionCreateRequest`): todos os campos opcionais.

```json
{
  "comment": "Adjusted comment only"
}
```

**Resposta `200 OK`** (exemplo representativo):

```json
{
  "state": "executed",
  "data": {
    "version_id": "01J2A4B6C8D0E2F4G6H8J0K2LM",
    "network_list_id": 1842,
    "state": "draft",
    "comment": "Adjusted comment only",
    "last_modified": "2026-06-10T13:05:00Z",
    "last_editor": "guilherme.santana@azion.com"
  }
}
```

---

### `DELETE /workspace/api/network_lists/{network_list_id}/versions/{version_id}`

- **operationId:** `delete_network_list_version`
- **Summary:** Delete a Network List version
- **Descrição:** Remove uma versão específica. A operação é assíncrona.

**Path parameters:** `network_list_id`, `version_id`.

**Resposta `202 Accepted`:** sem corpo. A deleção é processada de forma assíncrona.

---

## Version Actions

Ações sobre o ciclo de vida da versão. Todas retornam **`202 Accepted`** sem corpo, pois o efeito é assíncrono (worker/queue).

### `POST /workspace/api/network_lists/{network_list_id}/versions/{version_id}/archive`

- **operationId:** `archive_network_list_version`
- **Summary:** Archive a Network List version
- **Descrição:** Arquiva (soft-delete) uma versão em estado `ready`. Versões arquivadas não podem mais ser referenciadas como atuais.

**Path parameters:** `network_list_id`, `version_id`.

**Request body** (`VersionArchiveRequest`):

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `comment` | string | não | Comentário do arquivamento. |

```json
{
  "comment": "Replaced by version 01J2A4B6C8D0E2F4G6H8J0K2LM"
}
```

**Resposta:** `202 Accepted` (sem body).

**Efeito:** estado da versão transita para `archived`.

---

### `POST /workspace/api/network_lists/{network_list_id}/versions/{version_id}/build`

- **operationId:** `build_network_list_version`
- **Summary:** Build a Network List version
- **Descrição:** Dispara o build de uma versão `draft`. O build promove a versão para `ready` ao final (ou `failed` em caso de erro).

**Path parameters:** `network_list_id`, `version_id`.

**Request body** (`VersionBuildRequest`):

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `trace_id` | string | não | Trace ID para observabilidade. |
| `comment` | string | não | Comentário do build. |

```json
{
  "trace_id": "trace-9f3c2e1a-b4d5-4f6e-9a8c-1b2c3d4e5f60",
  "comment": "Promote new office ranges to production"
}
```

**Resposta:** `202 Accepted` (sem body).

**Efeito:** transição `draft` -> `queued` -> `building` -> `ready` (ou `failed`).

---

### `POST /workspace/api/network_lists/{network_list_id}/versions/{version_id}/cancel`

- **operationId:** `cancel_network_list_version_build`
- **Summary:** Cancel a Network List version build
- **Descrição:** Cancela um build em estado `queued` ou `building`. Não tem efeito em versões já `ready`/`failed`/`archived`.

**Path parameters:** `network_list_id`, `version_id`.

**Request body** (`VersionCancelRequest`):

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `comment` | string | não | Comentário do cancelamento. |

```json
{
  "comment": "Wrong items, cancelling to re-edit draft"
}
```

**Resposta:** `202 Accepted` (sem body).

**Efeito:** transição `queued`/`building` -> `draft` (a versão volta a ser editável).

---

## Referências de Schemas

| Schema | Localização (linha em `openapi-schema.yml`) |
|--------|----------------------------------------------|
| `NetworkListRequest` | 31400 |
| `NetworkListResponse` | 31459 |
| `NetworkListSummary` | 31474 |
| `PaginatedNetworkListSummaryList` | 32167 |
| `PatchedNetworkListRequest` | 32954 |
| `VersionCreateRequest` | 34581 |
| `PatchedVersionCreateRequest` | 33077 |
| `VersionArchiveRequest` | 34538 |
| `VersionBuildRequest` | 34551 |
| `VersionCancelRequest` | 34568 |
| `DeleteResponse` | 28604 |
| `JSONAPIErrorResponse` | 31008 |
