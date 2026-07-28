const NOT_FOUND_STATUS = 404

export const isNotFound = (error) =>
  error?.statusCode === NOT_FOUND_STATUS ||
  error?.response?.status === NOT_FOUND_STATUS ||
  error?.status === NOT_FOUND_STATUS
