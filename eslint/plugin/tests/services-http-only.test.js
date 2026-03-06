const { RuleTester } = require('eslint')
const rule = require('../lib/rules/services-http-only')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('services-http-only', rule, {
  valid: [
    // Service importing HTTP modules — allowed
    {
      code: `import axios from 'axios'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Service importing api client — allowed
    {
      code: `import { api } from '@/shared/services/api-client'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Service importing from adapter modules — allowed (not store/composable/dom)
    {
      code: `import { usersAdapter } from '../adapters/users-adapter'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Service importing type files — allowed (type-only)
    {
      code: `import { UserResponse } from '../types/user.types'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Service importing contract files — allowed (type-only)
    {
      code: `import { User } from '../types/user.contracts'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Base/http excluded path with store import — excluded
    {
      code: `import { authStore } from '@/stores/auth-store'`,
      filename: 'src/services/base/http/interceptor.js'
    },

    // Base/query excluded path — excluded
    {
      code: `import { useRouter } from 'vue-router'`,
      filename: 'src/services/base/query/query-service.js'
    },

    // Axios makeApi excluded — excluded
    {
      code: `import { authStore } from '@/stores/auth-store'`,
      filename: 'src/services/axios/makeApi/index.js'
    },

    // Non-service file — rule does not apply
    {
      code: `import { useUserStore } from '../stores/user-store'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Service with plain HTTP logic — allowed
    {
      code: `
        import { api } from '@/shared/services/api-client'

        export const usersService = {
          list() { return api.get('/users') }
        }
      `,
      filename: 'src/modules/users/services/users-service.js'
    }
  ],

  invalid: [
    // Service importing store — forbidden
    {
      code: `import { useUserStore } from '../stores/user-store'`,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noStoreInService',
          data: {
            fileName: 'users-service.js',
            source: '../stores/user-store'
          }
        }
      ]
    },

    // Service importing from @/stores — forbidden
    {
      code: `import { useAuthStore } from '@/stores/auth-store'`,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noStoreInService',
          data: {
            fileName: 'users-service.js',
            source: '@/stores/auth-store'
          }
        }
      ]
    },

    // Service importing composable — forbidden
    {
      code: `import { useAuth } from '../composables/useAuth'`,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noComposableInService',
          data: {
            fileName: 'users-service.js',
            source: '../composables/useAuth'
          }
        }
      ]
    },

    // Service importing vue-router — forbidden (DOM import)
    {
      code: `import { useRouter } from 'vue-router'`,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noDomInService',
          data: { fileName: 'users-service.js', source: 'vue-router' }
        }
      ]
    },

    // Service importing @/router — forbidden (DOM import)
    {
      code: `import router from '@/router'`,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noDomInService',
          data: { fileName: 'users-service.js', source: '@/router' }
        }
      ]
    },

    // Service accessing document — forbidden
    {
      code: `
        const cookie = document.cookie
      `,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noDomAccess',
          data: { fileName: 'users-service.js', object: 'document' }
        }
      ]
    },

    // Service accessing localStorage — forbidden
    {
      code: `
        const token = localStorage.getItem('token')
      `,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noDomAccess',
          data: { fileName: 'users-service.js', object: 'localStorage' }
        }
      ]
    },

    // Service accessing sessionStorage — forbidden
    {
      code: `
        const session = sessionStorage.getItem('session')
      `,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noDomAccess',
          data: { fileName: 'users-service.js', object: 'sessionStorage' }
        }
      ]
    },

    // V2 service importing store — forbidden
    {
      code: `import { useAuthStore } from '@/stores/auth-store'`,
      filename: 'src/services/v2/users/users-service.js',
      errors: [
        {
          messageId: 'noStoreInService',
          data: {
            fileName: 'users-service.js',
            source: '@/stores/auth-store'
          }
        }
      ]
    },

    // Multiple violations
    {
      code: `
        import { useAuthStore } from '@/stores/auth-store'
        import { useAuth } from '../composables/useAuth'
        const token = localStorage.getItem('token')
      `,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        { messageId: 'noStoreInService' },
        { messageId: 'noComposableInService' },
        { messageId: 'noDomAccess' }
      ]
    }
  ]
})

console.log('services-http-only: all tests passed')
