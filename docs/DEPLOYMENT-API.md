# Deployment API — Endpoints

curl-first map of the HTTP + GraphQL surface. **Authoritative shapes: [`../openapi-schema.yaml`](../openapi-schema.yaml)**; error codes: [`ERRORS.md`](./ERRORS.md); outbox payloads: [`OUTBOX-EVENTS.md`](./OUTBOX-EVENTS.md). `*` = required field, `?` = optional.

## Setup for examples

```bash
export API=https://api.azion.com   # host
export TOKEN=<personal-token>      # Authorization: Token <TOKEN>
```

## Conventions

| Aspect | Value |
|---|---|
| Base path | `/v4/` (auth: `Authorization: Token <TOKEN>`). `/health*` + `/api/graphql` are outside `/v4` (secret-gated). |
| IDs | short_id `^[A-Z][A-Z0-9]+$` (A=8 chars), `VARCHAR(26)`. |
| Multi-tenant | `client_id` from `auth.account.clientId` (never from body). |
| Single response | `{ "data": { ...flat } }` (no `{data:{type,attributes}}`). |
| List response | `{ count, total_pages, page, page_size, next, previous, results: [...] }`. |
| Pagination | `?page` (1-based, ≤1000) · `?page_size` (default 20, ≤100). |
| Ordering | `?ordering=-field,field2` (DRF style: `-` = desc, comma = multi, unknown ignored). |
| Errors | `{ "errors":[{ status, code, title, detail, meta:{source:{pointer:"/field"}} }] }`. Codes numeric `43000-43005`. |
| Audit | `created_by`/`last_modified_by` = requester email (or `null`); derived server-side, never sent in body. |

**Auth** (`/v4/*`, only when `AUTH_ENABLED=true`): SSO token/JWT/cookie → `401`/`403`; plus `requireV6FlagMiddleware` (`use_v6_configurations` flag) → `403`. Dev (`AUTH_ENABLED=false`): no auth, `client_id` = `DEV_CLIENT_ID` (`1234567`). `/health*` + `/api/graphql` failures → `404` empty (security-by-obscurity).

**State channel**: GraphQL `getResourceState` = state-only, service-to-service, batch. HTTP GET = full resource for SDK/end-user.

---

## Service

### GET /health
Liveness probe.
```bash
curl -s "$API/health" -H "Authorization: Bearer $SSO_GQL_SECRET"
```
**200** `{ status:"ok", timestamp }`

### GET /health/db
Readiness probe (`SELECT 1`).
```bash
curl -s "$API/health/db" -H "Authorization: Bearer $SSO_GQL_SECRET"
```
**200** `{ status:"ok", database:"connected", responseTime, timestamp }`
**503** `{ status:"error", database:"disconnected", error, errorName, cause, responseTime }`

---

## GraphQL — POST /api/graphql

Yoga endpoint, **service-to-service only** (`X-Secret` validated against `graphql_secrets`; auth failure → `404` empty). Execution errors → `200 {data:null, errors:[...]}`. State is **UPPERCASE** on this boundary. SDL in `src/infrastructure/graphql/schema.ts` (mirrored to `schema.graphql`). Both lookups bypass `client_id` filtering (secret-gated carve-out).

```bash
curl -sX POST "$API/api/graphql" -H 'X-Secret: <secret>' -H 'Content-Type: application/json' \
  -d '{"query":"query($r:[ResourceStateInput!]!){getResourceState(resources:$r){resourceType resourceId resourceVersion state}}","variables":{"r":[{"resourceType":"deployment","resourceId":"ADEPSTG1"},{"resourceType":"release","resourceVersion":"ARELACT1"}]}}'
```

