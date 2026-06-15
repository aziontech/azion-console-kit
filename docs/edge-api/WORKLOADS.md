# Workloads API

> Endpoints para gerenciar Workloads, Deployments e Versions. Extraído de `openapi-schema.yml`.
>
> Base path: `/v4/workspace/workloads`
>
> Autenticação: `TokenAuth` ou `BearerAuth` (header `Authorization`).
>
> Notas sobre versionamento (formato pseudo-versioning):
>
> - O campo `version_id` (ULID string, nullable, read-only) substitui os antigos `is_versioned`/`version_state`. Quando presente, linka para `/v4/workspace/workloads/{workload_id}/versions/{version_id}` para meta completa (incluindo `last_error`).
> - O campo `state` (string, nullable, read-only) substitui `version_state`. Representa o build state da versão associada: `queued`, `building`, `ready`, `error`, etc.
> - O campo `product_version` (read-only) segue o pattern `^(custom|\d+\.\d+)$` (por exemplo, `1.0`, `1.1`, `custom`).
> - Clientes podem interagir com a rota principal (`/v4/workspace/workloads/{workload_id}`) e observar o estado do build sem precisar chamar `/versions`.

## Sumário

- [Workloads](#workloads)
- [Deployments](#deployments)
- [Versions (versionamento)](#versions-versionamento)
- [Version Actions](#version-actions)

---

## Workloads

Um Workload representa a configuração de borda exposta para um conjunto de domínios: TLS, protocolos HTTP (HTTP/1, HTTP/2, HTTP/3), mTLS, infraestrutura (produção/staging) e o `deployment` ativo (associando Edge Application, Edge Firewall e Custom Page).

### `GET /v4/workspace/workloads`

- operationId: `list_workloads`
- summary: List Workloads
- description: List all Workloads owned by your account.

Query parameters:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `active` | boolean | Filter by active status. |
| `digital_certificate_id` | integer | Filter by digital certificate id (accepts comma-separated values). |
| `fields` | string | Comma-separated list of field names to include in the response. |
| `id` | integer | Filter by id (accepts comma-separated values). |
| `infrastructure` | string | Filter by infrastructure (accepts comma-separated values). |
| `last_editor` | string | Filter by last editor (case-insensitive, partial match). |
| `last_modified__gte` | date-time | Filter by last modified date (>=). |
| `last_modified__lte` | date-time | Filter by last modified date (<=). |
| `map_name` | string | Filter by map name (case-insensitive, partial match). |
| `mtls_trusted_ca_certificate_id` | integer | Filter by mTLS trusted CA certificate id. |
| `name` | string | Filter by name (case-insensitive, partial match). |
| `ordering` | string | Order by `id`, `name`, `active`, `last_editor`, `last_modified`. |
| `page` | integer | Page number. |
| `page_size` | integer | Items per page. |
| `search` | string | Search term across `id`, `name`, `last_editor`. |

Response `200`:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 14821,
      "name": "production-edge",
      "active": true,
      "last_editor": "ops@example.com",
      "last_modified": "2026-06-10T14:32:11Z",
      "created_at": "2026-05-02T09:14:00Z",
      "infrastructure": 1,
      "tls": {
        "certificate": 9921,
        "ciphers": 7,
        "minimum_version": "tls_1_3"
      },
      "protocols": {
        "http": {
          "versions": ["http1", "http2", "http3"],
          "http_ports": [80],
          "https_ports": [443],
          "quic_ports": [443]
        }
      },
      "mtls": {
        "enabled": false,
        "config": null
      },
      "domains": ["www.example.com", "api.example.com"],
      "workload_domain_allow_access": true,
      "workload_domain": "edge-14821.map.azionedge.net",
      "deployment_id": 55012,
      "environment_id": "9b4f1d2e-7c14-4f9a-83b0-3e9d6b2a5a11",
      "product_version": "1.1",
      "version_id": "01HX9KZ8R7AYV1F2N3Q4WJK5MT",
      "state": "ready"
    }
  ]
}
```

### `POST /v4/workspace/workloads`

- operationId: `create_workload`
- summary: Create a Workload
- description: Create a new Workload in your account.

Request body (`WorkloadRequest`):

```json
{
  "name": "production-edge",
  "active": true,
  "infrastructure": 1,
  "tls": {
    "certificate": 9921,
    "ciphers": 7,
    "minimum_version": "tls_1_3"
  },
  "protocols": {
    "http": {
      "versions": ["http1", "http2", "http3"],
      "http_ports": [80],
      "https_ports": [443],
      "quic_ports": [443]
    }
  },
  "mtls": {
    "enabled": false,
    "config": null
  },
  "domains": ["www.example.com", "api.example.com"],
  "workload_domain_allow_access": true,
  "deployment_id": null,
  "environment_id": null
}
```

Field notes:

- `infrastructure` (`InfrastructureEnum`): `1` (Production - All Edge Locations), `2` (Staging).
- `tls.minimum_version` (`MinimumVersionEnum`): `tls_1_0`, `tls_1_1`, `tls_1_2`, `tls_1_3`. Pode ser `null`.
- `tls.ciphers` (`CiphersEnum`, integer 1..8): `1` TLSv1.2_2018, `2` TLSv1.2_2019, `3` TLSv1.3_2022, `4` TLSv1.2_2021, `5` Legacy_v2025Q1, `6` Compatible_v2025Q1, `7` Modern_v2025Q1, `8` Legacy_v2017Q1.
- `protocols.http.versions`: subset de `["http1", "http2", "http3"]` (até 3 itens).
- `mtls.config.verification` (`VerificationEnum`): `enforce` ou `permissive`.

Response `201` (`WorkloadResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 14821,
    "name": "production-edge",
    "active": true,
    "last_editor": "ops@example.com",
    "last_modified": "2026-06-10T14:32:11Z",
    "created_at": "2026-06-10T14:32:11Z",
    "infrastructure": 1,
    "tls": {
      "certificate": 9921,
      "ciphers": 7,
      "minimum_version": "tls_1_3"
    },
    "protocols": {
      "http": {
        "versions": ["http1", "http2", "http3"],
        "http_ports": [80],
        "https_ports": [443],
        "quic_ports": [443]
      }
    },
    "mtls": {
      "enabled": false,
      "config": null
    },
    "domains": ["www.example.com", "api.example.com"],
    "workload_domain_allow_access": true,
    "workload_domain": "edge-14821.map.azionedge.net",
    "deployment_id": null,
    "environment_id": null,
    "product_version": "1.1",
    "version_id": "01HX9KZ8R7AYV1F2N3Q4WJK5MT",
    "state": "queued"
  }
}
```

Response `202`: Workload creation accepted and processing asynchronously (mesmo payload de `WorkloadResponse`).

### `GET /v4/workspace/workloads/{workload_id}`

- operationId: `retrieve_workload`
- summary: Retrieve details of a Workload

Path parameters: `workload_id` (integer, required).

Query: `fields` (string).

Response `200` (`WorkloadResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 14821,
    "name": "production-edge",
    "active": true,
    "last_editor": "ops@example.com",
    "last_modified": "2026-06-10T14:32:11Z",
    "created_at": "2026-05-02T09:14:00Z",
    "infrastructure": 1,
    "tls": {
      "certificate": 9921,
      "ciphers": 7,
      "minimum_version": "tls_1_3"
    },
    "protocols": {
      "http": {
        "versions": ["http1", "http2", "http3"],
        "http_ports": [80],
        "https_ports": [443],
        "quic_ports": [443]
      }
    },
    "mtls": {
      "enabled": true,
      "config": {
        "certificate": 4410,
        "crl": [101, 102],
        "verification": "enforce"
      }
    },
    "domains": ["www.example.com", "api.example.com"],
    "workload_domain_allow_access": true,
    "workload_domain": "edge-14821.map.azionedge.net",
    "deployment_id": 55012,
    "environment_id": "9b4f1d2e-7c14-4f9a-83b0-3e9d6b2a5a11",
    "product_version": "1.1",
    "version_id": "01HX9KZ8R7AYV1F2N3Q4WJK5MT",
    "state": "ready"
  }
}
```

### `PUT /v4/workspace/workloads/{workload_id}`

- operationId: `update_workload`
- summary: Update a Workload (full replace)

Path parameter: `workload_id` (integer).

Request body: `WorkloadRequest` (mesmo schema do POST). Todos os campos obrigatórios devem ser enviados; `name` é obrigatório.

```json
{
  "name": "production-edge",
  "active": true,
  "infrastructure": 1,
  "tls": {
    "certificate": 9921,
    "ciphers": 6,
    "minimum_version": "tls_1_2"
  },
  "protocols": {
    "http": {
      "versions": ["http1", "http2"],
      "http_ports": [80],
      "https_ports": [443, 8443],
      "quic_ports": null
    }
  },
  "mtls": {
    "enabled": true,
    "config": {
      "certificate": 4410,
      "crl": [101, 102],
      "verification": "permissive"
    }
  },
  "domains": ["www.example.com", "api.example.com", "cdn.example.com"],
  "workload_domain_allow_access": true,
  "deployment_id": 55012,
  "environment_id": "9b4f1d2e-7c14-4f9a-83b0-3e9d6b2a5a11"
}
```

Response `200` (`WorkloadResponse`): mesmo formato do retrieve. Quando o build é disparado automaticamente, `data.state` retorna `queued` ou `building` até a transição para `ready`.

### `PATCH /v4/workspace/workloads/{workload_id}`

- operationId: `partial_update_workload`
- summary: Partially update a Workload

Path parameter: `workload_id` (integer).

Request body (`PatchedWorkloadRequest`): qualquer subconjunto dos campos. Exemplo trocando apenas TLS minimum version e domains:

```json
{
  "tls": {
    "minimum_version": "tls_1_2"
  },
  "domains": ["www.example.com", "api.example.com", "static.example.com"]
}
```

Response `200`: `WorkloadResponse` (mesmo formato do retrieve).

### `DELETE /v4/workspace/workloads/{workload_id}`

- operationId: `destroy_workload`
- summary: Delete a Workload

Path parameter: `workload_id` (integer).

Response `202` (`DeleteResponse`):

```json
{
  "state": "executed"
}
```

---

## Deployments

Um Workload Deployment associa uma estratégia de deployment a um Workload, referenciando um `application` (Edge Application), opcionalmente um `firewall` (Edge Firewall) e um `custom_page`.

### `GET /v4/workspace/workloads/{workload_id}/deployments`

- operationId: `list_workload_deployments`
- summary: List Workload Deployments

Path parameter: `workload_id` (integer).

Query parameters: `current` (boolean), `fields` (string), `id` (integer), `ordering` (`id`, `tag`, `current`), `page` (integer), `page_size` (integer), `search` (string), `tag` (string).

Response `200` (`PaginatedWorkloadDeploymentList`):

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 55012,
      "name": "blue-2026-06",
      "current": true,
      "active": true,
      "strategy": {
        "type": "default",
        "attributes": {
          "application": 7781234567,
          "firewall": 332211,
          "custom_page": 9001
        }
      },
      "last_editor": "ops@example.com",
      "last_modified": "2026-06-10T14:32:11Z",
      "created_at": "2026-06-05T11:01:00Z"
    }
  ]
}
```

