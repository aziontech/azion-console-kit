import { httpService } from './httpService'
import { QueryService } from './queryService'

export class BaseService {
  constructor() {
    if (this.constructor.instance) {
      return this.constructor.instance
    }

    this.http = httpService
    this.query = new QueryService()
    this.constructor.instance = this
  }
}
