const { RuleTester } = require('eslint')
const rule = require('../lib/rules/module-isolation')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('module-isolation', rule, {
  valid: [
    // Module importing from same module — allowed
    {
      code: `import { usersService } from '../services/users-service'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Module importing from same module (relative) — allowed
    {
      code: `import UserCard from './UserCard.vue'`,
      filename: 'src/modules/users/components/UserList.vue'
    },

    // Module importing from same module via @/modules alias — allowed
    {
      code: `import { usersService } from '@/modules/users/services/users-service'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Module importing from @/components (shared) — allowed (not a module import)
    {
      code: `import BaseTable from '@/components/BaseTable.vue'`,
      filename: 'src/modules/users/components/UserList.vue'
    },

    // Module importing from @/stores (shared) — allowed (not a module import)
    {
      code: `import { useAuthStore } from '@/stores/auth-store'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Module importing from @/composables (shared) — allowed
    {
      code: `import { useToast } from '@/composables/useToast'`,
      filename: 'src/modules/users/views/UsersView.vue'
    },

    // Module importing from vue — allowed
    {
      code: `import { ref, computed } from 'vue'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Module importing from npm package — allowed
    {
      code: `import { useQuery } from '@tanstack/vue-query'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Non-module file — rule does not apply
    {
      code: `import { usersService } from '@/modules/users/services/users-service'`,
      filename: 'src/shared/composables/useUsers.js'
    },

    // Module importing from @/shared — allowed
    {
      code: `import { formatDate } from '@/shared/utils/format-date'`,
      filename: 'src/modules/users/adapters/users-adapter.js'
    }
  ],

  invalid: [
    // Module importing from different module via @/modules — forbidden
    {
      code: `import { marketplaceService } from '@/modules/marketplace/services/marketplace-service'`,
      filename: 'src/modules/users/composables/useUsers.js',
      errors: [
        {
          messageId: 'noModuleCrossImport',
          data: {
            currentModule: 'users',
            importedModule: 'marketplace',
            source: '@/modules/marketplace/services/marketplace-service'
          }
        }
      ]
    },

    // Module importing component from different module — forbidden
    {
      code: `import MarketplaceCard from '@/modules/marketplace/components/MarketplaceCard.vue'`,
      filename: 'src/modules/users/views/UsersView.vue',
      errors: [
        {
          messageId: 'noModuleCrossImport',
          data: {
            currentModule: 'users',
            importedModule: 'marketplace',
            source: '@/modules/marketplace/components/MarketplaceCard.vue'
          }
        }
      ]
    },

    // Module importing adapter from different module — forbidden
    {
      code: `import { marketplaceAdapter } from '@/modules/marketplace/adapters/marketplace-adapter'`,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noModuleCrossImport',
          data: {
            currentModule: 'users',
            importedModule: 'marketplace',
            source: '@/modules/marketplace/adapters/marketplace-adapter'
          }
        }
      ]
    },

    // Module importing store from different module — forbidden
    {
      code: `import { useMarketplaceStore } from '@/modules/marketplace/stores/marketplace-store'`,
      filename: 'src/modules/users/composables/useUsers.js',
      errors: [
        {
          messageId: 'noModuleCrossImport',
          data: {
            currentModule: 'users',
            importedModule: 'marketplace',
            source: '@/modules/marketplace/stores/marketplace-store'
          }
        }
      ]
    },

    // Module importing types from different module — forbidden
    {
      code: `import { MarketplaceItem } from '@/modules/marketplace/types/marketplace.contracts'`,
      filename: 'src/modules/users/composables/useUsers.js',
      errors: [
        {
          messageId: 'noModuleCrossImport',
          data: {
            currentModule: 'users',
            importedModule: 'marketplace',
            source: '@/modules/marketplace/types/marketplace.contracts'
          }
        }
      ]
    },

    // Multiple cross-module imports — multiple errors
    {
      code: `
        import { marketplaceService } from '@/modules/marketplace/services/marketplace-service'
        import { authService } from '@/modules/auth/services/auth-service'
      `,
      filename: 'src/modules/users/composables/useUsers.js',
      errors: [
        {
          messageId: 'noModuleCrossImport',
          data: {
            currentModule: 'users',
            importedModule: 'marketplace',
            source: '@/modules/marketplace/services/marketplace-service'
          }
        },
        {
          messageId: 'noModuleCrossImport',
          data: {
            currentModule: 'users',
            importedModule: 'auth',
            source: '@/modules/auth/services/auth-service'
          }
        }
      ]
    }
  ]
})

console.log('module-isolation: all tests passed')