### `POST /v4/workspace/workloads/{workload_id}/deployments`

- operationId: `create_workload_deployment`
- summary: Create a Workload Deployment

Path parameter: `workload_id` (integer).

Request body (`WorkloadDeploymentRequest`):

```json
{
  "name": "blue-2026-06",
  "current": true,
  "active": true,
  "strategy": {
    "type": "default",
    "attributes": {
      "application": 7781234567,
      "firewall": 332211,
      "custom_page": 9001
    }
  }
}
```

Field notes:

- `strategy.type`: discriminator. Atualmente o único valor suportado é `default`, mapeado para `DeploymentStrategyDefaultDeploymentStrategy`.
- `strategy.attributes.application`: integer (>=1) - ID da Edge Application. Obrigatório.
- `strategy.attributes.firewall`: integer ou `null` - ID do Edge Firewall.
- `strategy.attributes.custom_page`: integer (>=1) ou `null`.

Response `201` (`WorkloadDeploymentResponse`):

```json
{
  "state": "executed",
  "data": {
    "id": 55012,
    "name": "blue-2026-06",
    "current": true,
    "active": true,
    "strategy": {
      "type": "default",
      "attributes": {
        "application": 7781234567,
        "firewall": 332211,
        "custom_page": 9001
      }
    },
    "last_editor": "ops@example.com",
    "last_modified": "2026-06-10T14:32:11Z",
    "created_at": "2026-06-10T14:32:11Z"
  }
}
```

