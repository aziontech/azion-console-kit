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

// Pseudo-parent bucket for dependencies the user adds MANUALLY — a connector or
// network_list a function references dynamically at runtime, invisible to the
// static per-parent discovery. It is NOT a singleton (no card, no version of its
// own); being a key of OWNED_COLLECTIONS is what lets it ride every
// PARENT_TYPES-driven path (compose + dedupe, shared-version sync, version load)
// for free, and the seed* actions never touch it, so manual entries survive a
// dependency re-seed. Extend MANUAL_DEP_TYPES to make a new type manually addable.
const ADDITIONAL_PARENT = 'additional'
const MANUAL_DEP_TYPES = ['connector', 'network_list']

// Which dependency collections each parent singleton owns. `coll` is keyed by
// parent → depType so a dependency of one singleton never bleeds into another.
// `additional` is appended LAST so real parents win the first-wins dedupe in
// `composeResources`.
const OWNED_COLLECTIONS = {
  [APPLICATION_TYPE]: ['function', 'connector'],
  firewall: ['function', 'network_list', 'waf'],
  custom_page: ['connector'],
  [ADDITIONAL_PARENT]: MANUAL_DEP_TYPES
}
const PARENT_TYPES = Object.keys(OWNED_COLLECTIONS)

// Dependency types whose VERSION is SHARED across parents: the same dependency
// instance (`resource_type` + `resource_id`) pins a SINGLE version for the whole
// release — the flat payload already dedupes by `(resource_id, type)`, so picking
// its version under one parent (e.g. a Connector under Application) must apply to
// every parent that references it (e.g. the same Connector under Custom Pages),
// and be shown as shared in the UI. Configurable per resource type; extend this
// list when a new dependency type becomes cross-parent shareable.
const SHARED_VERSION_DEP_TYPES = ['connector', 'network_list']

const VERSIONED_URLS = 'versioned_urls'
const MAX_DEPLOYS = 20

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// Key for `versionsByResource`: `${resource_type}:${resource_id}`.
const versionsKey = (type, id) => `${type}:${id}`

// Key capturing a user's picked version per parent-scoped dependency instance.
const collKey = (parent, type, id) => `${parent}:${type}:${id}`

