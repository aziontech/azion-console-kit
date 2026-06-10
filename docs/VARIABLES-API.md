# API Reference — variables-api

> Base path: `/api`. Auth: `azion_auth` (SSO) salvo onde dito "interno" (que usa `X-Secret`). Todos os endpoints: `Content-Type: application/json`.
>
> A **mesma rota** `/api/variables` atende v5 e v6 — o backend decide pelo SSO flag `use_v6_configurations` (ver [V6_FLOW.md](./V6_FLOW.md)).
>
> **v6 é save-and-build**: cada mutação em `/api/variables` cria uma `VariableVersion`, faz upsert da linha `variables_build` pendente e emite o outbox numa única transação. Não existe mais endpoint público de build manual — o build é parte da própria mutação. Concurrent writes do mesmo `client_id` são serializadas por `pg_advisory_xact_lock(hashtext(client_id))`.

---

## 1. Variáveis (rota dual: v5/v6)

### `POST /api/variables`

**Legacy (v5)** — request:

```json
{ "key": "MY_VAR", "value": "abc", "secret": false }
```

- `key`: ≤ 100 chars, `[A-Z_][A-Z0-9_]*` (ASCII only).
- `value`: ASCII, ≤ 32 KB.
- `secret`: opcional, default `false`.

**v6** — request:

```json
{
  "key": "MY_VAR",
  "value": "abc",
  "secret": false,
  "scope": [
    { "type": "global" },
    { "type": "environment", "environment_id": "123" },
    { "type": "deployment",  "deployment_id":  "456" },
    { "type": "resource",    "resource_id":    "789" }
  ]
}
```

- `scope`: **opcional**. Se omitido ou enviado como lista vazia, cai no scope `global` (semeado). Cada item: `type ∈ {global, environment, deployment, resource}` + o `*_id` correspondente (exceto `global`).

**Response** `201 Created`:

Legacy (`VariableGetSerializer`):

```json
{
  "uuid": "…",
  "key": "MY_VAR",
  "value": "abc",
  "secret": false,
  "last_editor": "user@x",
  "created_at": "…",
  "updated_at": "…"
}
```

v6 (`V6VariableSerializer`):

```json
{
  "uuid": "…",
  "key": "MY_VAR",
  "value": "abc",
  "secret": false,
  "last_editor": "user@x",
  "created_at": "…",
  "updated_at": "…",
  "scope": [
    { "type": "global" },
    { "type": "environment", "environment_id": "123" }
  ],
  "version_id": "AB12…"
}
```

- `version_id`: short-id público da versão criada (formato `^[A-Z][A-Z0-9]+$`, ver [short-id-spec.md](./short-id-spec.md)). Estado da publicação não vem nesse payload — consultar `/api/variables/{variable_id}/versions`.

---

### `GET /api/variables`

Query params (ambos os fluxos):

- `uuid` (lista CSV), `key` (icontains), `secret` (bool), `last_editor` (icontains)
- `created_at__gte`, `created_at__lte`, `updated_at__gte`, `updated_at__lte`
- `ordering` ∈ `key | created_at | updated_at` (com `-` para desc)
- `search` (em `key`)
- Paginação via `azion_django_extensions.CustomPagination` (`page`, `page_size`). Settings: `PAGE_SIZE_QUERY_PARAM = "page_size"`.

v6 extras: `scope_type`, `scope_id` (match exato).

**Response** `200`: lista paginada de objetos `VariableGetSerializer` (legacy) ou `V6VariableSerializer` (v6).

---

### `GET /api/variables/{uuid}`

Sem body. **Response** `200`: mesmo shape do create response. v6 retorna `404` se a última versão da variable for um `action=to_delete` (variable considerada removida).

---

### `PUT /api/variables/{uuid}` e `PATCH /api/variables/{uuid}`

Mesmos schemas do `POST` (PATCH: todos os campos opcionais). **Response** `200` com o mesmo shape do create.

v6:

- `scope` é **imutável após criação** — qualquer `scope` enviado em PUT/PATCH é silenciosamente ignorado.
- Cada update cria nova `VariableVersion` e dispara save-and-build.

---

### `DELETE /api/variables/{uuid}`

Sem body. **Response** `204 No Content`.

v6: não apaga linha física — cria uma `VariableVersion` com `action=to_delete` e emite o build (a remoção real acontece no Edge quando o build aplica). GETs subsequentes em `/api/variables/{uuid}` passam a retornar `404`.

---

## 2. Histórico de versões (v6 apenas)

> O endpoint público `POST /api/variables/build` **foi removido** no refactor #184 (save-and-build). Não há build manual público — todas as mutações em `/api/variables` já emitem build. A única rota relacionada que sobrou é a operadora `POST /api/internal/build/release` (ver §4).

`{version_id}` em todas as rotas abaixo é o short-id público (`^[A-Z][A-Z0-9]+$`) gravado em `VariableVersion.version_id`.

### `GET /api/variables/{variable_id}/versions`

Sem body. **Response** `200`: lista (não paginada) ordenada por `-version`, com `build_status` anotado via JOIN com `variables_build`:

