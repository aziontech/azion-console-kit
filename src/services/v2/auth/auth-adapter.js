export const AuthAdapter = {
  transformLoginMethod(data) {
    return data
  },
  transformPayloadLogin(data) {
    return {
      email: data.email,
      password: data.password
    }
  }
}
