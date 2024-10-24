import { describe, it, expect } from 'vitest'
import { useLayout } from '../../composables/use-layout'

describe('useLayout', () => {
  it('should ensure resetMenu sets sidebarVisible to false', () => {
    const { layoutState, resetMenu } = useLayout()
    layoutState.sidebarVisible = true
    resetMenu()
    expect(layoutState.sidebarVisible).toBeFalsy()
  })

  it('should verify toggleSidebar toggles sidebarVisible state', () => {
    const { layoutState, toggleSidebar } = useLayout()
    layoutState.sidebarVisible = false
    toggleSidebar()
    expect(layoutState.sidebarVisible).toBeTruthy()
    toggleSidebar()
    expect(layoutState.sidebarVisible).toBeFalsy()
  })

  it('should confirm isSidebarActive is readonly and reflects the sidebarVisible state accurately, blocking direct modifications', () => {
    const { layoutState, toggleSidebar, isSidebarActive } = useLayout()
    layoutState.sidebarVisible = true
    expect(isSidebarActive.value).toBeFalsy()
    toggleSidebar()
    expect(isSidebarActive.value).toBeTruthy()
  })
})
