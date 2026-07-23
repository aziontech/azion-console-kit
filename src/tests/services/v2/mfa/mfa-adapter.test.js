// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { MFAAdapter } from '@/services/v2/mfa/mfa-adapter'

describe('MFAAdapter.transformListMfa', () => {
  it('maps confirmed=true to a success tag and false to a danger tag', () => {
    const rows = MFAAdapter.transformListMfa([
      { id: 1, name: 'Ana', email: 'a@azion.com', confirmed: true },
      { id: 2, name: 'Bia', email: 'b@azion.com', confirmed: false }
    ])

    expect(rows[0].confirmed).toEqual({ content: 'Confirmed', severity: 'success' })
    expect(rows[1].confirmed).toEqual({ content: 'Not Confirmed', severity: 'danger' })
  })

  it('returns an empty list for null/undefined input (defensive default)', () => {
    expect(MFAAdapter.transformListMfa(null)).toEqual([])
    expect(MFAAdapter.transformListMfa(undefined)).toEqual([])
  })
})
