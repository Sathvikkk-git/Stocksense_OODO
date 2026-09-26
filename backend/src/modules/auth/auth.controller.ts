import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';
import { config } from '../../config';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        throw new AppError('Email, password, and name are required.', 400);
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError('Email address is already registered.', 400);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: role || 'WAREHOUSE_STAFF',
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.status(201).json({
        success: true,
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required.', 400);
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AppError('Invalid email or password credentials.', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password credentials.', 401);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      const userPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      res.status(200).json({
        success: true,
        data: { user: userPayload, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated.', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError('Email is required.', 400);
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Return 200 for security to avoid email enumeration
        return res.status(200).json({
          success: true,
          message: 'If an account exists with this email, an OTP has been generated.',
        });
      }

      // Generate 6-digit mock OTP
      const otp = '123456';
      console.log(`[AUTH] Generated Password Reset OTP for ${email}: ${otp}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully (Demo OTP: 123456)',
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        throw new AppError('Email, OTP, and newPassword are required.', 400);
      }

      if (otp !== '123456') {
        throw new AppError('Invalid or expired OTP code.', 400);
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. You may now log in.',
      });
    } catch (error) {
      next(error);
    }
  }
}
