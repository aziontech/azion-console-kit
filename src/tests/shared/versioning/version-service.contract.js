import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { parse } from '@babel/parser'
import {
  isComposableImport,
  isStoreImport,
  isDomImport
} from '../../../../eslint/plugin/lib/utils/import-resolver.js'
import {
  spyHttpRequest,
  stubVersionQueryCache,
  restoreBoundaries
} from '@/tests/support/versioning/boundaries'

/**
 * @param {object} descriptor
 */
export const describeVersionServiceContract = (descriptor) => {
  const RID = 'res-1'
  const VID = 'ver-1'
  const BASE = `${descriptor.baseURL}/${RID}/versions`

  describe(`version-service contract: ${descriptor.resourceType}`, () => {
    let service

    beforeEach(() => {
      service = new descriptor.ServiceClass()
    })

    afterEach(() => {
      restoreBoundaries()
    })

    describe('resource bindings', () => {
      it('binds baseURL + versionKeys and builds resource-scoped version URLs', () => {
        expect(service.baseURL).toBe(descriptor.baseURL)
        expect(service.versionKeys).toBe(descriptor.versionKeys)
        expect(service.getUrl(RID, VID, '/build')).toBe(`${BASE}/${VID}/build`)
      })
    })

    if (descriptor.envelope === 'standard') {
      describe('reads normalize via the adapter', () => {
        it('fetchList GETs /versions and normalizes to { count, body } with config per item', async () => {
          const { useQuery } = stubVersionQueryCache(service)
          const http = spyHttpRequest()
          const raw = descriptor.buildVersion()
          http.respondWith([raw])

          const { queryFn } = service.useListVersionsQuery(RID)
          const result = await queryFn()

          expect(useQuery).toHaveBeenCalledWith(
            descriptor.versionKeys.list(RID),
            expect.any(Function),
            expect.any(Object)
          )
          expect(http.spy).toHaveBeenCalledWith({ method: 'GET', url: BASE })
          expect(result.count).toBe(1)
          expect(result.body[0].id).toBe(raw.version_id)
          expect(result.body[0].config).toMatchObject(descriptor.configMarkers)
        })

        it('fetchOne GETs /versions/{vid} and extracts the snapshot into config', async () => {
          stubVersionQueryCache(service)
          const http = spyHttpRequest()
          const raw = descriptor.buildVersion()
          http.respondWith(raw)

          const { queryFn } = service.useLoadVersionQuery(RID, VID)
          const result = await queryFn()

          expect(http.spy).toHaveBeenCalledWith({ method: 'GET', url: `${BASE}/${VID}` })
          expect(result.id).toBe(raw.version_id)
          expect(result.config).toMatchObject(descriptor.configMarkers)
        })
      })
    }

    describe('mutations invalidate the version cache', () => {
      it('createDraft POSTs /versions with source_version/comment at the root and invalidates', async () => {
        const cache = stubVersionQueryCache(service)
        const http = spyHttpRequest()
        http.respondWith({ version_id: VID, state: 'draft' })

        const result = await service.createDraft(RID, {
          sourceVersionId: 'SRC-0',
          comment: 'clone'
        })

        expect(http.spy).toHaveBeenCalledWith({
          method: 'POST',
          url: BASE,
          body: expect.objectContaining({ source_version: 'SRC-0', comment: 'clone' })
        })
        expect(result).toMatchObject({ id: VID })
        expect(cache.removeQueries).toHaveBeenCalledWith({
          queryKey: descriptor.versionKeys.all(RID)
        })
      })

      it(`updateDraft ${descriptor.updateVerb}es /versions/{vid} with the resource payload at the root and invalidates`, async () => {
        const cache = stubVersionQueryCache(service)
        const http = spyHttpRequest()
        http.respondWith({ version_id: VID, state: 'draft' })

        await service.updateDraft(RID, VID, descriptor.buildFormValues())

        expect(http.spy).toHaveBeenCalledWith({
          method: descriptor.updateVerb,
          url: `${BASE}/${VID}`,
          body: expect.objectContaining(descriptor.payloadMarkers)
        })
        expect(cache.removeQueries).toHaveBeenCalledWith({
          queryKey: descriptor.versionKeys.all(RID)
        })
      })

      it('build POSTs /versions/{vid}/build and invalidates', async () => {
        const cache = stubVersionQueryCache(service)
        const http = spyHttpRequest()
        http.respondWith({})

        await service.build(RID, VID, { comment: 'go' })

        expect(http.spy).toHaveBeenCalledWith({
          method: 'POST',
          url: `${BASE}/${VID}/build`,
          body: { comment: 'go' }
        })
        expect(cache.removeQueries).toHaveBeenCalledWith({
          queryKey: descriptor.versionKeys.all(RID)
        })
      })

      it('cancelBuild POSTs /versions/{vid}/cancel and invalidates', async () => {
        const cache = stubVersionQueryCache(service)
        const http = spyHttpRequest()
        http.respondWith({})

        await service.cancelBuild(RID, VID, {})

        expect(http.spy).toHaveBeenCalledWith({
          method: 'POST',
          url: `${BASE}/${VID}/cancel`,
          body: {}
        })
        expect(cache.removeQueries).toHaveBeenCalledWith({
          queryKey: descriptor.versionKeys.all(RID)
        })
      })

      it('deleteVersion DELETEs /versions/{vid} and invalidates', async () => {
        const cache = stubVersionQueryCache(service)
        const http = spyHttpRequest()
        http.respondWith({})

        await service.deleteVersion(RID, VID)

        expect(http.spy).toHaveBeenCalledWith({ method: 'DELETE', url: `${BASE}/${VID}` })
        expect(cache.removeQueries).toHaveBeenCalledWith({
          queryKey: descriptor.versionKeys.all(RID)
        })
      })
    })

    describe('archive requires a non-empty comment', () => {
      it('rejects an empty comment before touching the network', async () => {
        const http = spyHttpRequest()

        await expect(service.archive(RID, VID, { comment: '  ' })).rejects.toThrow(/comment/)

        expect(http.spy).not.toHaveBeenCalled()
      })

      it('POSTs /versions/{vid}/archive with the comment once it is present and invalidates', async () => {
        const cache = stubVersionQueryCache(service)
        const http = spyHttpRequest()
        http.respondWith({})

        await service.archive(RID, VID, { comment: 'done' })

        expect(http.spy).toHaveBeenCalledWith({
          method: 'POST',
          url: `${BASE}/${VID}/archive`,
          body: { comment: 'done' }
        })
        expect(cache.removeQueries).toHaveBeenCalledWith({
          queryKey: descriptor.versionKeys.all(RID)
        })
      })
    })

    if (descriptor.extraMutations.includes('rollback')) {
      describe('rollback (extra mutation)', () => {
        it('POSTs /versions/{vid}/rollback and invalidates the version cache', async () => {
          const cache = stubVersionQueryCache(service)
          const http = spyHttpRequest()
          http.respondWith({})

          await service.rollback(RID, VID, { comment: 'revert' })

          expect(http.spy).toHaveBeenCalledWith({
            method: 'POST',
            url: `${BASE}/${VID}/rollback`,
            body: { comment: 'revert' }
          })
          expect(cache.removeQueries).toHaveBeenCalledWith({
            queryKey: descriptor.versionKeys.all(RID)
          })
        })
      })
    }

    describe('services-http-only — the service imports no composables/stores/DOM', () => {
      const importSources = (() => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- shared suite: path comes from the repo-committed test registry, not user input
        const code = readFileSync(descriptor.serviceModulePath, 'utf-8')
        const ast = parse(code, { sourceType: 'module', plugins: ['classProperties'] })
        return ast.program.body
          .filter((node) => node.type === 'ImportDeclaration')
          .map((node) => node.source.value)
      })()

      it('imports no composable modules', () => {
        expect(importSources.filter((source) => isComposableImport(source))).toEqual([])
      })

      it('imports no Pinia stores', () => {
        expect(importSources.filter((source) => isStoreImport(source))).toEqual([])
      })

      it('imports no DOM/router modules', () => {
        expect(importSources.filter((source) => isDomImport(source))).toEqual([])
      })
    })
  })
}
