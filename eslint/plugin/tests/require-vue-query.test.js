const { RuleTester } = require('eslint')
const rule = require('../lib/rules/require-vue-query')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('require-vue-query', rule, {
  valid: [
    // Composable importing service AND @tanstack/vue-query — allowed
    {
      code: `
        import { useQuery } from '@tanstack/vue-query'
        import { usersService } from '../services/users-service'

        export function useUsers() {
          return useQuery({
            queryKey: ['users'],
            queryFn: () => usersService.list()
          })
        }
      `,
      filename: 'src/modules/users/composables/use-users.js'
    },

    // Composable with no service import — allowed (no server data usage)
    {
      code: `
        import { ref, computed } from 'vue'

        export function useCounter() {
          const count = ref(0)
          return { count }
        }
      `,
      filename: 'src/modules/users/composables/use-counter.js'
    },

    // Composable using @tanstack/query-core with service — allowed
    {
      code: `
        import { useQuery } from '@tanstack/query-core'
        import { usersService } from '../services/users-service'

        export function useUsers() {
          return useQuery({
            queryKey: ['users'],
            queryFn: () => usersService.list()
          })
        }
      `,
      filename: 'src/modules/users/composables/use-users.js'
    },

    // Composable using BaseService methods (useQuery on member) — allowed
    {
      code: `
        import { usersService } from '../services/users-service'

        export function useUsers() {
          return usersService.useQuery(['users'])
        }
      `,
      filename: 'src/modules/users/composables/use-users.js'
    },

    // Composable using service with useMutation member — allowed
    {
      code: `
        import { usersService } from '../services/users-service'

        export function useDeleteUser() {
          return usersService.useMutation(['users', 'delete'])
        }
      `,
      filename: 'src/modules/users/composables/use-delete-user.js'
    },

    // Composable importing BaseService directly — allowed
    {
      code: `
        import { BaseService } from '@/shared/services/base-service'
        import { usersService } from '../services/users-service'

        export function useUsers() {
          return usersService.list()
        }
      `,
      filename: 'src/modules/users/composables/use-users.js'
    },

    // Non-composable file — rule does not apply
    {
      code: `
        import { usersService } from '../services/users-service'
        export function getUsers() { return usersService.list() }
      `,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Composable importing service with useEnsureQueryData member — allowed
    {
      code: `
        import { usersService } from '../services/users-service'

        export function useUsers() {
          return usersService.useEnsureQueryData(['users'])
        }
      `,
      filename: 'src/modules/users/composables/use-users.js'
    },

    // Composable importing service with usePrefetchQuery member — allowed
    {
      code: `
        import { usersService } from '../services/users-service'

        export function useUsers() {
          return usersService.usePrefetchQuery(['users'])
        }
      `,
      filename: 'src/modules/users/composables/use-users.js'
    }
  ],

  invalid: [
    // Composable importing service WITHOUT vue-query import — forbidden
    {
      code: `
        import { usersService } from '../services/users-service'

        export function useUsers() {
          return usersService.list()
        }
      `,
      filename: 'src/modules/users/composables/use-users.js',
      errors: [
        {
          messageId: 'requireVueQuery',
          data: {
            fileName: 'use-users.js',
            source: '../services/users-service'
          }
        }
      ]
    },

    // Composable importing @/services without vue-query — forbidden
    {
      code: `
        import { listUsers } from '@/services/v2/users/users-service'

        export function useUserList() {
          return listUsers()
        }
      `,
      filename: 'src/modules/users/composables/useUserList.js',
      errors: [
        {
          messageId: 'requireVueQuery',
          data: {
            fileName: 'useUserList.js',
            source: '@/services/v2/users/users-service'
          }
        }
      ]
    },

    // Composable in shared importing service without vue-query — forbidden
    {
      code: `
        import { authService } from '../services/auth-service'

        export function useAuth() {
          return authService.me()
        }
      `,
      filename: 'src/composables/useAuth.js',
      errors: [
        {
          messageId: 'requireVueQuery',
          data: {
            fileName: 'useAuth.js',
            source: '../services/auth-service'
          }
        }
      ]
    }
  ]
})

console.log('require-vue-query: all tests passed')
