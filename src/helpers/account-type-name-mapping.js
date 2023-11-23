const MAPPED_NAME_TYPE = {
  client: 'Client',
  clients: 'Client',
  groups: 'Group',
  reseller: 'Group',
  resellers: 'Reseller',
  company: 'Reseller',
  brand: 'Brand',
  brands: 'Brand'
}

const ICON_TYPE_ACCOUNT = {
  client: 'pi pi-box',
  group: 'pi pi-folder',
  reseller: 'pi pi-building',
  brand: 'pi pi-globe'
}

export const getAccountTypeName = (typeAccount) => {
  const nameType = MAPPED_NAME_TYPE[typeAccount]
  return nameType
}

export const getAccountTypeIcon = (typeAccount) => {
  const nameType = MAPPED_NAME_TYPE[typeAccount]

  if (!nameType) return null

  const nameLower = nameType.toLowerCase()
  const icon = ICON_TYPE_ACCOUNT[nameLower]

  return icon
}
