const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-try-catch-in-services')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-try-catch-in-services', rule, {
  valid: [
    // Service without try/catch — allowed
    {
      code: `
        import { api } from '@/shared/services/api-client'

        export const usersService = {
          list(params) {
            return api.get('/users', { params })
          },
          getById(id) {
            return api.get('/users/' + id)
          }
        }
      `,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Base/http service with try/catch — excluded by EXCLUDED_PATHS
    {
      code: `
        async function request(url) {
          try {
            const response = await axios.get(url)
            return response
          } catch (error) {
            handleError(error)
          }
        }
      `,
      filename: 'src/services/base/http/api-client.js'
    },

    // Base/query service with try/catch — excluded
    {
      code: `
        async function fetchData(options) {
          try {
            const result = await queryClient.fetchQuery(options)
            return result
          } catch (error) {
            handleError(error)
          }
        }
      `,
      filename: 'src/services/base/query/query-service.js'
    },

    // Axios makeApi with try/catch — excluded
    {
      code: `
        function createApi(config) {
          try {
            const instance = axios.create(config)
            return instance
          } catch (error) {
            throw error
          }
        }
      `,
      filename: 'src/services/axios/makeApi/index.js'
    },

    // Axios errors handler with try/catch — excluded
    {
      code: `
        function handle(error) {
          try {
            parseError(error)
          } catch (e) {
            return defaultError
          }
        }
      `,
      filename: 'src/services/axios/errors/handler.js'
    },

    // Non-service file with try/catch — rule does not apply
    {
      code: `
        try {
          const data = await fetchData()
        } catch (error) {
          console.error(error)
        }
      `,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // V2 service without try/catch — allowed
    {
      code: `
        export function listUsers(params) {
          return api.get('/v2/users', { params })
        }
      `,
      filename: 'src/services/v2/users/users-service.js'
    }
  ],

  invalid: [
    // Service with try/catch — forbidden
    {
      code: `
        import { api } from '@/shared/services/api-client'

        export const usersService = {
          async list(params) {
            try {
              return await api.get('/users', { params })
            } catch (error) {
              console.error(error)
              throw error
            }
          }
        }
      `,
      filename: 'src/modules/users/services/users-service.js',
      errors: [
        {
          messageId: 'noTryCatch',
          data: { fileName: 'users-service.js' }
        }
      ]
    },

    // V2 service with try/catch — forbidden
    {
      code: `
        export async function listUsers(params) {
          try {
            return await api.get('/v2/users', { params })
          } catch (error) {
            throw error
          }
        }
      `,
      filename: 'src/services/v2/users/users-service.js',
      errors: [
        {
          messageId: 'noTryCatch',
          data: { fileName: 'users-service.js' }
        }
      ]
    },

    // Service with multiple try/catch blocks — multiple errors
    {
      code: `
        export const usersService = {
          async list() {
            try {
              return await api.get('/users')
            } catch (e) { throw e }
          },
          async getById(id) {
            try {
              return await api.get('/users/' + id)
            } catch (e) { throw e }
          }
        }
      `,
      filename: 'src/modules/users/services/users-service.js',
      errors: [{ messageId: 'noTryCatch' }, { messageId: 'noTryCatch' }]
    }
  ]
})

console.log('no-try-catch-in-services: all tests passed')
