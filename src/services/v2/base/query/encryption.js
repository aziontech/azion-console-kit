/**
 * Encryption utilities for sensitive data in TanStack Query cache
 * Uses Web Crypto API (native browser API) for AES-GCM encryption
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 128 // 128 bits authentication tag

/**
 * Derives an encryption key from a password using PBKDF2
 * @param {string} password - The password to derive the key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} The derived encryption key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Gets the encryption secret from environment or uses a default
 * In production, this should be set via environment variable
 * @returns {string} The encryption secret
 */
function getEncryptionSecret() {
  // Try to get from environment variable (for build-time configuration)
  // In production, this should be set via VITE_ENCRYPTION_SECRET or similar
  if (import.meta.env?.VITE_ENCRYPTION_SECRET) {
    return import.meta.env.VITE_ENCRYPTION_SECRET
  }

  // Fallback to a default secret (should be overridden in production)
  // This provides basic protection but should be replaced with a proper secret
  return 'azion-sensitive-cache-key-v1'
}

/**
 * Generates a persistent encryption key
 * Uses a stable identifier to ensure data can be decrypted across sessions
 * @returns {Promise<CryptoKey>} The encryption key
 */
async function getEncryptionKey() {
  const secret = getEncryptionSecret()

  // Use localStorage instead of sessionStorage to persist across browser restarts
  let persistentId = localStorage.getItem('azion-cache-key-id')
  if (!persistentId) {
    persistentId = crypto.randomUUID()
    localStorage.setItem('azion-cache-key-id', persistentId)
  }

  // Create a salt from persistent ID for key derivation
  const encoder = new TextEncoder()
  const salt = await crypto.subtle.digest('SHA-256', encoder.encode(persistentId))

  return deriveKey(secret, new Uint8Array(salt))
}

/**
 * Converts Uint8Array to base64 string (handles all characters including Unicode)
 * @param {Uint8Array} bytes - Bytes to convert
 * @returns {string} Base64 encoded string
 */
function uint8ArrayToBase64(bytes) {
  // Use a more robust method that handles all bytes correctly
  // Convert bytes to binary string, then to base64
  let binary = ''
  const len = bytes.byteLength
  for (let index = 0; index < len; index++) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

/**
 * Converts base64 string to Uint8Array (handles all characters including Unicode)
 * @param {string} base64 - Base64 encoded string
 * @returns {Uint8Array} Decoded bytes
 */
function base64ToUint8Array(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

/**
 * Encrypts data using AES-GCM
 * Supports all characters including Unicode and special characters
 * @param {any} data - Data to encrypt (can contain any characters)
 * @returns {Promise<string>} Encrypted data as base64 string
 */
export async function encryptSensitiveData(data) {
  try {
    const key = await getEncryptionKey()
    const encoder = new TextEncoder()

    // JSON.stringify handles all characters including Unicode and special characters
    // TextEncoder.encode converts the string to UTF-8 bytes, preserving all characters
    const dataString = JSON.stringify(data)
    const dataBuffer = encoder.encode(dataString)

    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // Encrypt the data (works with any byte sequence)
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH
      },
      key,
      dataBuffer
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedData), iv.length)

    // Convert to base64 for storage (handles all bytes correctly)
    return uint8ArrayToBase64(combined)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error encrypting sensitive data:', error)
    throw new Error('Failed to encrypt sensitive data')
  }
}

/**
 * Decrypts data using AES-GCM
 * Supports all characters including Unicode and special characters
 * @param {string} encryptedData - Encrypted data as base64 string
 * @returns {Promise<any>} Decrypted data (preserves all original characters)
 */
export async function decryptSensitiveData(encryptedData) {
  try {
    const key = await getEncryptionKey()
    const decoder = new TextDecoder()

    // Convert from base64 (handles all bytes correctly)
    const combined = base64ToUint8Array(encryptedData)

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH
      },
      key,
      encrypted
    )

    // TextDecoder.decode converts UTF-8 bytes back to string, preserving all characters
    // JSON.parse restores the original object with all special characters intact
    const decryptedString = decoder.decode(decryptedData)
    return JSON.parse(decryptedString)
  } catch (error) {
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
