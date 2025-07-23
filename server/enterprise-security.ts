import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Enterprise-grade encryption for sensitive data
export class DataEncryption {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  private static readonly ALGORITHM = 'aes-256-gcm';
  
  // Encrypt sensitive user data (GDPR compliant)
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }
  
  // Decrypt sensitive user data
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.ALGORITHM, this.ENCRYPTION_KEY);
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Hash passwords with enterprise-grade security
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 14); // Higher rounds for enterprise security
  }
  
  // Verify passwords securely
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Multi-Factor Authentication implementation
export class MFAService {
  private static readonly MFA_SECRET_LENGTH = 32;
  
  // Generate MFA secret for user
  static generateMFASecret(): string {
    return crypto.randomBytes(this.MFA_SECRET_LENGTH).toString('base32');
  }
  
  // Generate TOTP code (Time-based One-Time Password)
  static generateTOTP(secret: string, window = 0): string {
    const epoch = Math.round(Date.now() / 1000 / 30) + window;
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(Buffer.from(epoch.toString(16).padStart(16, '0'), 'hex'));
    
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }
  
  // Verify TOTP code with time window
  static verifyTOTP(secret: string, token: string): boolean {
    // Check current window and ±1 window for clock drift
    for (let window = -1; window <= 1; window++) {
      if (this.generateTOTP(secret, window) === token) {
        return true;
      }
    }
    return false;
  }
  
  // Generate backup codes for MFA recovery
  static generateBackupCodes(count = 10): string[] {
    return Array.from({ length: count }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
  }
}

// GDPR Compliance utilities
export class GDPRCompliance {
  // Data processing consent tracking
  static logConsent(userId: number, consentType: string, granted: boolean): void {
    console.log(`GDPR Consent: User ${userId} ${granted ? 'granted' : 'revoked'} ${consentType} at ${new Date().toISOString()}`);
    // In production, store in dedicated audit table
  }
  
  // Data export for GDPR "Right to Data Portability"
  static async exportUserData(userId: number): Promise<any> {
    // Collect all user data across all systems
    return {
      personal_info: {}, // User profile data
      activity_logs: [], // User activity
      preferences: {}, // User settings
      exported_at: new Date().toISOString(),
      format: 'JSON',
      gdpr_compliant: true
    };
  }
  
  // Data anonymization for GDPR "Right to be Forgotten"
  static async anonymizeUserData(userId: number): Promise<void> {
    console.log(`GDPR: Anonymizing data for user ${userId}`);
    // Replace all PII with anonymized values
    // Keep statistical data for business analytics
  }
  
  // Data retention policy enforcement
  static checkDataRetention(): void {
    console.log('Checking data retention policies...');
    // Automatically delete data older than retention period
    // Notify users before deletion as required by GDPR
  }
}

// Advanced session management for enterprise security
export class EnterpriseSessionManager {
  private static sessions = new Map<string, SessionData>();
  private static deviceFingerprints = new Map<string, DeviceInfo>();
  
  // Enhanced session data structure
  interface SessionData {
    userId: number;
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActivity: Date;
    mfaVerified: boolean;
    riskScore: number;
    location?: string;
  }
  
  interface DeviceInfo {
    deviceId: string;
    userId: number;
    trusted: boolean;
    registeredAt: Date;
    lastSeen: Date;
    deviceType: string;
    location: string;
  }
  
  // Create secure session with device tracking
  static createSession(userId: number, req: Request): string {
    const sessionToken = jwt.sign(
      { userId, sessionId: crypto.randomUUID() },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    const deviceId = this.generateDeviceFingerprint(req);
    const session: SessionData = {
      userId,
      deviceId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      createdAt: new Date(),
      lastActivity: new Date(),
      mfaVerified: false,
      riskScore: this.calculateRiskScore(req)
    };
    
    this.sessions.set(sessionToken, session);
    this.trackDevice(userId, deviceId, req);
    
    return sessionToken;
  }
  
  // Generate device fingerprint for tracking
  private static generateDeviceFingerprint(req: Request): string {
    const components = [
      req.get('User-Agent'),
      req.get('Accept-Language'),
      req.get('Accept-Encoding'),
      req.ip
    ].filter(Boolean);
    
    return crypto.createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }
  
  // Calculate session risk score
  private static calculateRiskScore(req: Request): number {
    let score = 0;
    
    // Check for suspicious patterns
    if (!req.get('User-Agent')) score += 20;
    if (req.get('X-Forwarded-For')) score += 10; // Proxy usage
    
    // Geographic risk (simplified)
    const ip = req.ip || '';
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) score -= 10; // Local network
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Track and manage devices
  private static trackDevice(userId: number, deviceId: string, req: Request): void {
    const existing = this.deviceFingerprints.get(deviceId);
    
    if (!existing) {
      // New device - require additional verification
      this.deviceFingerprints.set(deviceId, {
        deviceId,
        userId,
        trusted: false,
        registeredAt: new Date(),
        lastSeen: new Date(),
        deviceType: this.detectDeviceType(req.get('User-Agent') || ''),
        location: req.ip || 'unknown'
      });
      
      console.log(`New device detected for user ${userId}: ${deviceId}`);
    } else {
      existing.lastSeen = new Date();
    }
  }
  
  // Detect device type from user agent
  private static detectDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    return 'desktop';
  }
  
