import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { storage } from "./storage.js";
import { sendWelcomeEmail } from "./email-service.js";
import { insertUserSchema } from "../shared/schema.js";
import { z } from "zod";

// JWT Secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development";

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: { 
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // General limit for other endpoints
  message: { 
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const JWT_EXPIRES_IN = "7d";

// Extended request interface for authenticated requests
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    username: string;
    subscriptionTier?: string;
  };
}

// Middleware to verify JWT token
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user || !user.isActive || user.isSuspended) {
      return res.status(401).json({ error: 'Invalid or suspended user' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      subscriptionTier: user.subscriptionTier,
    };

    // Log user activity
    await storage.logUserActivity({
      userId: user.id,
      action: 'api_access',
      details: { endpoint: req.path, method: req.method },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
    });

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is super admin
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Generate JWT token with user information
const generateToken = (user: any): string => {
  return jwt.sign({ 
    userId: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    organizationId: user.organizationId,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    creditsRemaining: user.creditsRemaining,
    createdAt: user.createdAt,
    iat: Math.floor(Date.now() / 1000),
    jti: Math.random().toString(36).substr(2, 9) // Add unique jti (JWT ID)
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove on* event handlers
    .substring(0, 1000); // Limit length
};

// Strong password validation
const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
  .max(128, 'Password must be no more than 128 characters long');

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(sanitizeInput),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = insertUserSchema.extend({
  email: z.string().email('Invalid email format').transform(sanitizeInput),
  password: strongPasswordSchema,
  confirmPassword: z.string().optional(),
  recaptchaToken: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms & Conditions"
  }),
  acceptPrivacy: z.boolean().refine(val => val === true, {
    message: "You must accept the Privacy Policy"
  }),
  acceptMarketing: z.boolean().optional(),
}).transform((data) => ({
  ...data,
  username: sanitizeInput(data.username || ''),
  displayName: sanitizeInput(data.displayName || ''),
  firstName: data.firstName ? sanitizeInput(data.firstName) : undefined,
  lastName: data.lastName ? sanitizeInput(data.lastName) : undefined,
}));

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Initialize demo data with all subscription tiers
async function initializeDemoData() {
  try {
    const demoUsers = [
      // Freemium tier
      {
        email: 'demo-freemium@platinumedge.com',
        password: 'Demo123!',
        username: 'demo-freemium',
        displayName: 'Demo Freemium User',
        firstName: 'Demo',
        lastName: 'Freemium',
        role: 'scout',
        subscriptionTier: 'freemium',
        subscriptionStatus: 'active',
        creditsRemaining: 5
      },
      // ScoutPro tier
      {
        email: 'demo-scoutpro@platinumedge.com',
        password: 'Demo123!',
        username: 'demo-scoutpro',
        displayName: 'Demo ScoutPro User',
        firstName: 'Demo',
        lastName: 'ScoutPro',
        role: 'scout',
        subscriptionTier: 'scoutpro',
        subscriptionStatus: 'active',
        creditsRemaining: 100
      },
      // Agent/Club tier
      {
        email: 'demo-agent@platinumedge.com',
        password: 'Demo123!',
        username: 'demo-agent',
        displayName: 'Demo Agent/Club User',
        firstName: 'Demo',
        lastName: 'Agent',
        role: 'agent',
        subscriptionTier: 'agent_club',
        subscriptionStatus: 'active',
        creditsRemaining: 200
      },
      // Enterprise tier
      {
        email: 'demo-enterprise@platinumedge.com',
        password: 'Demo123!',
        username: 'demo-enterprise',
        displayName: 'Demo Enterprise User',
        firstName: 'Demo',
        lastName: 'Enterprise',
        role: 'scout',
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
        creditsRemaining: 1000
      },
      // Platinum tier
      {
        email: 'demo-platinum@platinumedge.com',
        password: 'Demo123!',
        username: 'demo-platinum',
        displayName: 'Demo Platinum User',
        firstName: 'Demo',
        lastName: 'Platinum',
        role: 'scout',
        subscriptionTier: 'platinum',
        subscriptionStatus: 'active',
        creditsRemaining: 9999
      },
      // Admin user
      {
        email: 'demo-admin@platinumedge.com',
        password: 'Demo123!',
        username: 'demo-admin',
        displayName: 'Demo Admin User',
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'admin',
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
        creditsRemaining: 1000
      },
      // Super Admin user
      {
        email: 'demo-superadmin@platinumedge.com',
        password: 'Demo123!',
        username: 'demo-superadmin',
        displayName: 'Demo Super Admin User',
        firstName: 'Demo',
        lastName: 'SuperAdmin',
        role: 'super_admin',
        subscriptionTier: 'platinum',
        subscriptionStatus: 'active',
        creditsRemaining: 9999
      },
      // Legacy users for backward compatibility
      {
        email: 'scout@demo.com',
        password: 'password123',
        username: 'scout',
        displayName: 'Demo Scout',
        firstName: 'Demo',
        lastName: 'Scout',
        role: 'scout',
        subscriptionTier: 'freemium',
        subscriptionStatus: 'active',
        creditsRemaining: 5
      },
      {
        email: 'admin@scoutpro.com',
        password: 'admin123',
        username: 'admin',
        displayName: 'ScoutPro Admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'super_admin',
        subscriptionTier: 'platinum',
        subscriptionStatus: 'active',
        creditsRemaining: 9999
      },
      {
        email: 'agent@scoutpro.com',
        password: 'agent123',
        username: 'agent',
        displayName: 'Demo Agent',
        firstName: 'Demo',
        lastName: 'Agent',
        role: 'agent',
        subscriptionTier: 'agent_club',
        subscriptionStatus: 'active',
        creditsRemaining: 200
      }
    ];

    for (const userData of demoUsers) {
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (!existingUser) {
        await storage.createUser(userData);
        console.log(`Demo user created: ${userData.email} / ${userData.password} (${userData.subscriptionTier})`);
      }
    }

    console.log('\n=== Demo Account Summary ===');
    console.log('Freemium: demo-freemium@platinumedge.com / Demo123!');
    console.log('ScoutPro: demo-scoutpro@platinumedge.com / Demo123!');
    console.log('Agent/Club: demo-agent@platinumedge.com / Demo123!');
    console.log('Enterprise: demo-enterprise@platinumedge.com / Demo123!');
    console.log('Platinum: demo-platinum@platinumedge.com / Demo123!');
    console.log('Admin: demo-admin@platinumedge.com / Demo123!');
    console.log('Super Admin: demo-superadmin@platinumedge.com / Demo123!');
    console.log('==============================\n');
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
}

export function registerAuthRoutes(app: Express) {
  // Initialize demo data
  initializeDemoData();
  
  // User Registration with rate limiting
  app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      const { email, username, password, recaptchaToken } = validation.data;

      // Basic reCAPTCHA validation (in production, verify with Google's API)
      if (!recaptchaToken && process.env.NODE_ENV === 'production') {
        return res.status(400).json({ error: 'Human verification required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      // Create user
      const user = await storage.createUser({
        email,
        username,
        password, // Will be hashed in storage layer
        displayName: validation.data.displayName,
        firstName: validation.data.firstName || null,
        lastName: validation.data.lastName || null,
        role: validation.data.role || 'scout', // Use role from form, default to scout
        organizationId: validation.data.organizationId || null,
        phone: validation.data.phone || null,
        country: validation.data.country || null,
      });

      // Log registration
      await storage.logUserActivity({
        userId: user.id,
        action: 'user_registered',
        details: { email, username },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      // Generate token
      const token = generateToken(user);

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.displayName || user.username);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // User Login with rate limiting
  app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      const { email, password } = validation.data;

      // Validate credentials
      const user = await storage.validateUserCredentials(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Log successful login
      await storage.logUserActivity({
        userId: user.id,
        action: 'login',
        details: { email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      // Clean up expired sessions first
      await storage.cleanupExpiredSessions();

      // Generate token
      const token = generateToken(user);

      // Create session
      await storage.createSession({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Get current user info
  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        profileImage: user.profileImage,
        phone: user.phone,
        country: user.country,
        city: user.city,
        bio: user.bio,
        expertise: user.expertise,
        languages: user.languages,
        experience: user.experience,
        certifications: user.certifications,
        socialLinks: user.socialLinks,
        preferredContactMethod: user.preferredContactMethod,
        timezone: user.timezone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        nationality: user.nationality,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt,
        verificationNotes: user.verificationNotes,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        creditsRemaining: user.creditsRemaining,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  });

  // Logout
  app.post('/api/auth/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get token from header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        await storage.invalidateSession(token);
      }

      // Log logout
      await storage.logUserActivity({
        userId: req.user!.id,
        action: 'logout',
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Request password reset with rate limiting
  app.post('/api/auth/forgot-password', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ message: 'If the email exists, a reset link will be sent' });
      }

      const resetToken = await storage.createPasswordResetToken(user.id);

      // Log password reset request
      await storage.logUserActivity({
        userId: user.id,
        action: 'password_reset_requested',
        details: { email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      // In production, send email with reset link
      // For now, just return the token for testing
      res.json({ 
        message: 'If the email exists, a reset link will be sent',
        // Remove this in production:
        resetToken: resetToken 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      const { token, newPassword } = validation.data;

      const user = await storage.verifyPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      await storage.resetUserPassword(user.id, newPassword);

      // Log password reset
      await storage.logUserActivity({
        userId: user.id,
        action: 'password_reset_completed',
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  });

  // Update user profile
  app.put('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        displayName, 
        firstName, 
        lastName, 
        phone, 
        country,
        city,
        bio,
        expertise,
        languages,
        experience,
        certifications,
        socialLinks,
        preferredContactMethod,
        timezone,
        dateOfBirth,
        gender,
        nationality,
        profileImage
      } = req.body;

      const updates: any = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (country !== undefined) updates.country = country;
      if (city !== undefined) updates.city = city;
      if (bio !== undefined) updates.bio = bio;
      if (expertise !== undefined) updates.expertise = expertise;
      if (languages !== undefined) updates.languages = languages;
      if (experience !== undefined) updates.experience = experience;
      if (certifications !== undefined) updates.certifications = certifications;
      if (socialLinks !== undefined) updates.socialLinks = socialLinks;
      if (preferredContactMethod !== undefined) updates.preferredContactMethod = preferredContactMethod;
      if (timezone !== undefined) updates.timezone = timezone;
      if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
      if (gender !== undefined) updates.gender = gender;
      if (nationality !== undefined) updates.nationality = nationality;
      if (profileImage !== undefined) updates.profileImage = profileImage;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      const updatedUser = await storage.updateUser(req.user!.id, updates);

      // Log profile update
      await storage.logUserActivity({
        userId: req.user!.id,
        action: 'profile_updated',
        details: { updatedFields: Object.keys(updates) },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          country: updatedUser.country,
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Profile update failed' });
    }
  });

  // Change password
  app.post('/api/auth/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All password fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "New passwords don't match" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      // Verify current password
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Update password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      await storage.updatePassword(user.id, hashedNewPassword);

      // Log password change
      await storage.logUserActivity({
        userId: req.user!.id,
        action: 'password_changed',
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  });

  // Request email change
  app.post('/api/auth/change-email', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { newEmail, password } = req.body;

      if (!newEmail || !password) {
        return res.status(400).json({ error: 'New email and password are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Password is incorrect' });
      }

      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(newEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'Email address is already taken' });
      }

      // Update email and mark as unverified
      await storage.updateUser(req.user!.id, { 
        email: newEmail, 
        emailVerified: false 
      });

      // Log email change
      await storage.logUserActivity({
        userId: req.user!.id,
        action: 'email_changed',
        details: { oldEmail: user.email, newEmail },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      });

      res.json({ message: 'Email changed successfully. Please verify your new email address.' });
    } catch (error) {
      console.error('Change email error:', error);
      res.status(500).json({ error: 'Email change failed' });
    }
  });
}