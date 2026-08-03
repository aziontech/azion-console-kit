import { describe, expect, it, vi } from 'vitest'

vi.mock('@/helpers/convert-date', () => ({
  formatDateToDayMonthYearHour: vi.fn(() => 'formatted-date'),
  convertToRelativeTime: vi.fn(() => 'relative-time')
}))

import { DigitalCertificatesV6Adapter } from '@/services/v2/digital-certificates/v6/digital-certificates-v6-adapter'
import { DigitalCertificatesCRLV6Adapter } from '@/services/v2/digital-certificates/v6/digital-certificates-crl-v6-adapter'

const CERT_CONTENT = 'CERT-CONTENT'
const PRIVATE_CONTENT = 'PRIVATE-CONTENT'
const CRL_CONTENT = 'CRL-CONTENT'

const makeCertApiItem = (overrides = {}) => ({
  id: 1,
  name: 'my-cert',
  type: 'edge_certificate',
  managed: false,
  csr: 'CSR-DATA',
  certificate: CERT_CONTENT,
  private_key: PRIVATE_CONTENT,
  ...overrides
})

const makeCrlApiItem = (overrides = {}) => ({
  id: 2,
  name: 'my-crl',
  crl: CRL_CONTENT,
  ...overrides
})

const makeVersionItem = (overrides = {}) => ({
  version_id: 'ver-1',
  version_state: 'ready',
  description: '',
  last_editor: 'user@azion.com',
  created_at: '2026-07-08T12:00:00Z',
  ready_at: '2026-07-08T11:59:00Z',
  ...overrides
})

describe('DigitalCertificatesV6Adapter — P2 write-only transformLoadItem', () => {
  it('never returns the stored certificate or private key content', () => {
    const result = DigitalCertificatesV6Adapter.transformLoadItem(makeCertApiItem())

    expect(result.certificate).toBe('')
    expect(result.privateKey).toBeUndefined()
    expect(result).not.toHaveProperty('private_key')
    expect(JSON.stringify(result)).not.toContain(CERT_CONTENT)
    expect(JSON.stringify(result)).not.toContain(PRIVATE_CONTENT)
  })

  it('maps id, name, type, managed and csr', () => {
    const result = DigitalCertificatesV6Adapter.transformLoadItem(
      makeCertApiItem({ id: 42, name: 'edge-cert', type: 'trusted_ca_certificate', managed: true })
    )

    expect(result).toMatchObject({
      id: 42,
      name: 'edge-cert',
      type: 'trusted_ca_certificate',
      managed: true,
      csr: 'CSR-DATA'
    })
  })

  it('unwraps a .data envelope and still hides the content', () => {
    const result = DigitalCertificatesV6Adapter.transformLoadItem({
      data: makeCertApiItem({ id: 7 })
    })

    expect(result.id).toBe(7)
    expect(result.certificate).toBe('')
    expect(result.privateKey).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain(CERT_CONTENT)
    expect(JSON.stringify(result)).not.toContain(PRIVATE_CONTENT)
  })
})

describe('DigitalCertificatesCRLV6Adapter — P2 write-only transformLoadItem', () => {
  it('never returns the stored crl content and forces the CRL type', () => {
    const result = DigitalCertificatesCRLV6Adapter.transformLoadItem(makeCrlApiItem())

    expect(result).toMatchObject({ id: 2, name: 'my-crl', type: 'CRL', certificate: '' })
    expect(result).not.toHaveProperty('crl')
    expect(JSON.stringify(result)).not.toContain(CRL_CONTENT)
  })

  it('unwraps a .data envelope and still hides the content', () => {
    const result = DigitalCertificatesCRLV6Adapter.transformLoadItem({
      data: makeCrlApiItem({ id: 9 })
    })

    expect(result.id).toBe(9)
    expect(result.certificate).toBe('')
    expect(JSON.stringify(result)).not.toContain(CRL_CONTENT)
  })
})

