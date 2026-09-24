import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async signin(req: Request, res: Response, next: NextFunction) {
    try {
      const { login, identifier, password, rememberMe, clientDevice } = req.body;
      const loginIdentifier = (login || identifier || '').trim();
      const result = await authService.signin(loginIdentifier, password);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      res.json({ success: true, tokens });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user?.id || 'user_current';
      await authService.logoutAll(userId);
      res.json({ success: true, message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  }

  async socialAuthGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.socialAuth('google', req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async socialAuthApple(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.socialAuth('apple', req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.query.userId as string) || req.user?.id || 'user_current';
      const sessions = await authService.getSessions(userId);
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req.query.userId as string) || req.user?.id || 'user_current';
      const result = await authService.deleteSession(userId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.query.userId as string) || req.user?.id || 'user_current';
      const devices = await authService.getDevices(userId);
      res.json(devices);
    } catch (error) {
      next(error);
    }
  }

  async deleteDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req.query.userId as string) || req.user?.id || 'user_current';
      const result = await authService.deleteDevice(userId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req.query.userId as string) || req.user?.id || 'user_current';
      const result = await authService.updateDevice(userId, id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSecurityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.query.userId as string) || req.user?.id || 'user_current';
      const logs = await authService.getSecurityLogs(userId);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await authService.setup2FA(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user?.id || 'user_current';
      const { code } = req.body;
      const result = await authService.enable2FA(userId, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await authService.disable2FA(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async verify2FALogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { tempToken, code } = req.body;
      const result = await authService.verify2FALogin(tempToken, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async resolveSuspiciousAlert(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, resolved: true });
    } catch (error) {
      next(error);
    }
  }

  async passkeyRegisterOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.query.userId as string) || req.user?.id || 'user_current';
      const options = await authService.passkeyRegisterOptions(userId);
      res.json(options);
    } catch (error) {
      next(error);
    }
  }

  async passkeyRegisterVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await authService.passkeyRegisterVerify(userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async passkeySigninOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const username = (req.query.username as string) || '';
      const options = await authService.passkeySigninOptions(username);
      res.json(options);
    } catch (error) {
      next(error);
    }
  }

  async passkeySigninVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.passkeySigninVerify(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPasswordRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPasswordRequest(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPasswordVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code, newPassword } = req.body;
      const result = await authService.forgotPasswordVerify(email, code, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendEmailVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.sendEmailVerification(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async confirmEmailVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const result = await authService.confirmEmailVerification(email, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
