import { listSidebarMenusService } from '@/services/sidebar-menus-services'
import { getMenuItens } from '@/services/sidebar-menus-services/menus'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  menusMock: getMenuItens(),
  menusMockWithMarketplaceProducts: getMenuItens(true)
}

const makeSut = () => {
  const sut = listSidebarMenusService

  return {
    sut
  }
}

describe('SidebarMenusServices', () => {
  vi.mock('@/composables/user-flag', () => {
    return {
      hasFlagBlockApiV4: vi.fn()
    }
  })

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

  it('should return correct menus with marketplace products', async () => {
    const { sut } = makeSut()

    const result = sut(true)

    expect(result).toEqual({
      body: {
        menus: fixtures.menusMockWithMarketplaceProducts
      },
      statusCode: 200
    })
  })
})
