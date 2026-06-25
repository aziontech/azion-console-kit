# Deployment API — Endpoints

Human-readable map of the HTTP + GraphQL surface with inline JSON examples. **The authoritative request/response shapes live in [`../openapi-schema.yaml`](../openapi-schema.yaml)** — this doc captures semantics, contracts, and gotchas the OpenAPI alone does not convey.

Error codes referenced below come from [`ERRORS.md`](./ERRORS.md). Outbox event payloads emitted by lifecycle transitions are documented in [`OUTBOX-EVENTS.md`](./OUTBOX-EVENTS.md).

## How to query state

| Use case | Recommended channel | Endpoint |
|---|---|---|
| State of a single deployment | **GraphQL** | `getResourceState([{resourceType:'deployment', resourceId:<did>}])` |
| State of a single release | **GraphQL** | `getResourceState([{resourceType:'release', resourceId:<did>, resourceVersion:<rid>}])` |
| Batch state lookup (N resources, mixed types) | **GraphQL** | `getResourceState([...])` |
| Paginated release listing for a deployment | **HTTP REST** | `GET /v4/deployments/{did}/releases` (filters: `?state=`, `?traffic_role=active`) |
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
| Pagination | `?page` (1-based, default 1, max 1000) + `?page_size` (default 20, max 100) |
| Ordering | `?ordering=<field>` — **azion-django-extensions / DRF OrderingFilter** convention: prefix with `-` for descending, comma-separate multiple fields. Unknown fields are silently ignored; default ordering used as fallback. Example: `?ordering=-created_at,name` |
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

Batch state lookup. Input semantics per `resourceType`:
- `deployment` → `resourceId` = deployment_id (required); `resourceVersion` must be null.
- `release` → `resourceVersion` = release_id (required); `resourceId` is ignored and may be omitted.
- `environment` → returns `state: null` (moved to environment-api).

Output preserves input order (1:1). `state` is null when the resource is not found, the required key is omitted, or the `resourceType` is unrecognized. Both lookups bypass `client_id` filtering — `/api/graphql` is the secret-gated service-to-service carve-out.

**Example request variables**

