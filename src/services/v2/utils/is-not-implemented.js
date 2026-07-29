const NOT_IMPLEMENTED_STATUS = 501

export const isNotImplemented = (error) =>
  error?.statusCode === NOT_IMPLEMENTED_STATUS ||
  error?.response?.status === NOT_IMPLEMENTED_STATUS ||
  error?.status === NOT_IMPLEMENTED_STATUS
