import { describe, it, expect } from 'vitest'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const isPrefixedBy = (key, prefix) => prefix.every((segment, index) => key[index] === segment)

describe('Property P4 — digital certificates v6 cache keys are isolated from the legacy namespace', () => {
  const certificateKeys = [
    queryKeys.digitalCertificatesV6.all,
    queryKeys.digitalCertificatesV6.list({ page: 1 }),
    queryKeys.digitalCertificatesV6.detail('abc'),
    queryKeys.digitalCertificatesV6.versions.all('abc'),
    queryKeys.digitalCertificatesV6.versions.list('abc', { page: 2 })
  ]

  const crlKeys = [
    queryKeys.digitalCertificatesCRLV6.all,
    queryKeys.digitalCertificatesCRLV6.list({ page: 1 }),
    queryKeys.digitalCertificatesCRLV6.detail('abc'),
    queryKeys.digitalCertificatesCRLV6.versions.all('abc'),
    queryKeys.digitalCertificatesCRLV6.versions.list('abc', { page: 2 })
  ]

  describe('digitalCertificatesV6', () => {
    it('exposes the exact v6 root namespace', () => {
      expect(queryKeys.digitalCertificatesV6.all).toEqual(['digital-certificates-v6'])
    })

    it('prefixes every generated key with the v6 root namespace', () => {
      for (const key of certificateKeys) {
        expect(key[0]).toBe('digital-certificates-v6')
      }
    })

    it('never prefixes a v6 key with the legacy digital certificates namespace', () => {
      for (const key of certificateKeys) {
        expect(key[0]).not.toBe(queryKeys.digitalCertificates.all[0])
      }
    })

    it('derives the versions namespace from the certificate detail key', () => {
      const detail = queryKeys.digitalCertificatesV6.detail('abc')

      expect(isPrefixedBy(queryKeys.digitalCertificatesV6.versions.all('abc'), detail)).toBe(true)
      expect(
        isPrefixedBy(queryKeys.digitalCertificatesV6.versions.list('abc', { page: 2 }), detail)
      ).toBe(true)
    })

    it('includes the certificate id in the versions list key', () => {
      const key = queryKeys.digitalCertificatesV6.versions.list('abc', { page: 2 })

      expect(key).toContain('abc')
    })

    it('differentiates versions list keys by distinct params', () => {
      const keyPageTwo = queryKeys.digitalCertificatesV6.versions.list('abc', { page: 2 })
      const keyPageThree = queryKeys.digitalCertificatesV6.versions.list('abc', { page: 3 })

      expect(keyPageTwo).not.toEqual(keyPageThree)
    })

    it('normalizes semantically equivalent params to the same versions list key', () => {
      const withEmptyArray = queryKeys.digitalCertificatesV6.versions.list('abc', {
        page: 2,
        fields: []
      })
      const withoutEmptyArray = queryKeys.digitalCertificatesV6.versions.list('abc', { page: 2 })

      expect(withEmptyArray).toEqual(withoutEmptyArray)
    })
  })

  describe('digitalCertificatesCRLV6', () => {
    it('exposes the exact v6 root namespace', () => {
      expect(queryKeys.digitalCertificatesCRLV6.all).toEqual(['digital-certificates-crl-v6'])
    })

    it('prefixes every generated key with the v6 root namespace', () => {
      for (const key of crlKeys) {
        expect(key[0]).toBe('digital-certificates-crl-v6')
      }
    })

    it('never prefixes a v6 key with the legacy digital certificates CRL namespace', () => {
      for (const key of crlKeys) {
        expect(key[0]).not.toBe(queryKeys.digitalCertificatesCRL.all[0])
      }
    })

    it('derives the versions namespace from the CRL detail key', () => {
      const detail = queryKeys.digitalCertificatesCRLV6.detail('abc')

      expect(isPrefixedBy(queryKeys.digitalCertificatesCRLV6.versions.all('abc'), detail)).toBe(
        true
      )
      expect(
        isPrefixedBy(queryKeys.digitalCertificatesCRLV6.versions.list('abc', { page: 2 }), detail)
      ).toBe(true)
    })

    it('includes the CRL id in the versions list key', () => {
      const key = queryKeys.digitalCertificatesCRLV6.versions.list('abc', { page: 2 })

      expect(key).toContain('abc')
    })

    it('differentiates versions list keys by distinct params', () => {
      const keyPageTwo = queryKeys.digitalCertificatesCRLV6.versions.list('abc', { page: 2 })
      const keyPageThree = queryKeys.digitalCertificatesCRLV6.versions.list('abc', { page: 3 })

      expect(keyPageTwo).not.toEqual(keyPageThree)
    })

    it('normalizes semantically equivalent params to the same versions list key', () => {
      const withEmptyArray = queryKeys.digitalCertificatesCRLV6.versions.list('abc', {
        page: 2,
        fields: []
      })
      const withoutEmptyArray = queryKeys.digitalCertificatesCRLV6.versions.list('abc', { page: 2 })

      expect(withEmptyArray).toEqual(withoutEmptyArray)
    })
  })

  describe('cross-namespace isolation', () => {
    it('never intersects the v6 certificate and v6 CRL prefixes', () => {
      for (const key of certificateKeys) {
        expect(isPrefixedBy(key, queryKeys.digitalCertificatesCRLV6.all)).toBe(false)
      }

      for (const key of crlKeys) {
        expect(isPrefixedBy(key, queryKeys.digitalCertificatesV6.all)).toBe(false)
      }
    })

    it('never prefixes any v6 key with a legacy root', () => {
      const legacyRoots = [queryKeys.digitalCertificates.all, queryKeys.digitalCertificatesCRL.all]

      for (const key of [...certificateKeys, ...crlKeys]) {
        for (const legacyRoot of legacyRoots) {
          expect(isPrefixedBy(key, legacyRoot)).toBe(false)
        }
      }
    })

    it('never prefixes any legacy root with a v6 root', () => {
      const legacyRoots = [queryKeys.digitalCertificates.all, queryKeys.digitalCertificatesCRL.all]
      const v6Roots = [queryKeys.digitalCertificatesV6.all, queryKeys.digitalCertificatesCRLV6.all]

      for (const legacyRoot of legacyRoots) {
        for (const v6Root of v6Roots) {
          expect(isPrefixedBy(legacyRoot, v6Root)).toBe(false)
        }
      }
    })
  })
})
