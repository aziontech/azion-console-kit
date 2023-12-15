import { menus } from './menus'

export const listSidebarMenusService = () => {
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
