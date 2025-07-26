import type { Express, Request, Response } from "express";
import { storage } from "./storage.js";
import { authenticateToken, requireAdmin, requireSuperAdmin, type AuthenticatedRequest } from "./auth-routes.js";
import { sendVerificationEmail, sendCustomEmail } from "./email-service.js";
import { db } from "./db.js";
import { emailNotifications, userVerificationRequests, users } from "../shared/schema.js";
import { eq, desc } from 'drizzle-orm';
import { z } from "zod";

// Validation schemas
const updateUserSchema = z.object({
  displayName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  role: z.enum(['scout', 'agent', 'admin', 'super_admin']).optional(),
  isActive: z.boolean().optional(),
});

const suspendUserSchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export function registerAdminRoutes(app: Express) {
  
  // Get all users (admin only)
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const users = await storage.getAllUsers(limit, offset);
      
      // Remove sensitive information
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        phone: user.phone,
        country: user.country,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        suspendedAt: user.suspendedAt,
        suspensionReason: user.suspensionReason,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      res.json({
        users: safeUsers,
        pagination: {
          page,
          limit,
          total: safeUsers.length,
          hasMore: safeUsers.length === limit,
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Get user by ID (admin only)
  app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user activity logs
      const activityLogs = await storage.getUserActivityLogs(userId, 20);

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        phone: user.phone,
        country: user.country,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        suspendedAt: user.suspendedAt,
        suspendedBy: user.suspendedBy,
        suspensionReason: user.suspensionReason,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        recentActivity: activityLogs,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Update user (admin only)
  app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const validation = updateUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      const updates = validation.data;

      // Check if trying to update role to admin/super_admin
      if (updates.role && (updates.role === 'admin' || updates.role === 'super_admin')) {
        if (req.user!.role !== 'super_admin') {
          return res.status(403).json({ error: 'Only super admins can assign admin roles' });
        }
      }

      const updatedUser = await storage.updateUser(userId, updates);

      // Log admin action if role was changed
      if (updates.role) {
        await storage.logAdminAction({
          adminId: req.user!.id,
          targetUserId: userId,
          action: 'update_user_role',
          details: { newRole: updates.role },
          ipAddress: req.ip,
        });
      }

      // Log general admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: userId,
        action: 'update_user',
        details: { updatedFields: Object.keys(updates) },
        ipAddress: req.ip,
      });

      res.json({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          isSuspended: updatedUser.isSuspended,
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Suspend user (admin only)
  app.post('/api/admin/users/:id/suspend', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const validation = suspendUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      const { reason } = validation.data;

      // Prevent self-suspension
      if (userId === req.user!.id) {
        return res.status(400).json({ error: 'Cannot suspend yourself' });
      }

      // Check if target user is admin/super_admin
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if ((targetUser.role === 'admin' || targetUser.role === 'super_admin') && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can suspend admin users' });
      }

      const suspendedUser = await storage.suspendUser(userId, req.user!.id, reason);

      res.json({
        message: 'User suspended successfully',
        user: {
          id: suspendedUser.id,
          email: suspendedUser.email,
          username: suspendedUser.username,
          isSuspended: suspendedUser.isSuspended,
          suspendedAt: suspendedUser.suspendedAt,
          suspensionReason: suspendedUser.suspensionReason,
        },
      });
    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({ error: 'Failed to suspend user' });
    }
  });

  // Unsuspend user (admin only)
  app.post('/api/admin/users/:id/unsuspend', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if ((targetUser.role === 'admin' || targetUser.role === 'super_admin') && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can unsuspend admin users' });
      }

      const unsuspendedUser = await storage.unsuspendUser(userId, req.user!.id);

      res.json({
        message: 'User unsuspended successfully',
        user: {
          id: unsuspendedUser.id,
          email: unsuspendedUser.email,
          username: unsuspendedUser.username,
          isSuspended: unsuspendedUser.isSuspended,
          suspendedAt: unsuspendedUser.suspendedAt,
          suspensionReason: unsuspendedUser.suspensionReason,
        },
      });
    } catch (error) {
      console.error('Unsuspend user error:', error);
      res.status(500).json({ error: 'Failed to unsuspend user' });
    }
  });

  // Reset user password (admin only)
  app.post('/api/admin/users/:id/reset-password', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      const { newPassword } = validation.data;

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if ((targetUser.role === 'admin' || targetUser.role === 'super_admin') && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can reset admin passwords' });
      }

      await storage.resetUserPassword(userId, newPassword);

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: userId,
        action: 'reset_password',
        details: {},
        ipAddress: req.ip,
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Delete user (super admin only)
  app.delete('/api/admin/users/:id', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      if (userId === req.user!.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      await storage.deleteUser(userId);

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: userId,
        action: 'delete_user',
        details: { deletedUser: { email: targetUser.email, username: targetUser.username } },
        ipAddress: req.ip,
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Get admin audit logs (admin only)
  app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const auditLogs = await storage.getAdminAuditLogs(limit);

      res.json({ auditLogs });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // Get user activity logs (admin only)
  app.get('/api/admin/users/:id/activity', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const activityLogs = await storage.getUserActivityLogs(userId, limit);

      res.json({ activityLogs });
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  });

  // Get dashboard statistics (admin only)
  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers(1000); // Get more users for stats
      const organizations = await storage.getOrganizations();
      const recentAuditLogs = await storage.getAdminAuditLogs(10);

      const stats = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.isActive && !u.isSuspended).length,
        suspendedUsers: allUsers.filter(u => u.isSuspended).length,
        adminUsers: allUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
        recentLogins: allUsers.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        unverifiedEmails: allUsers.filter(u => !u.emailVerified).length,
        pendingVerifications: allUsers.filter(u => !u.isVerified).length,
        inactiveUsers: allUsers.filter(u => !u.isActive).length,
        totalOrganizations: organizations.length,
        verifiedOrganizations: organizations.filter(o => o.isVerified).length,
        usersByRole: {
          scout: allUsers.filter(u => u.role === 'scout').length,
          agent: allUsers.filter(u => u.role === 'agent').length,
          admin: allUsers.filter(u => u.role === 'admin').length,
          super_admin: allUsers.filter(u => u.role === 'super_admin').length,
        },
        recentActivity: recentAuditLogs,
      };

      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Cleanup expired sessions (admin only)
  app.post('/api/admin/cleanup-sessions', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.cleanupExpiredSessions();

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        action: 'cleanup_sessions',
        details: {},
        ipAddress: req.ip,
      });

      res.json({ message: 'Expired sessions cleaned up successfully' });
    } catch (error) {
      console.error('Cleanup sessions error:', error);
      res.status(500).json({ error: 'Failed to cleanup sessions' });
    }
  });

  // User verification management
  app.post('/api/admin/users/:id/verify', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { verificationNotes } = req.body;

      // Update user verification status
      const [updatedUser] = await db.update(users)
        .set({ 
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user!.id,
          verificationNotes
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: userId,
        action: 'verify_user',
        details: { verificationNotes },
        ipAddress: req.ip,
      });

      // Send verification email using SendGrid
      try {
        const emailSent = await sendVerificationEmail(updatedUser.email, updatedUser.displayName || updatedUser.username);
        
        // Log email notification
        await db.insert(emailNotifications).values({
          userId: userId,
          type: 'verification_approved',
          subject: 'Your PlatinumEdge Analytics account has been verified',
          content: `Congratulations! Your account has been successfully verified. You now have access to all verified user features.`,
          status: emailSent ? 'sent' : 'failed',
          sentBy: req.user!.id
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Log email failure but don't fail the verification
        await db.insert(emailNotifications).values({
          userId: userId,
          type: 'verification_approved',
          subject: 'Your PlatinumEdge Analytics account has been verified',
          content: `Congratulations! Your account has been successfully verified. You now have access to all verified user features.`,
          status: 'failed',
          sentBy: req.user!.id
        });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error verifying user:', error);
      res.status(500).json({ error: 'Failed to verify user' });
    }
  });

  app.post('/api/admin/users/:id/unverify', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason } = req.body;

      // Update user verification status
      const [updatedUser] = await db.update(users)
        .set({ 
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
          verificationNotes: reason
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: userId,
        action: 'unverify_user',
        details: { reason },
        ipAddress: req.ip,
      });

      // Send notification email
      await db.insert(emailNotifications).values({
        userId: userId,
        type: 'verification_revoked',
        subject: 'Your PlatinumEdge Analytics account verification has been revoked',
        content: `Your account verification has been revoked. Reason: ${reason}. Please contact support for more information.`,
        status: 'pending',
        sentBy: req.user!.id
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error unverifying user:', error);
      res.status(500).json({ error: 'Failed to unverify user' });
    }
  });

  // Email management
  app.get('/api/admin/emails', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const emails = await db.select()
        .from(emailNotifications)
        .orderBy(desc(emailNotifications.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({ emails });
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  });

  app.post('/api/admin/emails/send', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, type, subject, content } = req.body;

      if (!userId || !subject || !content) {
        return res.status(400).json({ error: 'User ID, subject, and content are required' });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Send email using SendGrid
      let emailSent = false;
      try {
        emailSent = await sendCustomEmail(user.email, user.displayName || user.username, subject, content);
      } catch (emailError) {
        console.error('Failed to send custom email:', emailError);
      }

      // Log email notification
      const emailId = await db.insert(emailNotifications).values({
        userId,
        type: type || 'custom',
        subject,
        content,
        status: emailSent ? 'sent' : 'failed',
        sentBy: req.user!.id
      }).returning({ id: emailNotifications.id });

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: userId,
        action: 'send_email',
        details: { type: type || 'custom', subject, emailSent },
        ipAddress: req.ip,
      });

      res.json({ 
        success: true, 
        emailId: emailId[0].id,
        emailSent,
        message: emailSent ? 'Email sent successfully' : 'Email logged but sending failed'
      });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // Verification requests management
  app.get('/api/admin/verification-requests', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requests = await db.select()
        .from(userVerificationRequests)
        .orderBy(desc(userVerificationRequests.submittedAt));

      res.json({ requests });
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      res.status(500).json({ error: 'Failed to fetch verification requests' });
    }
  });

  app.post('/api/admin/verification-requests/:id/approve', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNotes } = req.body;

      // Update verification request
      const [updatedRequest] = await db.update(userVerificationRequests)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: req.user!.id,
          reviewNotes
        })
        .where(eq(userVerificationRequests.id, requestId))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ error: 'Verification request not found' });
      }

      // Update user verification status
      await db.update(users)
        .set({ 
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user!.id,
          verificationNotes: reviewNotes
        })
        .where(eq(users.id, updatedRequest.userId));

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: updatedRequest.userId,
        action: 'approve_verification_request',
        details: { requestId, reviewNotes },
        ipAddress: req.ip,
      });

      res.json({ success: true, request: updatedRequest });
    } catch (error) {
      console.error('Error approving verification request:', error);
      res.status(500).json({ error: 'Failed to approve verification request' });
    }
  });

  app.post('/api/admin/verification-requests/:id/reject', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reviewNotes } = req.body;

      // Update verification request
      const [updatedRequest] = await db.update(userVerificationRequests)
        .set({
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: req.user!.id,
          reviewNotes
        })
        .where(eq(userVerificationRequests.id, requestId))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ error: 'Verification request not found' });
      }

      // Log admin action
      await storage.logAdminAction({
        adminId: req.user!.id,
        targetUserId: updatedRequest.userId,
        action: 'reject_verification_request',
        details: { requestId, reviewNotes },
        ipAddress: req.ip,
      });

      res.json({ success: true, request: updatedRequest });
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      res.status(500).json({ error: 'Failed to reject verification request' });
    }
  });
}