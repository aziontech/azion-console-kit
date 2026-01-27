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
    servicePlans: (id) => [...queryKeys.contract.all, 'service-plans', id]
  },
  accountSettings: {
    all: ['account-settings'],
    jobRole: () => [...queryKeys.accountSettings.all, 'job-role']
  },
  solutions: {
    all: ['solutions'],
    list: (group, type) => [...queryKeys.solutions.all, 'list', group, type]
  },
  edgeApp: {
    all: ['edge-apps'],
    detail: (id) => {
      return [...queryKeys.edgeApp.all, id]
    },
    list: (id, params) => {
      return [...queryKeys.edgeApp.all, id, 'list', params]
    },
    origins: {
      all: (parentId) => [...queryKeys.edgeApp.detail(parentId), 'origins'],
      list: (parentId, params) => [
        ...queryKeys.edgeApp.detail(parentId),
        'origins',
        'list',
        params
      ],
      detail: (parentId, id) => [...queryKeys.edgeApp.detail(parentId), 'origins', 'detail', id]
    },
    cacheSettings: {
      all: (parentId) => [...queryKeys.edgeApp.detail(parentId), 'cache-settings'],
      list: (parentId, params) => [
        ...queryKeys.edgeApp.detail(parentId),
        'cache-settings',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.edgeApp.detail(parentId),
        'cache-settings',
        'detail',
        id
      ]
    },
    deviceGroups: {
      all: (parentId) => [...queryKeys.edgeApp.detail(parentId), 'device-groups'],
      list: (parentId, params) => [
        ...queryKeys.edgeApp.detail(parentId),
        'device-groups',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.edgeApp.detail(parentId),
        'device-groups',
        'detail',
        id
      ]
    },
    errorResponse: {
      all: (parentId) => [...queryKeys.edgeApp.detail(parentId), 'error-responses'],
      list: (parentId, params) => [
        ...queryKeys.edgeApp.detail(parentId),
        'error-responses',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.edgeApp.detail(parentId),
        'error-responses',
        'detail',
        id
      ]
    },
    rulesEngine: {
      all: (parentId) => [...queryKeys.edgeApp.detail(parentId), 'rules-engine'],
      list: (parentId, params) => [
        ...queryKeys.edgeApp.detail(parentId),
        'rules-engine',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.edgeApp.detail(parentId),
        'rules-engine',
        'detail',
        id
      ]
    },
    functionInstance: {
      all: (parentId) => [...queryKeys.edgeApp.detail(parentId), 'functions'],
      list: (parentId, params) => [
        ...queryKeys.edgeApp.detail(parentId),
        'functions',
        'list',
        params
      ],
      detail: (parentId, id) => [...queryKeys.edgeApp.detail(parentId), 'functions', 'detail', id]
    }
  },
  workload: {
    all: ['workloads'],
    list: (params) => [...queryKeys.workload.all, 'list', params],
    detail: (id) => [...queryKeys.workload.all, 'detail', id]
  },
  firewall: {
    all: ['edge-firewalls'],
    list: (params) => [...queryKeys.firewall.all, 'list', params],
    detail: (id) => [...queryKeys.firewall.all, 'detail', id],
    functions: {
      all: (parentId) => [...queryKeys.firewall.detail(parentId), 'functions'],
      list: (id, params) => [...queryKeys.firewall.detail(id), 'functions', params],
      detail: (parentId, id) => [...queryKeys.firewall.detail(parentId), 'functions', id]
    },
    rulesEngine: {
      all: (parentId) => [...queryKeys.firewall.detail(parentId), 'rules-engine'],
      list: (id, params) => [...queryKeys.firewall.detail(id), 'rules-engine', 'list', params],
      detail: (parentId, id) => [
        ...queryKeys.firewall.detail(parentId),
        'rules-engine',
        'detail',
        id
      ]
    }
  },
  teams: {
    all: ['teams', 'list']
  },
  edgeAppV3: {
    all: ['edge-apps-v3'],
    list: (params) => [...queryKeys.edgeAppV3.all, 'list', params],
    detail: (id) => [...queryKeys.edgeAppV3.all, 'detail', id]
  },
  billing: {
    all: ['billing'],
    lastBill: () => [...queryKeys.billing.all, 'last-bill']
  }
}
