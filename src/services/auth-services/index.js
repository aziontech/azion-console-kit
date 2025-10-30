import { switchAccountService } from './switch-account-service'
import { loginService } from './login-service'
import { authService } from '@/services/v2/auth'
import { logoutService } from './logout-service'
import { sendResetPasswordEmailService } from './send-reset-password-email-service'
import { resetPasswordService } from './reset-password-service'
import { passwordSettingService } from './password-setting-service'

// Export v2 auth services
export const verifyAuthenticationService = authService.verifyAuthenticationService
export const refreshAuthenticationService = authService.refreshAuthenticationService

export {
  loginService,
  switchAccountService,
  logoutService,
  sendResetPasswordEmailService,
  resetPasswordService,
  passwordSettingService
}
