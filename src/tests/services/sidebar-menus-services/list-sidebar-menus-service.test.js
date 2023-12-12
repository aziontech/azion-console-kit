import { listSidebarMenusService } from '@/services/sidebar-menus-services'
import { menus } from '@/services/sidebar-menus-services/menus'
import { describe, expect, it } from 'vitest'

const fixtures = {
  menusMock: menus
}

const makeSut = () => {
  const sut = listSidebarMenusService

  return {
    sut
  }
}

describe('SidebarMenusServices', () => {
  it('should return correct menus', async () => {
    const { sut } = makeSut()

    const result = sut()

    expect(result).toEqual({
      body: {
        menus: fixtures.menusMock
      },
      statusCode: 200
    })
  })
})
