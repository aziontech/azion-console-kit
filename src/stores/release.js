import { defineStore } from 'pinia'
import { LATEST_READY, resolveLatestVersion } from '@/templates/release-composition/version-options'

const APPLICATION_TYPE = 'application'
const OPTIONAL_SINGLETON_TYPES = ['firewall', 'custom_page']
const SINGLETON_TYPES = [APPLICATION_TYPE, ...OPTIONAL_SINGLETON_TYPES]

const COLLECTION_TYPES = ['function', 'connector', 'waf', 'network_list']

const ADDITIONAL_PARENT = 'additional'
const MANUAL_DEP_TYPES = ['connector', 'network_list']

const OWNED_COLLECTIONS = {
  [APPLICATION_TYPE]: ['function', 'connector'],
  firewall: ['function', 'network_list', 'waf'],
  custom_page: ['connector'],
  [ADDITIONAL_PARENT]: MANUAL_DEP_TYPES
}
const PARENT_TYPES = Object.keys(OWNED_COLLECTIONS)

const SHARED_VERSION_DEP_TYPES = ['connector', 'network_list']

const VERSIONED_URLS = 'versioned_urls'
const MAX_DEPLOYS = 20

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const versionsKey = (type, id) => `${type}:${id}`

const collKey = (parent, type, id) => `${parent}:${type}:${id}`

const releaseResourceId = (resource) =>
  resource?.resource_type === APPLICATION_TYPE
    ? (resource?.global_id ?? resource?.resource_id ?? null)
    : (resource?.resource_id ?? resource?.global_id ?? null)

const freshLoadedData = () => ({
  deployments: [],
  activeReleaseByDs: {},
  activeReleaseErrorByDs: {},
  versionsByResource: {}
})

const freshSelectionState = () => ({
  fromVersion: false,
  scopedType: null,
  versionId: '',
  resourceId: '',
  deploymentId: '',
  deploymentIds: [],
  resNames: {},
  resVers: {},
  resEnabled: {},
  coll: {},
  collOpen: {},
  canary: false,
  canaryForm: {},
  dsQuery: '',
  impactUnavailable: true
})

const freshState = () => ({
  ...freshSelectionState(),
  ...freshLoadedData()
})

export const useReleaseStore = defineStore('release', {
  state: freshState,

  getters: {
    effDsId: (state) => state.deploymentId || state.deploymentIds[0] || '',

    deployCtx() {
      return (dsId = this.effDsId) => {
        const deployment =
          this.deployments.find((item) => String(item?.id) === String(dsId)) ?? null
        const activeRelease = this.activeReleaseByDs[dsId] ?? null

        const ok = Boolean(dsId)
        const isVersioned = deployment?.deployment_policy === VERSIONED_URLS
        const deployed = Boolean(activeRelease)

        const degraded = Boolean(this.activeReleaseErrorByDs[dsId])

        const resources = Array.isArray(activeRelease?.resources) ? activeRelease.resources : []
        const releaseHasApp = resources.some(
          (resource) => resource?.resource_type === APPLICATION_TYPE
        )
        const hasApp = releaseHasApp || Boolean(this.resNames[APPLICATION_TYPE])

        const appEditable = hasApp && (isVersioned || !deployed)

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

    appVersionChosen() {
      const value = this.resVers[APPLICATION_TYPE]
      if (value === LATEST_READY || Boolean(value)) return true
      return value === undefined && this.deployCtx().hasApp
    },

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
    openRelease(payload = {}) {
      this.$patch(freshSelectionState())

      MANUAL_DEP_TYPES.forEach((type) => {
        this.collOpen[`${ADDITIONAL_PARENT}:${type}`] = false
      })

      const source = isObject(payload) ? payload : {}

      if ('fromVersion' in source) this.fromVersion = Boolean(source.fromVersion)
      if ('scopedType' in source) this.scopedType = source.scopedType ?? null
      if ('versionId' in source) this.versionId = source.versionId ?? ''
      if ('resourceId' in source) this.resourceId = source.resourceId ?? ''

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

      OPTIONAL_SINGLETON_TYPES.forEach((type) => {
        this.resEnabled[type] = true
      })

      if (source.scopedType && SINGLETON_TYPES.includes(source.scopedType)) {
        this.resEnabled[source.scopedType] = true
        if (source.resourceId != null) this.resNames[source.scopedType] = source.resourceId
        if (source.versionId) this.resVers[source.scopedType] = source.versionId
      }

      const seed = source.seed
      if (seed && SINGLETON_TYPES.includes(seed.type)) {
        this.resEnabled[seed.type] = true
        if (seed.resourceId != null) this.resNames[seed.type] = seed.resourceId
        if (seed.versionId) this.resVers[seed.type] = seed.versionId
      }
    },

    pickDs(id) {
      if (id == null) return
      const exists = this.deploymentIds.some((item) => String(item) === String(id))
      this.deploymentIds = exists
        ? this.deploymentIds.filter((item) => String(item) !== String(id))
        : [...this.deploymentIds, id]
      this.deploymentId = this.deploymentIds[0] ?? ''
    },

    toggleResource(type) {
      if (type === APPLICATION_TYPE || !OPTIONAL_SINGLETON_TYPES.includes(type)) return
      this.resEnabled[type] = !this.resEnabled[type]
    },

    setResName(type, resourceId) {
      this.resNames[type] = resourceId
      this.resVers[type] = LATEST_READY
    },

    setResVer(type, version) {
      this.resVers[type] = version
    },

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
      if (SHARED_VERSION_DEP_TYPES.includes(type)) {
        this.syncSharedDependencyVersion(type, resourceId, version)
      }
    },

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

    toggleCanary(value) {
      this.canary = value === undefined ? !this.canary : Boolean(value)
    },

    setCanaryForm(values) {
      this.canaryForm = isObject(values) ? values : {}
    },

    setDeployments(list) {
      this.deployments = Array.isArray(list) ? list : []
    },

    setActiveReleaseByDs(dsId, release) {
      this.activeReleaseByDs = { ...this.activeReleaseByDs, [dsId]: release ?? null }
    },

    setActiveReleaseError(dsId, failed) {
      this.activeReleaseErrorByDs = { ...this.activeReleaseErrorByDs, [dsId]: Boolean(failed) }
    },

    setVersionsByResource(type, resourceId, options) {
      this.versionsByResource = {
        ...this.versionsByResource,
        [versionsKey(type, resourceId)]: Array.isArray(options) ? options : []
      }
    },

    seedVersionsFromRelease(dsId) {
      const release = this.activeReleaseByDs[dsId]
      const releaseResources = Array.isArray(release?.resources) ? release.resources : []

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

      if (seededAnyDep) this.reconcileSharedVersions()
    },

    resolveVersion(type, resourceId, selected) {
      const options = this.versionsByResource[versionsKey(type, resourceId)] ?? []
      return resolveLatestVersion(options, selected)
    },

    composeResources() {
      const resources = []

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

        const selectedVersion = this.resVers[type] ?? LATEST_READY
        resources.push({
          resource_id: resourceId,
          resource_version: this.resolveVersion(type, resourceId, selectedVersion),
          resource_type: type
        })
      })

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
