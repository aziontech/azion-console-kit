class NavigatorNotAvailableError extends Error {
  constructor() {
    super('Navigator is not available')
    this.name = 'NavigatorNotAvailableError'
  }
}
export async function clipboardWrite(content) {
  if (!navigator.clipboard) {
    throw new NavigatorNotAvailableError().message
  }
  navigator.clipboard.writeText(content)
}
