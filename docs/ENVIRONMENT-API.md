# Environment API — Endpoints

Human-readable map of the HTTP surface with inline JSON examples. The OpenAPI spec at [`../openapi-schema.yaml`](../openapi-schema.yaml) is the authoritative source for shapes; this doc adds semantics and full payload examples the spec alone does not convey.

Error codes referenced below come from [`ERRORS.md`](./ERRORS.md). Outbox event payloads are documented in [`OUTBOX-EVENTS.md`](./OUTBOX-EVENTS.md).

## Conventions

| Aspect | Value |
|---|---|
| Base path | `/v4/` |
| IDs | Bare **short_id** strings (`^[A-Z][A-Z0-9]+$`; A-prefix = 8 chars). DTOs accept up to 26 chars (columns are `VARCHAR(26)`). |
| Multi-tenant | Every entity carries `client_id` from `auth.account.clientId` |
| Single response envelope | `{ "state": "executed", "data": { ...flat resource } }` |
| List response envelope | `{ count, total_pages, page, page_size, next, previous, results: [...] }` (Azion V4) |
| Versioning entity envelope | `{ "state": "executed", "data": { ...resource, "meta": { ... } } }` |
| Versioning meta-only envelope | `{ "state": "executed", "data": { "meta": { ... } } }` |
| Build envelope | Meta-only + `data.trace_id` (UUIDv4, correlates the async build) |
| Error envelope | `{ "errors": [{ status, code, title, detail, meta }] }` — `meta.source.pointer` = `/<field>` |
| Request body | **Flat** — no `{data:{type,attributes}}` wrapper |
| Error code family | `42000–42005` from `@azion/js-api-errors` |

`created_by` / `last_modified_by` carry an **Actor** snapshot built server-side from `actorOf(c)`:

```json
{ "user_id": "42", "trigger": "console", "email": "alice@example.com" }
```

Clients never supply `user_id` or `email`. `trigger` is the lowercased `X-Trigger` header (`api | cli | console | terraform | sdk`). When `AUTH_ENABLED=false`, `user_id` falls back to `'system'` and `email` to `null`.

## Authentication

`/v4/*` is gated by two middlewares (only when `AUTH_ENABLED=true`):

1. **`azionAuthMiddleware`** — validates SSO credential (API token, JWT Bearer, or session cookie). Failures: `401 AZN-AUTH-NOT_AUTHENTICATED-001` or `403 AZN-AUTH-PERMISSION_DENIED-001`.
2. **`requireV6FlagMiddleware`** — checks `auth.account.flags` for `'use_v6_configurations'`. Failure: `403 AZN-AUTH-PERMISSION_DENIED-001` (`title: "v6 Flag Required"`). Skipped when `V6_FLAG_REQUIRED !== 'true'`.

In dev (`AUTH_ENABLED=false`) neither runs; `clientIdOf(c)` falls back to `DEV_CLIENT_ID` (default `'1234567'`).

`/health`, `/health/db`, and `/graphql` are **outside** `/v4/*` and use a shared-secret middleware (`Authorization: Bearer <SSO_GQL_SECRET>`, constant-time compare). Any failure returns **`404`** with empty body.

---

## Service endpoints

### GET /health

Liveness probe. No DB touch.

**Response 200**

```json
{ "status": "ok", "service": "environment-api", "version": "0.1.0" }
```

---

### GET /health/db

Readiness probe. Runs `SELECT 1`. Auth failure → `404` empty body.

**Response 200**

```json
{ "status": "ok", "db": "up" }
```

**Response 503**

```json
{ "status": "degraded", "db": "down" }
```

---

### POST /graphql

Internal GraphQL endpoint for service-to-service state lookups (environment + version state). Shared-secret auth via `X-Secret` header. Auth failure → `404` empty body.

---

## Environments — `/v4/environments`

