import { describe, expect, it } from 'vitest'
import { formatBytes } from '@/helpers/format-bytes'

describe('formatBytes', () => {
  it('should format byte values with decimal SI prefixes', () => {
    expect(formatBytes(1_500_000, 1)).toBe('1.5 MB')
    expect(formatBytes(1_500_000_000, 1)).toBe('1.5 GB')
  })
})
