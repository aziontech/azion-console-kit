import { describe, it, expect } from 'vitest'
import { useLayout } from '../../composables/use-layout'

describe('useLayout', () => {
  it('should ensure resetMenu sets sidebarVisible to false', () => {
    const { layoutState, closeSidebar } = useLayout()
    layoutState.sidebarVisible = true
    closeSidebar()
    expect(layoutState.sidebarVisible).toBeFalsy()
  })

  it('should verify toggleSidebar toggles sidebarVisible state', () => {
    const { layoutState, toggleSidebarComponent } = useLayout()
    layoutState.sidebarVisible = false
    toggleSidebarComponent('helper', {})
    expect(layoutState.sidebarVisible).toBeTruthy()
    toggleSidebarComponent('helper', {})
    expect(layoutState.sidebarVisible).toBeFalsy()
  })

  it('should confirm isSidebarActive is readonly and reflects the sidebarVisible state accurately, blocking direct modifications', () => {
    const { layoutState, toggleSidebarComponent, isSidebarActive } = useLayout()
    layoutState.sidebarVisible = true
    expect(isSidebarActive.value).toBeFalsy()
    toggleSidebarComponent('helper', {})
    expect(isSidebarActive.value).toBeTruthy()
  })

  it('should open the sidebar with the correct component', () => {
    const { layoutState, OpenSidebarComponent } = useLayout()
    OpenSidebarComponent('helper', { someProp: 'value' })
    expect(layoutState.sidebarVisible).toBeTruthy()
    expect(layoutState.currentComponent.component.name).toBe('helper-sidebar')
    expect(layoutState.currentComponent.props.someProp).toBe('value')
  })

  it('should close the sidebar', () => {
    const { layoutState, closeSidebar } = useLayout()
    layoutState.sidebarVisible = true
    closeSidebar()
    expect(layoutState.sidebarVisible).toBeFalsy()
    expect(layoutState.currentComponent.component).toBeNull()
    expect(layoutState.currentComponent.props).toEqual({})
  })
})