describe('transformVersionsList — P2 write-only + shape', () => {
  it('never leaks content fields and exposes only the version shape', () => {
    const result = DigitalCertificatesV6Adapter.transformVersionsList([
      makeVersionItem({
        version_id: 'ver-1',
        version_state: 'ready',
        certificate: 'V-CERT',
        private_key: 'V-KEY',
        crl: 'V-CRL'
      })
    ])

    expect(result[0]).toEqual({
      id: 'ver-1',
      label: 'ver-1',
      versionState: 'ready',
      isCurrent: true,
      lastEditor: 'user@azion.com',
      lastModified: 'formatted-date'
    })
    expect(result[0]).not.toHaveProperty('certificate')
    expect(result[0]).not.toHaveProperty('private_key')
    expect(result[0]).not.toHaveProperty('crl')
    expect(JSON.stringify(result)).not.toContain('V-CERT')
    expect(JSON.stringify(result)).not.toContain('V-KEY')
    expect(JSON.stringify(result)).not.toContain('V-CRL')
  })

  it('exposes the same shape through the CRL adapter', () => {
    const result = DigitalCertificatesCRLV6Adapter.transformVersionsList([
      makeVersionItem({ version_id: 'ver-2', version_state: 'ready', crl: 'V-CRL' })
    ])

    expect(result[0]).toEqual({
      id: 'ver-2',
      label: 'ver-2',
      versionState: 'ready',
      isCurrent: true,
      lastEditor: 'user@azion.com',
      lastModified: 'formatted-date'
    })
    expect(JSON.stringify(result)).not.toContain('V-CRL')
  })

  it('marks isCurrent from version_state — ready is current, archived is historical', () => {
    const result = DigitalCertificatesV6Adapter.transformVersionsList([
      makeVersionItem({ version_id: 'ver-1', version_state: 'ready' }),
      makeVersionItem({ version_id: 'ver-2', version_state: 'archived' }),
      makeVersionItem({ version_id: 'ver-3', version_state: 'archived' })
    ])

    expect(result.find((entry) => entry.id === 'ver-1').isCurrent).toBe(true)
    expect(result.find((entry) => entry.id === 'ver-2').isCurrent).toBe(false)
    expect(result.find((entry) => entry.id === 'ver-3').isCurrent).toBe(false)
  })

  it('labels every version with its hash, never exposing an internal version number', () => {
    const result = DigitalCertificatesV6Adapter.transformVersionsList([
      makeVersionItem({ version_id: 'ver-1', description: 'Renewed intermediate chain' }),
      makeVersionItem({ version_id: 'ver-2', version: '2' })
    ])

    expect(result.find((entry) => entry.id === 'ver-1').label).toBe('ver-1')
    expect(result.find((entry) => entry.id === 'ver-2').label).toBe('ver-2')
    expect(result.find((entry) => entry.id === 'ver-2')).not.toHaveProperty('version')
    expect(result.find((entry) => entry.id === 'ver-2')).not.toHaveProperty('versionNumber')
  })

  it('returns an empty array for a non-array input', () => {
    expect(DigitalCertificatesV6Adapter.transformVersionsList(undefined)).toEqual([])
  })
})

describe('DigitalCertificatesV6Adapter — P3 PUT preservation transformEditPayload', () => {
  it('returns only name and type when all content fields are empty, undefined, or whitespace', () => {
    expect(
      DigitalCertificatesV6Adapter.transformEditPayload({
        name: 'n',
        type: 't',
        certificate: '',
        privateKey: ''
      })
    ).toEqual({ name: 'n', type: 't' })

    expect(
      DigitalCertificatesV6Adapter.transformEditPayload({
        name: 'n',
        type: 't',
        certificate: undefined,
        privateKey: undefined
      })
    ).toEqual({ name: 'n', type: 't' })

    expect(
      DigitalCertificatesV6Adapter.transformEditPayload({
        name: 'n',
        type: 't',
        certificate: '   ',
        privateKey: '\n\t '
      })
    ).toEqual({ name: 'n', type: 't' })
  })

  it('includes certificate and omits private_key when only certificate is provided', () => {
    const result = DigitalCertificatesV6Adapter.transformEditPayload({
      name: 'n',
      type: 't',
      certificate: CERT_CONTENT,
      privateKey: ''
    })

    expect(result).toEqual({ name: 'n', type: 't', certificate: CERT_CONTENT })
    expect(result).not.toHaveProperty('private_key')
  })

  it('includes private_key and omits certificate when only the private key is provided', () => {
    const result = DigitalCertificatesV6Adapter.transformEditPayload({
      name: 'n',
      type: 't',
      certificate: '',
      privateKey: PRIVATE_CONTENT
    })

    expect(result).toEqual({ name: 'n', type: 't', private_key: PRIVATE_CONTENT })
    expect(result).not.toHaveProperty('certificate')
  })

  it('includes both certificate and private_key when both are provided', () => {
    const result = DigitalCertificatesV6Adapter.transformEditPayload({
      name: 'n',
      type: 't',
      certificate: CERT_CONTENT,
      privateKey: PRIVATE_CONTENT
    })

    expect(result).toEqual({
      name: 'n',
      type: 't',
      certificate: CERT_CONTENT,
      private_key: PRIVATE_CONTENT
    })
  })
})

