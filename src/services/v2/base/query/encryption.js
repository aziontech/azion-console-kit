/**
 * Encryption utilities for sensitive data in TanStack Query cache
 * Uses Web Crypto API (native browser API) for AES-GCM encryption.
 *
 * Key strategy:
 * - Primary: non-extractable CryptoKey stored in IndexedDB (extractable: false,
 *   so raw key bytes are never exposed to JavaScript or DevTools)
 * - Fallback: ephemeral in-memory key generated per session if IDB is unavailable
 *   (e.g., private browsing, IDB quota exceeded, browser restriction)
 */

import { get, set, createStore } from 'idb-keyval'

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 128 // 128 bits authentication tag

const KEY_DB_NAME = 'azion-key-db'
const KEY_STORE_NAME = 'azion-key-store'
const CRYPTO_KEY_ID = 'azion-crypto-key'

let _keyStore = null
let _encryptionKey = null

function getKeyStore() {
  if (!_keyStore) {
    _keyStore = createStore(KEY_DB_NAME, KEY_STORE_NAME)
  }
  return _keyStore
}

async function generateKey() {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // extractable: false — key material never exposed to JS
    ['encrypt', 'decrypt']
  )
}

/**
 * Gets or creates a persistent non-extractable AES-GCM key stored in IndexedDB.
 * Falls back to an ephemeral in-memory key if IDB is unavailable.
 * @returns {Promise<CryptoKey>} The encryption key
 */
async function getEncryptionKey() {
  if (_encryptionKey) return _encryptionKey

  try {
    const keyStore = getKeyStore()
    const existing = await get(CRYPTO_KEY_ID, keyStore)

    if (existing instanceof CryptoKey) {
      _encryptionKey = existing
      return _encryptionKey
    }

    const key = await generateKey()
    await set(CRYPTO_KEY_ID, key, keyStore)
    _encryptionKey = key
    return _encryptionKey
  } catch {
    // IDB unavailable (private browsing, quota exceeded, etc.)
    // Fall back to an ephemeral key — data won't persist across sessions
    // but encryption still protects data within the current session
    if (!_encryptionKey) {
      _encryptionKey = await generateKey()
    }
    return _encryptionKey
  }
}

/**
 * Encrypts data using AES-GCM.
 * @param {any} data - Data to encrypt
 * @returns {Promise<ArrayBuffer>} Encrypted data as ArrayBuffer (IV prepended)
 */
export async function encryptSensitiveData(data) {
  if (data === null || data === undefined) {
    throw new Error('Cannot encrypt null or undefined data')
  }

  try {
    const key = await getEncryptionKey()
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(JSON.stringify(data))
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    const encryptedData = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      key,
      dataBuffer
    )

    const combined = new Uint8Array(IV_LENGTH + encryptedData.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedData), IV_LENGTH)

    return combined.buffer
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error encrypting sensitive data:', error)
    throw new Error('Failed to encrypt sensitive data')
  }
}

/**
 * Decrypts data using AES-GCM.
 * Only accepts ArrayBuffer — rejects legacy base64 strings from the old format
 * so they are discarded and the cache is rebuilt cleanly on migration.
 * @param {ArrayBuffer | ArrayBufferView} encryptedData - Encrypted data (IV prepended)
 * @returns {Promise<any>} Decrypted data
 */
export async function decryptSensitiveData(encryptedData) {
  if (!(encryptedData instanceof ArrayBuffer) && !ArrayBuffer.isView(encryptedData)) {
    throw new Error('Invalid encrypted data format: expected ArrayBuffer')
  }

  const combined = new Uint8Array(
    encryptedData instanceof ArrayBuffer ? encryptedData : encryptedData.buffer
  )

  if (combined.byteLength <= IV_LENGTH) {
    throw new Error('Encrypted data too short to contain IV')
  }

  try {
    const key = await getEncryptionKey()
    const decoder = new TextDecoder()

    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)

    const decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      key,
      encrypted
    )

    return JSON.parse(decoder.decode(decryptedData))
  } catch {
    throw new Error('Failed to decrypt sensitive data')
  }
}

/**
 * Checks if Web Crypto API is available
 * @returns {boolean} True if Web Crypto API is available
 */
export function isEncryptionAvailable() {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}