```json
[
  {
    "version_id": "AB12…",
    "variable_id": "uuid…",
    "version": 3,
    "action": "upsert",
    "key": "MY_VAR",
    "last_editor": "user@x",
    "created_at": "…",
    "source_version_id": null,
    "build_resource_version": "01H…",
    "build_status": "pending"
  }
]
```

- `action ∈ {upsert, to_delete}`.
- `source_version_id`: preenchido apenas em rollback (aponta para a versão clonada).
- `build_resource_version`: ULID do build que carrega essa versão. `null` em linhas pre-refactor.
- `build_status`: status corrente do build (`pending | succeeded | error | ...`), ou `null` se sem build associado.
- **Não existe** mais campo `state` por versão — o lifecycle vive em `variables_build`, não na linha de versão.

### `GET /api/variables/{variable_id}/versions/{version_id}`

**Response** `200`: mesmo shape do item acima. `404` se o `version_id` não existir para a variable.

### `POST /api/variables/{variable_id}/rollback/{version_id}`

Sem body. Clona a `VariableVersion` indicada em uma **nova** versão no topo do histórico (com `source_version_id = version_id` alvo), seguindo o mesmo caminho de save-and-build.

- `201 Created`: mesma shape de `GET /versions/{version_id}` (a versão recém-criada).
- `404`: variable/version não encontrada.

---

## 3. Scopes (rotas legacy — `NonV6OnlyPermission`)

Bloqueadas para clients v6 (que usam `scope` inline em `/api/variables`).

### `POST /api/scope-groups/{group_slug}/scopes`

Request (`ScopeSerializer`):

```json
{ "slug": "my-env", "name": "My Env" }
```

**Response** `201`: `{ "slug": "…", "name": "…", "created_at": "…" }`.

### `GET /api/scope-groups/{group_slug}/scopes/{scope_slug}/variables`

Sem body. **Response** `200`: lista de `VariableGetSerializer`.

### `POST /api/scope-groups/{group_slug}/scopes/{scope_slug}/variables`

Request — lista de variables:

```json
[
  { "key": "K1", "value": "v1", "secret": false },
  { "key": "K2", "value": "v2" }
]
```

**Response** `201`: lista de `VariableGetSerializer`.

### `PATCH /api/scope-groups/{group_slug}/scopes/{scope_slug}/variables`

Request — batch update:

```json
[ { "uuid": "…", "key": "K1", "value": "v1-new", "secret": false } ]
```

**Response** `200`: lista de `VariableGetSerializer`.

---

## 4. Internal (auth `X-Secret`)

### `POST /api/internal/scope-groups/{group_slug}/scopes`

Request (`InternalScopeCreateSerializer`):

```json
{ "slug": "my-env", "name": "My Env", "client_id": "1234" }
```

**Response** `201`: igual ao público.

### `DELETE /api/internal/scope-groups/{group_slug}/scopes/{scope_slug}?client_id=1234`

**Response** `204`.

### `GET /api/internal/scope-groups/{group_slug}/scopes/{scope_slug}/variables?client_id=1234`

**Response** `200`: lista de `VariableGetSerializer`.

### `POST /api/internal/scope-groups/{group_slug}/scopes/{scope_slug}/variables`

Request (`InternalScopeVarsCreateSerializer`):

```json
{
  "client_id": "1234",
  "variables": [ { "key": "K1", "value": "v1", "secret": false } ]
}
```

**Response** `201`: lista de `VariableGetSerializer`.

### `PATCH /api/internal/scope-groups/{group_slug}/scopes/{scope_slug}/variables`

Request:

```json
{
  "client_id": "1234",
  "variables": [ { "uuid": "…", "key": "K1", "value": "v1", "secret": false } ]
}
```

**Response** `200`.

### `POST /api/internal/build/release`

Operator escape hatch — força-falha um build pendente preso. Pareia com o ULID do `variables_build` (não com `client_id`).

Request (`BuildReleaseSerializer`):

```json
{ "resource_version": "01H…", "error_message": "manually released" }
```

- `resource_version`: ULID da linha `variables_build` pendente. **Obrigatório**.
- `error_message`: opcional, default `"manually released"`.

**Response**:

- `200`: `{ "detail": "Pending build released." }`
- `404`: `{ "detail": "No pending build for this resource_version." }`

---

## 5. GraphQL

`POST /variables/api/graphql/` — schema em `variables_api/schema.py` e `schema.graphql`. Abra o endpoint com GraphiQL se `ENABLE_SWAGGER` estiver ligado.

---

## 6. Misc

- `GET /admin/` — Django admin.
- `GET /api/schema` — OpenAPI (drf-spectacular), só com `ENABLE_SWAGGER=true`.
- `GET /` — Swagger UI, idem.
- `GET /metrics` — Prometheus (`django_prometheus`).

---

## Códigos de erro recorrentes

| Código | Quando |
|---|---|
| `REQUIRED_FIELD` | Campo obrigatório ausente (ex.: `environment_id` num scope item `environment`). |
| `INVALID_PATTERN_MATCH` | Valor não corresponde ao esperado (ex.: `environment_id` em scope `deployment`, `scope_type` fora do enum). |
| `INVALID_REQUEST_BODY` | Endpoints internos exigem JSON object. |
| `CLIENT_ID_REQUIRED_BODY` / `CLIENT_ID_REQUIRED_QUERY_STRING` | Endpoints internos sem `client_id`. |
