# Deployment API — Endpoints

Human-readable map of the HTTP + GraphQL surface with inline JSON examples. **The authoritative request/response shapes live in [`../openapi-schema.yaml`](../openapi-schema.yaml)** — this doc captures semantics, contracts, and gotchas the OpenAPI alone does not convey.

Error codes referenced below come from [`ERRORS.md`](./ERRORS.md). Outbox event payloads emitted by lifecycle transitions are documented in [`OUTBOX-EVENTS.md`](./OUTBOX-EVENTS.md).

## How to query state

| Use case | Recommended channel | Endpoint |
|---|---|---|
| State of a single deployment | **GraphQL** | `getResourceState([{resourceType:'deployment', resourceId:<did>}])` |
| State of a single release | **GraphQL** | `getResourceState([{resourceType:'release', resourceId:<did>, resourceVersion:<rid>}])` |
| Batch state lookup (N resources, mixed types) | **GraphQL** | `getResourceState([...])` |
| Paginated release listing for a deployment | **HTTP REST** | `GET /v4/deployments/{did}/releases` (with optional `?state=` filter) |
| Paginated release history of a deployment (state-only) | **GraphQL** | `getDeploymentHistory(clientId, deploymentId, page, pageSize)` |
| Full resource (not just state) | **HTTP REST** | `GET /v4/deployments/{id}` or `GET /v4/deployments/{did}/releases/{rid}` |

GraphQL is the optimized state-only channel for service-to-service callers (Data Plane, edge-api, Config Builder). HTTP GETs return the resource in full (state + metadata + audit + composition) for end-user / SDK consumers.

## Conventions

| Aspect | Value |
|---|---|
| Base path | `/v4/` |
| IDs | Bare **short_id** strings (version char + base36 payload; A=8 chars). Pattern `^[A-Z][A-Z0-9]+$`. DTOs accept up to 26 chars (DB columns are `VARCHAR(26)`). |
| Multi-tenant | Every entity carries `client_id` from `auth.account.clientId` |
| Single response envelope | `{ "data": { ...flat resource } }` |
| List response envelope (Azion V4) | `{ count, total_pages, page, page_size, next, previous, results: [...] }` |
| Error envelope | `{ "errors": [{ status, code, title, detail, meta }] }` — `meta.source.pointer` = `/<field>` |
| Request body | **Flat** — no `{data:{type,attributes}}` wrapper |

`created_by` / `last_modified_by` on **responses** (and on outbox payloads) are a **plain email string** — the requester's email or `null` for service-to-service / dev. Clients never supply these fields in **request** bodies either; they are derived server-side from the authenticated session.