describe('DigitalCertificatesCRLV6Adapter — P3 PUT preservation transformEditPayload', () => {
  it('returns only name when the certificate is empty', () => {
    expect(
      DigitalCertificatesCRLV6Adapter.transformEditPayload({ name: 'n', certificate: '' })
    ).toEqual({ name: 'n' })
  })

  it('includes crl when the certificate is provided', () => {
    expect(
      DigitalCertificatesCRLV6Adapter.transformEditPayload({ name: 'n', certificate: CRL_CONTENT })
    ).toEqual({ name: 'n', crl: CRL_CONTENT })
  })
})

describe('transformCreatePayload', () => {
  it('builds the certificate payload with content when provided', () => {
    expect(
      DigitalCertificatesV6Adapter.transformCreatePayload({
        digitalCertificateName: 'cert-name',
        certificateType: 'edge_certificate',
        certificate: CERT_CONTENT,
        privateKey: PRIVATE_CONTENT
      })
    ).toEqual({
      name: 'cert-name',
      type: 'edge_certificate',
      certificate: CERT_CONTENT,
      private_key: PRIVATE_CONTENT
    })
  })

  it('omits empty content from the certificate payload', () => {
    expect(
      DigitalCertificatesV6Adapter.transformCreatePayload({
        digitalCertificateName: 'cert-name',
        certificateType: 'edge_certificate',
        certificate: '',
        privateKey: '  '
      })
    ).toEqual({ name: 'cert-name', type: 'edge_certificate' })
  })

  it('builds the CRL payload with name and crl', () => {
    expect(
      DigitalCertificatesCRLV6Adapter.transformCreatePayload({
        digitalCertificateName: 'crl-name',
        certificate: CRL_CONTENT
      })
    ).toEqual({ name: 'crl-name', crl: CRL_CONTENT })
  })
})

describe('transformList — row shape', () => {
  it('maps a minimal certificate row', () => {
    const [row] = DigitalCertificatesV6Adapter.transformList([
      {
        id: 1,
        name: 'my-cert',
        type: 'edge_certificate',
        status: 'active',
        last_editor: 'user@azion.com',
        last_modified: '2026-07-08T12:00:00Z'
      }
    ])

    expect(row.id).toBe(1)
    expect(row.name).toBe('my-cert')
    expect(row.type).toBe('TLS Certificate')
    expect(row.status.status).toEqual({ content: 'Active', severity: 'success' })
    expect(row.validity).toBe('-')
    expect(row.lastModified).toBe('formatted-date')
  })

  it('returns an empty array for a non-array certificate input', () => {
    expect(DigitalCertificatesV6Adapter.transformList(null)).toEqual([])
  })

  it('maps a minimal CRL row', () => {
    const [row] = DigitalCertificatesCRLV6Adapter.transformList([
      {
        id: 2,
        name: 'my-crl',
        active: true,
        last_editor: 'user@azion.com',
        last_modified: '2026-07-08T12:00:00Z'
      }
    ])

    expect(row.id).toBe(2)
    expect(row.name).toBe('my-crl')
    expect(row.status.status).toEqual({ content: 'Active', severity: 'success' })
    expect(row.lastEditor).toBe('user@azion.com')
    expect(row.lastModified).toBe('formatted-date')
  })

  it('returns an empty array for a non-array CRL input', () => {
    expect(DigitalCertificatesCRLV6Adapter.transformList(undefined)).toEqual([])
  })
})
