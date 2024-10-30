import { getMenuItens } from './menus'

export const listSidebarMenusService = (showMarketplaceProductsItens) => {
  const menus = getMenuItens(showMarketplaceProductsItens)
  return adapt(menus)
}

const adapt = (menus) => {
  return {
    body: {
      menus
    },
    statusCode: 200
  }
}
