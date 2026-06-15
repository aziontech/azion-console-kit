# Deployment API Endpoints

This document describes all implemented API endpoints. It reflects the actual implementation in `src/controller/` and should be treated as the source of truth.

## Architecture (post env-detach + draft round)

| Aspect | Notes |
|--------|-------|
| Base path | `/v1/` |
| IDs | Bare 26-char Crockford-base32 ULIDs (no prefix) |
| Multi-tenant | Every entity carries `client_id` (sourced from auth `clientId`) |
| Routing model | `traffic_role` (`ACTIVE \| CANDIDATE \| VALID_URL \| INACTIVE`) is a **column on `deployment_versions`** — there is no pivot table |
| Deployment ↔ Environment | **Decoupled.** Migration `0010` dropped `deployments.environment_id`. `deployment_policy` is now a column on `deployments` (immutable at the application layer). Environments still exist as a CRUD entity but are never consulted by version/routing flows. |
| Version lifecycle | New versions are born as **`state='draft'`** via `POST /versions`. Drafts are mutable (`resources`/`strategy`/`origin` via `PATCH`), do not invoke the catalog, and emit no outbox. `POST /:vid/deploy` runs catalog validation and transitions `draft → queued` with `INSTALL` outbox. |
| Promote semantics | Promote **clones** the version into the target deployment (new ULID, copied `resource_versions`, `origin` stamped) — it does **not** insert a routing row |
| `resource_versions` | Relational mirror; assembled into the `resources: ResourceRef[]` projection at read time via two-step batch query (fetch version rows, then `inArray` on `resource_versions` grouped into a `Map`). Each row carries `resource_type`, `resource_id`, `resource_version` (nullable while in draft), `product_version`, `client_id`, and `name` (caller-supplied display name, nullable for legacy rows). While in `state='draft'`, `resource_version`/`product_version`/`client_id` stay `NULL` — enriched on `/deploy`. `name` is set on draft create/patch and preserved on enrich/clone. |
| Response envelope | Flat `{state, data}` for single; V4 list envelope for collections |

---

## Response Envelope

All endpoints use a consistent envelope:

### Single Resource
```json
{
  "state": "executed",
  "data": { /* flat resource */ }
}
```

### List Response
```json
{
  "count": 42,
  "total_pages": 3,
  "page": 1,
  "page_size": 20,
  "next": "http://...?page=2&page_size=20",
  "previous": null,
  "results": [ /* flat resources */ ]
}
```

### Error Response
```json
{
  "errors": [
    {
      "status": "409",
      "code": "AZN-DEPLOYMENT-CONFLICT-001",
      "title": "Conflict",
      "detail": "...",
      "meta": {
        "source": { "pointer": "/field_name" }
      }
    }
  ]
}
```

---

## Authentication & Authorization

All `/v1/*` requests pass through two middlewares (both mounted in `src/main.ts`, both inside the `if (AUTH_ENABLED)` branch):

1. **`azionAuthMiddleware`** (`src/controller/http/middlewares/auth.middleware.ts`) — validates the SSO credential via `@azion/js-auth` (API token, JWT Bearer, or session cookie), resolves the user/account via SSO GraphQL, and sets `c.set('auth', authResult)` + `c.set('clientId', authResult.account.clientId)`. Failures return:
   - `401 AZN-AUTH-NOT_AUTHENTICATED-001` when no/invalid credentials.
   - `403 AZN-AUTH-PERMISSION_DENIED-001` when the user is inactive, has no account, the account is not of type `client`, or `account.clientId` is missing.

2. **`requireV6FlagMiddleware`** (`src/controller/http/middlewares/require-v6-flag.middleware.ts`) — reads `auth.account.flags`, which `@azion/js-auth` (>=1.1.1) populates from the SSO GraphQL response (API tokens get flags inlined in `TOKEN_QUERY`, no extra round-trip; session cookies trigger a follow-up `getClient(clientId)` round-trip during validation). Blocks clients that do not carry `'use_v6_configurations'`. Same flag string used by edge-api and variables-api. Failure:
   - `403` with `code: "AZN-AUTH-PERMISSION_DENIED-001"`, `title: "v6 Flag Required"`, `detail: "Client is not eligible for v6 deployments. Required flag: use_v6_configurations"`.
   - Skipped automatically when (a) the auth middleware did not run (`AUTH_ENABLED=false`) or (b) env `V6_FLAG_REQUIRED` is not the string `'true'` (the toggle is the prod escape hatch; default `'true'`).

The error envelope for both is:
```json
{
  "errors": [
    {
      "status": "403",
      "code": "AZN-AUTH-PERMISSION_DENIED-001",
      "title": "v6 Flag Required",
      "detail": "Client is not eligible for v6 deployments. Required flag: use_v6_configurations",
      "meta": { "requestId": "..." }
    }
  ]
}
```

**Headers consumed by handlers:**
- `Authorization: Bearer <SSO_JWT>` — required when `AUTH_ENABLED=true`.
- `X-Trigger: <api|cli|console|terraform|sdk>` — optional, lowercased and stamped into `Actor.trigger`. Defaults to `'api'`.
- `Content-Type: application/json` — required on requests with a body.
- `Content-Type: application/vnd.api+json` — surfaced on error responses.