// The release endpoint pins version in `version_id`; the active-release response
// returns every resource id under `resource_id` (for `application` its value is
// the `global_id`), with `global_id` kept as a legacy fallback.
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
  // Keyed by DS id; `true` when the composable's active-release READ failed for
  // that DS (distinct from a genuine "no release", which stays absent here). The
  // composable owns it and feeds it through `setActiveReleaseError`; `deployCtx`
  // reads it to BLOCK publish on a degraded DS.
  activeReleaseErrorByDs: {},
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

        // The active-release read FAILED for this DS (not a genuine "no release").
        // Publishing anyway is unsafe: a non-scoped re-release falls back to the
        // active release to fill the singletons (`composeResources`), so a failed
        // read would silently ship a release MISSING firewall/custom_page; a scoped
        // override has no base composition to preserve. Block until the read
        // recovers (the picker/footer offer a Retry).
        const degraded = Boolean(this.activeReleaseErrorByDs[dsId])

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
        const canDeploy = hasApp && !atLimit && !degraded

        return {
          ok,
          isVersioned,
          hasApp,
          deployed,
          degraded,
          maxDeploys: MAX_DEPLOYS,
          atLimit,
          appEditable,
          canDeploy
        }
      }
    },

    // An application version is chosen once the app has a selected version (LATEST
    // sentinel or a concrete pinned id). With NO explicit pick the composition
    // defaults to LATEST_READY at compose time (`composeResources`), so treat it as
    // chosen as soon as an application is composed — otherwise the version pre-shown
    // as "Track latest Ready" would leave the button disabled. Whether a deployable
    // version actually EXISTS is enforced by the view (it also drives the build hint).
    appVersionChosen() {
      const value = this.resVers[APPLICATION_TYPE]
      if (value === LATEST_READY || Boolean(value)) return true
      return value === undefined && this.deployCtx().hasApp
    },

    // A scoped (Scenario B) entry gates on the SCOPED resource's version, not the
    // application's: the application card is not rendered in a firewall/custom_page
    // scope (it is preserved from each DS's active release), so `resVers[APPLICATION_TYPE]`
    // is never set and `appVersionChosen` would block deploy forever.
    scopedVersionChosen: (state) => {
      if (!state.scopedType) return false
      const value = state.resVers[state.scopedType]
      return value === LATEST_READY || Boolean(value)
    },

    appManagedVersionsChosen: (state) => {
      return PARENT_TYPES.every((parent) =>
        (OWNED_COLLECTIONS[parent] ?? []).every((type) => {
          const list = Array.isArray(state.coll[parent]?.[type]) ? state.coll[parent][type] : []
          return list
            .filter((item) => item?.required && item?.resourceId != null)
            .every((item) => item.version != null)
        })
      )
    },

    pendingDependencySelections: (state) => {
      const pending = []
      PARENT_TYPES.forEach((parent) => {
        ;(OWNED_COLLECTIONS[parent] ?? []).forEach((type) => {
          const list = Array.isArray(state.coll[parent]?.[type]) ? state.coll[parent][type] : []
          list.forEach((item) => {
            if (item?.required && item.resourceId != null && item.version == null) {
              pending.push({ type, resourceId: item.resourceId })
            }
          })
        })
      })
      return pending
    },

    // Parents (other than `excludeParent`) that reference the SAME shared-type
    // dependency instance in the current composition. Drives the UI "shared"
    // badge + hint: a Connector/Network List used by two parents pins ONE version,
    // so both cards must show they move together. Only SHARED_VERSION_DEP_TYPES can
    // share; every other type (or an id present under no other parent) returns [].
    // A parent toggled off has an empty `coll` slot (the view re-seeds it to `[]`),
    // so it never counts as a sharer.
    sharedDependencyParentsFor: (state) => (type, resourceId, excludeParent) => {
      if (!SHARED_VERSION_DEP_TYPES.includes(type) || resourceId == null) return []
      return PARENT_TYPES.filter((parent) => {
        if (parent === excludeParent) return false
        const list = Array.isArray(state.coll[parent]?.[type]) ? state.coll[parent][type] : []
        return list.some(
          (entry) => entry?.resourceId != null && String(entry.resourceId) === String(resourceId)
        )
      })
    },

    // Set of resourceIds (as String) of `type` already present anywhere in the
    // composition (real parents + `additional`). Feeds the "additional" picker so
    // a resource that is already a dependency can't be added a second time
    // (ENG-46674: one version per resource) — the caller drops the current row's
    // own id so it stays selectable.
    usedDependencyIds: (state) => (type) => {
      const ids = new Set()
      PARENT_TYPES.forEach((parent) => {
        const list = Array.isArray(state.coll[parent]?.[type]) ? state.coll[parent][type] : []
        list.forEach((entry) => {
          if (entry?.resourceId != null) ids.add(String(entry.resourceId))
        })
      })
      return ids
    },

    // The version gate alone (extracted so the view can tell WHEN only the version
    // confirmation is missing and surface a hint, instead of a silently-disabled
    // button). A scoped non-application entry gates on the scoped resource's
    // version; every other entry gates on the application's.
    versionGateSatisfied() {
      const versionChosen =
        this.scopedType && this.scopedType !== APPLICATION_TYPE
          ? this.scopedVersionChosen
          : this.appVersionChosen
      return Boolean(versionChosen && this.appManagedVersionsChosen)
    },

    deployEnabled() {
      const ctx = this.deployCtx()
      return Boolean(ctx.ok && ctx.canDeploy && this.effDsId && this.versionGateSatisfied)
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

      // Seed a resource into its singleton slot for a FULL (non-scoped) first
      // release opened via the "Compose first release" CTA: pre-fills the
      // resource + version the user came from while the composition stays full,
      // so the Application card renders and stays editable (Case 4 in deployCtx).
      const seed = source.seed
      if (seed && SINGLETON_TYPES.includes(seed.type)) {
        this.resEnabled[seed.type] = true
        if (seed.resourceId != null) this.resNames[seed.type] = seed.resourceId
        if (seed.versionId) this.resVers[seed.type] = seed.versionId
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

    // Merge a single parent's dependency slot, keeping `coll` reactive and every
    // other parent/type untouched. All coll writers go through here.
    _setParentColl(parent, depType, list) {
      const current = this.coll[parent] ?? {}
      this.coll = { ...this.coll, [parent]: { ...current, [depType]: list } }
    },

    addCollItem({ parent, type, item = {} } = {}) {
      if (!OWNED_COLLECTIONS[parent]?.includes(type)) return
      const list = Array.isArray(this.coll[parent]?.[type]) ? this.coll[parent][type] : []
      this._setParentColl(parent, type, [
        ...list,
        {
          resourceId: item.resourceId ?? null,
          version: 'version' in item ? item.version : LATEST_READY,
          ...(item.required ? { required: true } : {})
        }
      ])
    },

    restoreCollVersions(versionByKey = {}) {
      const source = isObject(versionByKey) ? versionByKey : {}
      const next = {}
      Object.keys(this.coll).forEach((parent) => {
        const byType = {}
        Object.keys(this.coll[parent] ?? {}).forEach((type) => {
          const list = Array.isArray(this.coll[parent][type]) ? this.coll[parent][type] : []
          byType[type] = list.map((instance) => {
            const kept = source[collKey(parent, type, instance?.resourceId)]
            return kept != null ? { ...instance, version: kept } : instance
          })
        })
        next[parent] = byType
      })
      this.coll = next
      // A shared-type dependency that reappears under a newly-seeded parent must
      // inherit the version its sibling already holds (see `reconcileSharedVersions`).
      this.reconcileSharedVersions()
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

      this._setParentColl(APPLICATION_TYPE, 'function', next)
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

      this._setParentColl(APPLICATION_TYPE, 'connector', next)
    },

    seedCustomPageConnectors(connectorDeps = []) {
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

      this._setParentColl('custom_page', 'connector', next)
    },

    seedFirewallFunctions(functionDeps = []) {
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

      this._setParentColl('firewall', 'function', next)
    },

    seedFirewallWafs(wafDeps = []) {
      const source = Array.isArray(wafDeps) ? wafDeps : []
      const seen = new Set()
      const next = []

      source.forEach((dep) => {
        const wafId = dep?.wafId
        if (wafId == null || seen.has(wafId)) return
        seen.add(wafId)
        next.push({
          resourceId: wafId,
          version: null,
          locked: true,
          required: true
        })
      })

      this._setParentColl('firewall', 'waf', next)
    },

    seedFirewallNetworkLists(networkListDeps = []) {
      const source = Array.isArray(networkListDeps) ? networkListDeps : []
      const seen = new Set()
      const next = []

      source.forEach((dep) => {
        const networkListId = dep?.networkListId
        if (networkListId == null || seen.has(networkListId)) return
        seen.add(networkListId)
        next.push({
          resourceId: networkListId,
          version: null,
          locked: true,
          required: true
        })
      })

      this._setParentColl('firewall', 'network_list', next)
    },

    // Pick an instance for a dependency collection item; reset that instance's
    // version to LATEST so a stale pinned id from the previous instance never
    // carries over (mirrors `setResName` for singletons).
    setCollResource({ parent, type, id, resourceId } = {}) {
      const list = this.coll[parent]?.[type]
      if (!Array.isArray(list) || !list[id]) return
      this._setParentColl(
        parent,
        type,
        list.map((entry, index) =>
          index === id ? { ...entry, resourceId, version: LATEST_READY } : entry
        )
      )
    },

    setCollVer(parent, type, index, version) {
      const list = this.coll[parent]?.[type]
      if (!Array.isArray(list) || !list[index]) return
      const { resourceId } = list[index]
      this._setParentColl(
        parent,
        type,
        list.map((entry, position) => (position === index ? { ...entry, version } : entry))
      )
      // Shared-version invariant: a Connector/Network List used by more than one
      // parent pins ONE version for the whole release (the payload dedupes by
      // `(resource_id, type)`). Mirror the pick to every other parent that
      // references the same instance so the two cards never diverge and the change
      // is visible in both immediately — "select the version in Application and it
      // is also selected in Custom Pages, and vice versa".
      if (SHARED_VERSION_DEP_TYPES.includes(type)) {
        this.syncSharedDependencyVersion(type, resourceId, version)
      }
    },

    // Write `version` onto every dependency instance of `type` whose `resourceId`
    // matches, across ALL parents — the enforcement behind the shared-version
    // invariant (called from `setCollVer` for SHARED_VERSION_DEP_TYPES). Idempotent:
    // a parent already at `version` is skipped so no needless reactivity fires.
    syncSharedDependencyVersion(type, resourceId, version) {
      if (resourceId == null) return
      PARENT_TYPES.forEach((parent) => {
        const list = this.coll[parent]?.[type]
        if (!Array.isArray(list)) return
        let changed = false
        const nextList = list.map((entry) => {
          if (
            entry?.resourceId != null &&
            String(entry.resourceId) === String(resourceId) &&
            entry.version !== version
          ) {
            changed = true
            return { ...entry, version }
          }
          return entry
        })
        if (changed) this._setParentColl(parent, type, nextList)
      })
    },

    // Reconcile the shared-version invariant across parents after a re-seed: when a
    // parent's dependency slot is rebuilt (deps reload), a sibling that gained the
    // instance later can start out of sync (its picked version was never keyed under
    // the new parent). For each shared instance pick the agreed version — a concrete
    // pinned id wins over the LATEST sentinel, ties resolved in PARENT_TYPES order
    // (matching `composeResources`' first-wins dedup) — and apply it everywhere.
    reconcileSharedVersions() {
      const rank = (value) => (value == null ? 0 : value === LATEST_READY ? 1 : 2)
      SHARED_VERSION_DEP_TYPES.forEach((type) => {
        const agreed = new Map()
        PARENT_TYPES.forEach((parent) => {
          const list = Array.isArray(this.coll[parent]?.[type]) ? this.coll[parent][type] : []
          list.forEach((entry) => {
            if (entry?.resourceId == null) return
            const key = String(entry.resourceId)
            const current = agreed.get(key)
            if (current === undefined || rank(entry.version) > rank(current)) {
              agreed.set(key, entry.version)
            }
          })
        })
        if (agreed.size === 0) return
        PARENT_TYPES.forEach((parent) => {
          const list = this.coll[parent]?.[type]
          if (!Array.isArray(list)) return
          let changed = false
          const nextList = list.map((entry) => {
            if (entry?.resourceId == null) return entry
            const version = agreed.get(String(entry.resourceId))
            if (version !== undefined && entry.version !== version) {
              changed = true
              return { ...entry, version }
            }
            return entry
          })
          if (changed) this._setParentColl(parent, type, nextList)
        })
      })
    },

    // Toggle a dependency collection group open/closed (UI grouping only). Keyed
    // by `parent:type` so collapsing one card never collapses another's same type.
    toggleCollOpen(parent, type) {
      if (!OWNED_COLLECTIONS[parent]?.includes(type)) return
      const key = `${parent}:${type}`
      this.collOpen = { ...this.collOpen, [key]: !this.collOpen[key] }
    },

    removeCollItem(parent, type, index) {
      const list = this.coll[parent]?.[type]
      if (!Array.isArray(list)) return
      this._setParentColl(
        parent,
        type,
        list.filter((entry, position) => Boolean(entry) && position !== index)
      )
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

    // The composable feeds the per-DS active-release read failure flag here so
    // `deployCtx` can block publish on a degraded DS (see `activeReleaseErrorByDs`).
    setActiveReleaseError(dsId, failed) {
      this.activeReleaseErrorByDs = { ...this.activeReleaseErrorByDs, [dsId]: Boolean(failed) }
    },

    setVersionsByResource(type, resourceId, options) {
      this.versionsByResource = {
        ...this.versionsByResource,
        [versionsKey(type, resourceId)]: Array.isArray(options) ? options : []
      }
    },

    // Pre-select the singleton + dependency versions with the pins carried by
    // `dsId`'s active release — the 'from-deployment' entry only (the view gates
    // the caller on `isFromDeployment`; every other entry keeps its own default:
    // LATEST_READY for singletons, `null`/pending for dependencies). Reads ONLY
    // store state (`activeReleaseByDs`, `versionsByResource`, `resVers`, `coll`) —
    // no I/O — so it can be re-invoked freely as the view's loaded-data watchers
    // re-fire while the release/catalogs/deps arrive async.
    //
    // "User pick wins" doubles as the ONE-SHOT/idempotency guard: a slot already
    // defined — a prior explicit pick OR a prior seed — is never revisited, so a
    // slot is written AT MOST once and repeated calls with the same loaded data
    // are a no-op past the first successful write.
    //
    // A pin is only applied when it resolves against the LOADED catalog
    // (`versionsByResource`): the release may pin a version that has since been
    // deprecated/removed, or the catalog for that resource simply hasn't loaded
    // yet. Either way, a miss is SILENT — no warning surfaces — and the slot
    // falls through to its existing default (LATEST_READY for a singleton, `null`
    // for a dependency), exactly as if this action had never run.
    seedVersionsFromRelease(dsId) {
      const release = this.activeReleaseByDs[dsId]
      const releaseResources = Array.isArray(release?.resources) ? release.resources : []

      // --- singletons: resVers[type] ---
      releaseResources.forEach((resource) => {
        const type = resource?.resource_type
        if (!SINGLETON_TYPES.includes(type)) return
        if (this.resVers[type] !== undefined) return

        const resourceId = resource.resource_id ?? resource.global_id
        const pin = resource.version_id ?? resource.resource_version_id ?? resource.resource_version
        if (resourceId == null || pin == null) return

        const options = this.versionsByResource[versionsKey(type, resourceId)] ?? []
        const matched = options.find((option) => String(option.value) === String(pin))
        if (!matched) return

        this.resVers[type] = matched.value
      })

      // --- dependencies: coll[parent][type][].version ---
      // Index the release composition once by `type:resourceId` → pin so every
      // dependency instance (nested per parent) can look up its own pin in O(1).
      const pinByKey = new Map()
      releaseResources.forEach((resource) => {
        const type = resource?.resource_type
        const resourceId = resource?.resource_id ?? resource?.global_id
        const pin =
          resource?.version_id ?? resource?.resource_version_id ?? resource?.resource_version
        if (type == null || resourceId == null || pin == null) return
        pinByKey.set(`${type}:${String(resourceId)}`, pin)
      })

      let seededAnyDep = false
      PARENT_TYPES.forEach((parent) => {
        ;(OWNED_COLLECTIONS[parent] ?? []).forEach((type) => {
          const list = Array.isArray(this.coll[parent]?.[type]) ? this.coll[parent][type] : []
          if (!list.length) return

          let changed = false
          const nextList = list.map((instance) => {
            if (instance?.resourceId == null || instance.version != null) return instance

            const pin = pinByKey.get(`${type}:${String(instance.resourceId)}`)
            if (pin == null) return instance

            const options = this.versionsByResource[versionsKey(type, instance.resourceId)] ?? []
            const matched = options.find((option) => String(option.value) === String(pin))
            if (!matched) return instance

            changed = true
            seededAnyDep = true
            return { ...instance, version: matched.value }
          })

          if (changed) this._setParentColl(parent, type, nextList)
        })
      })

      // A shared-type dependency (connector/network_list) just seeded under one
      // parent must propagate to every sibling parent that references the same
      // instance — the existing `rank` in `reconcileSharedVersions` already makes
      // a concrete pin win over `null`/LATEST, so this is a straight reuse.
      if (seededAnyDep) this.reconcileSharedVersions()
    },

    // Resolve a chosen version to a concrete id for dispatch (Property 6: the
    // 'LATEST' sentinel never leaves the store).
    resolveVersion(type, resourceId, selected) {
      const options = this.versionsByResource[versionsKey(type, resourceId)] ?? []
      return resolveLatestVersion(options, selected)
    },

    // Assemble the flat `resources[]` for the payload. Each entry carries
    // `resource_id` + `resource_version` + `resource_type` in the shape the
    // adapter expects (every resource keyed by `resource_id`). Optional
    // singletons toggled off are skipped; every 'LATEST' sentinel is resolved to
    // a concrete `version_id` (Property 6).
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

      // Flatten per-parent dependency instances into the flat payload, DEDUPING by
      // `(resource_id, type)`: a resource pins a single version in a flat release,
      // so the same dependency referenced by two parents ships exactly once.
      const seenDeps = new Set()
      PARENT_TYPES.forEach((parent) => {
        ;(OWNED_COLLECTIONS[parent] ?? []).forEach((type) => {
          const list = Array.isArray(this.coll[parent]?.[type]) ? this.coll[parent][type] : []
          list.forEach((item) => {
            if (item?.resourceId == null) return
            const key = versionsKey(type, item.resourceId)
            if (seenDeps.has(key)) return
            seenDeps.add(key)
            resources.push({
              resource_id: item.resourceId,
              resource_version: this.resolveVersion(type, item.resourceId, item.version),
              resource_type: type
            })
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

      // The SCOPED singleton's own dependencies are editable overrides; every OTHER
      // singleton's deps are preserved byte-for-byte by the composable's per-DS read
      // and must never leak here. The `additional` bucket is the deliberate
      // exception: those are dependencies the user EXPLICITLY added to this release,
      // so they ride along as overrides too (the composable appends any that don't
      // already exist in the preserved composition).
      const dependencyOverrides = []
      const seenDeps = new Set()
      ;[scopedType, ADDITIONAL_PARENT].forEach((parent) => {
        ;(OWNED_COLLECTIONS[parent] ?? []).forEach((type) => {
          const list = Array.isArray(this.coll[parent]?.[type]) ? this.coll[parent][type] : []
          list.forEach((item) => {
            if (item?.resourceId == null) return
            const key = versionsKey(type, item.resourceId)
            if (seenDeps.has(key)) return
            seenDeps.add(key)
            dependencyOverrides.push({
              resource_id: item.resourceId,
              resource_type: type,
              version: this.resolveVersion(type, item.resourceId, item.version)
            })
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
export {
  SINGLETON_TYPES,
  OPTIONAL_SINGLETON_TYPES,
  COLLECTION_TYPES,
  OWNED_COLLECTIONS,
  PARENT_TYPES,
  SHARED_VERSION_DEP_TYPES,
  ADDITIONAL_PARENT,
  MANUAL_DEP_TYPES,
  releaseResourceId
}