| Query | Args | Returns |
|---|---|---|
| `resourceVersionInUse` | `clientId*, resourceType*, resourceVersion*` | `Boolean` — true if ≥1 READY release in tenant references `(type, version)`. Gates edge-api hard-delete. |
| `getResourceState` | `resources: [{resourceType*, resourceId, resourceVersion}]` | `[{resourceType, resourceId, resourceVersion, state}]` (input order). `deployment`→key `resourceId`; `release`→key `resourceVersion`; `environment`→`null`. `state:null` if missing/unknown. |
| `getDeploymentHistory` | `clientId*, deploymentId*, page?, pageSize?` | `{count,page,pageSize,totalPages, results:[{id,deploymentId,state,trafficRole,createdAt}]}` — state-only release history. |

```bash
# getDeploymentHistory
curl -sX POST "$API/api/graphql" -H 'X-Secret: <secret>' -H 'Content-Type: application/json' \
  -d '{"query":"{getDeploymentHistory(clientId:\"1234567\",deploymentId:\"ADEPSTG1\",page:1,pageSize:5){count results{id state trafficRole}}}"}'
```

---

## Deployments (CRUD on the base)

### POST /v4/deployments
Create deployment (base + draft v1). No outbox / no edge effect until a release activates.
```bash
curl -sX POST "$API/v4/deployments" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"public-api","binding_policy":"FLEXIBLE","deployment_policy":"single_version"}'
```
**Body** `name*` `binding_policy*`(FLEXIBLE|STRICT) `deployment_policy*`(single_version|versioned_urls) `description?` `strategy_defaults?`
**201** `{ data:{ id, name, binding_policy, deployment_policy, state:"draft", client_id, created_at, created_by, … } }`
**Errors** `400 malformed` · `409 DUPLICATE_NAME` · `422 validation`

### GET /v4/deployments
List (one row per deployment: base + latest version row).
```bash
curl -s "$API/v4/deployments?page=1&page_size=20&ordering=-created_at" -H "Authorization: Token $TOKEN"
```
**Query** `page?` `page_size?` `name?`(substring) `ordering?`(id|name|created_at|updated_at|state; default `-created_at,-id`)
**200** list envelope; `results[]` = `{ id, version_id, name, state, … }`

### GET /v4/deployments/{id}
Read deployment — resolves base → latest READY version (fallback latest).
```bash
curl -s "$API/v4/deployments/ADEPSTG1" -H "Authorization: Token $TOKEN"
```
**200** `{ data:{ …same shape as POST 201 } }`
**Errors** `404 DEPLOYMENT_NOT_FOUND`

### PATCH /v4/deployments/{id}
State-aware update: head `draft` → edit in place; else → clone latest into a new draft.
```bash
curl -sX PATCH "$API/v4/deployments/ADEPSTG1" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"public-api-v2","description":"renamed"}'
```
**Body** `name?` `description?` `binding_policy?` `deployment_policy?`(idempotent) `strategy_defaults?`
**200** `{ data:{ … }, meta:{ version_id, state, … } }`
**Errors** `404` · `409 IMMUTABLE_FIELD`(deployment_policy mismatch) · `409 CANNOT_TIGHTEN_POLICY`(FLEXIBLE→STRICT on mixed history) · `409 DUPLICATE_NAME`

### DELETE /v4/deployments/{id}
Soft-delete (cascade base + versions + releases → `deleting`; worker → `deleted`).
```bash
curl -sX DELETE "$API/v4/deployments/ADEPSTG1" -H "Authorization: Token $TOKEN"
```
**200** `{ state:"executed", data:null }`
**Errors** `404` · `409 RESOURCE_IN_USE`(bound to a workload)

