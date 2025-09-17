import { httpService } from './httpService'

export class BaseService {
  constructor() {
    if (this.constructor.instance) {
      return this.constructor.instance
    }

    this.http = httpService

    this.constructor.instance = this
  }
}