```json
{
  "r": [
    { "resourceType": "deployment", "resourceId": "ADEPSTG1" },
    { "resourceType": "release", "resourceVersion": "ARELACT1" }
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

Creates a deployment (base row + a v1 version-row in `state='draft'`). **Does not emit an outbox event** and has **no effect on the edge** — by design, a deployment stays purely local until its first release becomes ACTIVE (via `/build_and_activate` or `POST /releases/:rid/activate`). Mirrors the env-api / edge-api convention: drafts are local, only the activation of a release publishes the deployment to the edge.

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
    "state": "draft",
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

Lists deployments (Azion V4 pagination). One row per deployment (base + latest version row). Each result includes `version_id` (the latest `deployment_versions.id` projected into the response) alongside `id` (the base `deployments.id`); `state` is the version's state.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (1-based, default 1, max 1000) |
| `page_size` | integer | Items per page (default 20, max 100) |
| `name` | string | Case-insensitive substring filter on deployment name |
| `ordering` | string | Comma-separated sort fields. Prefix with `-` for descending. **Allowed:** `id`, `name`, `created_at`, `updated_at`, `state`. **Default:** `-created_at,-id` (newest first). Example: `?ordering=-state,name` |

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

Updates a deployment. **State-aware**: if the latest `deployment_versions` row is in `state='draft'`, PATCH refines that row in place (no clone). If the latest row is in any other state (`ready`/`error`/`queued`/`building`/`archiving`/`archived`/`canceled`), PATCH **clones** the latest into a new draft and applies the patch there — the existing row is preserved. Successive PATCHes against a deployment whose head is `draft` keep editing the same row; the first PATCH after a finalized version forks a new draft. Returns the draft with `meta`. Accepts `name`, `description`, `binding_policy`, `deployment_policy` (idempotent), `strategy_defaults`.

**Request**

```json
{ "name": "public-api-v2", "description": "renamed" }
```

**Response 200** — single resource envelope (base-row path includes a `meta` object alongside the resource).

- **404** — not found
- **409** — `43004 IMMUTABLE_FIELD` on `deployment_policy` mismatch; `43005 CANNOT_TIGHTEN_POLICY` for FLEXIBLE→STRICT against non-homogeneous history

### DELETE /v4/deployments/{id}

Soft-deletes a deployment (async, edge parity). The base + its `deployment_versions` + its `releases` all transition to `deleting` (cascade) and a base-level `deployment / delete` outbox event is emitted; the worker drives them to `deleted` (state-aware trigger `sync_outbox_base_delete_to_deployment`). Blocked (`RESOURCE_IN_USE`) while the deployment is bound to a workload on the edge.

**Response 204** — no content
- **404** — not found
- **409** — `RESOURCE_IN_USE`

### POST /v4/deployments/{id}/archive

Soft-archives a deployment (async). Same cascade shape as delete but to `archiving` → `archived`: the base + its `deployment_versions` + its `releases` transition to `archiving`, a base-level `deployment / delete` outbox event is emitted, and the worker drives them to `archived` (state-aware trigger). Only deployments in an archivable state (`ready`/`draft`/`error`/`canceled`, per `@azion/versioning` v2.4) may be archived. Blocked (`RESOURCE_IN_USE`) while bound to a workload on the edge.

Body: `{ "reason": "SUPERSEDED" | "SECURITY_ISSUE" | "POLICY_VIOLATION" | "MANUAL", "comment"?: string }`.

**Response 202** — `{ "data": { "id": "<id>", "state": "archiving" } }`
- **404** — not found
- **409** — `RESOURCE_IN_USE`; `InvalidStateTransition` when not archivable

---

## Deployments — Build-config versioning (`/v4/deployments/{id}/versions/*`)

Powered by the external lib `@azion/versioning` mounted under `/v4/deployments`. Version rows live in the sibling `deployment_versions` table — one row per `(deployment_id, version_number)`. The `deployments` table holds identity + denormalized state only. See [DATABASE.md](./DATABASE.md).

### GET /v4/deployments/{id}/versions

Lists version-rows of a deployment with their lifecycle state (now carried directly on the `deployment_versions` row). Pagination + `?fields=` sparse fieldset.

### POST /v4/deployments/{id}/versions

Creates a new DRAFT by cloning the latest READY version-row. Limit: `MAX_VERSIONING_DRAFTS_PER_RESOURCE` per `(client_id, base_id)` (default 20).

**Response 202**

```json
{ "data": { "id": "ADEPVRD1", "state": "draft" } }
```

### GET /v4/deployments/{id}/versions/{vid}

Reads a specific version-row by `:version_id` (the `deployment_versions.id`). Response wraps the deployment resource + a `meta` object carrying the lifecycle fields (incl. `version_id` = the version-row id) — **no `resource_type`** as of lib v2.

### PATCH /v4/deployments/{id}/versions/{vid}

Edits a DRAFT version-row's build-config fields. Only valid while the version row's `state='draft'`.

- **409** — version is not a draft

### POST /v4/deployments/{id}/versions/{vid}/cancel

Cancels a queued/building version-row.

### POST /v4/deployments/{id}/versions/{vid}/archive

Transitions a READY version-row → archiving (worker drives the rest).

### DELETE /v4/deployments/{id}/versions/{vid}

Soft-deletes all rows: transitions state to `deleted` (draft/error/canceled — direct, no outbox) or emits a delete outbox event for the worker to drive `deleting → deleted` (ready/queued/building). Blocked while traffic_role ≠ INACTIVE.

---

## Releases — Build and Activate (one-shot)

### POST /v4/deployments/{id}/build_and_activate _(internal — not in public OpenAPI spec)_

**Optimistic activation** (lib v3 + migration 0052). Creates a release in `state=queued` AND **synchronously** flips routing in the same transaction:

- `releases.traffic_role` of the new release → `ACTIVE` (single_version) or `VALID_URL` (versioned_urls).
- Previous ACTIVE demoted to `VALID_URL` (skew protection on) or `INACTIVE` (otherwise).
- New `deployment_versions` row materialized (reused pending draft OR cloned from latest READY) and stamped with `activated_release_id`.
- Two outbox rows emitted: `release/install` (carrying a `prior_state_snapshot` for rollback) + `deployment/install` (new routing).

The release returns from the API already marked as routing-active — a subsequent `GET` reflects the new state immediately. If the worker reports `outbox.status='error'` (or the user `/cancel`s the build), the lib's dispatcher trigger calls `fn_revert_deployment_build_activate` which restores `traffic_role`, prior ACTIVE, and cleans up the auto-created `deployment_versions` row. The failed release stays in `state=error` (or `state=canceled` for cancel) for inspection and PATCH-and-retry — same semantic as the Python workload pattern.

Atomic equivalent of `POST /releases` + `POST /releases/:rid/build` + `POST /releases/:rid/activate` — without client polling and without waiting for the build to finish before routing flips. Use this for the first upload of a deployment to the edge and any subsequent rollout that should be visible immediately on the API surface.

**Request**

```json
{
  "resources": [
    { "global_id": 521846, "resource_type": "application", "version_id": "AAPV0001" },
    { "resource_id": 318420, "resource_type": "connector", "version_id": "ARSV0001" }
  ],
  "strategy":              { /* optional */ },
  "origin":                { /* optional */ },
  "deployment_version_id": "ADEPVTGT"  /* optional — see below */
}
```

Each resource carries its identity explicitly. The **application** is sent by `global_id` (its external REST identity) plus `resource_type: "application"` and `version_id` (the resource version short_id); it does **not** carry `resource_id` — the edge-api is the source of truth and resolves the internal `resource_id` from `global_id` via `getResourceStateByGlobalIds`, which we store and pass on the outbox. **Other resources** carry `resource_id` directly: `{ resource_id, resource_type, version_id }`. Composition (exactly one `application`, at-most-one singletons) is validated after resolution. The application's resolved `resource_id` is internal — never echoed in the response (which shows `global_id` + `resource_type` + `version_id` for the application; `resource_id` + `resource_type` + `version_id` for the others). A `global_id` the edge can't confirm → **404**; invalid composition → **422**.

`deployment_version_id` (optional) lets the caller pick **which** `deployment_versions` draft becomes the activated row. Default behavior is "pick the head" (highest `version_number`). With multiple drafts on a deployment, the head may not be the one the caller wants to ship — supply this field to target a specific draft. Validated server-side: the row must belong to `:id` AND be in `state='draft'` (else 422). The use case threads it into `ReleaseSnapshotService.snapshotForActivation` synchronously.

**Response 202**

```json
{ "data": { "id": "ARELNEW1", "state": "queued", "trace_id": "fdf67102-a2eb-45ce-92fb-c7dbf1d8e8d2" } }
```

`trace_id` is an auto-generated UUIDv4 persisted on `outbox.trace_id` for this build. Both the `release/install` and `deployment/install` rows emitted in the same tx share this id so the entire build → activate chain can be correlated downstream.

- **404** — deployment not found
- **409** — `ConcurrentActivation` when another `/build_and_activate` (or `/activate`) is racing on the same deployment and won the partial UNIQUE `idx_unique_active_version`. Caller can retry once the in-flight save commits.
- **422** — catalog rejected (resource missing/blocked/unknown type), composition invalid, or `VERSIONED_URLS_ACTIVE_LIMIT` reached (the new slot would exceed the cap).

> The compensating `deployment/install` event emitted by `fn_revert_deployment_build_activate` on rollback is also stripped (no skew/candidate cookies) and re-emits the restored routing. A subsequent `/activate` or `PATCH /strategy` re-emits the full doc.

---

## Releases (`/v4/deployments/{did}/releases/*`)

Operations on the `releases` table — the URL says **releases**, the table stays `releases`. `:did` is the parent deployment id; `:rid` is the release id. Every handler validates `release.deployment_id === did` AND `release.client_id === auth.client_id` (404 on mismatch).

### POST /v4/deployments/{did}/releases

Creates a release in `state="draft"`. The API resolves the application's `global_id` against the edge-api at CREATE and validates composition, then persists the draft. Other resources are stored as supplied (their state is validated later at `/build`). No outbox event is emitted at draft time. Refine via PATCH; finalize via POST on `/releases/:rid/build`. Limit: `DRAFT_LIMIT_PER_DEPLOYMENT` per `(client_id, deployment_id)` (default 20).

**Request**

```json
{
  "resources": [
    { "global_id": 521846, "resource_type": "application", "version_id": "AAPV0001" },
    { "resource_id": 318420, "resource_type": "connector", "version_id": "ARSV0001" }
  ],
  "strategy": { /* optional */ },
  "origin":   { /* optional */ }
}
```

The application is sent by `global_id`; other resources by `resource_id` (see Build-and-Activate above for the full resolution contract).

**Response 202** — `{ "data": { "id": "ARELDRF1", "state": "draft" } }`

- **400** — malformed resource: application sent by `resource_id`, a standard resource sent by `global_id`, missing `version_id`, non-positive-int id, or an unknown key (strict)
- **404** — deployment not found, or an application `global_id` the edge can't confirm (`43000`)
- **422** — composition invalid (`43002`), or `43003 DRAFT_LIMIT_EXCEEDED`

### GET /v4/deployments/{did}/releases

Lists releases for a deployment. Pagination + optional filters + optional ordering.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (1-based, default 1, max 1000) |
| `page_size` | integer | Items per page (default 20, max 100) |
| `state` | enum | Exact match on `releases.state`: `draft` / `queued` / `building` / `ready` / `error` / `canceled` / `archiving` / `archived` |
| `traffic_role` | `"active"` | **Semantic** filter — returns only what is currently serving traffic. Actual roles depend on `deployment_policy`: `single_version` → `ACTIVE` + `CANDIDATE`; `versioned_urls` → `ACTIVE` + `VALID_URL`. Only the literal `'active'` is accepted (raw enum not exposed). |
| `ordering` | string | Comma-separated sort fields. Prefix with `-` for descending. **Allowed:** `id`, `created_at`, `state`, `traffic_role`. **Default:** `-created_at,-id` (newest first). Example: `?ordering=state,-created_at` |

`?state` and `?traffic_role` can be combined and intersect (e.g. `?state=ready&traffic_role=active`).

- **404** — `?traffic_role=active` requires a deployment lookup; unknown `:did` returns `43000 DEPLOYMENT_NOT_FOUND`. Without `traffic_role=active` the list returns an empty page for unknown ids (current behavior).

### GET /v4/deployments/{did}/releases/{rid}

Reads a single release. Response includes `resources` (each `{ global_id, resource_id, resource_type, version_id }` — the application carries `global_id` with `resource_id: null` since its internal id stays hidden; other resources carry `resource_id` with `global_id: null`), `strategy`, `urls`, `kivo`, `origin`, `audit`, `traffic_role`, `state`, etc.

### PATCH /v4/deployments/{did}/releases/{rid}

**State-aware** full-replace patch (`resources` — same union shape as create: application by `global_id`, others by `resource_id`; plus `strategy`, `origin`; fields absent are inherited):

- **draft** → edited **in place** (iterate on the draft before `/build`); stays `draft`.
- **ready / error / canceled / archived** → **cloned** into a brand-new `draft` carrying the source's composition + the override. The source row is left untouched. Build + activate the clone afterward (or use `/patch_and_activate`). Subject to the draft cap.
- **queued / building** → **409** (in-flight, racing the worker).
- **deleting / deleted** → hidden → **404**.

Returns the (in-place or newly-cloned) draft.
- **404** — release not found (or in a gone state)
- **409** — in-flight (`queued`/`building`)

### POST /v4/deployments/{did}/releases/{rid}/patch_and_activate _(internal — not in public OpenAPI spec)_

One-shot "edit + roll out": **clone** the release with the payload override (`resources?`/`strategy?`/`origin?`), **build** it, and **activate** the clone — in a single call. Delegates to `/build_and_activate` and inherits its optimistic-activation semantic (the clone becomes `ACTIVE` synchronously; rollback on worker error or cancel). Works for both policies (single_version swaps the active pointer; versioned_urls adds the clone to the valid-URL set). Equivalent to PATCH-clone + `/build_and_activate` in one request.

**Response 202** — `{ "data": { "id": "ARELNEW1", "state": "queued", "trace_id": "..." } }`
- **404** — source release not found
- **422** — catalog/composition validation failed

### POST /v4/deployments/{did}/releases/{rid}/build

**Finalize**: transitions `draft → queued` (or `error → queued` for an in-place rebuild) + emits INSTALL outbox so the worker builds the artifact at the edge. Calls the resource catalog, runs STRICT baseline checks. On any failure, the release transitions to `state="error"` — the caller can PATCH new resources and call /build again without going through delete + recreate. Mirrors edge-api's `/build` verb. Routing is a separate, later step (`/activate`).

**Response 202** — `{ "data": { "id": "ARELQ001", "state": "queued", "trace_id": "fdf67102-a2eb-45ce-92fb-c7dbf1d8e8d2" } }`

`trace_id` is an auto-generated UUIDv4 persisted on `outbox.trace_id`, mirrored into `message.trace_id`. Use it to correlate the async build downstream.
- **404** — release not found
- **409** — release is not in `draft` nor `error`
- **422** — catalog/composition validation failed

### DELETE /v4/deployments/{did}/releases/{rid}

Soft-deletes a release, with **canonical (Python-aligned, `@azion/versioning` v2.5) routing**:

- `ready` / `queued` / `building` (present/about-to-be on the edge) → `deleting` + emit `release / delete`; the state-sync trigger drives `deleting → deleted` on worker success.
- `draft` / `error` / `canceled` / `archived` (never on the edge or already superseded) → **direct** to `deleted` (no outbox; metadata cleanup).
- `deleting` / `deleted` → hidden → **404**.

**In-use gate (policy-aware)** — a release that is currently routing cannot be deleted:

- **single_version**: `ACTIVE` or `CANDIDATE` → **409 `VersionStillReferenced`**. `VALID_URL` (a parked previous active) and `INACTIVE` are deletable.
- **versioned_urls**: a release with role `ACTIVE`/`VALID_URL` is blocked **only when it is the last valid release** (deleting it would empty `valid_releases`); if other valid releases remain, it can be deleted.

`queued`/`building` no longer require `/cancel` first — they soft-delete via the outbox.

---

## Releases — Lifecycle

### POST /v4/deployments/{did}/releases/{rid}/cancel

Cancels a queued or building release.

**Request** — `{ "reason": "optional" }`
- **202** — `{ "data": { ...resource, "state": "canceled" } }`
- **409** — invalid state transition

### POST /v4/deployments/{did}/releases/{rid}/archive

Archives a release in an archivable state (`ready`/`draft`/`error`/`canceled`, per `@azion/versioning` v2.5). Canonical routing: `ready` → `archiving` + emit `release / delete` (worker reclaims edge artifacts; trigger drives `archiving → archived`); `draft`/`error`/`canceled` → **direct** to `archived` (no outbox). Same **policy-aware in-use gate** as delete (an ACTIVE/CANDIDATE single_version release, or the last valid versioned_urls release, cannot be archived). Required body: `reason` (`SUPERSEDED | SECURITY_ISSUE | POLICY_VIOLATION | MANUAL`) + optional `comment`.

- **202** — async transition (returns `{data: {id, state: "archiving" | "archived"}}`)
- **409** — release is still routing → `VersionStillReferenced`; or not archivable → `InvalidStateTransition`

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

- If `deployment_version_id` is supplied and points at a draft on this deployment → **that draft** is promoted to `ready` + stamped with `activated_release_id`. No new row created. Same override the trigger consumes for `/build_and_activate`.
- Else if the latest deployment version-row's `state = 'draft'` (a pending PATCH or POST /versions draft) → the head draft is **promoted to `ready`** + stamped with `activated_release_id`. No new row created.
- Otherwise → the latest READY version-row (fallback latest, fallback base) is cloned into a new version-row directly in `state='ready'`, with `activated_release_id` set (the lifecycle is on the row itself — no separate meta).

GRADUAL activations (CANDIDATE only) skip the snapshot — it fires when the candidate is later promoted to ACTIVE.

The same `ReleaseSnapshotService.snapshotForActivation` is reused by `/build_and_activate` (which inlines it into the optimistic-save transaction).

**Request** — `{ "strategy": { /* optional override */ }, "deployment_version_id": "ADEPVTGT" /* optional */ }`

When omitted, the head (highest `version_number`) is used. When provided, must reference a `deployment_versions` row of `:did` in `state='draft'` (else 422 Validation). Both sync `/activate` and `/build_and_activate` validate this loud (the request fails on a stale id).

**CANDIDATE uniqueness invariant** — a deployment has **at most one** active `CANDIDATE` at a time. Activating with `strategy.rollout_mode = GRADUAL` when a different release is already `CANDIDATE` returns **422 `CandidateAlreadyExists`**. Re-issuing GRADUAL on the same `:rid` (idempotent strategy refresh) is allowed. To start a new canary you must first either **promote** the existing candidate (INSTANT activate) or **rollback** it (see below).

- **202** — `{ "data": { "id": "ARELACT1", "state": "ready" } }`
- **409** — `ConcurrentActivation` when another activate/build_and_activate is racing on the same deployment (partial UNIQUE `idx_unique_active_version`). Caller can retry.
- **422** — `VERSIONED_URLS_ACTIVE_LIMIT` exceeded; `deployment_version_id` unknown / cross-deployment / not `draft`; or `CandidateAlreadyExists` when a concurrent CANDIDATE blocks a new GRADUAL activate.

### POST /v4/deployments/{did}/releases/{rid}/rollback

Single_version only. Two semantically distinct flows share the verb, dispatched by the target release's current `traffic_role`:

1. **Restore a previously-routed release** (`:rid` in `VALID_URL`/`INACTIVE`, or idempotent on the current `ACTIVE`) → make `:rid` the new ACTIVE. Demotes the current ACTIVE to `VALID_URL` (if skew on) or `INACTIVE`. Snapshots the deployment build-config under the same rule as `/activate`.
2. **Abandon an active canary** (`:rid` in `CANDIDATE`) → demote `:rid` to `VALID_URL` (if the current ACTIVE has skew on) or `INACTIVE`. The current ACTIVE stays put; the deployment doc is re-emitted with `candidate: null`. No snapshot is taken (no new release becomes active). Pair this with `/activate` again for a fresh canary attempt.

**Request** — `{ "reason": "operator-supplied", "comment": "optional" }`
- **422** — deployment policy is `versioned_urls`

### PATCH /v4/deployments/{did}/releases/{rid}/strategy

Mutates `releases.strategy` for the ACTIVE release (`single_version` only). Partial merge of `gradual_rollout` / `skew_protection`.

- **200** — `{ "data": { "deployment_id": "...", "release_id": "...", "strategy": {...} } }`
- **422** — release is not ACTIVE or deployment is `versioned_urls`; or `strategy.gradual_rollout.candidate_from_release_id` references a release of a different deployment.

> **Cross-resource invariant:** any persisted `strategy.gradual_rollout.candidate_from_release_id` (here, on `/strategy`, `/activate`, `/build_and_activate`, `POST /releases`, and `PATCH /releases/:rid`) must point at a release of the same `:did`. Cross-deployment references are rejected with **422 Validation** (`field: strategy.gradual_rollout.candidate_from_release_id`).

---

## State machine

The 10-state enum applies to `releases.state` and `deployment_versions.state` (lifecycle of base+version rows):

```
draft → queued → building → ready
              ↘ canceled
              ↘ error
