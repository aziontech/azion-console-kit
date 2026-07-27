const AZION_DEFAULT_SSO_ID = 'azion-default-sso'

export const resolveRollbackTarget = (list = []) => {
  if (!Array.isArray(list)) {
    return null
  }

  const target = list.find((item) => item?.isActive === true && item?.id !== AZION_DEFAULT_SSO_ID)

  if (!target) {
    return null
  }

  return {
    id: target.id,
    protocol: target.protocol
  }
}
