// @vitest-environment node
import { Buffer } from 'node:buffer'
import { describe, it, expect } from 'vitest'
import {
  encryptSensitiveData,
  decryptSensitiveData,
  isEncryptionAvailable
} from '@/services/v2/base/query/encryption'

/**
 * Cache encryption (test-maturity deep pass — protects sensitive data
 * persisted in IndexedDB). Runs against Node's REAL WebCrypto; without
 * IndexedDB the module takes its documented fallback (ephemeral session key),
 * which is itself a production path (private browsing).
 */
describe('roundtrip with real AES-GCM', () => {
  it('encrypts and decrypts an object back to its original value', async () => {
    const secret = { token: 'tok_123', nested: { flags: [1, 2, 3] } }

    const encrypted = await encryptSensitiveData(secret)
    const decrypted = await decryptSensitiveData(encrypted)

    expect(encrypted).toBeInstanceOf(ArrayBuffer)
    expect(decrypted).toEqual(secret)
  })

  it('never reuses an IV — same plaintext yields different ciphertext', async () => {
    const first = new Uint8Array(await encryptSensitiveData({ seed: 1 }))
    const second = new Uint8Array(await encryptSensitiveData({ seed: 1 }))

    expect(Buffer.from(first).equals(Buffer.from(second))).toBe(false)
  })
})

describe('input validation', () => {
  it('refuses to encrypt null or undefined', async () => {
    await expect(encryptSensitiveData(null)).rejects.toThrow('Cannot encrypt null or undefined')
    await expect(encryptSensitiveData(undefined)).rejects.toThrow(
      'Cannot encrypt null or undefined'
    )
  })

  it('rejects legacy base64 strings (old cache format is discarded, not migrated)', async () => {
    await expect(decryptSensitiveData('bGVnYWN5LWZvcm1hdA==')).rejects.toThrow(
      'expected ArrayBuffer'
    )
  })

  it('rejects a buffer too short to contain the IV', async () => {
    await expect(decryptSensitiveData(new Uint8Array(4).buffer)).rejects.toThrow(
      'too short to contain IV'
    )
  })
})

describe('tamper resistance (GCM auth tag)', () => {
  it('fails closed when the ciphertext is tampered with', async () => {
    const encrypted = new Uint8Array(await encryptSensitiveData({ balance: 100 }))
    encrypted[encrypted.length - 1] ^= 0xff

    await expect(decryptSensitiveData(encrypted.buffer)).rejects.toThrow(
      'Failed to decrypt sensitive data'
    )
  })
})

describe('capability detection', () => {
  it('reports WebCrypto as available in this runtime', () => {
    expect(isEncryptionAvailable()).toBe(true)
  })
})
