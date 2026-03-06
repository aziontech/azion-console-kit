const { RuleTester } = require('eslint')
const rule = require('../lib/rules/pure-adapters')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('pure-adapters', rule, {
  valid: [
    // Adapter with pure transformation logic — allowed
    {
      code: `
        export const usersAdapter = {
          toUser(response) {
            return {
              id: response.uuid,
              name: response.name,
              email: response.email_address,
              createdAt: new Date(response.created_at)
            }
          }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js'
    },

    // Adapter importing from type files — allowed (types are not HTTP/service)
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

    // Adapter importing utility functions — allowed
    {
      code: `
        import { formatDate } from '@/shared/utils/format-date'

        export function toUser(response) {
          return {
            id: response.uuid,
            createdAt: formatDate(response.created_at)
          }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js'
    },

    // Non-adapter file with console.log — rule does not apply
    {
      code: `
        console.log('hello')
        localStorage.setItem('key', 'value')
      `,
      filename: 'src/modules/users/composables/useUsers.js'
    },

    // Adapter with Math and basic operations — allowed
    {
      code: `
        export function toPrice(response) {
          return {
            price: response.price_cents / 100,
            total: Math.round(response.total_cents / 100)
          }
        }
      `,
      filename: 'src/modules/marketplace/adapters/marketplace-adapter.js'
    }
  ],

  invalid: [
    // Adapter calling console.log — forbidden (side effect)
    {
      code: `
        export function toUser(response) {
          console.log('transforming user', response)
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noSideEffects',
          data: {
            fileName: 'users-adapter.js',
            detail: 'calls console.log()'
          }
        }
      ]
    },

    // Adapter calling console.warn — forbidden
    {
      code: `
        export function toUser(response) {
          console.warn('deprecated field')
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noSideEffects',
          data: {
            fileName: 'users-adapter.js',
            detail: 'calls console.warn()'
          }
        }
      ]
    },

    // Adapter calling console.error — forbidden
    {
      code: `
        export function toUser(response) {
          console.error('missing field')
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noSideEffects',
          data: {
            fileName: 'users-adapter.js',
            detail: 'calls console.error()'
          }
        }
      ]
    },

    // Adapter accessing localStorage — forbidden (side effect)
    {
      code: `
        export function toUser(response) {
          localStorage.setItem('lastUser', response.uuid)
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noSideEffects',
          data: {
            fileName: 'users-adapter.js',
            detail: 'accesses localStorage.setItem()'
          }
        }
      ]
    },

    // Adapter accessing sessionStorage — forbidden (side effect)
    {
      code: `
        export function toUser(response) {
          sessionStorage.setItem('user', response.uuid)
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noSideEffects',
          data: {
            fileName: 'users-adapter.js',
            detail: 'accesses sessionStorage.setItem()'
          }
        }
      ]
    },

    // Adapter importing axios — forbidden (HTTP import)
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
          messageId: 'noHttpImport',
          data: { fileName: 'users-adapter.js', source: 'axios' }
        }
      ]
    },

    // Adapter importing from service — forbidden (service import)
    {
      code: `
        import { usersService } from '../services/users-service'

        export function toUser(response) {
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noHttpImport',
          data: {
            fileName: 'users-adapter.js',
            source: '../services/users-service'
          }
        }
      ]
    },

    // Adapter calling fetch() — forbidden (side effect)
    {
      code: `
        export async function toUser(response) {
          const extra = await fetch('/api/extra')
          return { id: response.uuid, extra }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        {
          messageId: 'noSideEffects',
          data: { fileName: 'users-adapter.js', detail: 'calls fetch()' }
        }
      ]
    },

    // Adapter accessing document — forbidden (DOM side effect)
    {
      code: `
        export function toUser(response) {
          const el = document.getElementById('user')
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        // MemberExpression for document.getElementById fires
        {
          messageId: 'noSideEffects',
          data: {
            fileName: 'users-adapter.js',
            detail: 'accesses document.getElementById'
          }
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

    // Multiple violations in one adapter
    {
      code: `
        import axios from 'axios'

        export function toUser(response) {
          console.log('transforming')
          localStorage.setItem('key', 'val')
          return { id: response.uuid }
        }
      `,
      filename: 'src/modules/users/adapters/users-adapter.js',
      errors: [
        { messageId: 'noHttpImport' },
        { messageId: 'noSideEffects' },
        { messageId: 'noSideEffects' }
      ]
    }
  ]
})

console.log('pure-adapters: all tests passed')
