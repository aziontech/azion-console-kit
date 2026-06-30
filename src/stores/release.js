// Single source of truth for the full-page "Review & deploy" screen: holds the
// release selection and derives the deploy gate (the 5 cases). It owns NO HTTP
// and NO service imports — the shared `useReleaseComposition` composable fills
// the loaded-data slots (`deployments`, `activeReleaseByDs`, `versionsByResource`),
// builds the strategy, transforms the payload and dispatches the per-DS
// `build_and_activate` fan-out (the composable is the layer allowed to call
// services). The store only exposes a PURE `composePayload()` describing the
// selection. Mirrors the options-style `stores/deploy.js`.

import { defineStore } from 'pinia'
import { LATEST_READY, resolveLatestVersion } from '@/templates/release-composition/version-options'

// Composition singletons (one each, never repeated). `application` is required
// and has no toggle; the others are optional (gated by `resEnabled`).
const APPLICATION_TYPE = 'application'
const OPTIONAL_SINGLETON_TYPES = ['firewall', 'custom_page']
const SINGLETON_TYPES = [APPLICATION_TYPE, ...OPTIONAL_SINGLETON_TYPES]

// Dependency collection types nested under each parent (UI grouping only — the
// payload is a flat `resources[]`). `function_instance` is never serialized.
const COLLECTION_TYPES = ['function', 'connector', 'waf', 'network_list']

const VERSIONED_URLS = 'versioned_urls'
const MAX_DEPLOYS = 20

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// Key for `versionsByResource`: `${resource_type}:${resource_id}`.
const versionsKey = (type, id) => `${type}:${id}`

// The release endpoint pins version in `version_id`; the active-release payload
// keys `application` by `global_id` and every other type by `resource_id`.
const releaseResourceId = (resource) =>
  resource?.resource_type === APPLICATION_TYPE
    ? (resource?.global_id ?? resource?.resource_id ?? null)
    : (resource?.resource_id ?? resource?.global_id ?? null)

// Loaded-data slots: filled by `useReleaseComposition` (the layer allowed to call
// services) and fed back through the setters. The store stays the source of truth
// for these, but they are NOT entry-context selection — `openRelease` must NOT
// wipe them, or a synchronously-available (cached) composable feed gets clobbered
// by the post-mount reset and the composition never populates.
const freshLoadedData = () => ({
  deployments: [],
  activeReleaseByDs: {},
  versionsByResource: {}
})

// Fresh, fully reset SELECTION state. `openRelease` rebuilds from this so there
// is never a partial patch across entry contexts (req 1.2). Loaded data is kept
// separate (see `freshLoadedData`) and preserved across `openRelease`.
const freshSelectionState = () => ({
  // --- entry context ---
  fromVersion: false,
  scopedType: null,
  versionId: '',
  resourceId: '',
  // --- target Deployment Settings (kept in sync; read via effDsId) ---
  deploymentId: '',
  deploymentIds: [],
  // --- per-singleton selection ('LATEST' sentinel | concrete version_id) ---
  resNames: {},
  resVers: {},
  resEnabled: {},
  // --- editable dependency instances per type: { [type]: [{ resourceId, version }] } ---
  coll: {},
  collOpen: {},
  // --- canary (gradual rollout) ---
  canary: false,
  canaryForm: {},
  // --- DS picker search ---
  dsQuery: '',
  // --- impact degraded by default until the reverse lookup ships ---
  impactUnavailable: true
})

// Full initial state = selection state + loaded-data slots.
const freshState = () => ({
  ...freshSelectionState(),
  ...freshLoadedData()
})

