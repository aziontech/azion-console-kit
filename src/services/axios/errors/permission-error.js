export class PermissionError extends Error {
  constructor() {
    super('You do not have permission to do this action.')
    this.name = 'PermissionError'
  }
}