Health endpoints (`/health`, `/health/db`) and the GraphQL endpoint (`/graphql`) live **outside `/v1/*`** and are not gated by either middleware. `/graphql` has its own `X-Secret` header auth (see [GraphQL section](#get-graphql-post-graphql-options-graphql)).

### `Actor` shape (every audit / authorship field)

Every `created_by` / `last_modified_by` payload, plus `audit.requested_by_*` inside `deployment_version`, carry a snapshot of the user who made the change. The Actor is **always** built server-side from `c.get('auth')` via `actorOf(c)` (`src/controller/http/utils/actor.ts`) — clients never supply the `user_id` or `email` in payloads.

```json
{
  "user_id": "42",
  "trigger": "console",
  "email": "alice@example.com"
}
```

- `user_id` — SSO numeric id stringified. Falls back to `'system'` when auth is off.
- `trigger` — `X-Trigger` header lowercased. One of `api | cli | console | terraform | sdk` by convention; not enforced by Zod.
- `email` — `auth.user.email` from the JWT. `null` when auth is off (`AUTH_ENABLED=false`) or the JWT carries no email. Historical rows persisted before commit `81a81fa` (Actor migration) read back as `email: null`.

---

## Endpoints

### Service Endpoints

These endpoints live outside `/v1/` and are **not** gated by `azionAuthMiddleware` (no SSO/JWT). They have their own narrower auth: a shared-secret value sent via the standard `Authorization` header (`healthAuthMiddleware`). The expected value reuses **the same secret the SSO layer already trusts** (`SSO_GQL_SECRET`) — no extra credential to provision or rotate. Header name is `Authorization` (same as `/v1/*`) so probes and CLI shorthand stay uniform across routes; only the value differs (static secret here, SSO JWT on `/v1/*`).

**Shared-secret auth contract:**

- Header: `Authorization: Bearer <env SSO_GQL_SECRET>`. The `Bearer ` scheme prefix is **optional** (a bare `Authorization: <secret>` also works) and **case-insensitive** (`Bearer`, `bearer`, `BEARER`).
- Comparison is constant-time (`safeEqual`) to avoid timing leaks on partial matches.
- **Any failure mode** (missing header, wrong value, server-side misconfiguration with empty `SSO_GQL_SECRET`) returns **`404 Not Found`** with an empty body — security-through-obscurity. Probes from the open internet can't fingerprint the API.
- The middleware is mounted **inside the `AUTH_ENABLED` branch** in `src/main.ts`, alongside `azionAuthMiddleware` and `requireV6FlagMiddleware`. When SSO is off (dev / `AUTH_ENABLED=false`), this middleware isn't mounted either — local probes and the smoke suite keep working unauthenticated.

The middleware is implemented at [`src/controller/http/middlewares/health-auth.middleware.ts`](../src/controller/http/middlewares/health-auth.middleware.ts).

#### GET /health

Liveness probe. Returns 200 as long as the process is up.

**Request**
```
GET /health
Authorization: Bearer <env SSO_GQL_SECRET>
```

**Response 200**
```json
{
  "status": "ok",
  "timestamp": "2026-03-18T15:00:00.000Z"
}
```

**Response 404** — secret missing/invalid (header absent, empty, or wrong value). Body is empty.

---

#### GET /health/db

Readiness probe. Executes `SELECT 1` against the configured database.

**Request**
```
GET /health/db
Authorization: Bearer <env SSO_GQL_SECRET>
```

**Response 200** — DB reachable
```json
{
  "status": "ok",
  "database": "connected",
  "responseTime": "12ms",
  "timestamp": "2026-03-18T15:00:00.000Z"
}
```

**Response 503** — DB unreachable. The body surfaces both Drizzle's wrapper (`error`/`errorName`) and the underlying driver / AWS SDK cause (`cause`/`causeName`). Without `cause`, the wrapped `"Failed query: ...\nparams: ..."` would hide AWS-level signals like credentials-chain failures.
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Failed query: SELECT 1 as health\nparams: ",
  "errorName": "DrizzleError",
  "cause": "Could not load credentials from any providers",
  "causeName": "CredentialsProviderError",
  "responseTime": "0ms",
  "timestamp": "2026-03-18T15:00:00.000Z"
}
```

**Response 404** — secret missing/invalid.

---

#### GET /graphql, POST /graphql, OPTIONS /graphql

Yoga GraphQL endpoint exposing read-only domain queries. Mounted outside `/v1/*` so the SSO middleware does not intercept it; instead it has its own secret-based middleware (see `src/controller/http/routes/graphql.routes.ts`) that requires the request to carry a valid `graphql_secrets.secret` value (typically as a header).

- `POST` is the standard GraphQL transport (JSON body with `query`/`variables`).
- `GET` serves the GraphiQL playground when accessed without query parameters (dev/stage only — masked in production).
- `OPTIONS` is the CORS preflight handler.

The schema lives in [`src/infrastructure/graphql/schema.ts`](../src/infrastructure/graphql/schema.ts); resolvers wire to use cases in [`src/infrastructure/graphql/resolvers.ts`](../src/infrastructure/graphql/resolvers.ts); composition root is `buildGraphQLModule` in [`src/composition/container.ts`](../src/composition/container.ts).

##### Schema

```graphql
type Query {
  resourceVersionInUse(
    clientId: String!
    resourceType: String!
    resourceVersion: String!
  ): Boolean!

  getResourceState(input: [ResourceStateInput!]!): [ResourceState!]!
}

input ResourceStateInput {
  resourceType: String!
  resourceId: String!
  "Required for deployment_version (the version_id); send null for environment/deployment, which are not versioned."
  resourceVersion: String
}

type ResourceState {
  resourceType: String!
  resourceId: String!
  resourceVersion: String
  state: String
}
```

##### `resourceVersionInUse(clientId, resourceType, resourceVersion): Boolean!`

Returns `true` when at least one **`ready`** `deployment_version` in the tenant references the `(resource_type, resource_version)` pair. Backed by `idx_resource_lookup_by_type` on `resource_versions`. Used by the upstream catalog (edge-api) to gate hard-delete of a resource version.

The boolean is **non-nullable**: a missing tenant or non-existent pair returns `false`, not `null`. Throws (GraphQL error) only on infrastructure failure (`check_resource_usage_failed:<kind>`).

```graphql
query {
  resourceVersionInUse(
    clientId: "1234567"
    resourceType: "application"
    resourceVersion: "01HX0LDRES000000000000000A"
  )
}
```

Response:
```json
{ "data": { "resourceVersionInUse": true } }
```

##### `getResourceState(input: [ResourceStateInput!]!): [ResourceState!]!`

Single batch query that resolves the lifecycle `state` (`draft | queued | building | ready | error | canceled | archiving | archived`) for any mix of environment / deployment / deployment_version in one round-trip. Replaces the older trio of `environmentState` / `deploymentState` / `deploymentVersionState` queries.

`resourceType` is a free **`String`** (not an enum), matching the sibling `resourceVersionInUse` query and the GQL contracts of the other Azion APIs. There is **no `clientId`** in the contract: lookups are keyed purely by the globally-unique ULID `resourceId`, because this is a trusted service-to-service endpoint (secret-gated — see above), not a per-tenant one.

**Input semantics** per `resourceType`:

| `resourceType`        | `resourceId`        | `resourceVersion`        | Notes                                                                                                  |
|-----------------------|---------------------|--------------------------|--------------------------------------------------------------------------------------------------------|
| `environment`         | `env_id`            | `null` (not versioned)   | Single-id lookup.                                                                                       |
| `deployment`          | `deployment_id`     | `null` (not versioned)   | Single-id lookup.                                                                                       |
| `deployment_version`  | `deployment_id`     | `version_id` (**required**)| Two-id lookup. `state` is `null` if the version exists but is **not** under that deployment.            |

**Response contract:**

- One `ResourceState` entry per input element, **in input order** (consumers can correlate by index).
- Each entry **echoes** `resourceType` / `resourceId` / `resourceVersion` from the input, regardless of whether the resource was found.
- `state` is `null` when (a) the resource id does not exist, (b) on `deployment_version` requests with the required `resourceVersion` absent, (c) the version exists but does not belong to the requested deployment, or (d) the `resourceType` is unrecognized.
- The query never throws when a resource is missing or the `resourceType` is unknown — only on infrastructure failure does GraphQL surface an `errors` field.

Each lookup is a single primary-key projection (`findStateById`, keyed by the ULID); the query is sequential in the resolver (no cross-repo batching benefit since each entity hits its own table) so the cost is O(N) round-trips to Postgres for a batch of size N. Bound batch size client-side for very large pages.

**Example query — mixed batch:**

```graphql
query Q($input: [ResourceStateInput!]!) {
  getResourceState(input: $input) {
    resourceType
    resourceId
    resourceVersion
    state
  }
}
```

**Variables:**

```json
{
  "input": [
    { "resourceType": "environment",        "resourceId": "01HRXENVPRD0000000000000000", "resourceVersion": null },
    { "resourceType": "deployment",         "resourceId": "01HRX8W6S3M9A4K7P2Q5T8Z1YB", "resourceVersion": null },
    { "resourceType": "deployment_version", "resourceId": "01HRX8W6S3M9A4K7P2Q5T8Z1YB", "resourceVersion": "01HRX92PS4N7D3M2Y8T6Q1K5VC" }
  ]
}
```

**Response (success):**

```json
{
  "data": {
    "getResourceState": [
      { "resourceType": "environment",        "resourceId": "01HRXENVPRD0000000000000000", "resourceVersion": null,                          "state": "ready"  },
      { "resourceType": "deployment",         "resourceId": "01HRX8W6S3M9A4K7P2Q5T8Z1YB",  "resourceVersion": null,                          "state": "queued" },
      { "resourceType": "deployment_version", "resourceId": "01HRX8W6S3M9A4K7P2Q5T8Z1YB",  "resourceVersion": "01HRX92PS4N7D3M2Y8T6Q1K5VC", "state": "ready"  }
    ]
  }
}
```

**Response (mixed hit / miss / version-not-under-deployment):**

```json
{
  "data": {
    "getResourceState": [
      { "resourceType": "environment",        "resourceId": "01HMISSING0000000000000001", "resourceVersion": null, "state": null },
      { "resourceType": "deployment",         "resourceId": "01HRX8W6S3M9A4K7P2Q5T8Z1YB",  "resourceVersion": null, "state": null },
      { "resourceType": "deployment_version", "resourceId": "01HRX8W6S3M9A4K7P2Q5T8Z1YB", "resourceVersion": null, "state": null }
    ]
  }
}
```

> **Migration from the old per-entity queries.** `environmentState`, `deploymentState`, `deploymentVersionState` were removed. Replacements:
> - `environmentState(id)` → `getResourceState([{ resourceType: "environment", resourceId: id, resourceVersion: null }])[0].state`.
> - `deploymentState(id)` → `getResourceState([{ resourceType: "deployment", resourceId: id, resourceVersion: null }])[0].state`.
> - `deploymentVersionState(deploymentId, id)` → `getResourceState([{ resourceType: "deployment_version", resourceId: deploymentId, resourceVersion: id }])[0].state`.

---

### Deployments

#### POST /v1/deployments

Create a new deployment stream. The deployment owns its routing policy (`deployment_policy`) and is no longer bound to an environment — see migration `0010`.

**Request**
```json
{
  "name": "magalu-storefront",
  "description": "Canal logico de deploy",
  "binding_policy": "STRICT",
  "deployment_policy": "single_version",
  "allowed_resource_types": [
    "application",
    "firewall",
    "custom_page",
    "function",
    "network_list"
  ],
  "strategy_defaults": {
    "canary": {
      "enabled": false,
      "default_percentage": 10
    },
    "skew_protection": {
      "enabled": true,
      "default_ttl_seconds": 3600
    }
  }
}
```

**Fields**
- `name` (required): 3-255 characters
- `description` (optional): nullable string
- `binding_policy` (required): `STRICT` | `FLEXIBLE`
- `deployment_policy` (optional, default `single_version`): `single_version` | `versioned_urls`. **Immutable after creation** (matching value via PATCH → 200 no-op; different value → 409 with pointer `/deployment_policy`).
- `allowed_resource_types` (required): non-empty array of resource type strings
- `strategy_defaults` (optional): canary and skew_protection defaults

**Response 201**
```json
{
  "state": "executed",
  "data": {
    "id": "01HRX8W6S3M9A4K7P2Q5T8Z1YB",
    "name": "magalu-storefront",
    "description": "Canal logico de deploy",
    "binding_policy": "STRICT",
    "deployment_policy": "single_version",
    "allowed_resource_types": ["application", "firewall"],
    "strategy_defaults": {
      "canary": { "enabled": false, "default_percentage": 10 },
      "skew_protection": { "enabled": true, "default_ttl_seconds": 3600 }
    },
    "state": "queued",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-03-18T15:00:00Z",
    "updated_at": null,
    "created_by":       { "user_id": "456", "trigger": "cli", "email": "alice@example.com" },
    "last_modified_by": { "user_id": "456", "trigger": "cli", "email": "alice@example.com" }
  }
}
```

`state` is set to `'queued'` on create and progresses via the worker (`queued → building → ready`). The API drives `cancel`/`archive`/`markError` via the entity methods; see [State Machine](#state-machine).

---

#### GET /v1/deployments

List deployments for the authenticated account.

**Query Parameters**
- `page` (default: 1)
- `page_size` (default: 20, max: 100)
- `name` (optional): filter by name substring

**Response 200**
```json
{
  "count": 7,
  "total_pages": 1,
  "page": 1,
  "page_size": 20,
  "next": null,
  "previous": null,
  "results": [
    { /* DeploymentResource — same shape as POST 201 response above */ }
  ]
}
```

---

#### GET /v1/deployments/{deployment_id}

Get a deployment by ID. Account-scoped — returns 404 if the id belongs to another tenant.

**Response 200**: single envelope with the full `DeploymentResource` (same shape as `POST` response).

---

#### PATCH /v1/deployments/{deployment_id}

Update a deployment. All fields are optional.

**Request** (all keys optional; sending no keys → 200 no-op)
```json
{
  "name": "magalu-storefront-v2",
  "description": "Renamed for the new initiative",
  "binding_policy": "FLEXIBLE",
  "allowed_resource_types": ["application", "firewall", "function"],
  "strategy_defaults": {
    "canary":           { "enabled": true, "default_percentage": 20 },
    "skew_protection":  { "enabled": true, "default_ttl_seconds": 7200 }
  }
}
```

**Rules**
- `binding_policy` can transition `STRICT` → `FLEXIBLE`, but not the reverse if versions with different resource_ids exist.
- `deployment_policy` is **immutable**: matching value → 200 no-op, different value → 409 `AZN-DEPLOYMENT-CONFLICT-001` with pointer `/deployment_policy`.
- Sending `state` or `client_id` is rejected by Zod `.strict()`.

**Response 200**: single envelope with the full updated `DeploymentResource` (`updated_at` bumps; `last_modified_by` reflects the caller).

---

#### DELETE /v1/deployments/{deployment_id}

Delete a deployment. Requires no non-archived versions (drafts do not count as non-archived for this check). The previous FK `deployments.environment_id → environments(id)` was dropped in migration `0010`; deployments and environments are now independent CRUD entities.

**Response 204**: No body.

---

### Deployment Versions

#### POST /v1/deployments/{deployment_id}/versions

Create a **draft** deployment version. Drafts are local-only: no resource-catalog round-trip, no outbox event, fully mutable via `PATCH`. Lands in `state='draft'` with `traffic_role='INACTIVE'`.

**Limit**: 20 drafts per `(client_id, deployment_id)`. The 21st create returns `AZN-DEPLOYMENT-LIMIT-002` (HTTP 422).

**Request** — all top-level fields optional; `resources` may be an empty array, but each entry **must carry `name`** (Zod-required 1–255 chars, snapshotted into `resource_versions.name` for the GET response).
```json
{
  "resources": [
    { "id": "01HRX901...", "resource_type": "application", "name": "primary-app" },
    { "id": "01HRX902...", "resource_type": "firewall",    "name": "edge-firewall" }
  ],
  "strategy": {
    "rollout_mode": "INSTANT",
    "gradual_rollout": {
      "enabled": false,
      "candidate_percentage": null,
      "candidate_cookie_name": "__azdeploy_candidate",
      "candidate_cookie_max_age_seconds": 86400,
      "candidate_from_deployment_version_id": null
    },
    "skew_protection": {
      "enabled": true,
      "cookie_name": "__azdeploy_skew",
      "max_age_seconds": 3600,
      "max_skewed_deployments": 20
    }
  },
  "origin": {
    "type": "cli",
    "source_environment_id": null,
    "source_deployment_version_id": null,
    "promoted_from": null
  }
}
```

**Response 202**
```json
{
  "state": "executed",
  "data": {
    "id": "01HRX92PS4N7D3M2Y8T6Q1K5VC",
    "state": "draft"
  }
}
```

---

#### PATCH /v1/deployments/{deployment_id}/versions/{version_id}

Update a draft. **Full-replace per field** — any field present in the body overwrites the current value; absent fields stay as-is. Allowed only while `state='draft'`; any other state returns **409 `AZN-DEPLOYMENT-CONFLICT-001`** with pointer `/state`.

**Request** — at least one of `resources`, `strategy`, `origin` is required. When `resources` is present it is a **full-replace** of the draft's resource set, and each entry must carry `name`.
```json
{
  "resources": [
    { "id": "01HRX910...", "resource_type": "application", "name": "primary-app" }
  ],
  "strategy": { /* full VersionStrategy shape */ }
}
```

**Response 200**: Single envelope with the updated `DeploymentVersionResource` (see GET response below for the full shape — note `resources[*].resource_version_id` is `null` while still in draft).

---

#### POST /v1/deployments/{deployment_id}/versions/{version_id}/deploy

Transition a draft to `state='queued'`. **No request body.** Triggers the catalog round-trip, validates `allowed_resource_types`, runs the STRICT baseline check, enriches the `resource_versions` mirror, and emits the `INSTALL` outbox event — all in a single transaction.

**Rules**
- Version must be `state='draft'`. Any other state → 409.
- Catalog or validation failures transition the version to **`state='error'`**; retry requires creating a new draft.

**Response 202**
```json
{
  "state": "executed",
  "data": {
    "id": "01HRX92PS4N7D3M2Y8T6Q1K5VC",
    "state": "queued"
  }
}
```

---

#### GET /v1/deployments/{deployment_id}/versions/{deployment_version_id}

**Response 200** — the **full** `DeploymentVersionResource`. The `resources` projection replaces the older `resource_version_ids: string[]` (commit `07525d5`); draft slots carry `resource_version_id: null` until `/deploy` enriches them from the catalog.
```json
{
  "state": "executed",
  "data": {
    "id": "01HRX92PS4N7D3M2Y8T6Q1K5VC",
    "deployment_id": "01HRX8W6S3M9A4K7P2Q5T8Z1YB",
    "resources": [
      { "resource_type": "application", "resource_id": "01HRX900APP000000000000001", "resource_version_id": "01HRX901APPV00000000000001", "resource_name": "primary-app" },
      { "resource_type": "function",    "resource_id": "01HRX910FN0000000000000001", "resource_version_id": "01HRX902FNV000000000000001", "resource_name": "edge-fn" }
    ],
    "traffic_role": "INACTIVE",
    "strategy": {
      "rollout_mode": "INSTANT",
      "gradual_rollout": {
        "enabled": false,
        "candidate_percentage": null,
        "candidate_cookie_name": "__azdeploy_candidate",
        "candidate_cookie_max_age_seconds": 86400,
        "candidate_from_deployment_version_id": null
      },
      "skew_protection": {
        "enabled": true,
        "cookie_name": "__azdeploy_skew",
        "max_age_seconds": 3600,
        "max_skewed_deployments": 20
      }
    },
    "urls": {
      "canonical_url": null,
      "deployment_url": null
    },
    "origin": {
      "type": "cli",
      "source_environment_id": null,
      "source_deployment_version_id": null,
      "promoted_from": null
    },
    "kivo": {
      "metadata_object": null,
      "deployment_version_object": null,
      "revision_token": null
    },
    "audit": {
      "trigger": "cli",
      "requested_by_user_id": "456",
      "requested_by_email": "alice@example.com",
      "requested_at": "2026-03-18T15:10:00Z",
      "ready_at": null
    },
    "state": "queued",
    "state_detail": null,
    "client_id": "1234567",
    "last_modified_by": { "user_id": "456", "trigger": "cli", "email": "alice@example.com" },
    "created_at": "2026-03-18T15:10:00Z"
  }
}
```

**Field notes:**
- `resources[*].resource_version_id` is `null` while `state='draft'`; populated by `POST /deploy` with the catalog ULID.
- `resources[*].resource_name` is `null` only for rows persisted before migration `0015` (`resource_versions.name` column). New drafts always carry a name (Zod-required on `POST /versions`).
- `audit.requested_by_email` mirrors the JWT email of the user who created the version; `null` when auth was off or the JWT had no email.
- `strategy` is the **frozen snapshot** for non-ACTIVE versions; for the ACTIVE version it is mutated by `PATCH /strategy` (single_version only).
- `urls`, `kivo`, `audit.ready_at` are filled by the worker on `ready`; while in `draft`/`queued`/`building` they read back as `null` defaults.
- `traffic_role` ∈ `ACTIVE | CANDIDATE | VALID_URL | INACTIVE` (see [Traffic Roles](#traffic-roles-column-on-deployment_versions)).

---

#### GET /v1/deployments/{deployment_id}/versions

List versions for a deployment. Drafts are included by default.

**Query Parameters**
- `page` (default: 1, max: 1000)
- `page_size` (default: 20, max: 100)
- `state` (optional): one of `draft | queued | building | ready | error | canceled | archiving | archived` — filters the result set.

**Response 200**
```json
{
  "count": 42,
  "total_pages": 3,
  "page": 1,
  "page_size": 20,
  "next": "http://api/v1/deployments/01HRX8W6S3M9A4K7P2Q5T8Z1YB/versions?page=2&page_size=20",
  "previous": null,
  "results": [
    { /* DeploymentVersionResource — same shape as GET /:vid above */ }
  ]
}
```

---

#### POST /v1/deployments/{deployment_id}/versions/{version_id}/cancel

Cancel a version in `queued` or `building` state. Marks the pending outbox row as `canceled` rather than emitting a new event.

**Request** (all fields optional)
```json
{ "reason": "optional free-text reason, max 255 chars" }
```

**Response 200**: `{state: "executed", data: { id, state: "canceled" }}`

---

#### POST /v1/deployments/{deployment_id}/versions/{version_id}/archive

Archive a version in `ready` state. Blocked when `traffic_role IN ('ACTIVE','CANDIDATE','VALID_URL')`.

**Request**
```json
{
  "reason": "SUPERSEDED",
  "comment": "Substituida por versao mais recente"
}
```

`reason` ∈ `{ SUPERSEDED, SECURITY_ISSUE, POLICY_VIOLATION, MANUAL }`.

**Response 202**: `{state: "executed", data: { id, state: "archiving" }}`

---

#### DELETE /v1/deployments/{deployment_id}/versions/{version_id}

Delete a version.

- **Drafts** (`state='draft'`): unconditional hard-delete. No `traffic_role` check, no outbox event.
- **Non-drafts**: requires `state ∈ {canceled, archived, error}` and `traffic_role='INACTIVE'` (i.e., not currently routing). Emits `DELETE` outbox.

**Response 204**: No body.

---

#### POST /v1/deployments/{deployment_id}/versions/{version_id}/activate

Activate a `ready` version. Routing branch is decided by `deployments.deployment_policy`.

**Request** (`strategy` optional — when present, full-replace on the row)
```json
{
  "strategy": {
    "rollout_mode": "GRADUAL",
    "gradual_rollout": {
      "enabled": true,
      "candidate_percentage": 10,
      "candidate_cookie_name": "__azdeploy_candidate",
      "candidate_cookie_max_age_seconds": 86400,
      "candidate_from_deployment_version_id": null
    },
    "skew_protection": {
      "enabled": true,
      "cookie_name": "__azdeploy_skew",
      "max_age_seconds": 3600,
      "max_skewed_deployments": 20
    }
  }
}
```

`strategy` is optional; when present it overrides the version's frozen strategy for this activation (and is persisted on the row).

**Rules**
- Version must be `state='ready'`.
- **`single_version` deployment, INSTANT**: target → `ACTIVE`; previous ACTIVE → `VALID_URL` if `skew_protection.enabled`, else `INACTIVE`.
- **`single_version` deployment, GRADUAL**: target → `CANDIDATE`; previous ACTIVE stays.
- **`versioned_urls` deployment**: target → `VALID_URL`. Cap: `count(traffic_role IN ('ACTIVE','VALID_URL') WHERE deployment_id = X)` ≤ `VERSIONED_URLS_ACTIVE_LIMIT` (default 20). Over-cap → `AZN-DEPLOYMENT-LIMIT-001` (HTTP 422).
- Idempotent: re-activating a version that already serves the requested role is a 200 no-op.

**Response 200**
```json
{
  "state": "executed",
  "data": { "id": "<version_id>", "state": "routed" }
}
```

---

#### POST /v1/deployments/{deployment_id}/versions/{version_id}/rollback

Roll back to an existing version on a `single_version` environment.

**Request**
```json
{
  "reason": "Rollback devido a regressao no checkout",
  "comment": "Optional"
}
```

**Rules**
- Target version must be in `state='ready'` and `traffic_role IN ('VALID_URL', 'INACTIVE', 'ACTIVE')` (ACTIVE is a no-op).
- Deployment must be `single_version`. `versioned_urls` rejects with 422.
- The previous ACTIVE is demoted per the version's `skew_protection.enabled`.

**Response 200**: same shape as activate.

---

#### POST /v1/deployments/{deployment_id}/versions/{version_id}/promote

Clone the version into another deployment in the same account. **Creates a new `deployment_versions` row** (new ULID, copied resource_versions rows, `origin.promoted_from` stamped).

**Request**
```json
{
  "target_deployment_id": "01HRXDEPPRD000000000000000"
}
```

**Validations**
- Source version must be `state='ready'`.
- Target deployment must exist in the same account.
- Source resource types must all be in the target deployment's `allowed_resource_types`.

**Response 202**
```json
{
  "state": "executed",
  "data": {
    "id": "<clone_version_id>",
    "state": "queued"
  }
}
```

The clone lands in `state='queued'`, `traffic_role='INACTIVE'`. The worker rebuilds the artifact in the target context. A subsequent `activate` promotes it to ACTIVE/VALID_URL.

---

#### PATCH /v1/deployments/{deployment_id}/versions/{version_id}/strategy

Mutate the rollout strategy of the **ACTIVE** version on a `single_version` deployment. Strategy is stored directly on `deployment_versions.strategy` (no separate override row).

**Request**: any subset of `{gradual_rollout, skew_protection}`. Provided fields are merged over the existing strategy. Rejected with 422 when the deployment is `versioned_urls` or the target version is not ACTIVE.
```json
{
  "gradual_rollout": {
    "enabled": true,
    "candidate_percentage": 25
  },
  "skew_protection": {
    "enabled": false
  }
}
```

**Response 200**
```json
{
  "state": "executed",
  "data": {
    "deployment_id": "01HRX8W6S3M9A4K7P2Q5T8Z1YB",
    "deployment_version_id": "01HRX92PS4N7D3M2Y8T6Q1K5VC",
    "strategy": {
      "rollout_mode": "GRADUAL",
      "gradual_rollout": {
        "enabled": true,
        "candidate_percentage": 25,
        "candidate_cookie_name": "__azdeploy_candidate",
        "candidate_cookie_max_age_seconds": 86400,
        "candidate_from_deployment_version_id": null
      },
      "skew_protection": {
        "enabled": false,
        "cookie_name": "__azdeploy_skew",
        "max_age_seconds": 3600,
        "max_skewed_deployments": 20
      }
    }
  }
}
```

---

### History

#### GET /v1/deployments/history

Global deployment version history (account-scoped). Returns versions across all deployments owned by the account, newest first.

**Query Parameters**
- `page` (default: 1, max: 1000)
- `page_size` (default: 20, max: 100)
- `deployment_id` (optional): filter to a single deployment
- `state` (optional): one of `draft | queued | building | ready | archiving | archived | canceled | error`

**Response 200**
```json
{
  "count": 128,
  "total_pages": 7,
  "page": 1,
  "page_size": 20,
  "next": "http://api/v1/deployments/history?page=2&page_size=20",
  "previous": null,
  "results": [
    {
      "id": "01HRX92PS4N7D3M2Y8T6Q1K5VC",
      "deployment_id": "01HRX8W6S3M9A4K7P2Q5T8Z1YB",
      "resources": [
        { "resource_type": "application", "resource_id": "01HRX900APP000000000000001", "resource_version_id": "01HRX901APPV00000000000001", "resource_name": "primary-app" }
      ],
      "traffic_role": "ACTIVE",
      "strategy": { "rollout_mode": "INSTANT", "gradual_rollout": { /* … */ }, "skew_protection": { /* … */ } },
      "urls": { "canonical_url": "https://example.com", "deployment_url": "https://abc-123.example.com" },
      "origin": { "type": "cli", "source_environment_id": null, "source_deployment_version_id": null, "promoted_from": null },
      "kivo": { "metadata_object": "kivo://...", "deployment_version_object": "kivo://...", "revision_token": "rev_xyz" },
      "audit": {
        "trigger": "cli",
        "requested_by_user_id": "456",
        "requested_by_email": "alice@example.com",
        "requested_at": "2026-03-18T15:10:00Z",
        "ready_at": "2026-03-18T15:14:22Z"
      },
      "state": "ready",
      "state_detail": null,
      "client_id": "1234567",
      "last_modified_by": { "user_id": "456", "trigger": "cli", "email": "alice@example.com" },
      "created_at": "2026-03-18T15:10:00Z"
    }
  ]
}
```

---

#### GET /v1/deployments/{deployment_id}/history

Per-deployment history. Same response shape as `/v1/deployments/history` (no `deployment_id` query needed since the path scopes it).

**Query Parameters**
- `page` (default: 1, max: 1000)
- `page_size` (default: 20, max: 100)

**Response 200**: same list envelope as `/v1/deployments/history` above.

---

#### GET /v1/deployments/{deployment_id}/versions/diff

Compare the resource composition of two versions of the same deployment.

**Query Parameters** (both required)
- `from`: 26-char ULID of the baseline version
- `to`: 26-char ULID of the version being compared

**Response 200**
```json
{
  "state": "executed",
  "data": {
    "added":   ["01HRX910..."],
    "removed": ["01HRX902..."],
    "changed": [
      { "from": "01HRX901...", "to": "01HRX911..." }
    ]
  }
}
```

- `added`: resource_version IDs present in `to` but not in `from`
- `removed`: resource_version IDs present in `from` but not in `to`
- `changed`: pairs where `resource_id` matches but `resource_version` differs

---

### Resources

#### POST /v1/resources/{resource_version_id}/redeploy

Propagate a new resource version to every `ready` deployment_version that currently references the **old** `(resource_type, resource_version)` pair. For each match, the deployment-api clones the version with the new resource_version_id swapped in, keeping every other resource slot identical.

Lookup key is `(resource_type, resource_version)` — not `resource_id`. The catalog refactor in migration `0009` materialized this via `idx_resource_lookup_by_type` so two different catalogs cannot collide on a shared ULID.

**Path parameter**
- `{resource_version_id}`: the **new** resource_version ULID that should replace the old one.

**Request**
```json
{
  "resource_type": "application",
  "old_resource_version_id": "01HX0LDRES000000000000000A"
}
```

**Fields**
- `resource_type` (required): the catalog resource type tag (lowercase snake_case).
- `old_resource_version_id` (required): the **old** resource_version ULID being replaced. Used to locate the affected deployment_versions; must be a 26-char Crockford-base32 ULID. Returns `AZN-DEPLOYMENT-NOT_FOUND-001` if no ready deployments reference this `(resource_type, old_resource_version_id)` pair.

**Response 202**
```json
{
  "state": "executed",
  "data": {
    "redeployed": [
      {
        "id": "01NEWVERSION1...",
        "state": "queued",
        "deployment_id": "01DEP001...",
        "replaced_resource_version_id": "01HX0LDRES000000000000000A"
      }
    ]
  }
}
```

Each entry in `redeployed` is a freshly created `deployment_version` in `state='queued'` (one per affected deployment). The worker rebuilds the artifact and the consumer can poll `GET /v1/deployments/{deployment_id}/versions/{id}` for the final state.

---

### Environments

An environment is a CRUD entity that holds the protection profile and edge-surface metadata (log verbosity, robots policy, branch tracking, etc.). Post env-detach (migration `0010`), **environments are not referenced by deployments** — the routing policy moved onto `deployments.deployment_policy` and `environment_id` was dropped. The `deployment_policy` field on environments is kept for historical reasons but no longer governs routing.

#### POST /v1/environments

Create a new environment. `deployment_policy` is fixed at creation and cannot be changed afterwards (see PATCH rule below).

**Request**
```json
{
  "name": "Production storefront",
  "description": "Public-facing routing surface",
  "deployment_policy": "single_version",
  "log_verbosity": "normal",
  "robots_policy": "index",
  "protection": {
    "azion_authentication": { "enabled": false },
    "password_protection": {
      "enabled": false,
      "secret_id": null
    },
    "ip_allowlist": {
      "enabled": false,
      "cidrs": []
    },
    "sso_enforcement": {
      "enabled": false,
      "idp_id": null,
      "allowed_domains": []
    }
  },
  "branch_tracking": {
    "enabled": true,
    "mode": "branch_starts_with",
    "branch_match": "release/"
  }
}
```

**Fields**
- `name` (required): 3-255 characters
- `description` (optional): nullable string
- `deployment_policy` (required): `single_version` | `versioned_urls`. Stored on the row for historical reasons; routing now reads the policy from the deployment, not the environment.
- `log_verbosity` (optional): `normal` | `verbose` (default `normal`)
- `robots_policy` (optional): `index` | `noindex` (default `index`)
- `protection` (optional): four sub-shapes documented below; missing keys default to `enabled: false`
- `branch_tracking` (optional): `{enabled, mode, branch_match}` or `null`. `mode` ∈ `{branch_is, branch_starts_with, branch_ends_with}`

**Protection sub-shapes**
| Sub-shape | Fields |
|---|---|
| `azion_authentication` | `{ enabled }` |
| `password_protection` | `{ enabled, secret_id: string \| null }` |
| `ip_allowlist` | `{ enabled, cidrs: string[] }` |
| `sso_enforcement` | `{ enabled, idp_id: string \| null, allowed_domains: string[] }` |

**Response 201**
```json
{
  "state": "executed",
  "data": {
    "id": "01HRXENVPRD0000000000000000",
    "name": "Production storefront",
    "description": "Public-facing routing surface",
    "deployment_policy": "single_version",
    "log_verbosity": "normal",
    "robots_policy": "index",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist":        { "enabled": false, "cidrs": [] },
      "sso_enforcement":     { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": {
      "enabled": true,
      "mode": "branch_starts_with",
      "branch_match": "release/"
    },
    "state": "queued",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-03-18T15:00:00Z",
    "updated_at": null,
    "created_by":       { "user_id": "456", "trigger": "console", "email": "alice@example.com" },
    "last_modified_by": { "user_id": "456", "trigger": "console", "email": "alice@example.com" }
  }
}
```

`state` is set to `'queued'` on create and progresses via the worker (`queued → building → ready`). Use the GraphQL `getResourceState` query (with `resourceType: "environment"`) for cheap polling — see the [GraphQL endpoint](#get-graphql-post-graphql-options-graphql) section.

---

#### GET /v1/environments

List environments for the authenticated account.

**Query Parameters**
- `page` (default: 1, max: 1000)
- `page_size` (default: 20, max: 100)
- `name` (optional): filter by name substring (case-insensitive)

**Response 200**
```json
{
  "count": 3,
  "total_pages": 1,
  "page": 1,
  "page_size": 20,
  "next": null,
  "previous": null,
  "results": [
    { /* EnvironmentResource — same shape as POST 201 response above */ }
  ]
}
```

---

#### GET /v1/environments/{id}

Get an environment by ID. Account-scoped — returns 404 if the id belongs to another tenant.

**Response 200**: single envelope with the full `EnvironmentResource` (same shape as the `POST` response).

---

#### PATCH /v1/environments/{id}

Update an environment. All fields are optional; only present fields are applied.

**Request** (any subset of mutable fields)
```json
{
  "name": "Production storefront — renamed",
  "description": null,
  "log_verbosity": "verbose",
  "robots_policy": "noindex",
  "protection": {
    "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8"] }
  },
  "branch_tracking": {
    "enabled": true,
    "mode": "branch_is",
    "branch_match": "main"
  }
}
```

**Rules**
- `deployment_policy` is still **immutable on the environment row**: same value → 200 no-op, different value → 409 `AZN-DEPLOYMENT-CONFLICT-001`. (The same enforcement now also lives on `deployments` — see PATCH /v1/deployments.)
- `client_id` and `state` are not accepted (Zod `.strict()` rejects them with 400).
- `protection` accepts partial sub-shapes — only present keys are merged over the current value.

**Response 200**: single envelope with the full updated `EnvironmentResource` (`updated_at` bumps; `last_modified_by` reflects the caller's `Actor`).

---

#### DELETE /v1/environments/{id}

Delete an environment. Post env-detach there is no FK to deployments — the delete succeeds regardless of whether deployments exist in the account.

**Response 204**: No body.

---

## ID Format

All IDs are bare 26-character Crockford-base32 ULIDs (no prefix):

```
01HRX8W6S3M9A4K7P2Q5T8Z1YB
```

Validation regex: `^[0-9A-HJ-NP-TV-Z]{26}$`

---

## State Machine

The same 8-state enum (`EntityLifecycleState`) backs `environments.state`, `deployments.state`, and `deployment_versions.state`. Values: `draft | queued | building | ready | error | canceled | archiving | archived`.

### Deployment Version States

```
                       POST /deploy                 worker
