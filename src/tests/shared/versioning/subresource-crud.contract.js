import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  spyHttpRequest,
  stubVersionQueryCache,
  restoreBoundaries
} from '@/tests/support/versioning/boundaries'

/**
 * Shared behavioral contract for a versioned SUB-RESOURCE service — the CRUDL
 * surface produced by `createVersionedSubResourceService`
 * (`src/services/v2/edge-app/versioned/create-versioned-sub-resource-service.js`).
 *
 * Every factory sub-resource inherits the same shape: version-scoped URLs
 * (`{baseURL}/{rid}/versions/{vid}/{path}`), adapter-normalized reads, and
 * mutations that invalidate a `queryKeyGroup.all(rid, vid)` cache entry. This
 * suite proves that inherited contract ONCE, parametrized by a descriptor, and
 * runs the REAL service against the kit boundaries only (HTTP client + the
 * shared `queryClient` — never the versioning code under test).
 *
 * The heart of the suite is the SCOPE isolation test: a mutation on (A, v1)
 * must invalidate ONLY (A, v1) — never (A, v2) nor (B, v1). That is the proof
 * of the sub-resource's version isolation.
 *
 * Titles are prefixed with owner/sub-resource so a failure names it and the
 * per-owner instantiation file anchors the stack trace.
 *
 * The `key`, `service`, `path`, `queryKeyGroup`, `idKey` and `buildPayload` fields
 * come straight from a `RESOURCE_TEST_REGISTRY[owner].subresources` entry (spread
 * into this call), so the instantiation file adds only `ownerLabel`.
 *
 * @param {object}   args
 * @param {string}   args.ownerLabel     Parent resource label (e.g. 'edge-app').
 * @param {string}   args.key            Sub-resource label (e.g. 'cacheSettings').
 * @param {() => object} args.service    Getter for the sub-resource service singleton.
 * @param {string}   args.path           API path segment (e.g. 'cache_settings').
 * @param {object}   args.queryKeyGroup  Versioned query-key group with `all`/`list`/`detail`.
 * @param {string}   [args.idKey='id']   Key under which `create` returns the new id.
 * @param {() => object} args.buildPayload Factory for a create/edit payload the adapter accepts.
 */
