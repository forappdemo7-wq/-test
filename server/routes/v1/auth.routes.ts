import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { SignupSchema, SigninSchema, RefreshTokenSchema } from '../../validation/auth.schema';
import { rateLimiter } from '../../middleware/rate-limiter.middleware';

const router = Router();

router.post(
  '/signup',
  rateLimiter({ max: 20 }),
  validate({ body: SignupSchema }),
  authController.signup.bind(authController)
);

router.post(
  '/signin',
  rateLimiter({ max: 30 }),
  validate({ body: SigninSchema }),
  authController.signin.bind(authController)
);

router.post(
  '/refresh',
  validate({ body: RefreshTokenSchema }),
  authController.refreshToken.bind(authController)
);

router.post('/logout', authController.logout.bind(authController));
router.post('/logout-all', authController.logoutAll.bind(authController));

// Social OAuth & Federation
router.post('/google', authController.socialAuthGoogle.bind(authController));
router.post('/apple', authController.socialAuthApple.bind(authController));

// Sessions & Devices
router.get('/sessions', authController.getSessions.bind(authController));
router.delete('/sessions/:id', authController.deleteSession.bind(authController));
router.get('/devices', authController.getDevices.bind(authController));
router.delete('/devices/:id', authController.deleteDevice.bind(authController));
router.patch('/devices/:id', authController.updateDevice.bind(authController));
router.put('/devices/:id', authController.updateDevice.bind(authController));
router.get('/security-logs', authController.getSecurityLogs.bind(authController));

// Two-Factor Authentication
router.post('/2fa/setup', authController.setup2FA.bind(authController));
router.post('/2fa/enable', authController.enable2FA.bind(authController));
router.post('/2fa/disable', authController.disable2FA.bind(authController));
router.post('/2fa/verify-login', authController.verify2FALogin.bind(authController));
router.post('/resolve-suspicious-alert', authController.resolveSuspiciousAlert.bind(authController));

// Passkey WebAuthn
router.post('/passkey/register-options', authController.passkeyRegisterOptions.bind(authController));
router.post('/passkey/register-verify', authController.passkeyRegisterVerify.bind(authController));
router.post('/passkey/signin-options', authController.passkeySigninOptions.bind(authController));
router.post('/passkey/signin-verify', authController.passkeySigninVerify.bind(authController));

// Password recovery & email verification
router.post('/forgot-password/request', authController.forgotPasswordRequest.bind(authController));
router.post('/forgot-password/verify', authController.forgotPasswordVerify.bind(authController));
router.post('/verify-email/send', authController.sendEmailVerification.bind(authController));
router.post('/verify-email/confirm', authController.confirmEmailVerification.bind(authController));

export const authRoutes = router;