### `GET /v4/workspace/workloads/{workload_id}/deployments/{deployment_id}`

- operationId: `retrieve_workload_deployment`
- summary: Retrieve a Workload Deployment

Path parameters: `workload_id` (integer), `deployment_id` (integer).

Response `200` (`WorkloadDeploymentResponse`): mesmo payload do POST.

### `PUT /v4/workspace/workloads/{workload_id}/deployments/{deployment_id}`

- operationId: `update_workload_deployment`
- summary: Update a Workload Deployment

Request body (`WorkloadDeploymentRequest`):

```json
{
  "name": "blue-2026-06-rev2",
  "current": true,
  "active": true,
  "strategy": {
    "type": "default",
    "attributes": {
      "application": 7781234567,
      "firewall": 332211,
      "custom_page": null
    }
  }
}
```

Response `200`: `WorkloadDeploymentResponse`.

### `PATCH /v4/workspace/workloads/{workload_id}/deployments/{deployment_id}`

- operationId: `partial_update_workload_deployment`
- summary: Partially update a Workload Deployment

Request body (`PatchedWorkloadDeploymentRequest`): qualquer subconjunto.

```json
{
  "current": true,
  "strategy": {
    "type": "default",
    "attributes": {
      "application": 7781234999
    }
  }
}
```

