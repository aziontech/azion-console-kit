# Workloads API

> Endpoints para gerenciar Workloads e seus Deployments. Extraído de `openapi-schema.yml`.

Um **Workload** representa a configuração de borda (domínios, TLS, mTLS, protocolos HTTP/HTTPS/QUIC) onde uma aplicação será exposta. Cada Workload possui um ou mais **Deployments**, que vinculam o Workload a uma Edge Application (e opcionalmente a um Edge Firewall e custom page) por meio de uma estratégia de deployment.

Autenticação: header `Authorization: Token <api-token>` ou `Authorization: Bearer <jwt>`.

## Sumário

- [Workloads](#workloads)
  - [`GET /workspace/api/workloads`](#get-workspaceapiworkloads)
  - [`POST /workspace/api/workloads`](#post-workspaceapiworkloads)
  - [`GET /workspace/api/workloads/{workload_id}`](#get-workspaceapiworkloadsworkload_id)
  - [`PUT /workspace/api/workloads/{workload_id}`](#put-workspaceapiworkloadsworkload_id)
  - [`PATCH /workspace/api/workloads/{workload_id}`](#patch-workspaceapiworkloadsworkload_id)
  - [`DELETE /workspace/api/workloads/{workload_id}`](#delete-workspaceapiworkloadsworkload_id)
- [Deployments](#deployments)
  - [`GET /workspace/api/workloads/{workload_id}/deployments`](#get-workspaceapiworkloadsworkload_iddeployments)
  - [`POST /workspace/api/workloads/{workload_id}/deployments`](#post-workspaceapiworkloadsworkload_iddeployments)
  - [`GET /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`](#get-workspaceapiworkloadsworkload_iddeploymentsdeployment_id)
  - [`PUT /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`](#put-workspaceapiworkloadsworkload_iddeploymentsdeployment_id)
  - [`PATCH /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`](#patch-workspaceapiworkloadsworkload_iddeploymentsdeployment_id)
  - [`DELETE /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`](#delete-workspaceapiworkloadsworkload_iddeploymentsdeployment_id)
- [Códigos de Erro](#códigos-de-erro)

---

## Workloads

### `GET /workspace/api/workloads`

- **operationId:** `list_workloads`
- **summary:** List Workloads
- **description:** List all Workloads owned by your account.

#### Query parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `active` | boolean | Filtra por status ativo. |
| `digital_certificate_id` | integer | Filtra por id de certificado digital (aceita valores separados por vírgula). |
| `fields` | string | Lista de campos (separados por vírgula) a incluir na resposta. |
| `id` | integer | Filtra por id (aceita valores separados por vírgula). |
| `infrastructure` | string | Filtra por infraestrutura (aceita valores separados por vírgula). Valores: `1` (Production), `2` (Staging). |
| `last_editor` | string | Filtra por último editor (case-insensitive, match parcial). |
| `last_modified__gte` | date-time | Filtra por última modificação (maior ou igual). |
| `last_modified__lte` | date-time | Filtra por última modificação (menor ou igual). |
| `map_name` | string | Filtra por nome de mapa (case-insensitive, match parcial). |
| `mtls_trusted_ca_certificate_id` | integer | Filtra por id do CA trust mTLS (aceita valores separados por vírgula). |
| `name` | string | Filtra por nome (case-insensitive, match parcial). |
| `ordering` | string | Campo de ordenação. Valores válidos: `id`, `name`, `active`, `last_editor`, `last_modified`. Use `-` para descendente. |
| `page` | integer | Número da página. |
| `page_size` | integer | Quantidade de itens por página. |
| `search` | string | Termo de busca em: `id`, `name`, `last_editor`. |

#### Response `200 OK`

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
      "id": 1837421,
      "name": "production-web",
      "active": true,
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-05-22T14:08:33Z",
      "created_at": "2026-01-10T09:12:00Z",
      "infrastructure": 1,
      "tls": {
        "certificate": 90187,
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
      "workload_domain": "1837421.map.azionedge.net",
      "product_version": "1.1"
    },
    {
      "id": 1837422,
      "name": "staging-api",
      "active": true,
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-06-01T18:45:10Z",
      "created_at": "2026-03-14T11:30:00Z",
      "infrastructure": 2,
      "tls": {
        "certificate": null,
        "ciphers": 7,
        "minimum_version": "tls_1_3"
      },
      "protocols": {
        "http": {
          "versions": ["http1", "http2"],
          "http_ports": [80],
          "https_ports": [443],
          "quic_ports": null
        }
      },
      "mtls": {
        "enabled": false,
        "config": null
      },
      "domains": ["staging.example.com"],
      "workload_domain_allow_access": true,
      "workload_domain": "1837422.map.azionedge.net",
      "product_version": "1.1"
    }
  ]
}
```

---

### `POST /workspace/api/workloads`

- **operationId:** `create_workload`
- **summary:** Create a Workload
- **description:** Create a new Workload in your account.

#### Request body (`WorkloadRequest`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string (1–100) | sim | Nome do workload. |
| `active` | boolean | não (default `true`) | Indica se o workload está ativo. |
| `infrastructure` | integer enum | não (default `1`) | `1` Production, `2` Staging. |
| `tls` | object | não | Configuração TLS. |
| `tls.certificate` | integer \| null | não | Id do certificado digital. `null` usa o certificado padrão Azion. |
| `tls.ciphers` | integer enum | não | Set de ciphers (1..8). Ex.: `7` = Modern_v2025Q1. |
| `tls.minimum_version` | string enum | não (default `tls_1_3`) | Um de `tls_1_0`, `tls_1_1`, `tls_1_2`, `tls_1_3`, `""` (None), ou `null`. |
| `protocols.http.versions` | string[] | não | Subconjunto de `["http1", "http2", "http3"]`. |
| `protocols.http.http_ports` | integer[] | não | Portas HTTP (1–4 itens). |
| `protocols.http.https_ports` | integer[] \| null | não | Portas HTTPS (1–12 itens). |
| `protocols.http.quic_ports` | integer[] \| null | não | Portas QUIC (até 12). |
| `mtls.enabled` | boolean \| null | não (default `false`) | Habilita mTLS. |
| `mtls.config.certificate` | integer \| null | não | Id do certificado CA confiável. |
| `mtls.config.crl` | integer[] \| null | não | Lista de ids de CRL (até 100). |
| `mtls.config.verification` | string enum \| null | não | `enforce` ou `permissive` (consulte `VerificationEnum`). |
| `domains` | string[] | não | Domínios e alternates atendidos pelo workload. |
| `workload_domain_allow_access` | boolean | não | Permite acesso pelo domínio interno gerado (`<id>.map.azionedge.net`). |

Exemplo (mTLS habilitado + HTTP/3):

```json
{
  "name": "production-web",
  "active": true,
  "infrastructure": 1,
  "tls": {
    "certificate": 90187,
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
      "certificate": 50321,
      "crl": [70011, 70012],
      "verification": "enforce"
    }
  },
  "domains": ["www.example.com", "api.example.com", "checkout.example.com"],
  "workload_domain_allow_access": false
}
```

#### Response `201 Created`

```json
{
  "state": "executed",
  "data": {
    "id": 1837421,
    "name": "production-web",
    "active": true,
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T12:00:00Z",
    "created_at": "2026-06-10T12:00:00Z",
    "infrastructure": 1,
    "tls": {
      "certificate": 90187,
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
        "certificate": 50321,
        "crl": [70011, 70012],
        "verification": "enforce"
      }
    },
    "domains": ["www.example.com", "api.example.com", "checkout.example.com"],
    "workload_domain_allow_access": false,
    "workload_domain": "1837421.map.azionedge.net",
    "product_version": "1.1"
  }
}
```

Status alternativo: `202 Accepted` quando a criação é processada de forma assíncrona (mesmo formato de payload).

---

### `GET /workspace/api/workloads/{workload_id}`

- **operationId:** `retrieve_workload`
- **summary:** Retrieve details of a Workload
- **description:** Retrieve details of a specific Workload in your account.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload. |

#### Query parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `fields` | string | Lista de campos (separados por vírgula) a retornar. |

#### Response `200 OK`

```json
{
  "state": "executed",
  "data": {
    "id": 1837421,
    "name": "production-web",
    "active": true,
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-05-22T14:08:33Z",
    "created_at": "2026-01-10T09:12:00Z",
    "infrastructure": 1,
    "tls": {
      "certificate": 90187,
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
    "workload_domain": "1837421.map.azionedge.net",
    "product_version": "1.1"
  }
}
```

---

### `PUT /workspace/api/workloads/{workload_id}`

- **operationId:** `update_workload`
- **summary:** Update a Workload
- **description:** Update an existing Workload. This replaces the entire Workload with the new data provided.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload. |

#### Request body

Mesmo schema de `POST` (`WorkloadRequest`). Todos os campos opcionais não enviados retornarão aos seus valores padrão.

```json
{
  "name": "production-web",
  "active": true,
  "infrastructure": 1,
  "tls": {
    "certificate": 90188,
    "ciphers": 6,
    "minimum_version": "tls_1_2"
  },
  "protocols": {
    "http": {
      "versions": ["http1", "http2", "http3"],
      "http_ports": [80],
      "https_ports": [443, 8443],
      "quic_ports": [443]
    }
  },
  "mtls": {
    "enabled": false,
    "config": null
  },
  "domains": ["www.example.com", "api.example.com", "www2.example.com"],
  "workload_domain_allow_access": true
}
```

#### Response `200 OK`

```json
{
  "state": "executed",
  "data": {
    "id": 1837421,
    "name": "production-web",
    "active": true,
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T13:24:51Z",
    "created_at": "2026-01-10T09:12:00Z",
    "infrastructure": 1,
    "tls": {
      "certificate": 90188,
      "ciphers": 6,
      "minimum_version": "tls_1_2"
    },
    "protocols": {
      "http": {
        "versions": ["http1", "http2", "http3"],
        "http_ports": [80],
        "https_ports": [443, 8443],
        "quic_ports": [443]
      }
    },
    "mtls": {
      "enabled": false,
      "config": null
    },
    "domains": ["www.example.com", "api.example.com", "www2.example.com"],
    "workload_domain_allow_access": true,
    "workload_domain": "1837421.map.azionedge.net",
    "product_version": "1.1"
  }
}
```

Status alternativo: `202 Accepted` para processamento assíncrono.

---

### `PATCH /workspace/api/workloads/{workload_id}`

- **operationId:** `partial_update_workload`
- **summary:** Partially update a Workload
- **description:** Update one or more fields of an existing Workload without affecting other fields.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload. |

#### Request body (`PatchedWorkloadRequest`)

Mesmo schema de `WorkloadRequest`, porém todos os campos são opcionais.

Exemplo (apenas adicionando um domínio alternativo e atualizando TLS):

```json
{
  "domains": ["www.example.com", "api.example.com", "blog.example.com"],
  "tls": {
    "certificate": 90188,
    "minimum_version": "tls_1_3"
  }
}
```

#### Response `200 OK`

```json
{
  "state": "executed",
  "data": {
    "id": 1837421,
    "name": "production-web",
    "active": true,
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T14:00:11Z",
    "created_at": "2026-01-10T09:12:00Z",
    "infrastructure": 1,
    "tls": {
      "certificate": 90188,
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
    "domains": ["www.example.com", "api.example.com", "blog.example.com"],
    "workload_domain_allow_access": true,
    "workload_domain": "1837421.map.azionedge.net",
    "product_version": "1.1"
  }
}
```

Status alternativo: `202 Accepted` para processamento assíncrono.

---

### `DELETE /workspace/api/workloads/{workload_id}`

- **operationId:** `delete_workload`
- **summary:** Delete a Workload
- **description:** Delete a specific Workload in your account.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload. |

#### Response `200 OK`

```json
{
  "state": "executed"
}
```

Status alternativo: `202 Accepted` quando a deleção é processada de forma assíncrona.

---

## Deployments

Um **WorkloadDeployment** vincula o Workload a uma Edge Application (e opcionalmente Edge Firewall e Custom Page) por meio de uma `strategy`. Atualmente apenas a estratégia `default` é suportada.

### `GET /workspace/api/workloads/{workload_id}/deployments`

- **operationId:** `list_workload_deployments`
- **summary:** List Workload Deployments
- **description:** List all Workload Deployments related to your account's Workloads.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload pai. |

#### Query parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `current` | boolean | Filtra por status atual (deployment ativo). |
| `fields` | string | Lista de campos (separados por vírgula) a incluir na resposta. |
| `id` | integer | Filtra por id (aceita valores separados por vírgula). |
| `ordering` | string | Ordenação. Campos válidos: `id`, `tag`, `current`. |
| `page` | integer | Número da página. |
| `page_size` | integer | Quantidade de itens por página. |
| `search` | string | Termo de busca em: `id`, `tag`, `current`. |
| `tag` | string | Filtra por tag (case-insensitive, match parcial). |

#### Response `200 OK`

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
      "id": 4421007,
      "name": "v2026-06-10",
      "current": true,
      "active": true,
      "strategy": {
        "type": "default",
        "attributes": {
          "application": 1675849,
          "firewall": 28930,
          "custom_page": 4012
        }
      },
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-06-10T11:20:00Z",
      "created_at": "2026-06-10T11:20:00Z"
    },
    {
      "id": 4421006,
      "name": "v2026-05-22",
      "current": false,
      "active": true,
      "strategy": {
        "type": "default",
        "attributes": {
          "application": 1675849,
          "firewall": null,
          "custom_page": null
        }
      },
      "last_editor": "guilherme.santana@azion.com",
      "last_modified": "2026-05-22T14:08:33Z",
      "created_at": "2026-05-22T14:08:33Z"
    }
  ]
}
```

---

### `POST /workspace/api/workloads/{workload_id}/deployments`

- **operationId:** `create_workload_deployment`
- **summary:** Create a Workload Deployment
- **description:** Create a new Workload Deployment associated with a Workload.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload pai. |

#### Request body (`WorkloadDeploymentRequest`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string (1–254) | sim | Nome do deployment. |
| `current` | boolean | não (default `true`) | Marca como o deployment ativo do workload. |
| `active` | boolean | não (default `true`) | Indica se o deployment está habilitado. |
| `strategy` | object | sim | Estratégia do deployment. |
| `strategy.type` | string | sim | Atualmente apenas `default`. |
| `strategy.attributes.application` | integer | sim | Id da Edge Application a ser servida. |
| `strategy.attributes.firewall` | integer \| null | não | Id da Edge Firewall associada. |
| `strategy.attributes.custom_page` | integer \| null | não | Id da Custom Page para respostas customizadas. |

Exemplo:

```json
{
  "name": "v2026-06-10",
  "current": true,
  "active": true,
  "strategy": {
    "type": "default",
    "attributes": {
      "application": 1675849,
      "firewall": 28930,
      "custom_page": 4012
    }
  }
}
```

#### Response `201 Created`

```json
{
  "state": "executed",
  "data": {
    "id": 4421007,
    "name": "v2026-06-10",
    "current": true,
    "active": true,
    "strategy": {
      "type": "default",
      "attributes": {
        "application": 1675849,
        "firewall": 28930,
        "custom_page": 4012
      }
    },
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T12:00:00Z",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

Status alternativo: `202 Accepted` para processamento assíncrono.

---

### `GET /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`

- **operationId:** `retrieve_workload_deployment`
- **summary:** Retrieve details of a Workload Deployment
- **description:** Retrieve details of a specific Workload Deployment in your account.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload pai. |
| `deployment_id` | integer | Id único do deployment. |

#### Query parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `fields` | string | Lista de campos (separados por vírgula) a retornar. |

#### Response `200 OK`

```json
{
  "state": "executed",
  "data": {
    "id": 4421007,
    "name": "v2026-06-10",
    "current": true,
    "active": true,
    "strategy": {
      "type": "default",
      "attributes": {
        "application": 1675849,
        "firewall": 28930,
        "custom_page": 4012
      }
    },
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T12:00:00Z",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

---

### `PUT /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`

- **operationId:** `update_workload_deployment`
- **summary:** Update a Workload Deployment
- **description:** Update an existing Workload Deployment. This replaces the entire Workload Deployment with the new data provided.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload pai. |
| `deployment_id` | integer | Id único do deployment. |

#### Request body

Mesmo schema de `POST` (`WorkloadDeploymentRequest`).

```json
{
  "name": "v2026-06-10-hotfix",
  "current": true,
  "active": true,
  "strategy": {
    "type": "default",
    "attributes": {
      "application": 1675850,
      "firewall": 28930,
      "custom_page": null
    }
  }
}
```

#### Response `200 OK`

```json
{
  "state": "executed",
  "data": {
    "id": 4421007,
    "name": "v2026-06-10-hotfix",
    "current": true,
    "active": true,
    "strategy": {
      "type": "default",
      "attributes": {
        "application": 1675850,
        "firewall": 28930,
        "custom_page": null
      }
    },
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T15:00:00Z",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

Status alternativo: `202 Accepted` para processamento assíncrono.

---

### `PATCH /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`

- **operationId:** `partial_update_workload_deployment`
- **summary:** Partially update a Workload Deployment
- **description:** Update one or more fields of an existing Workload Deployment without affecting other fields.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload pai. |
| `deployment_id` | integer | Id único do deployment. |

#### Request body (`PatchedWorkloadDeploymentRequest`)

Todos os campos opcionais.

Exemplo (apagando a custom page e mantendo o resto):

```json
{
  "strategy": {
    "type": "default",
    "attributes": {
      "application": 1675849,
      "firewall": 28930,
      "custom_page": null
    }
  }
}
```

#### Response `200 OK`

```json
{
  "state": "executed",
  "data": {
    "id": 4421007,
    "name": "v2026-06-10",
    "current": true,
    "active": true,
    "strategy": {
      "type": "default",
      "attributes": {
        "application": 1675849,
        "firewall": 28930,
        "custom_page": null
      }
    },
    "last_editor": "guilherme.santana@azion.com",
    "last_modified": "2026-06-10T15:30:00Z",
    "created_at": "2026-06-10T12:00:00Z"
  }
}
```

Status alternativo: `202 Accepted` para processamento assíncrono.

---

### `DELETE /workspace/api/workloads/{workload_id}/deployments/{deployment_id}`

- **operationId:** `delete_workload_deployment`
- **summary:** Delete a Workload Deployment
- **description:** Delete a specific Workload Deployment in your account.

#### Path parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `workload_id` | integer | Id único do workload pai. |
| `deployment_id` | integer | Id único do deployment. |

#### Response `200 OK`

```json
{
  "state": "executed"
}
```

Status alternativo: `202 Accepted` quando a deleção é processada de forma assíncrona.

---

## Códigos de Erro

Todos os endpoints retornam respostas de erro no formato JSON:API (`JSONAPIErrorResponse`).

| HTTP | Código | Título | Detalhe |
|------|--------|--------|---------|
| 400 | 10000 | Validation Error | Invalid data provided in the request. |
| 401 | 10001 | Authentication Failed | Invalid authentication credentials. |
| 403 | 10003 | Permission Denied | You do not have permission to perform this action. |
| 404 | 10004 | Not Found | Not found. |
| 405 | 10007 | Method Not Allowed | Method "{method}" not allowed. |
| 406 | 10005 | Not Acceptable | Could not satisfy the request Accept header. |
| 429 | 10010 | Throttled | Request was throttled. |

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
