const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-http-in-stores')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-http-in-stores', rule, {
  valid: [
    // Store importing from vue — allowed
    {
      code: `import { ref, computed } from 'vue'`,
      filename: 'src/stores/users-store.js'
    },

    // Store importing from pinia — allowed (not classified as HTTP/service)
    // Note: pinia matches STORE_PATTERNS but isHttpOrServiceImport checks http+service only
    {
      code: `import { defineStore } from 'pinia'`,
      filename: 'src/modules/users/stores/users-store.js'
    },

    // Store importing from composables — allowed
    {
      code: `import { useAuth } from '../composables/useAuth'`,
      filename: 'src/modules/users/stores/users-store.js'
    },

    // Store importing from type files — allowed (type-only)
    {
      code: `import { UserFilter } from '../types/user.types'`,
      filename: 'src/modules/users/stores/users-store.js'
    },

    // Store importing from contract files — allowed (type-only)
    {
      code: `import { User } from '../types/user.contracts'`,
      filename: 'src/modules/users/stores/users-store.js'
    },

    // Non-store file importing axios — rule does not apply
    {
      code: `import axios from 'axios'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Store with plain client state logic — no violations
    {
      code: `
        import { defineStore } from 'pinia'
        import { ref } from 'vue'
        const useUserStore = defineStore('user', () => {
          const filter = ref('')
          return { filter }
        })
      `,
      filename: 'src/modules/users/stores/users-store.js'
    }
  ],

  invalid: [
    // Store importing axios — forbidden
    {
      code: `import axios from 'axios'`,
      filename: 'src/stores/users-store.js',
      errors: [
        {
          messageId: 'noHttpInStore',
          data: { fileName: 'users-store.js', source: 'axios' }
        }
      ]
    },

    // Store importing from services — forbidden
    {
      code: `import { listUsers } from '../services/users-service'`,
      filename: 'src/modules/users/stores/users-store.js',
      errors: [
        {
          messageId: 'noHttpInStore',
          data: {
            fileName: 'users-store.js',
            source: '../services/users-service'
          }
        }
      ]
    },

    // Store importing from @/services — forbidden
    {
      code: `import { api } from '@/services/api-client'`,
      filename: 'src/modules/users/stores/users-store.js',
      errors: [
        {
          messageId: 'noHttpInStore',
          data: { fileName: 'users-store.js', source: '@/services/api-client' }
        }
      ]
    },

    // Store calling fetch() — forbidden
    {
      code: `
        const data = fetch('/api/users')
      `,
      filename: 'src/stores/users-store.js',
      errors: [
        {
          messageId: 'noFetchInStore',
          data: { fileName: 'users-store.js' }
        }
      ]
    },

    // Store calling window.fetch() — forbidden
    {
      code: `
        const data = window.fetch('/api/users')
      `,
      filename: 'src/modules/users/stores/users-store.js',
      errors: [
        {
          messageId: 'noFetchInStore',
          data: { fileName: 'users-store.js' }
        }
      ]
    },

    // Multiple violations: import + fetch
    {
      code: `
        import axios from 'axios'
        const data = fetch('/api/users')
      `,
      filename: 'src/stores/users-store.js',
      errors: [{ messageId: 'noHttpInStore' }, { messageId: 'noFetchInStore' }]
    }
  ]
})

console.log('no-http-in-stores: all tests passed')