Response `200`: `WorkloadDeploymentResponse`.

### `DELETE /v4/workspace/workloads/{workload_id}/deployments/{deployment_id}`

- operationId: `destroy_workload_deployment`
- summary: Delete a Workload Deployment

Response `202` (`DeleteResponse`):

```json
{
  "state": "executed"
}
```

---

## Versions (versionamento)

Endpoints abaixo gerenciam o ciclo de vida completo de versões. Use estes endpoints quando precisar manipular drafts, builds e snapshots arquivados (rollback). Para o estado simplificado do build, prefira ler `version_id` e `state` no payload principal do Workload.

> Importante: os path parameters destes endpoints diferem dos demais.
>
> - `resource_pk` (integer): global_id do Workload (equivalente ao `workload_id` nos outros endpoints).
> - `id` (string): short ID identifier da versão (ULID).

### `GET /v4/workspace/workloads/{resource_pk}/versions`

- operationId: `list_workload_versions`
- summary: List Workload versions
- description: List all versions of a specific Workload.

Path parameter: `resource_pk` (integer). Query: `fields` (string).

Response `200`:

```json
{
  "count": 3,
  "results": [
    {
      "id": "01HX9KZ8R7AYV1F2N3Q4WJK5MT",
      "state": "ready",
      "is_active": true,
      "is_archived": false,
      "product_version": "1.1",
      "comment": "Switch to TLS 1.3 only",
      "created_at": "2026-06-10T14:32:11Z",
      "last_modified": "2026-06-10T14:34:02Z",
      "last_editor": "ops@example.com",
      "last_error": null
    },
    {
      "id": "01HX2K0F3WV4X8B0A1C5D6E7G8",
      "state": "ready",
      "is_active": false,
      "is_archived": true,
      "product_version": "1.0",
      "comment": "Previous production",
      "created_at": "2026-05-02T09:14:00Z",
      "last_modified": "2026-06-10T14:30:01Z",
      "last_editor": "ops@example.com",
      "last_error": null
    },
    {
      "id": "01HXA1B2C3D4E5F6G7H8J9K0LM",
      "state": "building",
      "is_active": false,
      "is_archived": false,
      "product_version": "1.1",
      "comment": "Adding new mTLS CRL",
      "created_at": "2026-06-15T10:00:00Z",
      "last_modified": "2026-06-15T10:00:42Z",
      "last_editor": "ops@example.com",
      "last_error": null
    }
  ]
}
```