export const useReleaseStore = defineStore('release', {
  state: freshState,

  getters: {
    // Property 4 — the single deployment read path. Every getter/action that
    // needs "the deployment" reads it through here, never `deploymentId` or
    // `deploymentIds` directly.
    effDsId: (state) => state.deploymentId || state.deploymentIds[0] || '',

    // The active-release composition resolved for a given DS (defaults to effDsId).
    // Returns a getter function so callers may inspect any selected DS (multi-DS
    // gates on the strictest).
    deployCtx() {
      return (dsId = this.effDsId) => {
        const deployment =
          this.deployments.find((item) => String(item?.id) === String(dsId)) ?? null
        const activeRelease = this.activeReleaseByDs[dsId] ?? null

        const ok = Boolean(dsId)
        const isVersioned = deployment?.deployment_policy === VERSIONED_URLS
        const deployed = Boolean(activeRelease)

        const resources = Array.isArray(activeRelease?.resources) ? activeRelease.resources : []
        const releaseHasApp = resources.some(
          (resource) => resource?.resource_type === APPLICATION_TYPE
        )
        // hasApp: a live application exists if a release pins one, OR a selectable
        // application is composed/available in the current selection (Case 4: no
        // release yet, but the user is picking one).
        const hasApp = releaseHasApp || Boolean(this.resNames[APPLICATION_TYPE])

        // Property 5 — the 5 cases:
        //   1 !hasApp                          → block, disable Build & activate
        //   2 single & !deployed               → App + resource editable
        //   3 single & deployed                → App read-only (locked Single Version)
        //   4 versioned & !deployed            → all editable
        //   5 versioned & deployed             → new release each deploy; rely on 422
        const appEditable = hasApp && (isVersioned || !deployed)

        // `atLimit` is best-effort: no reliable active-count client-side, so the
        // front never blocks preventively — the API 422 is the real barrier.
        const atLimit = false
        const canDeploy = hasApp && !atLimit

        return {
          ok,
          isVersioned,
          hasApp,
          deployed,
          maxDeploys: MAX_DEPLOYS,
          atLimit,
          appEditable,
          canDeploy
        }
      }
    },

    // An application version is chosen once the application has a selected version
    // that is either the LATEST sentinel or a concrete pinned id.
    appVersionChosen: (state) => {
      const value = state.resVers[APPLICATION_TYPE]
      return value === LATEST_READY || Boolean(value)
    },

    appManagedVersionsChosen: (state) => {
      return COLLECTION_TYPES.every((type) => {
        const list = Array.isArray(state.coll[type]) ? state.coll[type] : []
        return list
          .filter((item) => item?.required)
          .every((item) => item.version != null && item.version !== LATEST_READY)
      })
    },

    pendingDependencySelections: (state) => {
      const pending = []
      COLLECTION_TYPES.forEach((type) => {
        const list = Array.isArray(state.coll[type]) ? state.coll[type] : []
        list.forEach((item) => {
          if (item?.required && (item.version == null || item.version === LATEST_READY)) {
            pending.push({ type, resourceId: item.resourceId })
          }
        })
      })
      return pending
    },

    deployEnabled() {
      const ctx = this.deployCtx()
      return Boolean(
        ctx.ok &&
        ctx.canDeploy &&
        this.effDsId &&
        this.appVersionChosen &&
        this.appManagedVersionsChosen
      )
    }
  },

  actions: {
    // FULL reset of SELECTION state then merge the entry payload (req 1.2): never
    // a partial patch. The composable-owned loaded data (`deployments`,
    // `activeReleaseByDs`, `versionsByResource`) is PRESERVED — `openRelease` runs
    // on mount AFTER the immediate composable→store feed, so resetting it would
    // clobber any synchronously-available (cached) data and leave the composition
    // empty. Keeps `deploymentId`/`deploymentIds` in sync regardless of which the
    // caller provides.
    openRelease(payload = {}) {
      this.$patch(freshSelectionState())

      const source = isObject(payload) ? payload : {}

      if ('fromVersion' in source) this.fromVersion = Boolean(source.fromVersion)
      if ('scopedType' in source) this.scopedType = source.scopedType ?? null
      if ('versionId' in source) this.versionId = source.versionId ?? ''
      if ('resourceId' in source) this.resourceId = source.resourceId ?? ''

      // Sync both representations from whichever the caller supplied.
      const incomingIds = Array.isArray(source.deploymentIds) ? [...source.deploymentIds] : null
      const incomingId = source.deploymentId != null ? source.deploymentId : null

      if (incomingIds && incomingIds.length) {
        this.deploymentIds = incomingIds
        this.deploymentId = incomingId ?? incomingIds[0]
      } else if (incomingId != null && incomingId !== '') {
        this.deploymentId = incomingId
        this.deploymentIds = [incomingId]
      } else {
        this.deploymentId = ''
        this.deploymentIds = []
      }

      // Optional singletons (Firewall, Custom Pages) default ON: a fresh release
      // includes them unless the user toggles them off (the toggle then writes an
      // explicit boolean). Seeding here keeps the header switch in sync with the
      // included-by-default payload (`composeResources` skips only `=== false`).
      OPTIONAL_SINGLETON_TYPES.forEach((type) => {
        this.resEnabled[type] = true
      })

      // Seed the scoped resource into its singleton slot when the screen is opened
      // from a resource version (preset version → editable that type).
      if (source.scopedType && SINGLETON_TYPES.includes(source.scopedType)) {
        this.resEnabled[source.scopedType] = true
        if (source.resourceId != null) this.resNames[source.scopedType] = source.resourceId
        if (source.versionId) this.resVers[source.scopedType] = source.versionId
      }
    },

    // Toggle a DS in the multi-select and keep the singular pointer in sync
    // (Property 4: `deploymentId` always tracks the first selected id).
    pickDs(id) {
      if (id == null) return
      const exists = this.deploymentIds.some((item) => String(item) === String(id))
      this.deploymentIds = exists
        ? this.deploymentIds.filter((item) => String(item) !== String(id))
        : [...this.deploymentIds, id]
      this.deploymentId = this.deploymentIds[0] ?? ''
    },

    // Toggle an optional singleton on/off. Application is always required — no-op.
    toggleResource(type) {
      if (type === APPLICATION_TYPE || !OPTIONAL_SINGLETON_TYPES.includes(type)) return
      this.resEnabled[type] = !this.resEnabled[type]
    },

    // Pick an instance for a singleton type; reset that type's version to LATEST
    // so a stale pinned id from the previous instance never carries over.
    setResName(type, resourceId) {
      this.resNames[type] = resourceId
      this.resVers[type] = LATEST_READY
    },

    setResVer(type, version) {
      this.resVers[type] = version
    },

    // --- dependency composition (editable; no "Add" — set inherited from parent) ---

    addCollItem(type, item = {}) {
      if (!COLLECTION_TYPES.includes(type)) return
      const list = Array.isArray(this.coll[type]) ? this.coll[type] : []
      this.coll[type] = [
        ...list,
        {
          resourceId: item.resourceId ?? null,
          version: item.version ?? LATEST_READY
        }
      ]
    },

    // Seed `coll` from the active release's dependency-type resources (spec: no
    // "Add" — the instance set is INHERITED from the active release). `byType` is
    // `{ [type]: [{ resourceId, version }] }`; only the four COLLECTION_TYPES are
    // kept and each instance's `version` is the release's pinned `version_id`
    // (NOT the LATEST sentinel, since it comes from a real release). Idempotent:
    // it fully REPLACES `coll`, so re-running on a DS change never accumulates
    // stale instances.
    seedColl(byType = {}) {
      const source = isObject(byType) ? byType : {}
      const next = {}

      COLLECTION_TYPES.forEach((type) => {
        const instances = Array.isArray(source[type]) ? source[type] : []
        next[type] = instances
          .filter((instance) => instance?.resourceId != null)
          .map((instance) => ({
            resourceId: instance.resourceId,
            version: instance.version ?? null
          }))
      })

      this.coll = next
    },

    seedApplicationFunctions(functionDeps = []) {
      const source = Array.isArray(functionDeps) ? functionDeps : []
      const seen = new Set()
      const next = []

      source.forEach((dep) => {
        const functionId = dep?.functionId
        if (functionId == null || seen.has(functionId)) return
        seen.add(functionId)
        next.push({
          resourceId: functionId,
          version: null,
          locked: true,
          required: true
        })
      })

      this.coll = { ...this.coll, function: next }
    },

    seedApplicationConnectors(connectorDeps = []) {
      const source = Array.isArray(connectorDeps) ? connectorDeps : []
      const seen = new Set()
      const next = []

      source.forEach((dep) => {
        const connectorId = dep?.connectorId
        if (connectorId == null || seen.has(connectorId)) return
        seen.add(connectorId)
        next.push({
          resourceId: connectorId,
          version: null,
          locked: true,
          required: true
        })
      })

      this.coll = { ...this.coll, connector: next }
    },

    // Pick an instance for a dependency collection item; reset that instance's
    // version to LATEST so a stale pinned id from the previous instance never
    // carries over (mirrors `setResName` for singletons).
    setCollResource({ type, id, resourceId } = {}) {
      const list = this.coll[type]
      if (!Array.isArray(list) || !list[id]) return
      list[id] = { ...list[id], resourceId, version: LATEST_READY }
    },

    setCollVer(type, index, version) {
      const list = this.coll[type]
      if (!Array.isArray(list) || !list[index]) return
      list[index] = { ...list[index], version }
    },

    // Toggle a dependency collection group open/closed (UI grouping only).
    toggleCollOpen(type) {
      if (!COLLECTION_TYPES.includes(type)) return
      this.collOpen = { ...this.collOpen, [type]: !this.collOpen[type] }
    },

    removeCollItem(type, index) {
      const list = this.coll[type]
      if (!Array.isArray(list)) return
      this.coll[type] = list.filter((entry, position) => Boolean(entry) && position !== index)
    },

    // --- canary (CanaryStrategyField → buildStrategy) ---

    toggleCanary(value) {
      this.canary = value === undefined ? !this.canary : Boolean(value)
    },

    setCanaryForm(values) {
      this.canaryForm = isObject(values) ? values : {}
    },

    // --- loaded-data setters (the composable fills these; store stays the source of truth) ---

    setDeployments(list) {
      this.deployments = Array.isArray(list) ? list : []
    },

    setActiveReleaseByDs(dsId, release) {
      this.activeReleaseByDs = { ...this.activeReleaseByDs, [dsId]: release ?? null }
    },

    setVersionsByResource(type, resourceId, options) {
      this.versionsByResource = {
        ...this.versionsByResource,
        [versionsKey(type, resourceId)]: Array.isArray(options) ? options : []
      }
    },

    // Resolve a chosen version to a concrete id for dispatch (Property 6: the
    // 'LATEST' sentinel never leaves the store).
    resolveVersion(type, resourceId, selected) {
      const options = this.versionsByResource[versionsKey(type, resourceId)] ?? []
      return resolveLatestVersion(options, selected)
    },

    // Assemble the flat `resources[]` for the payload. Each entry carries
    // `resource_id` + `resource_version` + `resource_type` in the shape the
    // adapter expects (`transformBuildAndActivatePayload` re-keys `application`
    // to `global_id`). Optional singletons toggled off are skipped; every
    // 'LATEST' sentinel is resolved to a concrete `version_id` (Property 6).
    composeResources() {
      const resources = []

      // Scenario A/B baseline: the effective DS's active release pre-fills each
      // singleton card WITHOUT seeding `resNames` (the view's display falls back to
      // it). Mirror that fallback here so re-releasing a deployment unchanged still
      // ships its resources — otherwise the payload is an empty `resources[]`, which
      // the API rejects with a Zod `too_small`. An explicit pick (`resNames`) wins.
      const activeResources = Array.isArray(this.activeReleaseByDs[this.effDsId]?.resources)
        ? this.activeReleaseByDs[this.effDsId].resources
        : []
      const baseResourceIdFor = (type) => {
        const match = activeResources.find((resource) => resource?.resource_type === type)
        return match ? (match.resource_id ?? match.global_id ?? null) : null
      }

      SINGLETON_TYPES.forEach((type) => {
        const isOptional = OPTIONAL_SINGLETON_TYPES.includes(type)
        if (isOptional && this.resEnabled[type] === false) return

        const explicitId = this.resNames[type]
        const resourceId =
          explicitId != null && explicitId !== '' ? explicitId : baseResourceIdFor(type)
        if (resourceId == null || resourceId === '') return

        // Default to the LATEST_READY sentinel (what the card shows) when the user
        // hasn't pinned a version, so it resolves to a concrete latest id below.
        // `?? LATEST_READY` is the single LATEST-default rule shared with the
        // scoped `composePayload` branch (a null/undefined pick → LATEST).
        const selectedVersion = this.resVers[type] ?? LATEST_READY
        resources.push({
          resource_id: resourceId,
          resource_version: this.resolveVersion(type, resourceId, selectedVersion),
          resource_type: type
        })
      })

      COLLECTION_TYPES.forEach((type) => {
        const list = Array.isArray(this.coll[type]) ? this.coll[type] : []
        list.forEach((item) => {
          if (item?.resourceId == null) return
          resources.push({
            resource_id: item.resourceId,
            resource_version: this.resolveVersion(type, item.resourceId, item.version),
            resource_type: type
          })
        })
      })

      return resources
    },

    // PURE description of the current selection for dispatch (no I/O, no service
    // import — Property 6: the 'LATEST' sentinel never leaves the store). The shape
    // is DISCRIMINATED by entry context (req 5.6/5.7/5.8); the composable branches
    // on `scoped` to choose the write path:
    //
    //   non-scoped (Scenario A — opened from one Deployment) → the full composed
    //     payload fanned out as a single body: `{ scoped: false, resources,
    //     canary, canaryForm }` (current behaviour; `composeResources` already
    //     carries the active-release fallback so re-releasing unchanged still ships).
    //
    //   scoped (Scenario B — opened from one Resource version) → only the OVERRIDE
    //     intent: `{ scoped: true, override: { resource_type, resource_id, version },
    //     canary, canaryForm }`. The composable preserves each selected DS's active
    //     composition and swaps ONLY this resource's version per DS (no per-DS data
    //     leaks into the store — it stays pure). `version` is resolved from the
    //     LATEST sentinel HERE so the sentinel never leaves the store (Property 6);
    //     `resource_id` is the explicit pick (`resNames`) or the scoped entry id.
    composePayload() {
      if (!this.scopedType) {
        return {
          scoped: false,
          resources: this.composeResources(),
          canary: this.canary,
          canaryForm: { ...this.canaryForm }
        }
      }

      const scopedType = this.scopedType
      const resourceId = this.resNames[scopedType] ?? this.resourceId
      const selectedVersion = this.resVers[scopedType] ?? LATEST_READY

      const dependencyOverrides = []
      COLLECTION_TYPES.forEach((type) => {
        const list = Array.isArray(this.coll[type]) ? this.coll[type] : []
        list.forEach((item) => {
          if (item?.resourceId == null) return
          dependencyOverrides.push({
            resource_id: item.resourceId,
            resource_type: type,
            version: this.resolveVersion(type, item.resourceId, item.version)
          })
        })
      })

      return {
        scoped: true,
        override: {
          resource_type: scopedType,
          resource_id: resourceId,
          version: this.resolveVersion(scopedType, resourceId, selectedVersion)
        },
        dependencyOverrides,
        canary: this.canary,
        canaryForm: { ...this.canaryForm }
      }
    }
  }
})

// Exposed for the composable/tests that derive ids from the active release.
export { SINGLETON_TYPES, OPTIONAL_SINGLETON_TYPES, COLLECTION_TYPES, releaseResourceId }
