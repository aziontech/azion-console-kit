import { toValue, computed, isRef } from 'vue'
import { logger } from '../logger'
import { isProduction } from '@/helpers/get-environment'

export function createFinalKey(queryKey) {
  if (queryKey === null || queryKey === undefined) {
    logger.error('keyFactory', 'Invalid queryKey (null/undefined)')
    return ['__invalid_key__', Date.now()]
  }

  if (typeof queryKey === 'function') return queryKey
  if (!Array.isArray(queryKey)) queryKey = [queryKey]

  if (!isProduction()) {
    const hasInvalidValues = queryKey.some((value) => value === null || value === undefined)
    if (hasInvalidValues) {
      logger.warn('keyFactory', 'QueryKey contains null/undefined:', queryKey)
    }
  }

  const hasReactive = queryKey.some((value) => isRef(value) || typeof value === 'function')

  if (!hasReactive) return queryKey
  return computed(() => queryKey.map((item) => toValue(item)))
}

const validateId = (id, context) => {
  if (id === null || id === undefined) {
    logger.warn('queryKeys', `Invalid id in ${context}:`, id)
    return '__invalid_id__'
  }
  return id
}

const createKeys = (resource) => {
  const keys = {
    all: (parentId) => {
      if (parentId !== undefined) {
        const validId = validateId(parentId, `${resource}.all`)
        return [resource, validId]
      }
      return [resource]
    },
    lists: (parentId) => {
      const base = parentId !== undefined ? keys.all(parentId) : keys.all()
      return [...base, 'list']
    },
    list: (parentIdOrFilters, filters) => {
      const isNested = filters !== undefined
      const parentId = isNested ? parentIdOrFilters : undefined
      const actualFilters = isNested ? filters : parentIdOrFilters || {}

      const base = keys.lists(parentId)
      const sortedEntries = Object.entries(actualFilters)
        .filter(([, value]) => value !== undefined && value !== null)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))

      return sortedEntries.length > 0 ? [...base, actualFilters] : base
    },
    details: (parentId) => {
      const base = parentId !== undefined ? keys.all(parentId) : keys.all()
      return [...base, 'detail']
    },
    detail: (parentIdOrId, id) => {
      const isNested = id !== undefined
      const parentId = isNested ? parentIdOrId : undefined
      const actualId = isNested ? id : parentIdOrId

      const validId = validateId(actualId, `${resource}.detail`)
      return [...keys.details(parentId), validId]
    }
  }
  return keys
}

export const queryKeys = {
  account: {
    all: ['account'],
    info: () => [...queryKeys.account.all, 'info']
  },

  user: {
    all: ['user'],
    info: () => [...queryKeys.user.all, 'info']
  },

  contract: {
    all: ['contract'],
    servicePlans: () => [...queryKeys.contract.all, 'service-plan'],
    servicePlan: (clientId) => {
      const validId = validateId(clientId, 'contract.servicePlan')
      return [...queryKeys.contract.servicePlans(), validId]
    }
  },

  accountSettings: {
    all: ['account-settings'],
    jobRole: () => [...queryKeys.accountSettings.all, 'job-role']
  },

  solutions: {
    all: ['solutions'],
    lists: () => [...queryKeys.solutions.all, 'list'],
    list: (group, type) => [...queryKeys.solutions.lists(), group, type]
  },

  edgeApp: createKeys('edge-apps'),
  workload: createKeys('workloads'),
  edgeFirewall: createKeys('edge-firewalls'),
  edgeFirewallFunctions: createKeys('edge-firewall-functions'),
  edgeFirewallRulesEngine: createKeys('edge-firewall-rules-engine'),
  cacheSettings: createKeys('cache-settings'),
  deviceGroups: createKeys('device-groups'),
  errorResponse: createKeys('error-responses'),
  rulesEngine: createKeys('rules-engine'),
  edgeAppFunctions: createKeys('edge-app-functions'),
  origins: createKeys('origins'),

  teams: {
    all: ['teams', 'list']
  },

  edgeAppV3: {
    all: ['edge-apps-v3'],
    lists: () => [...queryKeys.edgeAppV3.all, 'list'],
    list: (orderBy, sort, page, pageSize) => [
      ...queryKeys.edgeAppV3.lists(),
      orderBy,
      sort,
      page,
      pageSize
    ],
    details: () => [...queryKeys.edgeAppV3.all, 'detail'],
    detail: (id) => {
      const validId = validateId(id, 'edgeAppV3.detail')
      return [...queryKeys.edgeAppV3.details(), validId]
    }
  },

  billing: {
    all: ['billing'],
    lastBill: () => [...queryKeys.billing.all, 'last-bill']
  }
}

export const createCustomKeys = createKeys