**Base-row vs version-row resolution:**
- `GET /v4/environments/:id` on a base-row → resolves to **latest READY version** (fallback latest if none ready). On version/legacy rows → returns as-is.
- `GET /v4/environments` → filters version-rows out; each base-row resolves to its latest READY (fallback latest).
- `PATCH /v4/environments/:id` on a base-row → creates a new **DRAFT** (clone of latest READY + patch applied) and returns it with `meta`. On version/legacy rows → mutates in place. `deployment_version_policy` is **immutable**: matching value → 200 no-op; mismatch → 409.

Draft cap: `MAX_VERSIONING_DRAFTS_PER_RESOURCE` (default 20) per base.

---

### POST /v4/environments

Creates a new environment. Returns 201. Minimum body: `{ "name": "...", "deployment_version_policy": "single_version" }`. All other fields default (`log_verbosity: "normal"`, `robots_policy: "index"`, protection off, `branch_tracking: null`).

**Request**

```json
{
  "name": "production",
  "description": "Customer-facing prod traffic",
  "deployment_version_policy": "single_version",
  "log_verbosity": "normal",
  "robots_policy": "index",
  "protection": {
    "azion_authentication": { "enabled": false },
    "password_protection": { "enabled": false, "secret_id": null },
    "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "192.168.0.0/16"] },
    "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
  },
  "branch_tracking": {
    "enabled": true,
    "mode": "branch_starts_with",
    "branch_match": "release/"
  }
}
```

**Response 201**

```json
{
  "state": "executed",
  "data": {
    "id": "AENV1234",
    "name": "production",
    "description": "Customer-facing prod traffic",
    "deployment_version_policy": "single_version",
    "log_verbosity": "normal",
    "robots_policy": "index",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "192.168.0.0/16"] },
      "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": {
      "enabled": true,
      "mode": "branch_starts_with",
      "branch_match": "release/"
    },
    "state": "queued",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-06-03T14:22:05.123Z",
    "updated_at": null,
    "created_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
    "last_modified_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" }
  }
}
```

- **422** — domain validation (`meta.source.pointer` = `/<field>`)

---

### GET /v4/environments

Paginated list. Filters version-rows; each base-row resolves to latest READY (fallback latest). Query: `page` (1–1000, default 1), `page_size` (1–100, default 20), `name` (substring), `fields` (comma-separated projection).

**Response 200**

```json
{
  "count": 2,
  "total_pages": 1,
  "page": 1,
  "page_size": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "AENV1234",
      "name": "production",
      "description": "Customer-facing prod traffic",
      "deployment_version_policy": "single_version",
      "log_verbosity": "normal",
      "robots_policy": "index",
      "protection": {
        "azion_authentication": { "enabled": false },
        "password_protection": { "enabled": false, "secret_id": null },
        "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8"] },
        "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
      },
      "branch_tracking": null,
      "state": "ready",
      "state_detail": null,
      "client_id": "1234567",
      "created_at": "2026-05-30T09:11:00.000Z",
      "updated_at": "2026-06-01T12:00:42.000Z",
      "created_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
      "last_modified_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" }
    },
    {
      "id": "AENV5678",
      "name": "staging",
      "description": null,
      "deployment_version_policy": "versioned_urls",
      "log_verbosity": "verbose",
      "robots_policy": "noindex",
      "protection": {
        "azion_authentication": { "enabled": true },
        "password_protection": { "enabled": false, "secret_id": null },
        "ip_allowlist": { "enabled": false, "cidrs": [] },
        "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
      },
      "branch_tracking": { "enabled": true, "mode": "branch_is", "branch_match": "main" },
      "state": "ready",
      "state_detail": null,
      "client_id": "1234567",
      "created_at": "2026-05-15T08:00:00.000Z",
      "updated_at": null,
      "created_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
      "last_modified_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" }
    }
  ]
}
```

When not last page, `next` carries the absolute URL with `?page=<n+1>` (`previous` mirrors for `page > 1`).

---

### GET /v4/environments/:id

Returns a single environment. Base-rows resolve to their latest READY (fallback latest); version/legacy rows return as-is.

**Response 200**

