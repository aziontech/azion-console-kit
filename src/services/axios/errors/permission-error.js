export class PermissionError extends Error {
  constructor() {
    super('You dont have permision to do this action.')
    this.name = 'PermissionError'
  }
}
