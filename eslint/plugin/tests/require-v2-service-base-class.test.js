const { RuleTester } = require('eslint')
const rule = require('../lib/rules/require-v2-service-base-class')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('require-v2-service-base-class', rule, {
  valid: [
    // Canonical v2 service: exported class extends BaseService — allowed
    {
      code: `
        import { BaseService } from '@/services/v2/base/query/baseService'
        export class UsersService extends BaseService {
          constructor() {
            super()
            this.baseURL = 'v4/users'
          }
        }
      `,
      filename: 'src/services/v2/users/users-service.js'
    },

    // Singleton pattern: class declared top-level (not exported) then exported as
    // an instance — the class still extends BaseService, so it is valid.
    {
      code: `
        import { BaseService } from '@/services/v2/base/query/baseService'
        class TeamsService extends BaseService {
          constructor() {
            super()
          }
        }
        export const teamsService = new TeamsService()
      `,
      filename: 'src/services/v2/teams/teams-service.js'
    },

    // Extends VersionServiceBase (which itself extends BaseService) — allowed
    {
      code: `
        import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
        export class WorkloadVersionService extends VersionServiceBase {}
      `,
      filename: 'src/services/v2/workload/workload-version-service.js'
    },

    // Factory-produced service leaf: no class at all in the file — allowed
    {
      code: `
        import { createVersionedSubResourceService } from '@/services/v2/edge-app/versioned/create-versioned-sub-resource-service'
        export const versionedDeviceGroupService = createVersionedSubResourceService({
          resource: 'device_groups'
        })
      `,
      filename: 'src/services/v2/edge-app/versioned/versioned-device-group-service.js'
    },

    // Purely functional service: no class — allowed (delegates/composes)
    {
      code: `
        export const createReleaseImpactLookupService = () => {
          return { lookup: () => {} }
        }
        export const releaseImpactLookupService = createReleaseImpactLookupService()
      `,
      filename: 'src/services/v2/release-impact/release-impact-lookup-service.js'
    },

    // Factory file whose INNER class does not extend BaseService — the class is
    // nested (not top-level), so it is not the file's service entry point — allowed.
    {
      code: `
        export const createVersionedSubResourceService = () => {
          class InnerService {
            list() {}
          }
          return new InnerService()
        }
      `,
      filename: 'src/services/v2/edge-app/versioned/create-versioned-sub-resource-service.js'
    },

    // Non-service file colocated in v2 (adapter) — outside the basename filter
    {
      code: `
        export class UsersAdapter {
          static transform() {}
        }
      `,
      filename: 'src/services/v2/users/users-adapter.js'
    },

    // Index barrel in v2 — outside the basename filter
    {
      code: `export * from './users-service'`,
      filename: 'src/services/v2/users/index.js'
    },

    // BaseService's own definition — camelCase filename dodges the -service filter
    // AND lives under base/, so it is exempt.
    {
      code: `export class BaseService {}`,
      filename: 'src/services/v2/base/query/baseService.js'
    },

    // Infra service under base/ that legitimately does not extend BaseService
    {
      code: `
        class CacheSyncService {
          start() {}
        }
        export const cacheSyncService = new CacheSyncService()
      `,
      filename: 'src/services/v2/base/cache-sync/cache-sync-service.js'
    },

    // Test file colocated in v2 — excluded
    {
      code: `
        export class FooService {}
      `,
      filename: 'src/services/v2/foo/foo-service.test.js'
    },

    // Legacy (non-v2) service — outside the v2-service zone gate
    {
      code: `
        export class UsersService {
          list() {}
        }
      `,
      filename: 'src/services/users-services/users-service.js'
    }
  ],

  invalid: [
    // V2 service class with NO superclass — forbidden
    {
      code: `
        export class FooService {
          list() {}
        }
      `,
      filename: 'src/services/v2/foo/foo-service.js',
      errors: [
        {
          messageId: 'mustExtendBaseService',
          data: {
            className: 'FooService',
            fileName: 'foo-service.js'
          }
        }
      ]
    },

    // V2 service class extending an unrelated base — forbidden
    {
      code: `
        import { SomethingElse } from './something-else'
        export class FooService extends SomethingElse {}
      `,
      filename: 'src/services/v2/foo/foo-service.js',
      errors: [
        {
          messageId: 'mustExtendBaseService',
          data: {
            className: 'FooService',
            fileName: 'foo-service.js'
          }
        }
      ]
    },

    // Singleton pattern with a class that does not extend BaseService — forbidden
    {
      code: `
        class BarService extends Object {}
        export const barService = new BarService()
      `,
      filename: 'src/services/v2/bar/bar-service.js',
      errors: [
        {
          messageId: 'mustExtendBaseService',
          data: {
            className: 'BarService',
            fileName: 'bar-service.js'
          }
        }
      ]
    }
  ]
})

console.log('require-v2-service-base-class: all tests passed')