```json
{
  "state": "executed",
  "data": {
    "id": "AENV1234",
    "name": "production",
    "description": "Customer-facing prod traffic",
    "deployment_version_policy": "single_version",
    "log_verbosity": "normal",
    "robots_policy": "index",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8"] },
      "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": null,
    "state": "ready",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-05-30T09:11:00.000Z",
    "updated_at": "2026-06-01T12:00:42.000Z",
    "created_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
    "last_modified_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" }
  }
}
```

- **404** — not found or cross-tenant

---

### PATCH /v4/environments/:id

Partial update. On a base-row → creates a new DRAFT and returns it with `meta`. On version/legacy rows → mutates in place. Any subset of fields accepted.

**Request**

```json
{
  "name": "production-eu",
  "description": "EU prod traffic",
  "log_verbosity": "verbose",
  "robots_policy": "noindex",
  "protection": {
    "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "172.16.0.0/12"] }
  },
  "branch_tracking": null
}
```

**Response 200** — version/legacy row (in-place update)

```json
{
  "state": "executed",
  "data": {
    "id": "AENV1234",
    "name": "production-eu",
    "description": "EU prod traffic",
    "deployment_version_policy": "single_version",
    "log_verbosity": "verbose",
    "robots_policy": "noindex",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "172.16.0.0/12"] },
      "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": null,
    "state": "ready",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-05-30T09:11:00.000Z",
    "updated_at": "2026-06-03T14:30:00.000Z",
    "created_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
    "last_modified_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" }
  }
}
```

**Response 200** — base-row (new DRAFT created)

```json
{
  "state": "executed",
  "data": {
    "id": "AENVD001",
    "name": "production-eu",
    "description": "EU prod traffic",
    "deployment_version_policy": "single_version",
    "log_verbosity": "verbose",
    "robots_policy": "noindex",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "172.16.0.0/12"] },
      "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": null,
    "state": "draft",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-06-03T14:30:00.000Z",
    "updated_at": "2026-06-03T14:30:00.000Z",
    "created_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
    "last_modified_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
    "meta": {
      "version_id": "AENVD001",
      "resource_type": "environment",
      "state": "draft",
      "product_version": "environment.v1.0",
      "source_version_id": "AENVR007",
      "archived_at": null,
      "archive_comment": null,
      "description": null,
      "ready_at": null,
      "last_error": null,
      "created_at": "2026-06-03T14:30:00.000Z",
      "updated_at": "2026-06-03T14:30:00.000Z"
    }
  }
}
```

- **404** — not found
- **409** — `deployment_version_policy` mismatch (immutable)
- **422** — domain validation (`meta.source.pointer` = `/<field>`)

---

### DELETE /v4/environments/:id

Hard-deletes the environment. Emits a `delete` outbox event.

**Response 200**

```json
{ "state": "executed", "data": null }
```

- **404** — not found
- **409** — referenced by existing versions

---

## Environment versioning — `/v4/environments/:id/versions/*`

8 standard ops from `@azion/versioning`. `:id` = base-row short_id; `:version_id` = meta short_id (version-row PK, also the `resource_version` in outbox events).

| Method | Path | Transition | Outbox |
|---|---|---|---|
| GET | `/:id/versions` | — | — |
| POST | `/:id/versions` | clone latest READY → DRAFT | no |
| GET | `/:id/versions/:version_id` | — | — |
| PATCH | `/:id/versions/:version_id` | DRAFT → DRAFT (replace) | no |
| DELETE | `/:id/versions/:version_id` | DRAFT/ERROR/CANCELED → DELETED; READY/QUEUED/BUILDING → DELETING + outbox | conditional (`delete`) |
| POST | `/:id/versions/:version_id/build` | DRAFT → QUEUED | yes (`install` + `trace_id`) |
| POST | `/:id/versions/:version_id/cancel` | QUEUED/BUILDING → CANCELED | no |
| POST | `/:id/versions/:version_id/archive` | DRAFT/ERROR/CANCELED → ARCHIVED; READY → ARCHIVING + outbox | conditional (`delete`) |

---

