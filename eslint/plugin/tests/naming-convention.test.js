const { RuleTester } = require('eslint')
const rule = require('../lib/rules/naming-convention')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('naming-convention', rule, {
  valid: [
    // Correctly named service — allowed
    {
      code: `export const usersService = {}`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Correctly named service (TypeScript) — allowed
    {
      code: `export const usersService = {}`,
      filename: 'src/modules/users/services/users-service.ts'
    },

    // Correctly named adapter — allowed
    {
      code: `export const usersAdapter = {}`,
      filename: 'src/modules/users/adapters/users-adapter.js'
    },

    // Correctly named adapter (TypeScript) — allowed
    {
      code: `export const usersAdapter = {}`,
      filename: 'src/modules/users/adapters/users-adapter.ts'
    },

    // Correctly named composable (use- prefix, kebab) — allowed
    {
      code: `export function useUsers() {}`,
      filename: 'src/modules/users/composables/use-users.js'
    },

    // Correctly named composable (usePascal) — allowed
    {
      code: `export function useUsers() {}`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Correctly named composable (TypeScript) — allowed
    {
      code: `export function useUsers() {}`,
      filename: 'src/modules/users/composables/useUsers.ts'
    },

    // Correctly named store — allowed
    {
      code: `export const useUsersStore = defineStore('users', () => {})`,
      filename: 'src/modules/users/stores/users-store.js'
    },

    // Index file — skipped
    {
      code: `export { default } from './UsersView.vue'`,
      filename: 'src/modules/users/index.js'
    },

    // Index file (TypeScript) — skipped
    {
      code: `export { default } from './UsersView.vue'`,
      filename: 'src/modules/users/index.ts'
    },

    // Type file — skipped
    {
      code: `export const UserResponse = {}`,
      filename: 'src/modules/users/types/user.types.ts'
    },

    // Contract file — skipped
    {
      code: `export const User = {}`,
      filename: 'src/modules/users/types/user.contracts.ts'
    },

    // Test file — skipped
    {
      code: `const test = 'users-service test'`,
      filename: 'src/modules/users/__tests__/users-service.spec.ts'
    },

    // Vue file — skipped (has its own naming pattern)
    {
      code: `const x = 1`,
      filename: 'src/modules/users/components/UserList.vue'
    },

    // Non-module file — rule does not apply
    {
      code: `export const usersService = {}`,
      filename: 'src/shared/services/api-client.js'
    },

    // V2 service with correct naming — allowed
    {
      code: `export const usersService = {}`,
      filename: 'src/services/v2/users/users-service.js'
    },

    // Multi-word service name — allowed
    {
      code: `export const dataStreamService = {}`,
      filename: 'src/modules/data-stream/services/data-stream-service.js'
    },

    // Multi-word composable (use- kebab) — allowed
    {
      code: `export function useUserList() {}`,
      filename: 'src/modules/users/composables/use-user-list.js'
    }
  ],

  invalid: [
    // camelCase service filename — forbidden
    {
      code: `export const getUsersService = {}`,
      filename: 'src/modules/users/services/getUsersService.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'getUsersService.js',
            roleDir: 'services/',
            expected: '<name>-service.js/ts'
          }
        }
      ]
    },

    // PascalCase adapter filename — forbidden
    {
      code: `export const UsersAdapter = {}`,
      filename: 'src/modules/users/adapters/UsersAdapter.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'UsersAdapter.js',
            roleDir: 'adapters/',
            expected: '<name>-adapter.js/ts'
          }
        }
      ]
    },

    // Service file without -service suffix — forbidden
    {
      code: `export function fetchUsers() {}`,
      filename: 'src/modules/users/services/fetchUsers.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'fetchUsers.js',
            roleDir: 'services/',
            expected: '<name>-service.js/ts'
          }
        }
      ]
    },

    // Composable file without use prefix — forbidden
    {
      code: `export function getUsers() {}`,
      filename: 'src/modules/users/composables/getUsers.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'getUsers.js',
            roleDir: 'composables/',
            expected: 'use-<name>.js/ts or use<Name>.js/ts'
          }
        }
      ]
    },

    // Store file without -store suffix — forbidden
    {
      code: `export const useUsersStore = defineStore('users', () => {})`,
      filename: 'src/modules/users/stores/usersState.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'usersState.js',
            roleDir: 'stores/',
            expected: '<name>-store.js/ts'
          }
        }
      ]
    },

    // PascalCase store filename — forbidden
    {
      code: `export const useUsersStore = defineStore('users', () => {})`,
      filename: 'src/modules/users/stores/UsersStore.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'UsersStore.js',
            roleDir: 'stores/',
            expected: '<name>-store.js/ts'
          }
        }
      ]
    },

    // Adapter file missing -adapter suffix — forbidden
    {
      code: `export function transform() {}`,
      filename: 'src/modules/users/adapters/users-transform.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'users-transform.js',
            roleDir: 'adapters/',
            expected: '<name>-adapter.js/ts'
          }
        }
      ]
    },

    // V2 service with wrong naming in service subfolder — forbidden
    {
      code: `export const UsersService = {}`,
      filename: 'src/services/v2/users/services/UsersService.js',
      errors: [
        {
          messageId: 'invalidName',
          data: {
            fileName: 'UsersService.js',
            roleDir: 'services/',
            expected: '<name>-service.js/ts'
          }
        }
      ]
    }
  ]
})

console.log('naming-convention: all tests passed')
