export function encrypt(value) {
  try {
    return btoa(value)
  } catch {
    return value
  }
}

export function decrypt(value) {
  try {
    return atob(value)
  } catch {
    return value
  }
}