export const describeVersionedSubresourceCrud = ({
  ownerLabel,
  key,
  service,
  path,
  queryKeyGroup,
  idKey = 'id',
  buildPayload
}) => {
  const subKey = key
  const RID_A = 'res-A'
  const RID_B = 'res-B'
  const VID_1 = 'ver-1'
  const VID_2 = 'ver-2'
  const CREATED_ID = 7
  const EDIT_ID = 5
  const LOAD_ID = 9

  describe(`versioned sub-resource CRUD: ${ownerLabel} / ${subKey}`, () => {
    let svc
    let baseUrl

    const urlFor = (rid, vid, suffix = '') => `${baseUrl}/${rid}/versions/${vid}/${path}${suffix}`

    const allKey = (rid, vid) => ({ queryKey: queryKeyGroup.all(rid, vid) })

    beforeEach(() => {
      svc = service()
      baseUrl = svc.baseURL
    })

    afterEach(() => {
      restoreBoundaries()
    })

    describe('list', () => {
      // A row rich enough that every sub-resource adapter's list transform runs
      // without throwing (conditions[] for WAF, a valid date for name enrichment).
      const rawResults = [
        {
          id: 1,
          name: 'row-1',
          conditions: [],
          last_editor: 'ada',
          last_modified: '2026-01-01T00:00:00.000Z'
        }
      ]

      it('GETs the version-scoped collection and returns { count, body } via the adapter', async () => {
        const cache = stubVersionQueryCache(svc)
        const http = spyHttpRequest()
        const listSpy = svc.adapter?.transformList ? vi.spyOn(svc.adapter, 'transformList') : null
        http.respondWith({ count: 1, results: rawResults })

        const result = await svc.list(RID_A, VID_1, { page: 1 })

        expect(http.spy).toHaveBeenCalledWith({
          method: 'GET',
          url: urlFor(RID_A, VID_1),
          params: expect.objectContaining({ page: 1 })
        })
        // No filter/search → the read is served through the shared query cache.
        expect(cache.ensureQueryData).toHaveBeenCalled()
        expect(result.count).toBe(1)
        if (listSpy) {
          expect(listSpy).toHaveBeenCalledWith(rawResults)
          expect(result.body).toBe(listSpy.mock.results[0].value)
        } else {
          expect(result.body).toHaveLength(1)
        }
      })

      it('skips the cache (direct fetch) when a search term is present', async () => {
        const cache = stubVersionQueryCache(svc)
        const http = spyHttpRequest()
        http.respondWith({ count: 0, results: [] })

        await svc.list(RID_A, VID_1, { search: 'abc' })

        expect(http.spy).toHaveBeenCalledWith({
          method: 'GET',
          url: urlFor(RID_A, VID_1),
          params: expect.objectContaining({ search: 'abc' })
        })
        expect(cache.ensureQueryData).not.toHaveBeenCalled()
      })
    })

    describe('load', () => {
      it('GETs the single sub-resource by id and returns it via the adapter', async () => {
        const cache = stubVersionQueryCache(svc)
        const http = spyHttpRequest()
        const loadSpy = svc.adapter?.transformLoad ? vi.spyOn(svc.adapter, 'transformLoad') : null
        const response = { data: { id: LOAD_ID, name: 'loaded', conditions: [] } }
        http.respondWith(response)

        const result = await svc.load(RID_A, VID_1, LOAD_ID)

        expect(http.spy).toHaveBeenCalledWith({
          method: 'GET',
          url: urlFor(RID_A, VID_1, `/${LOAD_ID}`)
        })
        expect(cache.ensureQueryData).toHaveBeenCalled()
        if (loadSpy) {
          expect(loadSpy).toHaveBeenCalledWith(response)
          expect(result).toBe(loadSpy.mock.results[0].value)
        } else {
          expect(result).toBeDefined()
        }
      })
    })

    describe('create', () => {
      it('POSTs the adapter payload, invalidates (rid, vid) and returns the drawer-compatible shape', async () => {
        const cache = stubVersionQueryCache(svc)
        const http = spyHttpRequest()
        const payload = buildPayload()
        const expectedBody = svc.adapter?.requestPayload
          ? svc.adapter.requestPayload(payload)
          : payload
        http.respondWith({ data: { id: CREATED_ID } })

        const result = await svc.create(RID_A, VID_1, payload)

        expect(http.spy).toHaveBeenCalledWith({
          method: 'POST',
          url: urlFor(RID_A, VID_1),
          body: expectedBody
        })
        expect(cache.removeQueries).toHaveBeenCalledWith(allKey(RID_A, VID_1))
        // Exact drawer-compatible shape: only the id (under idKey) + a feedback string.
        expect(result).toEqual({ [idKey]: CREATED_ID, feedback: expect.any(String) })
        expect(result.feedback.length).toBeGreaterThan(0)
        if (svc.createdMessage) {
          expect(result.feedback).toBe(svc.createdMessage)
        }
      })
    })

    describe('edit', () => {
      it('PUTs the adapter payload to /{id}, invalidates (rid, vid) and resolves the success message', async () => {
        const cache = stubVersionQueryCache(svc)
        const http = spyHttpRequest()
        const payload = { ...buildPayload(), id: EDIT_ID }
        const expectedBody = svc.adapter?.editPayload
          ? svc.adapter.editPayload(payload)
          : svc.adapter?.requestPayload
            ? svc.adapter.requestPayload(payload)
            : payload
        http.respondWith({})

        const result = await svc.edit(RID_A, VID_1, payload)

        expect(http.spy).toHaveBeenCalledWith({
          method: 'PUT',
          url: urlFor(RID_A, VID_1, `/${EDIT_ID}`),
          body: expectedBody
        })
        expect(cache.removeQueries).toHaveBeenCalledWith(allKey(RID_A, VID_1))
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
        if (svc.updatedMessage) {
          expect(result).toBe(svc.updatedMessage)
        }
      })
    })

    describe('remove', () => {
      it('DELETEs by id and invalidates (rid, vid)', async () => {
        const cache = stubVersionQueryCache(svc)
        const http = spyHttpRequest()
        http.respondWith({})

        await svc.remove(RID_A, VID_1, EDIT_ID)

        expect(http.spy).toHaveBeenCalledWith({
          method: 'DELETE',
          url: urlFor(RID_A, VID_1, `/${EDIT_ID}`)
        })
        expect(cache.removeQueries).toHaveBeenCalledWith(allKey(RID_A, VID_1))
      })
    })

    describe('version isolation — a mutation on (A, v1) never invalidates (A, v2) nor (B, v1)', () => {
      it('scopes the invalidated cache key to exactly (A, v1)', async () => {
        const cache = stubVersionQueryCache(svc)
        const http = spyHttpRequest()
        http.respondWith({ data: { id: CREATED_ID } })

        await svc.create(RID_A, VID_1, buildPayload())

        const scopedKey = queryKeyGroup.all(RID_A, VID_1)
        expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: scopedKey })
        // The invalidation key encodes BOTH rid and vid, so it can never collide
        // with a sibling version of the same resource, nor the same version of
        // another resource — the essence of sub-resource version isolation.
        expect(scopedKey).not.toEqual(queryKeyGroup.all(RID_A, VID_2))
        expect(scopedKey).not.toEqual(queryKeyGroup.all(RID_B, VID_1))
        expect(cache.removeQueries).not.toHaveBeenCalledWith({
          queryKey: queryKeyGroup.all(RID_A, VID_2)
        })
        expect(cache.removeQueries).not.toHaveBeenCalledWith({
          queryKey: queryKeyGroup.all(RID_B, VID_1)
        })
      })
    })
  })
}
