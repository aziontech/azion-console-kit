const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-direct-http-in-components')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-direct-http-in-components', rule, {
  valid: [
    // Component importing from a composable (use*) — allowed
    {
      code: `import { useUsers } from '../composables/useUsers'`,
      filename: 'src/modules/users/components/user-list.vue'
    },

    // Component importing from @/components — allowed
    {
      code: `import BaseTable from '@/components/BaseTable.vue'`,
      filename: 'src/modules/users/components/user-list.vue'
    },

    // Component importing vue — allowed
    {
      code: `import { ref, computed } from 'vue'`,
      filename: 'src/modules/users/components/user-list.vue'
    },

    // Component importing vue-router — allowed (not classified as HTTP)
    {
      code: `import { useRoute } from 'vue-router'`,
      filename: 'src/modules/users/components/user-list.vue'
    },

    // Non-component file (service) importing axios — rule does not apply
    {
      code: `import axios from 'axios'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Non-component file in composables importing axios — rule does not apply
    {
      code: `import axios from 'axios'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Component importing from type files — allowed (type-only imports)
    {
      code: `import { UserResponse } from '../types/user.types'`,
      filename: 'src/modules/users/components/user-list.vue'
    },

    // Component importing from contract files — allowed (type-only imports)
    {
      code: `import { User } from '../types/user.contracts'`,
      filename: 'src/modules/users/components/user-list.vue'
    },

    // Component importing from error utilities — allowed (error imports)
    {
      code: `import { parseApiError } from '@/shared/utils/errors'`,
      filename: 'src/modules/users/components/user-list.vue'
    },

    // View file importing from composable — allowed
    {
      code: `import { useUsers } from '../composables/useUsers'`,
      filename: 'src/views/Users/UserList.vue'
    },

    // Component with non-HTTP code — no violations
    {
      code: `
        import { ref } from 'vue'
        const count = ref(0)
      `,
      filename: 'src/modules/users/components/user-list.vue'
    }
  ],

  invalid: [
    // Component importing axios — forbidden
    {
      code: `import axios from 'axios'`,
      filename: 'src/modules/users/components/user-list.vue',
      errors: [
        {
          messageId: 'noDirectHttp',
          data: { fileName: 'user-list.vue', source: 'axios' }
        }
      ]
    },

    // Component importing from @/services/v2/xxx/xxx-service — forbidden
    {
      code: `import { listUsers } from '@/services/v2/users/users-service'`,
      filename: 'src/modules/users/components/user-list.vue',
      errors: [
        {
          messageId: 'noDirectHttp',
          data: {
            fileName: 'user-list.vue',
            source: '@/services/v2/users/users-service'
          }
        }
      ]
    },

    // Component importing from relative services path — forbidden
    {
      code: `import { getUser } from '../services/users-service'`,
      filename: 'src/modules/users/components/user-detail.vue',
      errors: [
        {
          messageId: 'noDirectHttp',
          data: {
            fileName: 'user-detail.vue',
            source: '../services/users-service'
          }
        }
      ]
    },

    // Component calling fetch() — forbidden
    {
      code: `
        const data = fetch('/api/users')
      `,
      filename: 'src/modules/users/components/user-list.vue',
      errors: [
        {
          messageId: 'noFetchCall',
          data: { fileName: 'user-list.vue' }
        }
      ]
    },

    // Component calling window.fetch() — forbidden
    {
      code: `
        const data = window.fetch('/api/users')
      `,
      filename: 'src/modules/users/components/user-list.vue',
      errors: [
        {
          messageId: 'noFetchCall',
          data: { fileName: 'user-list.vue' }
        }
      ]
    },

    // View (.vue file in views/) importing axios — forbidden
    {
      code: `import axios from 'axios'`,
      filename: 'src/views/Users/UserList.vue',
      errors: [
        {
          messageId: 'noDirectHttp',
          data: { fileName: 'UserList.vue', source: 'axios' }
        }
      ]
    },

    // Component importing from service with -service suffix — forbidden
    {
      code: `import { create } from './user-service'`,
      filename: 'src/modules/users/components/user-form.vue',
      errors: [
        {
          messageId: 'noDirectHttp',
          data: { fileName: 'user-form.vue', source: './user-service' }
        }
      ]
    },

    // Multiple violations in one file
    {
      code: `
        import axios from 'axios'
        import { listUsers } from '../services/users-service'
        const data = fetch('/api/fallback')
      `,
      filename: 'src/modules/users/components/user-list.vue',
      errors: [
        { messageId: 'noDirectHttp' },
        { messageId: 'noDirectHttp' },
        { messageId: 'noFetchCall' }
      ]
    }
  ]
})

console.log('no-direct-http-in-components: all tests passed')
