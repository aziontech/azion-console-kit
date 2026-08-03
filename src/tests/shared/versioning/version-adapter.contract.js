import { describe, expect, it } from 'vitest'

/**
 * @param {object} descriptor
 */

const hasUndefinedDeep = (value) => {
  if (value === undefined) return true
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(hasUndefinedDeep)
  return Object.values(value).some(hasUndefinedDeep)
}

export const describeVersionAdapterContract = (descriptor) => {
  const adapter = descriptor.adapter

  describe(`version-adapter contract: ${descriptor.resourceType}`, () => {
    describe('transformListVersions normalizes every input shape', () => {
      it('turns a bare array into { count, body } with config per item', () => {
        const raw = descriptor.buildVersion()
        const { count, body } = adapter.transformListVersions([raw])

        expect(count).toBe(1)
        expect(body[0].id).toBe(raw.version_id)
        expect(body[0].config).toMatchObject(descriptor.configMarkers)
      })

      it('accepts a { results, count } envelope', () => {
        expect(adapter.transformListVersions({ results: [], count: 0 })).toEqual({
          count: 0,
          body: []
        })
      })

      it('accepts a { data } envelope', () => {
        expect(adapter.transformListVersions({ data: [] })).toEqual({ count: 0, body: [] })
      })

      it('treats a null/absent payload as empty', () => {
        expect(adapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
      })
    })

    describe('transformLoadVersion extracts the config', () => {
      it('extracts the resource config markers from a full snapshot', () => {
        const raw = descriptor.buildVersion()
        const result = adapter.transformLoadVersion(raw)

        expect(result.id).toBe(raw.version_id)
        expect(result.config).toMatchObject(descriptor.configMarkers)
      })

      it('unwraps a { data } envelope', () => {
        const raw = descriptor.buildVersion()
        const result = adapter.transformLoadVersion({ data: raw })

        expect(result.id).toBe(raw.version_id)
        expect(result.config).toMatchObject(descriptor.configMarkers)
      })

      it('discards a null/absent raw', () => {
        expect(adapter.transformLoadVersion(null)).toBeNull()
      })

      it('normalizes a metadata-only payload per the resource fallback', () => {
        const result = adapter.transformLoadVersion({ version_id: 'META-1', state: 'ready' })

        expect(result.id).toBe('META-1')
        if (descriptor.metadataOnly.exact) {
          expect(result.config).toEqual(descriptor.metadataOnly.config)
        } else {
          expect(result.config).toMatchObject(descriptor.metadataOnly.config)
        }
      })
    })

    describe('payload transforms write to the root and strip undefined', () => {
      it('transformCreateDraftPayload maps source_version/comment + the resource fields to the root', () => {
        const payload = adapter.transformCreateDraftPayload({
          sourceVersionId: 'SRC-0',
          comment: 'clone',
          ...descriptor.buildFormValues()
        })

        expect(payload.source_version).toBe('SRC-0')
        expect(payload.comment).toBe('clone')
        expect(payload).toMatchObject(descriptor.payloadMarkers)
        expect(hasUndefinedDeep(payload)).toBe(false)
      })

      it('transformDraftPayload maps the form back to the root resource shape', () => {
        const payload = adapter.transformDraftPayload(descriptor.buildFormValues())

        expect(payload).toMatchObject(descriptor.payloadMarkers)
        expect(hasUndefinedDeep(payload)).toBe(false)
      })

      it('transformDraftPayload passes comment (and source_version, unless the resource opts out) to the root', () => {
        const payload = adapter.transformDraftPayload({
          ...descriptor.buildFormValues(),
          comment: 'note',
          sourceVersionId: 'SRC-1'
        })

        expect(payload.comment).toBe('note')
        if (descriptor.draftCarriesSourceVersion === false) {
          expect(payload).not.toHaveProperty('source_version')
        } else {
          expect(payload.source_version).toBe('SRC-1')
        }
      })
    })

    if (descriptor.mapMetaFields.length > 0) {
      describe('mapMeta adds the resource-specific meta fields', () => {
        it('exposes every declared meta field on the normalized version', () => {
          const result = adapter.transformLoadVersion(descriptor.buildVersion())
          for (const field of descriptor.mapMetaFields) {
            expect(result).toHaveProperty(field)
          }
        })
      })
    }
  })
}