draft  ───────────────────────────────►  queued ───────────►  building  ──►  ready  ──►  archiving  ──►  archived
  │                                       │                     │              │
  │ (catalog or validation fails)         │ cancel              │ cancel       │ (no API transition)
  └──────────────────────────────────────►error                 ▼              ▼
  │                                                          canceled       (cancel rejected from ready;
  │ DELETE  (hard delete, no outbox)                                         must Archive first)
  ▼
(removed)
```

- `draft` is the only state where the version is mutable (`PATCH`).
- The transition `draft → queued` only happens via `POST /:vid/deploy`.
- Catalog/validation failures during `/deploy` land the row in `state='error'`; retry requires creating a new draft.

### Environment / Deployment States

Both entities land in `state='queued'` on create. The worker drives `queued → building → ready` (and `archiving → archived`) by writing directly to the column. The API drives only the explicit transitions `cancel` / `archive` / `markError` via entity methods (paralleled with `DeploymentVersion`). PATCH on the row never touches `state` — sending `state` in the body is rejected by Zod (`.strict`).

```
   create               worker                              worker
  ───────►  queued ────────────► building ────────────► ready ───────► archiving ───────► archived
              │                     │                     │
              │ cancel              │ cancel              │ archive
              ▼                     ▼                     ▼
           canceled             canceled              archiving
              │                                              (worker → archived)
              │ markError (queued/building/draft → error)
              ▼
            error
