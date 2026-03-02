const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-http-in-adapters')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-http-in-adapters', rule, {
  valid: [
    // Adapter importing only type files — allowed
    {
      code: `
        import { UserResponse } from '../types/user.types'
        import { User } from '../types/user.contracts'

        export function toUser(response) {
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js'
    },

    // Adapter importing utility — allowed (not HTTP)
    {
      code: `
        import { formatDate } from '@/shared/utils/format-date'

        export function toUser(response) {
          return { id: response.uuid, createdAt: formatDate(response.created_at) }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js'
    },

    // Adapter with pure logic — allowed
    {
      code: `
        export const usersAdapter = {
          toUser(response) {
            return {
              id: response.uuid,
              name: response.name,
              isActive: response.status === 'active',
              createdAt: new Date(response.created_at)
            }
          },
          toPayload(user) {
            return {
              name: user.name,
              status: user.isActive ? 'active' : 'inactive'
            }
          }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js'
    },

    // Non-adapter file importing axios — rule does not apply
    {
      code: `import axios from 'axios'`,
      filename: 'src/modules/users/services/users-service.js'
    },

    // Adapter importing from vue — allowed
    {
      code: `
        import { toRaw } from 'vue'
        export function toPayload(user) {
          return toRaw(user)
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js'
    }
  ],

  invalid: [
    // Adapter importing axios — forbidden
    {
      code: `
        import axios from 'axios'

        export function toUser(response) {
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noHttpInAdapter',
          data: { fileName: 'users-adapter.js', source: 'axios' }
        }
      ]
    },

    // Adapter importing node-fetch — forbidden
    {
      code: `
        import fetch from 'node-fetch'

        export function toUser(response) {
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noHttpInAdapter',
          data: { fileName: 'users-adapter.js', source: 'node-fetch' }
        }
      ]
    },

    // Adapter importing ky — forbidden
    {
      code: `
        import ky from 'ky'

        export function toUser(response) {
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noHttpInAdapter',
          data: { fileName: 'users-adapter.js', source: 'ky' }
        }
      ]
    },

    // Adapter calling fetch() — forbidden
    {
      code: `
        export async function toUser(response) {
          const extra = await fetch('/api/details/' + response.uuid)
          return { id: response.uuid, extra: await extra.json() }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noFetchInAdapter',
          data: { fileName: 'users-adapter.js' }
        }
      ]
    },

    // Adapter calling this.http.request() — forbidden
    {
      code: `
        export class UsersAdapter {
          async toUser(response) {
            const extra = await this.http.request('/details')
            return { id: response.uuid, extra }
          }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noHttpMethod',
          data: { fileName: 'users-adapter.js', method: 'request' }
        }
      ]
    },

    // Adapter calling this.http.get() — forbidden
    {
      code: `
        export class UsersAdapter {
          async toUser(response) {
            const extra = await this.http.get('/details')
            return { id: response.uuid, extra }
          }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noHttpMethod',
          data: { fileName: 'users-adapter.js', method: 'get' }
        }
      ]
    },

    // Adapter calling this.http.post() — forbidden
    {
      code: `
        export class UsersAdapter {
          async transform(data) {
            await this.http.post('/notify', data)
            return data
          }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noHttpMethod',
          data: { fileName: 'users-adapter.js', method: 'post' }
        }
      ]
    },

    // Multiple violations: import + fetch + this.http
    {
      code: `
        import axios from 'axios'

        export class UsersAdapter {
          async toUser(response) {
            const a = await fetch('/extra')
            const b = await this.http.get('/more')
            return { id: response.uuid }
          }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        { messageId: 'noHttpInAdapter' },
        { messageId: 'noFetchInAdapter' },
        { messageId: 'noHttpMethod' }
      ]
    }
  ]
})

console.log('no-http-in-adapters: all tests passed')