Internally each value is persisted as a JSONB **Actor snapshot** `{ user_id, trigger, email }` (mirrors `@azion/versioning` lib's shape) for audit purposes. The wire contract projects only `email` — `user_id` (always equal to `client_id`) and `trigger` (the lowercased `X-Trigger` header: `api | cli | console | terraform | sdk`) stay in the database to answer "who made this change and how" without leaking implementation noise on the public surface. The same `audit.trigger` field is exposed on `release` rows (releases) inside their `audit` JSONB.

## Authentication

`/v4/*` is gated by two middlewares (mounted only when `AUTH_ENABLED=true`):

1. **`azionAuthMiddleware`** — validates SSO credential (API token, JWT Bearer, or session cookie). Sets `c.set('auth', ...)` and `c.set('clientId', ...)`. Failures: `401 AZN-AUTH-NOT_AUTHENTICATED-001` or `403 AZN-AUTH-PERMISSION_DENIED-001`.
2. **`requireV6FlagMiddleware`** — checks `auth.account.flags` for `'use_v6_configurations'`. Failure: `403 AZN-AUTH-PERMISSION_DENIED-001` with `title: "v6 Flag Required"`. Skipped when env `V6_FLAG_REQUIRED !== 'true'`.

In dev (`AUTH_ENABLED=false`) neither middleware runs; `clientIdOf(c)` falls back to `DEV_CLIENT_ID` (default `'1234567'`).

`/health`, `/health/db`, and `/api/graphql` live **outside** `/v4/*`. They are gated by a shared-secret middleware: `/health` + `/health/db` use `Authorization: Bearer <SSO_GQL_SECRET>` (constant-time compare); `/api/graphql` uses an `X-Secret` header validated against the `graphql_secrets` table. Any failure returns **`404`** with empty body (security-through-obscurity).

---

## Service endpoints

### GET /health

Liveness probe. No SSO; gated by the shared-secret middleware when `AUTH_ENABLED=true`.

**Response 200**

```json
{ "status": "ok", "timestamp": "2026-06-08T14:22:01.812Z" }
```

### GET /health/db

Readiness probe — executes `SELECT 1` against the configured Postgres pool. On failure surfaces both the Drizzle wrapper (`error`/`errorName`) and the underlying driver error (`cause`/`causeName`).

**Response 200**

```json
{ "status": "ok", "database": "connected", "responseTime": "4ms", "timestamp": "2026-06-08T14:22:01.812Z" }
```

**Response 503**

```json
{ "status": "error", "database": "disconnected", "error": "...", "errorName": "Error", "cause": "...", "responseTime": "39ms", "timestamp": "2026-06-08T14:22:01.812Z" }
```

---

## GraphQL — `POST /api/graphql`

Yoga endpoint mounted **outside** `/v4/*`. Schema lives at `src/infrastructure/graphql/schema.ts`. Gated by an `X-Secret` header validated against the `graphql_secrets` table — **service-to-service only**. Auth failure returns `404` empty body. GraphQL execution errors return `200` with `{data:null, errors:[...]}` per GraphQL spec.

The SDL is inlined in `schema.ts` (the Edge bundle can't `readFileSync` a `.graphql` at runtime). A canonical copy is generated to `schema.graphql` at the repo root via `npm run generate-graphql-schema`; the `Generate GraphQL schema` workflow keeps it in sync on PRs.

State on the GraphQL boundary is **UPPERCASE** (`READY`, `QUEUED`, `BUILDING`, etc) — converted in the resolver. The underlying DB column stays lowercase. Aligns with edge-api convention.

### Query: `resourceVersionInUse`

```graphql
query Q($cid:String!, $rt:String!, $rv:String!) {
  resourceVersionInUse(clientId: $cid, resourceType: $rt, resourceVersion: $rv)
}
```

Returns `true` when ≥1 READY `release` in the given tenant references `(resource_type, resource_version)`. Backed by `idx_resource_lookup_by_type` on `resource_versions`. Used by edge-api to gate hard-delete.

**Example response**

```json
{ "data": { "resourceVersionInUse": true } }
```

### Query: `getResourceState`

```graphql
query Q($r:[ResourceStateInput!]!) {
  getResourceState(resources: $r) {
    resourceType resourceId resourceVersion state
  }
}
```

Batch state lookup. Input tuples: `{ resourceType, resourceId, resourceVersion? }`. Supported `resourceType`: `deployment`, `release` (`environment` returns `state: null` — moved to environment-api). `resourceVersion` is required only for `release`. Output preserves input order (1:1). Missing rows / unknown types / parent-guard failures return `state: null`.

**Carve-out:** `findStateById` for `deployment` does **not** filter by `client_id` — `/api/graphql` is service-to-service. For `release`, the parent guard ensures the version belongs to the given deployment (returns null otherwise; never reveals cross-deployment existence).

**Example request variables**

```json
{
  "r": [
    { "resourceType": "deployment", "resourceId": "ADEPSTG1", "resourceVersion": null },
    { "resourceType": "release", "resourceId": "ADEPSTG1", "resourceVersion": "ARELACT1" }
  ]
}
```

**Example response**

```json
{
  "data": {
    "getResourceState": [
      { "resourceType": "deployment", "resourceId": "ADEPSTG1", "resourceVersion": null, "state": "READY" },
      { "resourceType": "release", "resourceId": "ADEPSTG1", "resourceVersion": "ARELACT1", "state": "READY" }
    ]
  }
}
```

### Query: `getDeploymentHistory`

```graphql
query Q($cid:String!, $did:String!, $page:Int, $pageSize:Int) {
  getDeploymentHistory(clientId: $cid, deploymentId: $did, page: $page, pageSize: $pageSize) {
    count page pageSize totalPages
    results { id deploymentId state trafficRole createdAt }
  }
}
```

Paginated release history (`releases`) for a single deployment. State-focused and shaped for service-to-service consumers (full release records are served by HTTP `GET /v4/deployments/{did}/releases`). `clientId` is **required** (no auth context inside `/api/graphql`). State is UPPERCASE on the boundary.

**Example response**

```json
{
  "data": {
    "getDeploymentHistory": {
      "count": 3, "page": 1, "pageSize": 10, "totalPages": 1,
      "results": [
        { "id": "ARELACT1", "deploymentId": "ADEPSTG1", "state": "READY", "trafficRole": "ACTIVE", "createdAt": "2026-06-08T14:00:00.000Z" },
        { "id": "ARELOL01", "deploymentId": "ADEPSTG1", "state": "ARCHIVED", "trafficRole": "INACTIVE", "createdAt": "2026-06-07T10:00:00.000Z" }
      ]
    }
  }
}
```

### Mapping: GraphQL ↔ use case ↔ HTTP equivalent

| GraphQL query | Use case | HTTP equivalent |
|---|---|---|
| `resourceVersionInUse` | `CheckResourceVersionUsageUseCase` | none (cross-service hook) |
| `getResourceState` (deployment) | `GetDeploymentStateUseCase` | `GET /v4/deployments/{id}` (returns full resource) |
| `getResourceState` (release) | `GetReleaseStateUseCase` | `GET /v4/deployments/{did}/releases/{rid}` (returns full resource) |
| `getDeploymentHistory` | `GetDeploymentHistoryUseCase` | `GET /v4/deployments/{did}/releases` (HTTP returns full Release records) |

### cURL example

```bash
curl -X POST -H 'X-Secret: <secret>' -H 'Content-Type: application/json' \
  https://api.azion.net/api/graphql \
  -d '{"query":"{ getDeploymentHistory(clientId:\"1234567\", deploymentId:\"ADEPSTG1\", page:1, pageSize:5) { count results { id state trafficRole } } }"}'
```

---

## Deployments (CRUD on the base)

### POST /v4/deployments

Creates a new deployment (base row). **Does not emit an outbox event** — the edge first hears about a deployment when its first release is activated.

**Request**

```json
{
  "name": "public-api",
  "description": "optional",
  "binding_policy": "FLEXIBLE",
  "deployment_policy": "single_version",
  "strategy_defaults": {}
}
```

**Response 201**

```json
{
  "data": {
    "id": "ADEPSTG1",
    "name": "public-api",
    "description": null,
    "binding_policy": "FLEXIBLE",
    "deployment_policy": "single_version",
    "strategy_defaults": {},
    "state": "queued",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-06-08T14:22:01.812Z",
    "updated_at": null,
    "created_by": "alice@example.com",
    "last_modified_by": "alice@example.com"
  }
}
```

- **400** — Zod validation failed
- **422** — domain validation (e.g., invalid enum)

### GET /v4/deployments

Lists deployments (Azion V4 pagination + `?name=<substring>` filter). One row per deployment (base + latest version row). Each result includes `version_id` (the latest `deployment_versions.id` projected into the response) alongside `id` (the base `deployments.id`); `state` is the version's state.

**Response 200**

```json
{
  "count": 42,
  "total_pages": 3,
  "page": 1,
  "page_size": 20,
  "next": "http://localhost:3000/v4/deployments?page=2&page_size=20",
  "previous": null,
  "results": [ { "id": "ADEPSTG1", "version_id": "AVERS001", "name": "public-api", "state": "ready", "...": "..." } ]
}
```

### GET /v4/deployments/{id}

Reads a deployment. **Resolves a base-row to its latest READY version** (fallback to latest if none ready). Returns the same resource shape as POST 201.

- **404** — `43000 DEPLOYMENT_NOT_FOUND` if no row matches `(client_id, id)`

### PATCH /v4/deployments/{id}

Updates a deployment. Clones the latest READY into a new DRAFT and returns the draft with `meta`. Accepts `name`, `description`, `binding_policy`, `deployment_policy` (idempotent), `strategy_defaults`.

**Request**

```json
{ "name": "public-api-v2", "description": "renamed" }
```

**Response 200** — single resource envelope (base-row path includes a `meta` object alongside the resource).

- **404** — not found
- **409** — `43004 IMMUTABLE_FIELD` on `deployment_policy` mismatch; `43005 CANNOT_TIGHTEN_POLICY` for FLEXIBLE→STRICT against non-homogeneous history

### DELETE /v4/deployments/{id}

Hard-deletes a deployment. Blocked while any non-archived `release` still references it.

**Response 200** — `{ "data": null }`
- **404** — not found
- **409** — `43001 DEPLOYMENT_HAS_ACTIVE_VERSIONS`

---

## Deployments — Build-config versioning (`/v4/deployments/{id}/versions/*`)

Powered by the external lib `@azion/versioning` mounted under `/v4/deployments`. Version rows live in the sibling `deployment_versions` table — one row per `(deployment_id, version_number)`. The `deployments` table holds identity + denormalized state only. See [DATABASE.md](./DATABASE.md) and [DATA-MODEL-AND-FLOW.md](./DATA-MODEL-AND-FLOW.md).

### GET /v4/deployments/{id}/versions

Lists version-rows of a deployment with their `versioning_resource_meta` lifecycle state. Pagination + `?fields=` sparse fieldset.

### POST /v4/deployments/{id}/versions

Creates a new DRAFT by cloning the latest READY version-row. Limit: `MAX_VERSIONING_DRAFTS_PER_RESOURCE` per `(client_id, base_id)` (default 20).

**Response 202**

```json
{ "data": { "id": "ADEPVRD1", "state": "draft" } }
```

### GET /v4/deployments/{id}/versions/{vid}

Reads a specific version-row by `meta.version_id` (or row id). Response wraps the deployment resource + `meta` object.

### PATCH /v4/deployments/{id}/versions/{vid}

Edits a DRAFT version-row's build-config fields. Only valid while `meta.state='draft'`.

- **409** — version is not a draft

### POST /v4/deployments/{id}/versions/{vid}/build

**Finalize**: transitions DRAFT → QUEUED and emits an INSTALL outbox event. The worker advances `queued → building → ready` via `outbox.status`; the `sync_outbox_to_version_meta` trigger mirrors onto `meta.state`. Mirrors edge-api's `/build` verb.

**Response 202**

```json
{ "data": { "id": "ADEPVRD1", "state": "queued" } }
```

- **409** — invalid state transition
- **422** — catalog validation failed

### POST /v4/deployments/{id}/versions/{vid}/cancel

Cancels a queued/building version-row.

### POST /v4/deployments/{id}/versions/{vid}/archive

Transitions a READY version-row → archiving (worker drives the rest).

### DELETE /v4/deployments/{id}/versions/{vid}

Hard-deletes draft/error/canceled rows; enqueues a delete outbox event for ready rows. Blocked while traffic_role ≠ INACTIVE.

---

## Releases — Build and Activate (one-shot)

### POST /v4/deployments/{id}/build_and_activate

Creates a draft release, validates the catalog, transitions to QUEUED, and emits an INSTALL outbox event with `outbox.auto_activate=TRUE` on the column. When the worker finishes the build (`outbox.status='succeeded'`), the SQL trigger `trg_outbox_auto_activate_on_success` flips the release's `traffic_role` to `ACTIVE` (demoting the previous ACTIVE) and emits a `deployment / install` event with the new routing. Atomic equivalent of `POST /releases` + `POST /releases/:rid/build` + `POST /releases/:rid/activate` — without client polling. Use this for the first upload of a deployment to the edge.

**Request**

```json
{
  "resources": [
    { "resource_id": 521846, "resource_version": "AAPV0001", "resource_type": "application", "name": "my-app" }
  ],
  "strategy": { /* optional */ },
  "origin":   { /* optional */ }
}
```

Both ids come from the client at draft time. `resource_id` is the upstream entity id (positive integer, e.g. an Application or Connector row id). `resource_version` is the meta short_id pinned by the upstream catalog when the resource was last published. The /build catalog round-trip only validates state for the pair; it no longer resolves a version on the client's behalf.

**Response 202**

```json
{ "data": { "id": "ARELNEW1", "state": "queued", "trace_id": "fdf67102-a2eb-45ce-92fb-c7dbf1d8e8d2" } }
```

`trace_id` is an auto-generated UUIDv4 persisted on `outbox.trace_id` for this build. The auto-activate trigger propagates it onto the follow-on `deployment / install` row so the entire build → activate chain shares one id — index, log, or join on it to trace the async flow.

- **404** — deployment not found
- **422** — catalog rejected (resource missing/blocked/unknown type) or composition invalid

> The outbox event emitted by the auto-activate trigger is **stripped** (no skew/candidate cookies). A subsequent `/activate` or `PATCH /strategy` re-emits the full doc.

---

## Releases (`/v4/deployments/{did}/releases/*`)

Operations on the `releases` table — the URL says **releases**, the table stays `releases`. `:did` is the parent deployment id; `:rid` is the release id. Every handler validates `release.deployment_id === did` AND `release.client_id === auth.client_id` (404 on mismatch).

### POST /v4/deployments/{did}/releases

Creates a release in `state="draft"`. Drafts are local — no catalog call, no outbox event. Refine via PATCH; finalize via POST on `/releases/:rid/build`. Limit: `DRAFT_LIMIT_PER_DEPLOYMENT` per `(client_id, deployment_id)` (default 20).

**Request**

```json
{
  "resources": [
    { "resource_id": 521846, "resource_version": "AAPV0001", "resource_type": "application", "name": "my-app" }
  ],
  "strategy": { /* optional */ },
  "origin":   { /* optional */ }
}
```

**Response 202** — `{ "data": { "id": "ARELDRF1", "state": "draft" } }`

- **404** — deployment not found
- **422** — `43003 DRAFT_LIMIT_EXCEEDED`

### GET /v4/deployments/{did}/releases

Lists releases for a deployment. Pagination + `?state` filter.

### GET /v4/deployments/{did}/releases/{rid}

Reads a single release. Response includes `resources`, `strategy`, `urls`, `kivo`, `origin`, `audit`, `traffic_role`, `state`, etc.

### PATCH /v4/deployments/{did}/releases/{rid}

Full-replace patch over a release in `draft` **or** `error` (`resources`, `strategy`, `origin`). Body must carry ≥1 of the three. The row stays in its source state — PATCH never transitions to `queued`; the subsequent `/build` does. Admitting `error` here lets a failed release be edited and rebuilt in place without going through delete + recreate. Other states (`canceled`, `queued`, `building`, `ready`, `archived`, `archiving`) are rejected with 409.

- **409** — release is not in `draft` nor `error`

### POST /v4/deployments/{did}/releases/{rid}/build

**Finalize**: transitions `draft → queued` (or `error → queued` for an in-place rebuild) + emits INSTALL outbox so the worker builds the artifact at the edge. Calls the resource catalog, runs STRICT baseline checks. On any failure, the release transitions to `state="error"` — the caller can PATCH new resources and call /build again without going through delete + recreate. Mirrors edge-api's `/build` verb. Routing is a separate, later step (`/activate`).

**Response 202** — `{ "data": { "id": "ARELQ001", "state": "queued", "trace_id": "fdf67102-a2eb-45ce-92fb-c7dbf1d8e8d2" } }`

`trace_id` is an auto-generated UUIDv4 persisted on `outbox.trace_id`, mirrored into `message.trace_id`. Use it to correlate the async build downstream.
- **404** — release not found
- **409** — release is not in `draft` nor `error`
- **422** — catalog/composition validation failed

### DELETE /v4/deployments/{did}/releases/{rid}

Deletes a release. Allowed only for draft/canceled/error/archived states; blocked otherwise.

---

## Releases — Lifecycle

### POST /v4/deployments/{did}/releases/{rid}/cancel

Cancels a queued or building release.

**Request** — `{ "reason": "optional" }`
- **202** — `{ "data": { ...resource, "state": "canceled" } }`
- **409** — invalid state transition

### POST /v4/deployments/{did}/releases/{rid}/archive

Archives a READY release. Required body: `reason` (`SUPERSEDED | SECURITY_ISSUE | POLICY_VIOLATION | MANUAL`) + optional `comment`.

- **202** — async transition (returns `{data: {id, state}}`)
- **409** — release is `ACTIVE` (must demote first) or still referenced

### POST /v4/deployments/{did}/releases/{rid}/promote

Clones the release into another deployment. Always **clones** (creates a brand-new row + new `resource_versions` rows pointing at the same `(resource_id, resource_version)` pairs) — never a reference.

**Request** — `{ "target_deployment_id": "ATGTDEP1" }`
- **202** — `{ "data": { "id": "ARELCLN1", "deployment_id": "ATGTDEP1", "state": "queued" } }`
- **404** — target deployment or source release not found

---

## Releases — Routing

`traffic_role` controls which release serves traffic for a given deployment. `{ ACTIVE | CANDIDATE | VALID_URL | INACTIVE }`. The partial UNIQUE index `idx_unique_active_version` enforces **one `ACTIVE` per `deployment_id`**.

### POST /v4/deployments/{did}/releases/{rid}/activate

Routes traffic to this release. `single_version` deployments swap `ACTIVE` instantly (INSTANT) or stage CANDIDATE (GRADUAL); `versioned_urls` appends a `VALID_URL` slot.

In addition to the routing update, every INSTANT activate (and `versioned_urls` slot append) snapshots the deployment build-config into a new (or reused) deployment version-row carrying `activated_release_id = <rid>`. The rule:

- If the latest deployment version-row's `meta.state = 'draft'` (a pending PATCH or POST /versions draft) → that draft is **promoted to `ready`** + stamped with `activated_release_id`. No new row created.
- Otherwise → the latest READY version-row (fallback latest, fallback base) is cloned into a new version-row directly in `state='ready'`, with `activated_release_id` set + a fresh `versioning_resource_meta` row in `state='ready'`.

GRADUAL activations (CANDIDATE only) skip the snapshot — it fires when the candidate is later promoted to ACTIVE.

The same logic applies to the `/build_and_activate` auto-activate path inside trigger `trg_outbox_auto_activate_on_success`.

**Request** — `{ "strategy": { /* optional override */ } }`
- **202** — `{ "data": { "id": "ARELACT1", "state": "routed" } }`
- **422** — `VERSIONED_URLS_ACTIVE_LIMIT` exceeded

### POST /v4/deployments/{did}/releases/{rid}/rollback

Rolls back `ACTIVE` on a `single_version` deployment to a previously routed release (must be in `state=ready`). Snapshots the deployment build-config under the same rule as `/activate`.

**Request** — `{ "reason": "operator-supplied", "comment": "optional" }`
- **422** — deployment policy is `versioned_urls`

### PATCH /v4/deployments/{did}/releases/{rid}/strategy

Mutates `releases.strategy` for the ACTIVE release (`single_version` only). Partial merge of `gradual_rollout` / `skew_protection`.

- **200** — `{ "data": { "deployment_id": "...", "release_id": "...", "strategy": {...} } }`
- **422** — release is not ACTIVE or deployment is `versioned_urls`

---

## State machine

The 10-state enum applies to `releases.state` and `versioning_resource_meta.state` (lifecycle of base+version rows):

```
draft → queued → building → ready
              ↘ canceled
              ↘ error
ready → archiving → archived
ready → deleting → deleted
draft/error/canceled → archived | deleted    (direct, no outbox)
```

API-driven transitions: `create draft`, `finalize` (POST on `:vid/build` or `:rid/build`), `cancel`, `archive`, `delete`, `activate`, `rollback`, `promote`. Worker drives `queued → building → ready` (and `archiving → archived`, `deleting → deleted`) via `outbox.status` updates; the `sync_outbox_to_version_meta` trigger (vendored from `azion-api-libs/azion-versioning`) mirrors onto `versioning_resource_meta.state`.

For `releases`, `traffic_role` is orthogonal to `state` and controls routing. The partial UNIQUE index `idx_unique_active_version` enforces **one `ACTIVE` per `deployment_id`**.

The one-shot `POST /build_and_activate` sets `outbox.auto_activate=TRUE` on the new column (the marker lives outside `message.payload` because the Config Builder rejects unknown payload keys as resource_type variants). When the worker writes `outbox.status='succeeded'`, the trigger `trg_outbox_auto_activate_on_success` flips the release's `traffic_role` to `ACTIVE` and emits a `deployment / install` event with the new routing. On `status='error'`, a sibling trigger clears the column so retries do not silently re-activate.

---

## Error envelope

All error responses follow the JSON:API shape via `@azion/js-api-errors`:

```json
{
  "errors": [{
    "status": "409",
    "code": "43004",
    "title": "Field Cannot Be Modified",
    "detail": "The field 'deployment_policy' is immutable after creation.",
    "meta": { "source": { "pointer": "/deployment_policy" } }
  }]
}
```

The pointer convention is **flat** (`/<field>`) — lifted from `meta.source.pointer` by `app.onError` in `src/main.ts`. Codes are numeric, in the `43000-43005` range. Full catalog in [`ERRORS.md`](./ERRORS.md).