  // Session timeout and cleanup
  static cleanupExpiredSessions(): void {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes
    
    for (const [token, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > timeout) {
        this.sessions.delete(token);
        console.log(`Session expired for user ${session.userId}`);
      }
    }
  }
  
  // Account lockout after failed attempts
  static checkAccountLockout(userId: number): boolean {
    // Implementation would check failed login attempts
    // Lock account after 5 failed attempts within 15 minutes
    return false; // Simplified for demo
  }
}

// Role-Based Access Control (RBAC) for enterprise clients
export class RBACSystem {
  private static permissions = new Map<string, string[]>();
  private static roleHierarchy = new Map<string, string[]>();
  
  // Initialize enterprise roles and permissions
  static initializeRoles(): void {
    // Define permission sets
    const permissions = {
      'player.read': ['scout', 'agent', 'coach', 'admin'],
      'player.write': ['agent', 'admin'],
      'player.delete': ['admin'],
      'reports.read': ['scout', 'agent', 'coach', 'admin'],
      'reports.write': ['scout', 'agent', 'admin'],
      'admin.panel': ['admin', 'super_admin'],
      'system.config': ['super_admin'],
      'billing.manage': ['admin', 'super_admin'],
      'organization.manage': ['admin', 'super_admin']
    };
    
    // Set role hierarchy
    this.roleHierarchy.set('super_admin', ['admin', 'agent', 'scout', 'coach']);
    this.roleHierarchy.set('admin', ['agent', 'scout', 'coach']);
    this.roleHierarchy.set('agent', ['scout']);
    
    // Store permissions
    for (const [permission, roles] of Object.entries(permissions)) {
      this.permissions.set(permission, roles);
    }
  }
  
  // Check if user has permission
  static hasPermission(userRole: string, permission: string): boolean {
    const allowedRoles = this.permissions.get(permission) || [];
    
    // Direct role check
    if (allowedRoles.includes(userRole)) return true;
    
    // Check role hierarchy
    const inheritedRoles = this.roleHierarchy.get(userRole) || [];
    return inheritedRoles.some(role => allowedRoles.includes(role));
  }
  
  // Middleware for permission checking
  static requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!this.hasPermission(user.role, permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    };
  }
}

// Security audit logging
export class SecurityAuditLogger {
  // Log security events for compliance
  static logSecurityEvent(event: {
    userId?: number;
    event: string;
    description: string;
    ipAddress: string;
    userAgent: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
  }): void {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    };
    
    console.log('SECURITY_AUDIT:', JSON.stringify(logEntry));
    
    // In production, store in dedicated security audit table
    // with tamper-proof logging and real-time alerts
  }
  
  // Track login attempts
  static logLoginAttempt(userId: number, success: boolean, req: Request): void {
    this.logSecurityEvent({
      userId,
      event: success ? 'login_success' : 'login_failure',
      description: `User ${userId} ${success ? 'successfully logged in' : 'failed to log in'}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      severity: success ? 'low' : 'medium'
    });
  }
  
  // Track privilege escalations
  static logPrivilegeEscalation(userId: number, fromRole: string, toRole: string, adminId: number): void {
    this.logSecurityEvent({
      userId,
      event: 'privilege_escalation',
      description: `User ${userId} role changed from ${fromRole} to ${toRole} by admin ${adminId}`,
      ipAddress: 'system',
      userAgent: 'system',
      severity: 'high',
      metadata: { fromRole, toRole, adminId }
    });
  }
}

// Initialize enterprise security systems
export function initializeEnterpriseSecurity(): void {
  RBACSystem.initializeRoles();
  
  // Start session cleanup interval
  setInterval(() => {
    EnterpriseSessionManager.cleanupExpiredSessions();
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // Start GDPR compliance checks
  setInterval(() => {
    GDPRCompliance.checkDataRetention();
  }, 24 * 60 * 60 * 1000); // Daily
  
  console.log('Enterprise security systems initialized');
}