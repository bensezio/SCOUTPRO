import type { Express, Request, Response } from "express";
import { eq, desc, and, or, sql, like, gte, lte, count } from "drizzle-orm";
import { db } from "./db";
import { authenticateToken } from "./auth-routes";
import { 
  users, 
  players, 
  platformSettings, 
  platformAnalytics, 
  reportedContent, 
  superAdminLogs, 
  maintenanceMode,
  type InsertSuperAdminLog,
  type InsertPlatformSettings,
  type InsertPlatformAnalytics,
  type InsertReportedContent,
  type InsertMaintenanceMode
} from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
    username: string;
  };
}

// Middleware to ensure super admin access
function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: "Super admin access required",
      error: "Insufficient permissions" 
    });
  }
  next();
}

// Helper function to log super admin actions
async function logSuperAdminAction(
  adminId: number,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: any,
  reason: string,
  req: Request,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  const logEntry: InsertSuperAdminLog = {
    adminId,
    action,
    targetType,
    targetId,
    details,
    reason,
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    severity
  };

  await db.insert(superAdminLogs).values(logEntry);
}

export function registerSuperAdminRoutes(app: Express) {
  // Get super admin dashboard overview
  app.get('/api/super-admin/overview', authenticateToken, authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [
        totalUsers,
        activeUsers,
        totalPlayers,
        pendingReports,
        maintenanceStatus,
        recentActivity
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
        db.select({ count: count() }).from(players),
        db.select({ count: count() }).from(reportedContent).where(eq(reportedContent.status, 'pending')),
        db.select().from(maintenanceMode).orderBy(desc(maintenanceMode.createdAt)).limit(1),
        db.select().from(superAdminLogs).orderBy(desc(superAdminLogs.createdAt)).limit(10)
      ]);

      res.json({
        totalUsers: totalUsers[0].count,
        activeUsers: activeUsers[0].count,
        totalPlayers: totalPlayers[0].count,
        pendingReports: pendingReports[0].count,
        maintenanceMode: maintenanceStatus[0] || null,
        recentActivity
      });
    } catch (error) {
      console.error('Super admin overview error:', error);
      res.status(500).json({ message: 'Failed to fetch overview data' });
    }
  });

  // User Management Routes
  app.get('/api/super-admin/users', authenticateToken, authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, search, role, status } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = db.select().from(users);
      
      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(users.username, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.displayName, `%${search}%`)
          )
        );
      }
      if (role) {
        conditions.push(eq(users.role, role as string));
      }
      if (status === 'active') {
        conditions.push(eq(users.isActive, true));
      } else if (status === 'suspended') {
        conditions.push(eq(users.isSuspended, true));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query
        .orderBy(desc(users.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(users);

      res.json({
        users: results,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Super admin users list error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Override user subscription
  app.post('/api/super-admin/users/:id/subscription-override', authenticateToken, authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { subscriptionTier, subscriptionStatus, reason, endDate } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required for subscription override' });
      }

      const user = await db.select().from(users).where(eq(users.id, parseInt(id)));
      if (!user.length) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updateData: any = {
        subscriptionOverride: true,
        subscriptionOverrideReason: reason,
        subscriptionOverrideBy: req.user!.id,
        subscriptionOverrideAt: new Date(),
        updatedAt: new Date()
      };

      if (subscriptionTier) updateData.subscriptionTier = subscriptionTier;
      if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
      if (endDate) updateData.subscriptionEndsAt = new Date(endDate);

      await db.update(users).set(updateData).where(eq(users.id, parseInt(id)));

      await logSuperAdminAction(
        req.user!.id,
        'subscription_override',
        'user',
        id,
        { subscriptionTier, subscriptionStatus, endDate, originalData: user[0] },
        reason,
        req,
        'high'
      );

      res.json({ message: 'Subscription override applied successfully' });
    } catch (error) {
      console.error('Subscription override error:', error);
      res.status(500).json({ message: 'Failed to apply subscription override' });
    }
  });

  // Delete user (soft delete)
  app.delete('/api/super-admin/users/:id', authenticateToken, authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, hardDelete } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required for user deletion' });
      }

      const user = await db.select().from(users).where(eq(users.id, parseInt(id)));
      if (!user.length) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (hardDelete) {
        // Hard delete - remove from database
        await db.delete(users).where(eq(users.id, parseInt(id)));
      } else {
        // Soft delete - deactivate account
        await db.update(users).set({
          isActive: false,
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedBy: req.user!.id,
          suspensionReason: `DELETED: ${reason}`,
          updatedAt: new Date()
        }).where(eq(users.id, parseInt(id)));
      }

      await logSuperAdminAction(
        req.user!.id,
        hardDelete ? 'user_hard_deletion' : 'user_soft_deletion',
        'user',
        id,
        { userData: user[0], hardDelete },
        reason,
        req,
        'critical'
      );

      res.json({ message: `User ${hardDelete ? 'permanently deleted' : 'deactivated'} successfully` });
    } catch (error) {
      console.error('User deletion error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Player Management Routes
  app.get('/api/super-admin/players', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, search, position, status } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = db.select().from(players);
      
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(players.name, `%${search}%`),
            like(players.fullName, `%${search}%`)
          )
        );
      }
      if (position) {
        conditions.push(eq(players.position, position as string));
      }
      if (status === 'active') {
        conditions.push(eq(players.isActive, true));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query
        .orderBy(desc(players.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(players);

      res.json({
        players: results,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Super admin players list error:', error);
      res.status(500).json({ message: 'Failed to fetch players' });
    }
  });

  // Delete player
  app.delete('/api/super-admin/players/:id', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, hardDelete } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required for player deletion' });
      }

      const player = await db.select().from(players).where(eq(players.id, parseInt(id)));
      if (!player.length) {
        return res.status(404).json({ message: 'Player not found' });
      }

      if (hardDelete) {
        await db.delete(players).where(eq(players.id, parseInt(id)));
      } else {
        await db.update(players).set({
          isActive: false,
          updatedAt: new Date()
        }).where(eq(players.id, parseInt(id)));
      }

      await logSuperAdminAction(
        req.user!.id,
        hardDelete ? 'player_hard_deletion' : 'player_soft_deletion',
        'player',
        id,
        { playerData: player[0], hardDelete },
        reason,
        req,
        'high'
      );

      res.json({ message: `Player ${hardDelete ? 'permanently deleted' : 'deactivated'} successfully` });
    } catch (error) {
      console.error('Player deletion error:', error);
      res.status(500).json({ message: 'Failed to delete player' });
    }
  });

  // Platform Settings Routes
  app.get('/api/super-admin/settings', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category } = req.query;
      
      let query = db.select().from(platformSettings);
      if (category) {
        query = query.where(eq(platformSettings.category, category as string));
      }

      const settings = await query.orderBy(platformSettings.category, platformSettings.key);
      res.json(settings);
    } catch (error) {
      console.error('Platform settings error:', error);
      res.status(500).json({ message: 'Failed to fetch platform settings' });
    }
  });

  app.post('/api/super-admin/settings', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { key, value, description, category, dataType, reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required for setting changes' });
      }

      const settingData: InsertPlatformSettings = {
        key,
        value,
        description,
        category,
        dataType: dataType || 'string',
        lastModifiedBy: req.user!.id
      };

      await db.insert(platformSettings).values(settingData);

      await logSuperAdminAction(
        req.user!.id,
        'platform_setting_create',
        'setting',
        key,
        settingData,
        reason,
        req,
        'medium'
      );

      res.json({ message: 'Platform setting created successfully' });
    } catch (error) {
      console.error('Platform setting creation error:', error);
      res.status(500).json({ message: 'Failed to create platform setting' });
    }
  });

  app.put('/api/super-admin/settings/:id', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { value, description, reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required for setting changes' });
      }

      const existingSetting = await db.select().from(platformSettings).where(eq(platformSettings.id, parseInt(id)));
      if (!existingSetting.length) {
        return res.status(404).json({ message: 'Setting not found' });
      }

      await db.update(platformSettings).set({
        value,
        description,
        lastModifiedBy: req.user!.id,
        updatedAt: new Date()
      }).where(eq(platformSettings.id, parseInt(id)));

      await logSuperAdminAction(
        req.user!.id,
        'platform_setting_update',
        'setting',
        id,
        { oldValue: existingSetting[0].value, newValue: value },
        reason,
        req,
        'medium'
      );

      res.json({ message: 'Platform setting updated successfully' });
    } catch (error) {
      console.error('Platform setting update error:', error);
      res.status(500).json({ message: 'Failed to update platform setting' });
    }
  });

  // Reported Content Management
  app.get('/api/super-admin/reported-content', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, priority } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = db.select().from(reportedContent);
      
      const conditions = [];
      if (status) {
        conditions.push(eq(reportedContent.status, status as string));
      }
      if (priority) {
        conditions.push(eq(reportedContent.priority, priority as string));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query
        .orderBy(desc(reportedContent.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(reportedContent);

      res.json({
        reports: results,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Reported content error:', error);
      res.status(500).json({ message: 'Failed to fetch reported content' });
    }
  });

  app.post('/api/super-admin/reported-content/:id/review', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, actionTaken, reviewNotes } = req.body;

      await db.update(reportedContent).set({
        status,
        actionTaken,
        reviewNotes,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(reportedContent.id, parseInt(id)));

      await logSuperAdminAction(
        req.user!.id,
        'reported_content_review',
        'report',
        id,
        { status, actionTaken, reviewNotes },
        `Content review: ${status}`,
        req,
        'medium'
      );

      res.json({ message: 'Report reviewed successfully' });
    } catch (error) {
      console.error('Report review error:', error);
      res.status(500).json({ message: 'Failed to review report' });
    }
  });

  // Usage Analytics
  app.get('/api/super-admin/analytics', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate, metric } = req.query;
      
      let query = db.select().from(platformAnalytics);
      
      const conditions = [];
      if (startDate) {
        conditions.push(gte(platformAnalytics.date, startDate as string));
      }
      if (endDate) {
        conditions.push(lte(platformAnalytics.date, endDate as string));
      }
      if (metric) {
        conditions.push(eq(platformAnalytics.metric, metric as string));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const analytics = await query.orderBy(desc(platformAnalytics.date));
      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Maintenance Mode
  app.get('/api/super-admin/maintenance', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const maintenance = await db.select().from(maintenanceMode)
        .orderBy(desc(maintenanceMode.createdAt))
        .limit(1);
      
      res.json(maintenance[0] || null);
    } catch (error) {
      console.error('Maintenance mode error:', error);
      res.status(500).json({ message: 'Failed to fetch maintenance mode status' });
    }
  });

  app.post('/api/super-admin/maintenance', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isEnabled, message, allowedRoles, endTime, reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required for maintenance mode changes' });
      }

      // Disable any existing maintenance mode
      await db.update(maintenanceMode).set({
        isEnabled: false,
        disabledBy: req.user!.id,
        updatedAt: new Date()
      });

      if (isEnabled) {
        const maintenanceData: InsertMaintenanceMode = {
          isEnabled: true,
          startTime: new Date(),
          endTime: endTime ? new Date(endTime) : null,
          message,
          allowedRoles: allowedRoles ? JSON.stringify(allowedRoles) : null,
          enabledBy: req.user!.id
        };

        await db.insert(maintenanceMode).values(maintenanceData);
      }

      await logSuperAdminAction(
        req.user!.id,
        isEnabled ? 'maintenance_mode_enabled' : 'maintenance_mode_disabled',
        'system',
        null,
        { isEnabled, message, allowedRoles, endTime },
        reason,
        req,
        'critical'
      );

      res.json({ message: `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      console.error('Maintenance mode error:', error);
      res.status(500).json({ message: 'Failed to update maintenance mode' });
    }
  });

  // Audit Logs
  app.get('/api/super-admin/audit-logs', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, action, severity, adminId } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = db.select().from(superAdminLogs);
      
      const conditions = [];
      if (action) {
        conditions.push(eq(superAdminLogs.action, action as string));
      }
      if (severity) {
        conditions.push(eq(superAdminLogs.severity, severity as string));
      }
      if (adminId) {
        conditions.push(eq(superAdminLogs.adminId, parseInt(adminId as string)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const logs = await query
        .orderBy(desc(superAdminLogs.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(superAdminLogs);

      res.json({
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Audit logs error:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });
}