### `POST /v4/workspace/workloads/{resource_pk}/versions`

- operationId: `create_workload_version`
- summary: Create a new Workload version
- description: Create a new version by cloning an existing one. Resource field overrides são enviados como top-level keys junto de `source_version` e `comment`.

Path parameter: `resource_pk` (integer).

Request body (`VersionCreateRequest` + overrides do `WorkloadRequest`):

```json
{
  "source_version": "01HX2K0F3WV4X8B0A1C5D6E7G8",
  "comment": "Clone v1.0 with new ciphers",
  "tls": {
    "ciphers": 7,
    "minimum_version": "tls_1_3"
  },
  "domains": ["www.example.com", "api.example.com"]
}
```

Field notes:

- `source_version` (string, nullable): ID da versão a ser clonada. Se omitido, clona a última versão `ready`.
- `comment` (string): descrição livre da nova versão.
- Demais campos top-level são validados pelo serializer do recurso (mesmo schema de `WorkloadRequest`).

Response `201`: cria a nova versão (geralmente em estado `queued`/`building`).

### `GET /v4/workspace/workloads/{resource_pk}/versions/{id}`

- operationId: `retrieve_workload_version`
- summary: Retrieve a Workload version
- description: Retrieve details of a specific version of a Workload.

Path parameters: `resource_pk` (integer), `id` (string, ULID). Query: `fields`.

Response `200`:

```json
{
  "id": "01HX9KZ8R7AYV1F2N3Q4WJK5MT",
  "state": "ready",
  "is_active": true,
  "is_archived": false,
  "product_version": "1.1",
  "comment": "Switch to TLS 1.3 only",
  "created_at": "2026-06-10T14:32:11Z",
  "last_modified": "2026-06-10T14:34:02Z",
  "last_editor": "ops@example.com",
  "last_error": null,
  "data": {
    "id": 14821,
    "name": "production-edge",
    "active": true,
    "infrastructure": 1,
    "tls": {
      "certificate": 9921,
      "ciphers": 7,
      "minimum_version": "tls_1_3"
    },
    "protocols": {
      "http": {
        "versions": ["http1", "http2", "http3"],
        "http_ports": [80],
        "https_ports": [443],
        "quic_ports": [443]
      }
    },
    "mtls": {
      "enabled": false,
      "config": null
    },
    "domains": ["www.example.com", "api.example.com"],
    "workload_domain_allow_access": true,
    "deployment_id": 55012,
    "environment_id": "9b4f1d2e-7c14-4f9a-83b0-3e9d6b2a5a11"
  }
}
```

### `PUT /v4/workspace/workloads/{resource_pk}/versions/{id}`

- operationId: `update_workload_version`
- summary: Update a Workload version
- description: Update a draft version of a Workload.

Path parameters: `resource_pk` (integer), `id` (string).

Request body (`WorkloadRequest`): mesmo schema do PUT do recurso principal.

```json
{
  "name": "production-edge",
  "active": true,
  "infrastructure": 1,
  "tls": {
    "certificate": 9921,
    "ciphers": 7,
    "minimum_version": "tls_1_3"
  },
  "protocols": {
    "http": {
      "versions": ["http1", "http2", "http3"],
      "http_ports": [80],
      "https_ports": [443],
      "quic_ports": [443]
    }
  },
  "mtls": {
    "enabled": false,
    "config": null
  },
  "domains": ["www.example.com", "api.example.com"],
  "workload_domain_allow_access": true,
  "deployment_id": 55012,
  "environment_id": null
}
```