### GET /v4/environments/:id/versions

Lists version-rows for a base. Query: `page` (1–1000, default 1), `page_size` (1–100, default 20).

**Response 200**

```json
{
  "count": 2,
  "total_pages": 1,
  "page": 1,
  "page_size": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "AENVR007",
      "name": "production",
      "description": "Customer-facing prod traffic",
      "deployment_version_policy": "single_version",
      "log_verbosity": "normal",
      "robots_policy": "index",
      "protection": {
        "azion_authentication": { "enabled": false },
        "password_protection": { "enabled": false, "secret_id": null },
        "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8"] },
        "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
      },
      "branch_tracking": null,
      "state": "ready",
      "state_detail": null,
      "client_id": "1234567",
      "created_at": "2026-05-30T09:11:00.000Z",
      "updated_at": "2026-05-30T09:12:33.000Z",
      "created_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
      "last_modified_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
      "meta": {
        "version_id": "AENVR007",
        "resource_type": "environment",
        "state": "ready",
        "product_version": "environment.v1.0",
        "source_version_id": null,
        "archived_at": null,
        "archive_comment": null,
        "description": null,
        "ready_at": "2026-05-30T09:12:33.000Z",
        "last_error": null,
        "created_at": "2026-05-30T09:11:00.000Z",
        "updated_at": "2026-05-30T09:12:33.000Z"
      }
    },
    {
      "id": "AENVD001",
      "name": "production-eu",
      "description": "EU prod traffic",
      "deployment_version_policy": "single_version",
      "log_verbosity": "verbose",
      "robots_policy": "noindex",
      "protection": {
        "azion_authentication": { "enabled": false },
        "password_protection": { "enabled": false, "secret_id": null },
        "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "172.16.0.0/12"] },
        "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
      },
      "branch_tracking": null,
      "state": "draft",
      "state_detail": null,
      "client_id": "1234567",
      "created_at": "2026-06-03T14:30:00.000Z",
      "updated_at": "2026-06-03T14:30:00.000Z",
      "created_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
      "last_modified_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
      "meta": {
        "version_id": "AENVD001",
        "resource_type": "environment",
        "state": "draft",
        "product_version": "environment.v1.0",
        "source_version_id": "AENVR007",
        "archived_at": null,
        "archive_comment": null,
        "description": null,
        "ready_at": null,
        "last_error": null,
        "created_at": "2026-06-03T14:30:00.000Z",
        "updated_at": "2026-06-03T14:30:00.000Z"
      }
    }
  ]
}
```

- **404** — base not found

---

### POST /v4/environments/:id/versions

Creates a new DRAFT by cloning the latest READY version (or an explicit `source_version_id`). Capped at `MAX_VERSIONING_DRAFTS_PER_RESOURCE` (default 20).

**Request** (both fields optional — pass `{}` to clone from latest READY)

```json
{
  "source_version_id": "AENVR007",
  "description": "Tighten IP allowlist for EU rollout"
}
```

**Response 202**

```json
{
  "state": "executed",
  "data": {
    "id": "AENVD002",
    "name": "production",
    "description": "Customer-facing prod traffic",
    "deployment_version_policy": "single_version",
    "log_verbosity": "normal",
    "robots_policy": "index",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8"] },
      "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": null,
    "state": "draft",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-06-03T14:35:00.000Z",
    "updated_at": "2026-06-03T14:35:00.000Z",
    "created_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
    "last_modified_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
    "meta": {
      "version_id": "AENVD002",
      "resource_type": "environment",
      "state": "draft",
      "product_version": "environment.v1.0",
      "source_version_id": "AENVR007",
      "archived_at": null,
      "archive_comment": null,
      "description": "Tighten IP allowlist for EU rollout",
      "ready_at": null,
      "last_error": null,
      "created_at": "2026-06-03T14:35:00.000Z",
      "updated_at": "2026-06-03T14:35:00.000Z"
    }
  }
}
```

- **404** — base or source version not found
- **422** — `42004 LIMIT_EXCEEDED` (draft cap reached)

