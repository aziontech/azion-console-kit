import { windowOpen } from '@/helpers/window-open'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('windowOpen', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should call window.open with provided URL and options', () => {
        const mockWindowOpen = vi.fn()
        vi.stubGlobal('window', { open: mockWindowOpen })

        const url = 'https://example.com'
        const options = '_blank'

        windowOpen(url, options)

        expect(mockWindowOpen).toHaveBeenCalledWith(url, options)
    })

    it('should call window.open without options when only URL is provided', () => {
        const mockWindowOpen = vi.fn()
        vi.stubGlobal('window', { open: mockWindowOpen })

        const url = 'https://example.com'

        windowOpen(url)

        expect(mockWindowOpen).toHaveBeenCalledWith(url, undefined)
    })

    it('should call window.open with an empty string when no arguments are provided', () => {
        const mockWindowOpen = vi.fn()
        vi.stubGlobal('window', { open: mockWindowOpen })

        windowOpen()

        expect(mockWindowOpen).toHaveBeenCalledWith('', undefined)
    })
})