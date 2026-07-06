import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'
import * as Errors from '@/services/axios/errors'
import { parseGraphQLResponse } from '../parse-graphql-response'

/**
 * Task 11.7 (Property P3) — BYTE-EQUIVALENCE golden oracle for the shared
 * GraphQL status switch (`_shared/service/parse-graphql-response.js`,
 * task 11.3 / req 5.3).
 *
 * The nine list services (http-request, edge-dns, image-processor, data-stream,
 * edge-functions, edge-functions-console, tiered-cache, activity-history) plus
 * get-total-records each inlined the SAME status switch (recon "Shape1", 9
 * identical). The `legacy(...)` below re-implements that switch VERBATIM — same
 * cases, same throw semantics (each branch `throw new X().message`, i.e. it
 * throws the STRING message, not an Error). The PBT (≥100 iters) drives every
 * status code and asserts the extracted `parseGraphQLResponse` throws (or
 * returns) BYTE-IDENTICALLY to the legacy switch.
 *
 * Nuance pinned: the throw value is the `.message` string, so `toThrow` must
 * match the exact string and the thrown value must NOT be an Error instance.
 */

// ── Verbatim pre-refactor status switch (the oracle) ────────────────────────
function legacy(response, on200) {
  const { body, statusCode } = response
  switch (statusCode) {
    case 200:
      return on200(body)
    case 400: {
      const apiError = body.detail
      throw new Error(apiError).message
    }
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403: {
      const forbiddenError = body.detail
      throw new Error(forbiddenError).message
    }
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/** Capture the thrown value (string) or a sentinel when nothing throws. */
const capture = (fn) => {
  try {
    return { threw: false, returned: fn() }
  } catch (thrown) {
    return { threw: true, thrown, isError: thrown instanceof Error }
  }
}

const arbStatus = fc.oneof(
  fc.constantFrom(200, 400, 401, 403, 404, 500),
  fc.integer({ min: 100, max: 599 }) // exercises the default branch too
)
const arbBody = fc.record({
  detail: fc.oneof(fc.string(), fc.constant(undefined)),
  data: fc.anything()
})

describe('P3 golden · parseGraphQLResponse is byte-equivalent to legacy switch (11.3)', () => {
  it('matches legacy return/throw for every status code (≥100 iters)', () => {
    fc.assert(
      fc.property(arbStatus, arbBody, (statusCode, body) => {
        const response = { statusCode, body }
        const on200 = (received) => ({ echoed: received })

        const actual = capture(() => parseGraphQLResponse(response, on200))
        const expected = capture(() => legacy(response, on200))

        expect(actual.threw).toBe(expected.threw)
        if (expected.threw) {
          // The thrown value is the STRING message, not an Error instance.
          expect(actual.isError).toBe(false)
          expect(actual.thrown).toBe(expected.thrown)
        } else {
          expect(actual.returned).toEqual(expected.returned)
        }
      }),
      { numRuns: 200 }
    )
  })

  it('200 delegates the exact body to on200 (success handler ownership preserved)', () => {
    const on200 = vi.fn((responseBody) => responseBody.data)
    const body = { data: [{ id: 1 }] }
    const result = parseGraphQLResponse({ statusCode: 200, body }, on200)
    expect(on200).toHaveBeenCalledTimes(1)
    expect(on200).toHaveBeenCalledWith(body)
    expect(result).toBe(body.data)
    // Oracle parity for the same call.
    on200.mockClear()
    expect(legacy({ statusCode: 200, body }, on200)).toBe(body.data)
  })

  it('400/403 throw the body.detail message string verbatim', () => {
    for (const statusCode of [400, 403]) {
      expect(() =>
        parseGraphQLResponse({ statusCode, body: { detail: 'boom' } }, () => {})
      ).toThrow('boom')
    }
  })
})
