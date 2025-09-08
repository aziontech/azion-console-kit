import { parseSnakeToCamel } from '@/helpers'

export const IAMAdapter = {
  transformListSocialIdps(data) {
    return data.map((socialIdp) => {
      socialIdp.login_url = socialIdp.login_url + '?console=true'
      return parseSnakeToCamel(socialIdp)
    })
  }
}
