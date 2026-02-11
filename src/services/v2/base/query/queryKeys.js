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
  marketplace: {
    all: ['marketplace'],
    list: (params) => [...queryKeys.marketplace.all, 'list', params],
    categories: () => [...queryKeys.marketplace.all, 'categories'],
    detail: (vendor, slug) => [...queryKeys.marketplace.all, 'detail', vendor, slug]
  },
  application: {
    all: ['application'],
    detail: (id) => {
      return [...queryKeys.application.all, id]
    },
    list: (id, params) => {
      return [...queryKeys.application.all, id, 'list', params]
    },
    origins: {
      all: (parentId) => [...queryKeys.application.detail(parentId), 'origins'],
      list: (parentId, params) => [
        ...queryKeys.application.detail(parentId),
        'origins',
        'list',
        params
      ],
      detail: (parentId, id) => [...queryKeys.application.detail(parentId), 'origins', 'detail', id]
    },
    cacheSettings: {
      all: (parentId) => [...queryKeys.application.detail(parentId), 'cache-settings'],
      list: (parentId, params) => [
        ...queryKeys.application.detail(parentId),
        'cache-settings',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.application.detail(parentId),
        'cache-settings',
        'detail',
        id
      ]
    },
    deviceGroups: {
      all: (parentId) => [...queryKeys.application.detail(parentId), 'device-groups'],
      list: (parentId, params) => [
        ...queryKeys.application.detail(parentId),
        'device-groups',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.application.detail(parentId),
        'device-groups',
        'detail',
        id
      ]
    },
    errorResponse: {
      all: (parentId) => [...queryKeys.application.detail(parentId), 'error-responses'],
      list: (parentId, params) => [
        ...queryKeys.application.detail(parentId),
        'error-responses',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.application.detail(parentId),
        'error-responses',
        'detail',
        id
      ]
    },
    rulesEngine: {
      all: (parentId) => [...queryKeys.application.detail(parentId), 'rules-engine'],
      list: (parentId, params) => [
        ...queryKeys.application.detail(parentId),
        'rules-engine',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.application.detail(parentId),
        'rules-engine',
        'detail',
        id
      ]
    },
    functionInstance: {
      all: (parentId) => [...queryKeys.application.detail(parentId), 'functions'],
      list: (parentId, params) => [
        ...queryKeys.application.detail(parentId),
        'functions',
        'list',
        params
      ],
      detail: (parentId, id) => [
        ...queryKeys.application.detail(parentId),
        'functions',
        'detail',
        id
      ]
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
  applicationV3: {
    all: ['application-v3'],
    list: (params) => [...queryKeys.applicationV3.all, 'list', params],
    detail: (id) => [...queryKeys.applicationV3.all, 'detail', id]
  },
  billing: {
    all: ['billing'],
    lastBill: () => [...queryKeys.billing.all, 'last-bill']
  },
  variables: {
    all: ['variables'],
    list: () => [...queryKeys.variables.all, 'list']
  },
  edgeFunction: {
    all: ['edge-functions'],
    list: (params) => [...queryKeys.edgeFunction.all, 'list', params],
    detail: (id) => [...queryKeys.edgeFunction.all, 'detail', id]
  },
  edgeDNS: {
    all: ['edge-dns'],
    list: (params) => [...queryKeys.edgeDNS.all, 'list', params],
    detail: (id) => [...queryKeys.edgeDNS.all, 'detail', id],
    dnssec: (id) => [...queryKeys.edgeDNS.detail(id), 'dnssec'],
    records: {
      all: (parentId) => [...queryKeys.edgeDNS.detail(parentId), 'records'],
      list: (parentId, params) => [
        ...queryKeys.edgeDNS.detail(parentId),
        'records',
        'list',
        params
      ],
      detail: (parentId, id) => [...queryKeys.edgeDNS.detail(parentId), 'records', 'detail', id]
    }
  },
  edgeStorage: {
    all: ['edge-storage'],
    buckets: {
      all: () => [...queryKeys.edgeStorage.all, 'buckets'],
      list: (params) => [...queryKeys.edgeStorage.buckets.all(), 'list', params],
      detail: (name) => [...queryKeys.edgeStorage.buckets.all(), 'detail', name]
    },
    files: {
      all: (bucketName) => [...queryKeys.edgeStorage.all, 'files', bucketName],
      list: (bucketName, params) => [...queryKeys.edgeStorage.files.all(bucketName), 'list', params]
    },
    credentials: {
      all: () => [...queryKeys.edgeStorage.all, 'credentials'],
      list: (bucketName, params) => [
        ...queryKeys.edgeStorage.credentials.all(),
        'list',
        bucketName,
        params
      ]
    }
  },
  dataStream: {
    all: ['data-streams'],
    list: (params) => [...queryKeys.dataStream.all, 'list', params],
    detail: (id) => [...queryKeys.dataStream.all, 'detail', id]
  },
  edgeConnectors: {
    all: ['edge-connectors'],
    list: (params) => [...queryKeys.edgeConnectors.all, 'list', params],
    detail: (id) => [...queryKeys.edgeConnectors.all, 'detail', id]
  },
  teamPermission: {
    all: ['team-permissions'],
    list: (params) => [...queryKeys.teamPermission.all, 'list', params],
    detail: (id) => [...queryKeys.teamPermission.all, 'detail', id]
  },
  waf: {
    all: ['waf-rules'],
    list: (params) => [...queryKeys.waf.all, 'list', params],
    detail: (id) => [...queryKeys.waf.all, 'detail', id]
  },
  edgeSql: {
    all: ['edge-sql'],
    list: (params) => [...queryKeys.edgeSql.all, 'list', params],
    detail: (id) => [...queryKeys.edgeSql.all, 'detail', id]
  },
  networkLists: {
    all: ['network-lists'],
    list: (params) => [...queryKeys.networkLists.all, 'list', params],
    detail: (id) => [...queryKeys.networkLists.all, 'detail', id]
  },
  digitalCertificates: {
    all: ['digital-certificates'],
    list: (params) => [...queryKeys.digitalCertificates.all, 'list', params],
    detail: (id) => [...queryKeys.digitalCertificates.all, 'detail', id]
  },
  customPages: {
    all: ['custom-pages'],
    list: (params) => [...queryKeys.customPages.all, 'list', params],
    detail: (id) => [...queryKeys.customPages.all, 'detail', id]
  },
  digitalCertificatesCRL: {
    all: ['digital-certificates-crl'],
    list: (params) => [...queryKeys.digitalCertificatesCRL.all, 'list', params],
    detail: (id) => [...queryKeys.digitalCertificatesCRL.all, 'detail', id]
  },
  users: {
    all: ['users'],
    list: (params) => [...queryKeys.users.all, 'list', params],
    detail: (id) => [...queryKeys.users.all, 'detail', id]
  }
}