---

### GET /v4/environments/:id/versions/:version_id

Returns a single version-row (entity + meta).

**Response 200**

```json
{
  "state": "executed",
  "data": {
    "id": "AENVR007",
    "name": "production",
    "description": "Customer-facing prod traffic",
    "deployment_version_policy": "single_version",
    "log_verbosity": "normal",
    "robots_policy": "index",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8"] },
      "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": null,
    "state": "ready",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-05-30T09:11:00.000Z",
    "updated_at": "2026-05-30T09:12:33.000Z",
    "created_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
    "last_modified_by": { "user_id": "42", "trigger": "console", "email": "alice@example.com" },
    "meta": {
      "version_id": "AENVR007",
      "resource_type": "environment",
      "state": "ready",
      "product_version": "environment.v1.0",
      "source_version_id": null,
      "archived_at": null,
      "archive_comment": null,
      "description": null,
      "ready_at": "2026-05-30T09:12:33.000Z",
      "last_error": null,
      "created_at": "2026-05-30T09:11:00.000Z",
      "updated_at": "2026-05-30T09:12:33.000Z"
    }
  }
}
```

- **404** — version not found

---

### PATCH /v4/environments/:id/versions/:version_id

Replaces patchable fields on a DRAFT. Same body shape as PATCH on the base resource. `deployment_version_policy` is immutable.

**Request**

```json
{
  "name": "production-eu",
  "description": "EU prod traffic",
  "log_verbosity": "verbose",
  "protection": {
    "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "172.16.0.0/12"] }
  }
}
```

**Response 200**

```json
{
  "state": "executed",
  "data": {
    "id": "AENVD002",
    "name": "production-eu",
    "description": "EU prod traffic",
    "deployment_version_policy": "single_version",
    "log_verbosity": "verbose",
    "robots_policy": "index",
    "protection": {
      "azion_authentication": { "enabled": false },
      "password_protection": { "enabled": false, "secret_id": null },
      "ip_allowlist": { "enabled": true, "cidrs": ["10.0.0.0/8", "172.16.0.0/12"] },
      "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }
    },
    "branch_tracking": null,
    "state": "draft",
    "state_detail": null,
    "client_id": "1234567",
    "created_at": "2026-06-03T14:35:00.000Z",
    "updated_at": "2026-06-03T14:37:12.000Z",
    "created_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
    "last_modified_by": { "user_id": "77", "trigger": "cli", "email": "bob@example.com" },
    "meta": {
      "version_id": "AENVD002",
      "resource_type": "environment",
      "state": "draft",
      "product_version": "environment.v1.0",
      "source_version_id": "AENVR007",
      "archived_at": null,
      "archive_comment": null,
      "description": "Tighten IP allowlist for EU rollout",
      "ready_at": null,
      "last_error": null,
      "created_at": "2026-06-03T14:35:00.000Z",
      "updated_at": "2026-06-03T14:37:12.000Z"
    }
  }
}
```

- **404** — version not found
- **409** — version is not in DRAFT state

---

### DELETE /v4/environments/:id/versions/:version_id

DRAFT / ERROR / CANCELED → DELETED (synchronous). READY / QUEUED / BUILDING → DELETING + outbox `delete` row (worker drives `deleting → deleted`).

**Response 202**

```json
{
  "state": "executed",
  "data": {
    "meta": {
      "version_id": "AENVD002",
      "resource_type": "environment",
      "state": "deleting",
      "product_version": "environment.v1.0",
      "source_version_id": "AENVR007",
      "archived_at": null,
      "archive_comment": null,
      "description": "Tighten IP allowlist for EU rollout",
      "ready_at": "2026-06-03T14:40:00.000Z",
      "last_error": null,
      "created_at": "2026-06-03T14:35:00.000Z",
      "updated_at": "2026-06-03T14:45:10.000Z"
    }
  }
}
```

When direct-deleted (DRAFT/ERROR/CANCELED), `meta.state` is `"deleted"`.

- **404** — version not found
- **409** — invalid state for delete