### POST /v4/deployments/{id}/archive
Soft-archive (cascade → `archiving` → `archived`). Archivable: `ready`/`draft`/`error`/`canceled`.
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/archive" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"reason":"SUPERSEDED"}'
```
**Body** `reason*`(SUPERSEDED|SECURITY_ISSUE|POLICY_VIOLATION|MANUAL) `comment?`
**202** `{ data:{ id, state:"archiving" } }`
**Errors** `404` · `409 RESOURCE_IN_USE` · `409 InvalidStateTransition`(not archivable)

---

## Deployment versions — build-config (`/v4/deployments/{id}/versions/*`)

`@azion/versioning` lib. One row per `(deployment_id, version_number)` in `deployment_versions`; lifecycle on the row.

### GET /v4/deployments/{id}/versions
List version rows + lifecycle state.
```bash
curl -s "$API/v4/deployments/ADEPSTG1/versions?page=1&page_size=20" -H "Authorization: Token $TOKEN"
```
**Query** `page?` `page_size?` `fields?`(sparse) **200** list envelope

### POST /v4/deployments/{id}/versions
Create DRAFT by cloning latest READY. Cap `MAX_VERSIONING_DRAFTS_PER_RESOURCE` (20).
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/versions" -H "Authorization: Token $TOKEN"
```
**202** `{ data:{ id, state:"draft" } }` · **422** `DRAFT_LIMIT_EXCEEDED`

### GET /v4/deployments/{id}/versions/{vid}
Read one version row.
```bash
curl -s "$API/v4/deployments/ADEPSTG1/versions/ADEPVRD1" -H "Authorization: Token $TOKEN"
```
**200** `{ data:{ …, meta:{ version_id, state, … } } }`

### PATCH /v4/deployments/{id}/versions/{vid}
Edit a DRAFT row's build-config (only while `state='draft'`).
```bash
curl -sX PATCH "$API/v4/deployments/ADEPSTG1/versions/ADEPVRD1" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' -d '{...}'
```
**200** version row · **409** not a draft

### POST /v4/deployments/{id}/versions/{vid}/cancel
Cancel a queued/building version row.
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/versions/ADEPVRD1/cancel" -H "Authorization: Token $TOKEN"
```
**202** `{ data:{ id, state:"canceled" } }`

### POST /v4/deployments/{id}/versions/{vid}/archive
READY version row → `archiving` (worker drives the rest).
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/versions/ADEPVRD1/archive" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' -d '{"reason":"SUPERSEDED"}'
```
**202** `{ data:{ id, state:"archiving" } }`

### DELETE /v4/deployments/{id}/versions/{vid}
Soft-delete: `draft`/`error`/`canceled` → `deleted` (direct); `ready`/`queued`/`building` → `deleting` (outbox). Blocked while `traffic_role ≠ INACTIVE`.
```bash
curl -sX DELETE "$API/v4/deployments/ADEPSTG1/versions/ADEPVRD1" -H "Authorization: Token $TOKEN"
```
**200** `{ state:"executed", data:null }`

---

## Releases (`/v4/deployments/{did}/releases/*`)

Ops on the `releases` table. Every handler enforces `release.deployment_id == did` AND `release.client_id == auth.client_id` (404 on mismatch). **Resource identity:** `application` sent by `global_id` (no `resource_id`); every other type by `resource_id`. `traffic_role ∈ {ACTIVE, CANDIDATE, VALID_URL, INACTIVE}` (one ACTIVE per deployment — partial UNIQUE).

### POST /v4/deployments/{did}/releases
Create release `state="draft"` (validates composition; no outbox). Cap `DRAFT_LIMIT_PER_DEPLOYMENT` (20).
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"resources":[{"global_id":521846,"resource_type":"application","version_id":"AAPV0001"},{"resource_id":318420,"resource_type":"connector","version_id":"ARSV0001"}]}'
```
**Body** `resources*`(app by `global_id`; others by `resource_id`; each + `resource_type*` `version_id*`) `strategy?` `origin?`
**202** `{ data:{ id, state:"draft" } }`
**Errors** `400 malformed resource` · `404 deployment / unknown global_id` · `422 composition / DRAFT_LIMIT_EXCEEDED`

### GET /v4/deployments/{did}/releases
List releases (filters intersect).
```bash
curl -s "$API/v4/deployments/ADEPSTG1/releases?state=ready&traffic_role=active&ordering=-created_at" -H "Authorization: Token $TOKEN"
```
**Query** `page?` `page_size?` `state?`(draft|queued|building|ready|error|canceled|archiving|archived) `traffic_role?`=`active`(serving set: single_version→ACTIVE+CANDIDATE, versioned_urls→ACTIVE+VALID_URL) `ordering?`(id|created_at|state|traffic_role)
**200** list envelope
**Errors** `404 DEPLOYMENT_NOT_FOUND`(only with `traffic_role=active`; else empty page)

### GET /v4/deployments/{did}/releases/{rid}
Read one release (full composition).
```bash
curl -s "$API/v4/deployments/ADEPSTG1/releases/ARELACT1" -H "Authorization: Token $TOKEN"
```
**200** `{ data:{ id, resources:[{global_id,resource_id,resource_type,version_id}], strategy, urls, kivo, origin, audit, traffic_role, state, … } }`

### PATCH /v4/deployments/{did}/releases/{rid}
State-aware full-replace (`draft`→in place; `ready`/`error`/`canceled`/`archived`→clone to new draft; `queued`/`building`→409; gone→404).
```bash
curl -sX PATCH "$API/v4/deployments/ADEPSTG1/releases/ARELDRF1" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"resources":[{"global_id":521846,"resource_type":"application","version_id":"AAPV0002"}]}'
```
**Body** `resources?` `strategy?` `origin?` (absent fields inherited)
**200** the (in-place or cloned) draft · **404** not found/gone · **409** in-flight

### POST /v4/deployments/{did}/releases/{rid}/build
Finalize: `draft|error → queued` + INSTALL outbox (worker builds at edge). On failure → `state="error"` (PATCH + rebuild, no recreate). Routing is separate (`/activate`).
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases/ARELDRF1/build" -H "Authorization: Token $TOKEN"
```
**202** `{ data:{ id, state:"queued", trace_id } }`
**Errors** `404` · `409 not draft|error` · `422 catalog/composition`

### POST /v4/deployments/{did}/releases/{rid}/cancel
Cancel a queued/building release.
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases/ARELQ001/cancel" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' -d '{"reason":"optional"}'
```
**202** `{ data:{ id, state:"canceled" } }` · **409** invalid transition

### POST /v4/deployments/{did}/releases/{rid}/archive
Archive (`ready`→`archiving`+outbox; `draft`/`error`/`canceled`→`archived` direct). Policy-aware in-use gate.
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases/ARELOL01/archive" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' -d '{"reason":"SUPERSEDED"}'
```
**Body** `reason*`(SUPERSEDED|SECURITY_ISSUE|POLICY_VIOLATION|MANUAL) `comment?`
**202** `{ data:{ id, state:"archiving"|"archived" } }`
**Errors** `409 VersionStillReferenced`(still routing) · `409 InvalidStateTransition`

### DELETE /v4/deployments/{did}/releases/{rid}
Soft-delete: `ready`/`queued`/`building`→`deleting`+outbox; `draft`/`error`/`canceled`/`archived`→`deleted` direct. **In-use gate**: single_version ACTIVE/CANDIDATE → 409; versioned_urls blocked only if it's the **last** valid release.
```bash
curl -sX DELETE "$API/v4/deployments/ADEPSTG1/releases/ARELOL01" -H "Authorization: Token $TOKEN"
```
**200** `{ state:"executed", data:null }` · **409 VersionStillReferenced**

### POST /v4/deployments/{did}/releases/{rid}/promote
Clone the release into another deployment (always a fresh row, never a reference).
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases/ARELACT1/promote" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' -d '{"target_deployment_id":"ATGTDEP1"}'
```
**Body** `target_deployment_id*`
**202** `{ data:{ id, deployment_id, state:"queued" } }` · **404** target/source not found

---

## Releases — routing

### POST /v4/deployments/{did}/releases/{rid}/activate
Route traffic. single_version: INSTANT swaps ACTIVE / GRADUAL stages CANDIDATE; versioned_urls appends a VALID_URL. INSTANT (and slot append) snapshots build-config into a version row stamped `activated_release_id`.
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases/ARELQ001/activate" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' -d '{}'
```
**Body** `strategy?`(override) `deployment_version_id?`(must be a `draft` of `:did`, else 422; default = head)
**202** `{ data:{ id, state:"ready" } }`
**Errors** `409 ConcurrentActivation` · `422 VERSIONED_URLS_ACTIVE_LIMIT` · `422 deployment_version_id invalid` · `422 CandidateAlreadyExists`(one CANDIDATE per deployment)

### POST /v4/deployments/{did}/releases/{rid}/rollback
single_version only. `:rid` in VALID_URL/INACTIVE/ACTIVE → make it ACTIVE (demote current). `:rid` in CANDIDATE → abandon canary (re-emit `candidate:null`, no snapshot).
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases/ARELOL01/rollback" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' -d '{"reason":"operator-supplied"}'
```
**Body** `reason*` `comment?`
**202** `{ data:{ id, state:"ready" } }` · **422** policy is versioned_urls

### PATCH /v4/deployments/{did}/releases/{rid}/strategy
Mutate `strategy` of the ACTIVE release (single_version only). Partial merge of `gradual_rollout`/`skew_protection`.
```bash
curl -sX PATCH "$API/v4/deployments/ADEPSTG1/releases/ARELACT1/strategy" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"gradual_rollout":{"enabled":true,"candidate_percentage":10}}'
```
**Body** ≥1 of `gradual_rollout?` `skew_protection?` (empty `{}` → 400)
**200** `{ data:{ deployment_id, release_id, version_id, strategy } }`
**Errors** `422 not ACTIVE / versioned_urls` · `422 candidate_from_release_id cross-deployment`(must reference a release of `:did`)

---

## Releases — one-shot _(internal — not in public OpenAPI spec)_

### POST /v4/deployments/{id}/build_and_activate
Optimistic activation: creates a release `state=queued` and **synchronously** flips routing in the same tx (new → ACTIVE/VALID_URL; prior ACTIVE demoted; materializes the `deployment_versions` row; emits `release/install`+`deployment/install`). GET reflects it immediately. On worker `error` / `/cancel`, the lib dispatcher (`fn_revert_deployment_build_activate`) restores prior routing; failed release stays `error`/`canceled` for PATCH-and-retry.
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/build_and_activate" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"resources":[{"global_id":521846,"resource_type":"application","version_id":"AAPV0001"},{"resource_id":318420,"resource_type":"connector","version_id":"ARSV0001"}]}'
```
**Body** `resources*`(as in POST /releases) `strategy?` `origin?` `deployment_version_id?`(target draft of `:id`, else 422)
**202** `{ data:{ id, state:"queued", trace_id } }` (`trace_id` shared by both outbox rows)
**Errors** `404 deployment / unknown global_id` · `409 ConcurrentActivation` · `422 catalog/composition / VERSIONED_URLS_ACTIVE_LIMIT`

### POST /v4/deployments/{did}/releases/{rid}/patch_and_activate
Clone `:rid` with the override, build, and activate the clone — one call. Delegates to `build_and_activate` (same optimistic semantic + rollback).
```bash
curl -sX POST "$API/v4/deployments/ADEPSTG1/releases/ARELACT1/patch_and_activate" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"resources":[{"resource_id":318420,"resource_type":"connector","version_id":"ARSV0002"}]}'
```
**Body** `resources?` `strategy?` `origin?`
**202** `{ data:{ id, state:"queued", trace_id } }` · **404** source not found · **422** catalog/composition

---

## Resource usage

Cross-deployment view of which deployments use an upstream resource + bulk version migration. "Active link" = serving set, excluding gone/archived releases. `application` matched by `global_id`; others by `resource_id`.

### GET /v4/resource_usage
Deployments with a live link to one+ resources of a type, paginated **by deployment**.
```bash
curl -s "$API/v4/resource_usage?resource_type=connector&resource_id=318420,318421&page=1" -H "Authorization: Token $TOKEN"
```
**Query** `resource_type*`(application|firewall|custom_page|waf|function|connector|network_list) `resource_id*`(1–100; `global_id` for application; repeated `resource_id[]=a&resource_id[]=b` **or** `resource_id=a,b`) `page?` `page_size?`
**200** list envelope; `results[]` = `{ deployment_id, name, state, deployment_policy, resources:[{ resource_type, resource_id, global_id, resource_version, product_version, name, release_id, traffic_role }] }`
**Notes** no matches → 200 empty `results`; excludes releases in `deleting`/`deleted`/`archiving`/`archived` even if `traffic_role` still reads ACTIVE/VALID_URL.

### GET /v4/deployments/{id}/resource_hierarchy
Resource composition of the deployment's ACTIVE release, grouped by type.
```bash
curl -s "$API/v4/deployments/ADEPSTG1/resource_hierarchy" -H "Authorization: Token $TOKEN"
```
**200** `{ data:{ deployment_id, active_release_id, resources:{ application|firewall|custom_page: entry|null, waf|function|connector|network_list: entry[] } } }` (entry = `{resource_type,resource_id,global_id,resource_version,product_version,name}`)
**Errors** `404 DEPLOYMENT_NOT_FOUND` · no ACTIVE → 200 with `active_release_id:null` + empty groups

### POST /v4/resource_usage/rerelease _(internal — not in public OpenAPI spec)_
Bulk version bump: for each **single_version + ACTIVE** deployment using `(type, id, from_version)`, build+activate a new release with that resource bumped to `to_version` (reuses `build_and_activate`). Synchronous fan-out, best-effort, capped at `RERELEASE_MAX_DEPLOYMENTS` (default **20**). Targets exclude versioned_urls, CANDIDATE-only, and gone/archived.
```bash
curl -sX POST "$API/v4/resource_usage/rerelease" \
  -H "Authorization: Token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"resource_type":"connector","resource_id":"318420","from_version":"ACNV0001","to_version":"ACNV0002","deployment_ids":["ADEP0001"]}'
```
**Body** `resource_type*` (`resource_id*` | `global_id*` if application — exactly one) `from_version*` `to_version*`(≠ from) `deployment_ids?`(≤100, narrows targets)
**200** `{ requested, succeeded, skipped, failed, results:[{ deployment_id, status, new_release_id?, trace_id?, reason? }] }`
**Notes** `status ∈ {success, skipped_already_on_z, skipped_not_single_version, error}`; matched set > cap → **422**(`field: deployment_ids`).

---

## State machine

10-state enum on `releases.state` and `deployment_versions.state`:
```
draft → queued → building → ready
              ↘ canceled / error
ready → archiving → archived
ready → deleting → deleted
draft/error/canceled → archived | deleted   (direct, no outbox)
```
API verbs: create draft · build (`/build`) · cancel · archive · delete · activate · rollback · promote. Worker drives `queued→building→ready` (+ `archiving→archived`, `deleting→deleted`) via `outbox.status`; `sync_outbox_to_version_meta` mirrors onto the version row. For `releases`, `traffic_role` is orthogonal to `state` (one ACTIVE per deployment — `idx_unique_active_version`). `build_and_activate` flips routing optimistically in-tx; the lib dispatcher reverts on `error`/`canceled`.

## Error envelope
```json
{ "errors":[{ "status":"409", "code":"43004", "title":"Field Cannot Be Modified",
  "detail":"The field 'deployment_policy' is immutable after creation.",
  "meta":{ "source":{ "pointer":"/deployment_policy" } } }] }
```
Flat pointer `/<field>`; numeric codes `43000-43005` ([`ERRORS.md`](./ERRORS.md)).
