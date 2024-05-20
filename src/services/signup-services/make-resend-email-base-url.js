export const makeResendEmailBaseUrl = () => {
  const version = 'v4'
  return `${version}/iam/user/resend-activation-link`
}