---

### POST /v4/environments/:id/versions/:version_id/build

DRAFT → QUEUED. Emits an outbox `install` row. The `fn_outbox_status_to_meta` trigger mirrors `outbox.status` onto `meta.state` (`queued → building → ready`). `data.trace_id` is a UUIDv4 auto-generated per build — use it to correlate the async flow downstream.

**Response 202**

```json
{
  "state": "executed",
  "data": {
    "meta": {
      "version_id": "AENVD002",
      "resource_type": "environment",
      "state": "queued",
      "product_version": "environment.v1.0",
      "source_version_id": "AENVR007",
      "archived_at": null,
      "archive_comment": null,
      "description": "Tighten IP allowlist for EU rollout",
      "ready_at": null,
      "last_error": null,
      "created_at": "2026-06-03T14:35:00.000Z",
      "updated_at": "2026-06-03T14:38:00.000Z"
    },
    "trace_id": "fdf67102-a2eb-45ce-92fb-c7dbf1d8e8d2"
  }
}
```

- **404** — version not found
- **409** — version is not in DRAFT state

---

### POST /v4/environments/:id/versions/:version_id/cancel

QUEUED / BUILDING → CANCELED. No outbox emitted.

**Response 202**

```json
{
  "state": "executed",
  "data": {
    "meta": {
      "version_id": "AENVD002",
      "resource_type": "environment",
      "state": "canceled",
      "product_version": "environment.v1.0",
      "source_version_id": "AENVR007",
      "archived_at": null,
      "archive_comment": null,
      "description": "Tighten IP allowlist for EU rollout",
      "ready_at": null,
      "last_error": null,
      "created_at": "2026-06-03T14:35:00.000Z",
      "updated_at": "2026-06-03T14:39:25.000Z"
    }
  }
}
```

- **404** — version not found
- **409** — invalid state for cancel

---

### POST /v4/environments/:id/versions/:version_id/archive

DRAFT / ERROR / CANCELED → ARCHIVED (synchronous). READY → ARCHIVING + outbox `delete` row (worker drives `archiving → archived`).

**Request** (optional)

```json
{ "comment": "Replaced by AENVR012 — keeping for audit" }
```

**Response 202**

```json
{
  "state": "executed",
  "data": {
    "meta": {
      "version_id": "AENVR007",
      "resource_type": "environment",
      "state": "archiving",
      "product_version": "environment.v1.0",
      "source_version_id": null,
      "archived_at": null,
      "archive_comment": "Replaced by AENVR012 — keeping for audit",
      "description": null,
      "ready_at": "2026-05-30T09:12:33.000Z",
      "last_error": null,
      "created_at": "2026-05-30T09:11:00.000Z",
      "updated_at": "2026-06-03T14:50:00.000Z"
    }
  }
}
```

When direct-archived (DRAFT/ERROR/CANCELED), `meta.state` is `"archived"` and `meta.archived_at` is populated.

- **404** — version not found
- **409** — invalid state for archive

---

## State machine

Applies to `environments.state` and `versioning_resource_meta.state`:

```
draft → queued → building → ready
              ↘ canceled
              ↘ error
ready → archiving → archived
ready → deleting  → deleted
draft/error/canceled → archived | deleted    (direct, no outbox)
```

API-driven transitions: `create draft`, `build`, `cancel`, `archive`, `delete`. The external worker drives `queued → building → ready` (and `archiving → archived`, `deleting → deleted`) via `outbox.status`; the `sync_outbox_to_version_meta` trigger mirrors onto `versioning_resource_meta.state`.

---

## Error envelope

All error responses follow the JSON:API shape via `@azion/js-api-errors`:

```json
{
  "errors": [{
    "status": "422",
    "code": "42001",
    "title": "Validation Error",
    "detail": "The field 'name' must be at least 1 character.",
    "meta": { "source": { "pointer": "/name" } }
  }]
}
```

Codes are numeric in the `42000–42005` range. Full catalog in [`ERRORS.md`](./ERRORS.md).
