/**
 * Module: chunked dataset field fetching with self-healing retry.
 *
 * Large datasets (60+ fields on workloadEvents) can't be asked in one shot
 * without bloating the payload; we split the requested field set, fetch the
 * chunks in parallel, and merge the per-chunk rows back into one per-record
 * shape using a stable join key (typically `ts` or `requestId`).
 *
 * A single bad field reported by the GraphQL endpoint would otherwise poison
 * the entire page load. `fetchChunkResilient` strips offending fields from
 * the chunk and retries once — the sidebar tooltip already explains that
 * field stats reflect loaded rows.
 */

// Pattern used by the GraphQL endpoint to report a rejected field. Matches both
// the standard `message` shape and the nested `graphQLErrors[].message` variant.
const INVALID_FIELD_PATTERN = /Cannot query field ["']([^"']+)["']/i

/**
 * Extracts offending field names from an Axios/HTTP error thrown by the GraphQL
 * client. Returns an empty array when the error is not a schema rejection.
 *
 * @param {unknown} error
 * @returns {string[]}
 */
const extractInvalidFields = (error) => {
  if (!error) return []
  const messages = []
  const push = (value) => {
    if (typeof value === 'string' && value) messages.push(value)
  }
  // Service helpers in this repo commonly `throw new Error(detail).message`,
  // which throws a bare string; handle that as well as structured Error/axios
  // objects.
  if (typeof error === 'string') {
    push(error)
  } else {
    push(error.message)
    push(error?.response?.data?.detail)
    push(error?.response?.data?.errors?.[0]?.message)
    const errors = error?.response?.data?.errors || error?.errors || []
    if (Array.isArray(errors)) errors.forEach((entry) => push(entry?.message))
  }

  const found = new Set()
  for (const msg of messages) {
    let match
    const scan = new RegExp(INVALID_FIELD_PATTERN, 'gi')
    // eslint-disable-next-line no-cond-assign
    while ((match = scan.exec(msg)) !== null) {
      found.add(match[1])
    }
  }
  return Array.from(found)
}

/**
 * Invokes `fetchChunk` for a chunk, transparently retrying ONCE after
 * stripping fields the schema rejected. Rows matching nothing but the join key
 * are still better than no rows at all — the missing fields simply won't show
 * stats, which the sidebar already handles via its tooltip.
 *
 * @template T
 * @param {string[]} chunk
 * @param {(fields: string[]) => Promise<T>} fetchChunk
 * @returns {Promise<T | []>}
 */
const MAX_SANITIZE_ATTEMPTS = 3

const fetchChunkResilient = async (chunk, fetchChunk, attempt = 0) => {
  try {
    return await fetchChunk(chunk)
  } catch (error) {
    const invalid = extractInvalidFields(error)
    // Only schema-level rejections trigger self-healing. Auth / quota / network
    // failures must propagate so callers and upstream toasts can surface them.
    if (!invalid.length) throw error

    const sanitized = chunk.filter((field) => !invalid.includes(field))
    if (!sanitized.length || sanitized.length === chunk.length) {
      // eslint-disable-next-line no-console
      console.warn('[fetchAllFieldsChunked] chunk rejected and cannot be sanitized:', {
        invalid,
        error
      })
      return []
    }
    if (attempt + 1 >= MAX_SANITIZE_ATTEMPTS) {
      // eslint-disable-next-line no-console
      console.warn('[fetchAllFieldsChunked] giving up after repeated schema rejections:', {
        invalid,
        error
      })
      return []
    }
    // Recurse so multiple bad fields reported across successive responses
    // all get stripped before we give up.
    return fetchChunkResilient(sanitized, fetchChunk, attempt + 1)
  }
}

/**
 * Runs a `fetchChunk` callback across the full field set of a dataset,
 * chunking and merging when the payload grows beyond `chunkThreshold`.
 *
 * @param {Object} params
 * @param {string[]} params.fields                – full field list
 * @param {number} [params.chunkThreshold=35]     – split only if |fields| > threshold
 * @param {number} [params.chunkSize=30]          – fields per chunk when splitting
 * @param {string[]} [params.alwaysInclude=['ts']]– fields added to every chunk (join keys)
 * @param {string} [params.joinKey]               – row merge key (defaults to alwaysInclude[0])
 * @param {(chunkFields: string[]) => Promise<Array<Object>>} params.fetchChunk
 * @returns {Promise<Array<Object>>}
 */
export async function fetchAllFieldsChunked({
  fields,
  chunkThreshold = 35,
  chunkSize = 30,
  alwaysInclude = ['ts'],
  joinKey,
  fetchChunk
}) {
  if (!Array.isArray(fields) || !fields.length) return []
  if (typeof fetchChunk !== 'function') {
    throw new Error('fetchAllFieldsChunked: fetchChunk must be a function')
  }

  // Short-circuit: small enough to fit in one request.
  if (fields.length <= chunkThreshold) {
    return fetchChunkResilient(fields, fetchChunk)
  }

  const effectiveJoinKey = joinKey || alwaysInclude[0] || 'ts'

  const chunks = []
  for (let idx = 0; idx < fields.length; idx += chunkSize) {
    const chunk = fields.slice(idx, idx + chunkSize)
    // Ensure the join key(s) are always present so we can merge rows.
    const withJoinKeys = Array.from(new Set([...alwaysInclude, ...chunk]))
    chunks.push(withJoinKeys)
  }

  const results = await Promise.all(chunks.map((chunk) => fetchChunkResilient(chunk, fetchChunk)))

  // Merge by joinKey. The first chunk establishes row order; subsequent
  // chunks contribute additional fields to existing rows (by joinKey) or
  // append if the row was missing in earlier chunks.
  const byKey = new Map()
  results.forEach((rows) => {
    if (!Array.isArray(rows)) return
    rows.forEach((row) => {
      if (!row || row[effectiveJoinKey] === undefined || row[effectiveJoinKey] === null) return
      const key = String(row[effectiveJoinKey])
      const existing = byKey.get(key)
      if (existing) {
        Object.entries(row).forEach(([field, value]) => {
          if (existing[field] === undefined) existing[field] = value
        })
      } else {
        byKey.set(key, { ...row })
      }
    })
  })

  return Array.from(byKey.values())
}