```

Every write to `state` — whether from the API (cancel/archive/markError) or the worker (direct SQL) — fires an `AFTER UPDATE OF state` trigger that publishes an `outbox(operation='install')` row (literal lowered from `'UPDATE'` in `0016`; `UPDATE` was retired and consolidated into `install`) carrying the entity's current desired-state doc. See [`docs/OUTBOX-EVENTS.md`](OUTBOX-EVENTS.md) for the payload shapes.

### Traffic Roles (column on `deployment_versions`)

| Role | Description |
|------|-------------|
| `ACTIVE` | Currently routed for the deployment. At most one per deployment (enforced by partial unique index `idx_unique_active_version`). |
| `CANDIDATE` | Gradual rollout candidate. Coexists with an `ACTIVE` version when `rollout_mode=GRADUAL`. |
| `VALID_URL` | Reachable via versioned URL. Used by `versioned_urls` envs (cap at runtime) and as the demotion target when `skew_protection.enabled=true`. |
| `INACTIVE` | Kept in DB for rollback. The Edge has dropped the artifact; the API can re-route to it via rollback. |

---

## Error Catalog

All errors use `AZN-DEPLOYMENT-{CATEGORY}-{NNN}` codes:

| Code | Category | Example |
|------|----------|---------|
| `AZN-DEPLOYMENT-NOT_FOUND-001` | NotFound | Deployment, Environment, Version not found (cross-account access also surfaces as not-found) |
| `AZN-DEPLOYMENT-CONFLICT-001` | Conflict | Immutable field (incl. `deployment_policy`), state transition (incl. `PATCH /:vid` on non-draft), policy violation |
| `AZN-DEPLOYMENT-VALIDATION-001` | Validation | Field validation failure (incl. unknown resource_type and resource-not-found surfacing at `/deploy`) |
| `AZN-DEPLOYMENT-VALIDATION-002` | Validation | Invalid enum value / resource_type not in `allowed_resource_types` |
| `AZN-DEPLOYMENT-LIMIT-001` | Limit | `versioned_urls` cap exceeded (per-deployment) |
| `AZN-DEPLOYMENT-LIMIT-002` | Limit | Draft limit exceeded (20 per `(client_id, deployment_id)`) |

Field pointers use `/<field>` format (no `/data/attributes` prefix).
