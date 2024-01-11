export class CannotReorderDefaultRule extends Error {
  constructor() {
    super(`You cannot reorder the Default rule.`)
    this.name = 'CannotReorderDefaultRule'
  }
}