ready → archiving → archived
ready → deleting → deleted
draft/error/canceled → archived | deleted    (direct, no outbox)
```

API-driven transitions: `create draft`, `finalize` (POST on `:vid/build` or `:rid/build`), `cancel`, `archive`, `delete`, `activate`, `rollback`, `promote`. Worker drives `queued → building → ready` (and `archiving → archived`, `deleting → deleted`) via `outbox.status` updates; the `sync_outbox_to_version_meta` trigger (vendored from `azion-api-libs/azion-versioning`) mirrors onto `deployment_versions.state`.

For `releases`, `traffic_role` is orthogonal to `state` and controls routing. The partial UNIQUE index `idx_unique_active_version` enforces **one `ACTIVE` per `deployment_id`**.

The one-shot `POST /build_and_activate` is **optimistic** (lib v3 + migration 0052): the synchronous save flips `traffic_role` + materializes the `deployment_versions` row + emits both `release/install` (with a `prior_state_snapshot` carrying everything needed to undo) and `deployment/install`. If the worker writes `outbox.status='error'` (or the user `/cancel`s the build), the lib's generic dispatcher trigger calls `fn_revert_deployment_build_activate` which atomically restores the pre-save state. The failed release stays in `state=error` (or `state=canceled`) for inspection and PATCH-and-retry — same semantic as the Python `workload` pattern.

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