Response `200`: meta + dados da versão atualizada (mesmo formato do GET).

### `PATCH /v4/workspace/workloads/{resource_pk}/versions/{id}`

- operationId: `partial_update_workload_version`
- summary: Partially update a Workload version
- description: Partially update a draft version of a Workload.

Request body (`PatchedWorkloadRequest`):

```json
{
  "tls": {
    "ciphers": 6
  }
}
```

Response `200`: meta + dados (mesmo formato do GET).

### `DELETE /v4/workspace/workloads/{resource_pk}/versions/{id}`

- operationId: `delete_workload_version`
- summary: Delete a Workload version
- description: Delete a specific version of a Workload.

Response `202`: sem body. A versão é removida assíncronamente. Para preservar histórico, prefira `archive`.

---

## Version Actions

Todas as actions de versão respondem `202 Accepted` (operação assíncrona). Após disparo, monitore `state` em `GET /versions/{id}` ou no campo `state` do recurso principal.

### `POST .../versions/{id}/archive`

- operationId: `archive_workload_version`
- summary: Archive a Workload version
- description: Archive a `ready` version (soft-delete). Versões archived ficam disponíveis para `rollback`.

Path parameters: `resource_pk` (integer), `id` (string).

Request body (`VersionArchiveRequest`):

```json
{
  "comment": "Replaced by 01HX9KZ8R7AYV1F2N3Q4WJK5MT"
}
```

Response `202`: sem body. Efeito: marca a versão como `is_archived=true`. Não promove novas versões automaticamente.

### `POST .../versions/{id}/build`

- operationId: `build_workload_version`
- summary: Build a Workload version
- description: Trigger a build for a draft version. Transiciona `state` de `draft`/`queued` para `building` e, ao concluir, para `ready` ou `error`.

Request body (`VersionBuildRequest`):

```json
{
  "comment": "Promote draft to production"
}
```

Response `202`: sem body. Em caso de falha o estado fica `error` e o campo `last_error` da versão é preenchido.

### `POST .../versions/{id}/cancel`

- operationId: `cancel_workload_version_build`
- summary: Cancel a Workload version build
- description: Cancel a `queued` or `building` version. Versão volta a um estado não ativo (geralmente `draft`).

Request body (`VersionCancelRequest`):

```json
{
  "comment": "Build hanging, retry later"
}
```

Response `202`: sem body.

### `POST .../versions/{id}/rollback` (unique to Workload)

- operationId: `rollback_workload_version`
- summary: Rollback to a Workload version
- description: Clone an archived version and promote it to active.

Este endpoint é exclusivo do recurso Workload e não tem equivalente nos demais recursos versionáveis (Edge Application, Edge Firewall, WAF, Custom Page etc.).

Comportamento:

1. Recebe o `{id}` de uma versão `archived` (`is_archived=true`).
2. Clona essa versão criando uma nova versão com novo ULID.
3. Promove a nova versão para `active` (`is_active=true`), substituindo a versão ativa atual.
4. A versão anteriormente ativa é arquivada automaticamente.

Path parameters: `resource_pk` (integer), `id` (string, ULID da versão archived a restaurar).

Request body (`VersionArchiveRequest`):

```json
{
  "comment": "Rollback to last stable v1.0 after incident INC-1284"
}
```

Response `202`: sem body. Após o build da nova versão concluir, o payload principal do Workload (`GET /v4/workspace/workloads/{workload_id}`) refletirá o novo `version_id` e `state: "ready"`.

Erros comuns:

- `400 Validation Error` se `{id}` não for de uma versão archived (apenas versões `is_archived=true` são aceitas).
- `404 Not Found` se a versão não pertencer ao `resource_pk` informado.

---

## Códigos de erro comuns

Todos os endpoints podem retornar os seguintes erros no formato `JSONAPIErrorResponse`:

| Status | Code | Title |
|--------|------|-------|
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
