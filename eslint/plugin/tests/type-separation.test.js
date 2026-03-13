const { RuleTester } = require('eslint')
const rule = require('../lib/rules/type-separation')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('type-separation', rule, {
  valid: [
    // Types file importing from other types file — allowed
    {
      code: `import { BaseResponse } from './base.types'`,
      filename: 'src/modules/users/types/user.types.js'
    },

    // Types file importing from npm package — allowed
    {
      code: `import { AxiosResponse } from 'axios'`,
      filename: 'src/modules/users/types/user.types.ts'
    },

    // Contracts file importing from non-types file — allowed
    {
      code: `import { z } from 'zod'`,
      filename: 'src/modules/users/types/user.contracts.ts'
    },

    // Contracts file importing from other contracts file — allowed
    {
      code: `import { BaseContract } from './base.contracts'`,
      filename: 'src/modules/users/types/user.contracts.ts'
    },

    // Non-type file importing from types — rule does not apply
    {
      code: `import { UserResponse } from '../types/user.types'`,
      filename: 'src/modules/users/adapters/users-adapter.js'
    },

    // Non-type file importing from contracts — rule does not apply
    {
      code: `import { User } from '../types/user.contracts'`,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Types file importing from vue — allowed
    {
      code: `import { Ref } from 'vue'`,
      filename: 'src/modules/users/types/user.types.ts'
    },

    // Contracts file importing from a utility — allowed
    {
      code: `import { formatDate } from '@/shared/utils/format-date'`,
      filename: 'src/modules/users/types/user.contracts.ts'
    },

    // Non-module type file — rule does not apply (zone !== module && zone !== v2-service)
    {
      code: `import { UserResponse } from './user.types'`,
      filename: 'src/shared/types/user.contracts.ts'
    },

    // Types file with no imports — allowed
    {
      code: `
        export const UserResponse = {
          uuid: '',
          name: ''
        }
      `,
      filename: 'src/modules/users/types/user.types.ts'
    },

    // Contracts file with no imports — allowed
    {
      code: `
        export const User = {
          id: '',
          name: ''
        }
      `,
      filename: 'src/modules/users/types/user.contracts.ts'
    }
  ],

  invalid: [
    // Contracts file importing from .types file — forbidden
    {
      code: `import { UserResponse } from './user.types'`,
      filename: 'src/modules/users/types/user.contracts.ts',
      errors: [
        {
          messageId: 'typesInContracts',
          data: { fileName: 'user.contracts.ts' }
        }
      ]
    },

    // Contracts file importing from .types.ts file — forbidden
    {
      code: `import { UserResponse } from './user.types.ts'`,
      filename: 'src/modules/users/types/user.contracts.ts',
      errors: [
        {
          messageId: 'typesInContracts',
          data: { fileName: 'user.contracts.ts' }
        }
      ]
    },

    // Contracts file importing from .types.js file — forbidden
    {
      code: `import { UserResponse } from './user.types.js'`,
      filename: 'src/modules/users/types/user.contracts.js',
      errors: [
        {
          messageId: 'typesInContracts',
          data: { fileName: 'user.contracts.js' }
        }
      ]
    },

    // Types file importing from .contracts file — forbidden
    {
      code: `import { User } from './user.contracts'`,
      filename: 'src/modules/users/types/user.types.ts',
      errors: [
        {
          messageId: 'contractsInTypes',
          data: { fileName: 'user.types.ts' }
        }
      ]
    },

    // Types file importing from .contracts.ts file — forbidden
    {
      code: `import { User } from './user.contracts.ts'`,
      filename: 'src/modules/users/types/user.types.ts',
      errors: [
        {
          messageId: 'contractsInTypes',
          data: { fileName: 'user.types.ts' }
        }
      ]
    },

    // Types file importing from .contracts.js file — forbidden
    {
      code: `import { User } from './user.contracts.js'`,
      filename: 'src/modules/users/types/user.types.js',
      errors: [
        {
          messageId: 'contractsInTypes',
          data: { fileName: 'user.types.js' }
        }
      ]
    },

    // Contracts file importing from types in different path — forbidden
    {
      code: `import { BaseResponse } from '../shared/base.types'`,
      filename: 'src/modules/users/types/user.contracts.ts',
      errors: [
        {
          messageId: 'typesInContracts',
          data: { fileName: 'user.contracts.ts' }
        }
      ]
    },

    // V2 service contracts file importing from types — forbidden
    {
      code: `import { ApiResponse } from './api.types'`,
      filename: 'src/services/v2/users/user.contracts.ts',
      errors: [
        {
          messageId: 'typesInContracts',
          data: { fileName: 'user.contracts.ts' }
        }
      ]
    },

    // Multiple violations in contracts file
    {
      code: `
        import { UserResponse } from './user.types'
        import { BaseResponse } from './base.types'
      `,
      filename: 'src/modules/users/types/user.contracts.ts',
      errors: [{ messageId: 'typesInContracts' }, { messageId: 'typesInContracts' }]
    }
  ]
})

console.log('type-separation: all tests passed')
