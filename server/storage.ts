import { 
  User, InsertUser, 
  Organization, InsertOrganization,
  Player, InsertPlayer, PlayerWithStats,
  PlayerStats, InsertPlayerStats,
  PlayerVideo, InsertPlayerVideo,
  MatchPerformance, InsertMatchPerformance,
  ScoutingReport, InsertScoutingReport,
  Session, InsertSession,
  UserActivityLog, InsertUserActivityLog,
  AdminAuditLog, InsertAdminAuditLog,
  PlayerSearchFilters,
  AFRICAN_COUNTRIES,
  // Video Analytics Types
  MatchAnalysis, InsertMatchAnalysis,
  MatchTeamSheet, InsertMatchTeamSheet,
  AnalysisVideo, InsertAnalysisVideo,
  EventType, InsertEventType,
  VideoEventTag, InsertVideoEventTag,
  EventSequence, InsertEventSequence,
  VideoPlayerAnalysis, InsertVideoPlayerAnalysis,
  VideoAnalysisReport, InsertVideoAnalysisReport
} from "../shared/schema.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db.js";
import { eq, and, or, like, ilike, sql, desc, asc, isNull, lt, gt, gte, inArray } from "drizzle-orm";
import { 
  users, organizations, players, player_stats, player_videos, 
  match_performances, scouting_reports, sessions, userActivityLogs, adminAuditLog,
  // Video Analytics Tables
  matchAnalysis, matchTeamSheets, analysisVideos, eventTypes, 
  videoEventTags, eventSequences, videoPlayerAnalysis, videoAnalysisReports
} from "../shared/schema.js";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  // Admin user management
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  suspendUser(userId: number, adminId: number, reason: string): Promise<User>;
  unsuspendUser(userId: number, adminId: number): Promise<User>;
  resetUserPassword(userId: number, newPassword: string): Promise<User>;
  updateUserRole(userId: number, role: string, adminId: number): Promise<User>;
  deleteUser(userId: number): Promise<void>;
  
  // Authentication
  validateUserCredentials(email: string, password: string): Promise<User | null>;
  createPasswordResetToken(userId: number): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<User | null>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  incrementLoginAttempts(userId: number): Promise<void>;
  resetLoginAttempts(userId: number): Promise<void>;
  lockUser(userId: number, lockUntil: Date): Promise<void>;
  
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  invalidateSession(token: string): Promise<void>;
  getUserSessions(userId: number): Promise<Session[]>;
  cleanupExpiredSessions(): Promise<void>;
  
  // Activity logging
  logUserActivity(log: InsertUserActivityLog): Promise<UserActivityLog>;
  getUserActivityLogs(userId: number, limit?: number): Promise<UserActivityLog[]>;
  logAdminAction(log: InsertAdminAuditLog): Promise<AdminAuditLog>;
  getAdminAuditLogs(limit?: number): Promise<AdminAuditLog[]>;
  
  // Organization operations
  getOrganizations(type?: string, country?: string, search?: string): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization>;
  deleteOrganization(id: number): Promise<void>;
  
  // Player operations
  getPlayers(filters?: PlayerSearchFilters, limit?: number, offset?: number): Promise<PlayerWithStats[]>;
  getPlayer(id: number): Promise<PlayerWithStats | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player>;
  deletePlayer(id: number): Promise<void>;
  searchPlayers(query: string): Promise<PlayerWithStats[]>;
  searchPlayersWithFilters(query: string, filters: PlayerSearchFilters): Promise<PlayerWithStats[]>;
  
  // Player stats operations
  getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(id: number, updates: Partial<PlayerStats>): Promise<PlayerStats>;
  
  // Video operations
  getPlayerVideos(playerId: number): Promise<PlayerVideo[]>;
  createPlayerVideo(video: InsertPlayerVideo): Promise<PlayerVideo>;
  updatePlayerVideo(id: number, updates: Partial<PlayerVideo>): Promise<PlayerVideo>;
  deletePlayerVideo(id: number): Promise<void>;
  
  // Match performance operations
  getMatchPerformances(playerId: number, limit?: number): Promise<MatchPerformance[]>;
  createMatchPerformance(performance: InsertMatchPerformance): Promise<MatchPerformance>;
  updateMatchPerformance(id: number, updates: Partial<MatchPerformance>): Promise<MatchPerformance>;
  
  // Scouting report operations
  getScoutingReports(playerId?: number, scoutId?: number): Promise<ScoutingReport[]>;
  createScoutingReport(report: InsertScoutingReport): Promise<ScoutingReport>;
  updateScoutingReport(id: number, updates: Partial<ScoutingReport>): Promise<ScoutingReport>;
  deleteScoutingReport(id: number): Promise<void>;

  // Video Analytics Operations
  // Match Analysis
  getMatchAnalysesByUser(userId: number): Promise<MatchAnalysis[]>;
  getMatchAnalysisById(id: number): Promise<MatchAnalysis | undefined>;
  createMatchAnalysis(data: InsertMatchAnalysis): Promise<MatchAnalysis>;
  updateMatchAnalysis(id: number, updates: Partial<MatchAnalysis>): Promise<MatchAnalysis>;
  deleteMatchAnalysis(id: number): Promise<void>;

  // Team Sheets
  createMatchTeamSheets(sheets: InsertMatchTeamSheet[]): Promise<MatchTeamSheet[]>;
  getMatchTeamSheets(matchId: number): Promise<MatchTeamSheet[]>;
  updateMatchTeamSheet(id: number, updates: Partial<MatchTeamSheet>): Promise<MatchTeamSheet>;
  deleteMatchTeamSheet(id: number): Promise<void>;

  // Video Management
  createAnalysisVideo(data: InsertAnalysisVideo): Promise<AnalysisVideo>;
  getAnalysisVideoById(id: number): Promise<AnalysisVideo | undefined>;
  getVideosByMatch(matchId: number): Promise<AnalysisVideo[]>;
  updateVideoProcessingStatus(id: number, status: string, progress: number): Promise<AnalysisVideo>;
  storeVideoAnalysisResults(videoId: number, analysisResults: any): Promise<void>;
  deleteAnalysisVideo(id: number): Promise<void>;

  // Event Tagging
  createVideoEventTag(data: InsertVideoEventTag): Promise<VideoEventTag>;
  getVideoEventTags(videoId: number, filters?: any): Promise<VideoEventTag[]>;
  updateVideoEventTag(id: number, updates: Partial<VideoEventTag>): Promise<VideoEventTag>;
  deleteVideoEventTag(id: number): Promise<void>;

  // Spotlight Clips
  getSpotlightClips(videoId: number, filters: any): Promise<any[]>;
  getSpotlightStats(videoId: number): Promise<any>;
  getVideoSpotlightPlayers(videoId: number): Promise<any[]>;

  // Event Sequences
  createEventSequence(data: InsertEventSequence): Promise<EventSequence>;
  getEventSequences(videoId: number): Promise<EventSequence[]>;
  updateEventSequence(id: number, updates: Partial<EventSequence>): Promise<EventSequence>;
  deleteEventSequence(id: number): Promise<void>;

  // Player Analysis
  generateVideoPlayerAnalysis(videoId: number): Promise<VideoPlayerAnalysis[]>;
  getVideoPlayerAnalysis(videoId: number, playerId?: number): Promise<VideoPlayerAnalysis[]>;
  updateVideoPlayerAnalysis(id: number, updates: Partial<VideoPlayerAnalysis>): Promise<VideoPlayerAnalysis>;

  // Reports
  createVideoAnalysisReport(data: InsertVideoAnalysisReport): Promise<VideoAnalysisReport>;
  getVideoAnalysisReports(matchId: number): Promise<VideoAnalysisReport[]>;
  updateVideoAnalysisReport(id: number, updates: Partial<VideoAnalysisReport>): Promise<VideoAnalysisReport>;
  deleteVideoAnalysisReport(id: number): Promise<void>;

  // Statistics and Export
  getVideoAnalyticsStats(userId: number): Promise<any>;
  exportMatchData(matchId: number, format: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  private isInitialized = false;

  constructor() {
    // Initialize demo data when the storage is created
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    try {
      if (this.isInitialized) return;
      
      // Check if organizations already exist
      const existingOrgs = await db.select().from(organizations).limit(1);
      if (existingOrgs.length > 0) {
        this.isInitialized = true;
        return;
      }

      console.log('Initializing demo data...');

      // Create demo organizations
      const demoOrgs = [
        { name: "Asante Kotoko", type: "club", country: "Ghana", city: "Kumasi" },
        { name: "Al Ahly", type: "club", country: "Egypt", city: "Cairo" },
        { name: "Mamelodi Sundowns", type: "club", country: "South Africa", city: "Pretoria" },
        { name: "TP Mazembe", type: "club", country: "DR Congo", city: "Lubumbashi" },
        { name: "Raja Casablanca", type: "club", country: "Morocco", city: "Casablanca" },
      ];

      for (const org of demoOrgs) {
        await db.insert(organizations).values({
          name: org.name,
          type: org.type,
          country: org.country,
          city: org.city,
          isVerified: true,
        });
      }

      // Create demo users
      const demoUsers = [
        { email: "admin@scoutpro.com", username: "admin", password: "admin123", displayName: "Admin User", role: "admin", subscriptionTier: "platinum" },
        { email: "scout@demo.com", username: "scout", password: "password123", displayName: "John Scout", role: "scout", subscriptionTier: "freemium" },
        { email: "agent@demo.com", username: "agent", password: "password123", displayName: "Mary Agent", role: "agent", subscriptionTier: "freemium" },
      ];

      for (const user of demoUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.insert(users).values({
          email: user.email,
          username: user.username,
          password: hashedPassword,
          displayName: user.displayName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.role === "admin" ? "active" : "inactive",
          organizationId: user.role === "scout" ? 1 : null,
          isActive: true,
          emailVerified: true,
        });
      }

      // Create demo players with full position names
      const demoPlayers = [
        {
          firstName: "Mohammed", lastName: "Salah", dateOfBirth: "1992-06-15", nationality: "Egypt",
          position: "Right Winger", currentClubId: 2, height: 175, weight: 71, preferredFoot: "left",
          marketValue: "€25,000,000", bio: "Prolific right winger with exceptional pace and finishing ability."
        },
        {
          firstName: "Sadio", lastName: "Mané", dateOfBirth: "1992-04-10", nationality: "Senegal",
          position: "Left Winger", currentClubId: 1, height: 175, weight: 69, preferredFoot: "right",
          marketValue: "€20,000,000", bio: "Versatile forward known for his speed and clinical finishing."
        },
        {
          firstName: "Thomas", lastName: "Partey", dateOfBirth: "1993-06-13", nationality: "Ghana",
          position: "Defensive Midfielder", currentClubId: 1, height: 185, weight: 77, preferredFoot: "right",
          marketValue: "€15,000,000", bio: "Defensive midfielder with excellent passing range and work rate."
        },
        {
          firstName: "Victor", lastName: "Osimhen", dateOfBirth: "1998-12-29", nationality: "Nigeria",
          position: "Striker", currentClubId: 2, height: 185, weight: 76, preferredFoot: "right",
          marketValue: "€120,000,000", bio: "Clinical striker with excellent finishing and aerial ability."
        },
        {
          firstName: "Yassine", lastName: "Bounou", dateOfBirth: "1991-04-05", nationality: "Morocco",
          position: "Goalkeeper", currentClubId: 1, height: 192, weight: 80, preferredFoot: "right",
          marketValue: "€30,000,000", bio: "World-class goalkeeper with exceptional shot-stopping ability."
        },
        {
          firstName: "Kalidou", lastName: "Koulibaly", dateOfBirth: "1991-06-20", nationality: "Senegal",
          position: "Centre-Back", currentClubId: 2, height: 187, weight: 89, preferredFoot: "right",
          marketValue: "€40,000,000", bio: "Commanding centre-back with leadership qualities and aerial dominance."
        }
      ];

      for (const player of demoPlayers) {
        await db.insert(players).values({
          firstName: player.firstName,
          lastName: player.lastName,
          dateOfBirth: player.dateOfBirth,
          nationality: player.nationality,
          position: player.position,
          currentClubId: player.currentClubId,
          height: player.height,
          weight: player.weight,
          preferredFoot: player.preferredFoot,
          marketValue: player.marketValue,
          bio: player.bio,
          isActive: true,
        });
      }

      this.isInitialized = true;
      console.log('Demo data initialized successfully');
    } catch (error) {
      console.error('Error initializing demo data:', error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const result = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Admin user management
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db.select().from(users).limit(limit).offset(offset);
  }

  async suspendUser(userId: number, adminId: number, reason: string): Promise<User> {
    const result = await db.update(users).set({
      isSuspended: true,
      suspendedAt: new Date(),
      suspendedBy: adminId,
      suspensionReason: reason,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async unsuspendUser(userId: number, adminId: number): Promise<User> {
    const result = await db.update(users).set({
      isSuspended: false,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.update(users).set({
      password: hashedPassword,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async updateUserRole(userId: number, role: string, adminId: number): Promise<User> {
    const result = await db.update(users).set({
      role,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async deleteUser(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Authentication
  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async createPasswordResetToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await db.update(users).set({
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<User | null> {
    const result = await db.select().from(users).where(
      and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpires, new Date())
      )
    ).limit(1);

    return result[0] || null;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }

  async incrementLoginAttempts(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const attempts = (user.loginAttempts || 0) + 1;
    const updates: any = { loginAttempts: attempts };

    // Lock account after 5 failed attempts for 30 minutes
    if (attempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    await this.updateUser(userId, updates);
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    await this.updateUser(userId, { 
      loginAttempts: 0, 
      lockedUntil: null 
    });
  }

  async lockUser(userId: number, lockUntil: Date): Promise<void> {
    await this.updateUser(userId, { lockedUntil: lockUntil });
  }

  // Session management
  async createSession(sessionData: InsertSession): Promise<Session> {
    const sessionId = uuidv4();
    const token = crypto.randomBytes(32).toString('hex');
    
    const result = await db.insert(sessions).values({
      id: sessionId,
      token,
      ...sessionData,
    }).returning();

    return result[0];
  }

  async getSession(token: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(
      and(
        eq(sessions.token, token),
        eq(sessions.isActive, true),
        gt(sessions.expiresAt, new Date())
      )
    ).limit(1);

    return result[0];
  }

  async invalidateSession(token: string): Promise<void> {
    await db.update(sessions).set({ isActive: false }).where(eq(sessions.token, token));
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return await db.select().from(sessions).where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.isActive, true)
      )
    );
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }

  // Activity logging
  async logUserActivity(log: InsertUserActivityLog): Promise<UserActivityLog> {
    const result = await db.insert(userActivityLogs).values(log).returning();
    return result[0];
  }

  async getUserActivityLogs(userId: number, limit = 50): Promise<UserActivityLog[]> {
    return await db.select().from(userActivityLogs)
      .where(eq(userActivityLogs.userId, userId))
      .orderBy(desc(userActivityLogs.timestamp))
      .limit(limit);
  }

  async logAdminAction(log: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const logEntry = {
      ...log,
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
      timestamp: new Date().toISOString()
    };
    const result = await db.insert(adminAuditLog).values(logEntry).returning();
    return result[0];
  }

  async getAdminAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    try {
      // Get the basic audit logs first - use simple select without joins
      const logs = await db.select({
        id: adminAuditLog.id,
        adminId: adminAuditLog.adminId,
        targetUserId: adminAuditLog.targetUserId,
        action: adminAuditLog.action,
        details: adminAuditLog.details,
        ipAddress: adminAuditLog.ipAddress,
        timestamp: adminAuditLog.timestamp
      })
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.timestamp))
      .limit(limit);

      // Enrich with admin user info
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        let adminUser = null;
        let targetUser = null;

        // Get admin user info
        if (log.adminId) {
          const adminResults = await db.select({
            id: users.id,
            username: users.username,
            email: users.email
          })
          .from(users)
          .where(eq(users.id, log.adminId))
          .limit(1);
          
          adminUser = adminResults[0] || null;
        }

        // Get target user info if applicable
        if (log.targetUserId) {
          const targetResults = await db.select({
            id: users.id,
            username: users.username,
            email: users.email
          })
          .from(users)
          .where(eq(users.id, log.targetUserId))
          .limit(1);
          
          targetUser = targetResults[0] || null;
        }

        return {
          ...log,
          adminUser,
          targetUser
        };
      }));

      return enrichedLogs;
    } catch (error) {
      console.error('Error in getAdminAuditLogs:', error);
      throw error;
    }
  }

  // Organization operations
  async getOrganizations(type?: string, country?: string, search?: string): Promise<Organization[]> {
    let query = db.select().from(organizations);
    let whereConditions = [];
    
    if (type) {
      whereConditions.push(eq(organizations.type, type));
    }
    
    if (country) {
      whereConditions.push(eq(organizations.country, country));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(organizations.name, `%${search}%`),
          like(organizations.city, `%${search}%`)
        )
      );
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    return await query.orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(org).returning();
    return result[0];
  }

  async updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization> {
    const result = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
    return result[0];
  }

  async deleteOrganization(id: number): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  // Player operations
  async getPlayers(filters?: PlayerSearchFilters, limit = 50, offset = 0): Promise<PlayerWithStats[]> {
    try {
      // If there's a searchQuery, delegate to the enhanced search method
      if (filters?.searchQuery) {
        return await this.searchPlayersWithFilters(filters.searchQuery, filters);
      }
      
      let whereConditions = [];
      
      if (filters?.position && filters.position !== 'all') {
        whereConditions.push(eq(players.position, filters.position));
      }
      
      if (filters?.nationality && filters.nationality !== 'all') {
        whereConditions.push(eq(players.nationality, filters.nationality));
      }
      
      if (filters?.ageMin || filters?.ageMax) {
        const currentYear = new Date().getFullYear();
        
        if (filters.ageMin) {
          const maxBirthYear = currentYear - filters.ageMin;
          whereConditions.push(sql`EXTRACT(YEAR FROM ${players.dateOfBirth}) <= ${maxBirthYear}`);
        }
        
        if (filters.ageMax) {
          const minBirthYear = currentYear - filters.ageMax;
          whereConditions.push(sql`EXTRACT(YEAR FROM ${players.dateOfBirth}) >= ${minBirthYear}`);
        }
      }
      
      if (filters?.isActive !== undefined) {
        whereConditions.push(eq(players.isActive, filters.isActive));
      }
      
      if (filters?.clubId) {
        whereConditions.push(eq(players.currentClubId, filters.clubId));
      }
      
      let query = db.select().from(players);
      
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      const result = await query
        .orderBy(players.lastName, players.firstName)
        .limit(limit)
        .offset(offset);
      
      // Transform to PlayerWithStats format
      return result.map(player => ({
        ...player,
        stats: undefined,
        currentClub: undefined,
        videos: [],
        latestReport: undefined
      } as PlayerWithStats));
      
    } catch (error) {
      console.error("Error in getPlayers:", error);
      return [];
    }
  }

  async getPlayer(id: number): Promise<PlayerWithStats | undefined> {
    const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    const player = result[0];
    
    // Get current season stats
    const statsResult = await db.select().from(player_stats)
      .where(eq(player_stats.playerId, id))
      .orderBy(desc(player_stats.createdAt))
      .limit(1);
    
    // Get videos
    const videosResult = await db.select().from(player_videos)
      .where(eq(player_videos.playerId, id));
    
    // Get latest scouting report
    const reportResult = await db.select().from(scouting_reports)
      .where(eq(scouting_reports.playerId, id))
      .orderBy(desc(scouting_reports.createdAt))
      .limit(1);
    
    return {
      ...player,
      stats: statsResult[0] || undefined,
      currentClub: undefined, // Will need to fetch organization separately if needed
      videos: videosResult,
      latestReport: reportResult[0] || undefined
    } as PlayerWithStats;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const result = await db.insert(players).values(player).returning();
    return result[0];
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player> {
    const result = await db.update(players).set({ ...updates, updatedAt: new Date() }).where(eq(players.id, id)).returning();
    return result[0];
  }

  async deletePlayer(id: number): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async searchPlayers(query: string): Promise<PlayerWithStats[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const result = await db.select().from(players).where(
        or(
          sql`LOWER(${players.firstName}) LIKE ${searchTerm}`,
          sql`LOWER(${players.lastName}) LIKE ${searchTerm}`,
          sql`LOWER(${players.nationality}) LIKE ${searchTerm}`,
          sql`LOWER(${players.position}) LIKE ${searchTerm}`
        )
      );
      
      return result.map(player => ({
        ...player,
        stats: undefined,
        currentClub: undefined,
        videos: [],
        latestReport: undefined
      } as PlayerWithStats));
      
    } catch (error) {
      console.error("Error in searchPlayers:", error);
      return [];
    }
  }

  async searchPlayersWithFilters(query: string = '', filters: PlayerSearchFilters = {}): Promise<{players: PlayerWithStats[], total: number}> {
    try {
      // Get all players from database
      const allPlayers = await db.select().from(players);
      let filteredPlayers = allPlayers;
      
      // Apply search query first (if provided)
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        
        filteredPlayers = allPlayers.filter(player => {
          const firstName = (player.firstName || '').toLowerCase();
          const lastName = (player.lastName || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`;
          const nationality = (player.nationality || '').toLowerCase();
          const position = (player.position || '').toLowerCase();
          
          const matches = firstName.includes(searchTerm) ||
                         lastName.includes(searchTerm) ||
                         fullName.includes(searchTerm) ||
                         nationality.includes(searchTerm) ||
                         position.includes(searchTerm);
          
          return matches;
        });
      }
      
      // Apply additional filters
      if (filters.position && filters.position !== 'all') {
        filteredPlayers = filteredPlayers.filter(player => player.position === filters.position);
      }
      
      if (filters.nationality && filters.nationality !== 'all') {
        filteredPlayers = filteredPlayers.filter(player => player.nationality === filters.nationality);
      }
      
      if (filters.isActive !== undefined) {
        filteredPlayers = filteredPlayers.filter(player => player.isActive === filters.isActive);
      }
      
      // Apply age filters
      if (filters.ageMin || filters.ageMax) {
        const currentYear = new Date().getFullYear();
        
        filteredPlayers = filteredPlayers.filter(player => {
          if (!player.dateOfBirth) return false;
          
          const birthYear = new Date(player.dateOfBirth).getFullYear();
          const age = currentYear - birthYear;
          
          if (filters.ageMin && age < filters.ageMin) return false;
          if (filters.ageMax && age > filters.ageMax) return false;
          
          return true;
        });
      }
      
      // Get total count before pagination
      const totalCount = filteredPlayers.length;
      
      // Apply pagination
      const start = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedPlayers = filteredPlayers.slice(start, start + limit);
      
      // Transform to PlayerWithStats format
      const resultPlayers = paginatedPlayers.map(player => ({
        ...player,
        stats: undefined,
        currentClub: undefined,
        videos: [],
        latestReport: undefined
      } as PlayerWithStats));
      return {
        players: resultPlayers,
        total: totalCount
      };
      
    } catch (searchError) {
      console.error("Error in searchPlayersWithFilters:", searchError);
      throw searchError;
    }
  }

  // Player stats operations
  async getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]> {
    const query = db.select().from(player_stats).where(eq(player_stats.playerId, playerId));
    return await query.orderBy(desc(player_stats.createdAt));
  }

  async createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats> {
    const result = await db.insert(player_stats).values(stats).returning();
    return result[0];
  }

  async updatePlayerStats(id: number, updates: Partial<PlayerStats>): Promise<PlayerStats> {
    const result = await db.update(player_stats).set(updates).where(eq(player_stats.id, id)).returning();
    return result[0];
  }

  // Player video operations
  async getPlayerVideos(playerId: number): Promise<PlayerVideo[]> {
    return await db.select().from(player_videos).where(eq(player_videos.playerId, playerId));
  }

  async createPlayerVideo(video: InsertPlayerVideo): Promise<PlayerVideo> {
    const result = await db.insert(player_videos).values(video).returning();
    return result[0];
  }

  async updatePlayerVideo(id: number, updates: Partial<PlayerVideo>): Promise<PlayerVideo> {
    const result = await db.update(player_videos).set(updates).where(eq(player_videos.id, id)).returning();
    return result[0];
  }

  async deletePlayerVideo(id: number): Promise<void> {
    await db.delete(player_videos).where(eq(player_videos.id, id));
  }



  // Match performance operations
  async getMatchPerformances(playerId: number, limit = 10): Promise<MatchPerformance[]> {
    return await db.select().from(match_performances)
      .where(eq(match_performances.playerId, playerId))
      .orderBy(desc(match_performances.createdAt))
      .limit(limit);
  }

  async createMatchPerformance(performance: InsertMatchPerformance): Promise<MatchPerformance> {
    const result = await db.insert(match_performances).values(performance).returning();
    return result[0];
  }

  async updateMatchPerformance(id: number, updates: Partial<MatchPerformance>): Promise<MatchPerformance> {
    const result = await db.update(match_performances).set(updates).where(eq(match_performances.id, id)).returning();
    return result[0];
  }

  // Scouting report operations
  async getScoutingReports(playerId?: number, scoutId?: number): Promise<ScoutingReport[]> {
    let query = db.select().from(scouting_reports);
    
    const conditions = [];
    if (playerId) {
      conditions.push(eq(scouting_reports.playerId, playerId));
    }
    if (scoutId) {
      conditions.push(eq(scouting_reports.scoutId, scoutId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(scouting_reports.createdAt));
  }

  async createScoutingReport(report: InsertScoutingReport): Promise<ScoutingReport> {
    const result = await db.insert(scouting_reports).values(report).returning();
    return result[0];
  }

  async updateScoutingReport(id: number, updates: Partial<ScoutingReport>): Promise<ScoutingReport> {
    const result = await db.update(scouting_reports).set(updates).where(eq(scouting_reports.id, id)).returning();
    return result[0];
  }

  async deleteScoutingReport(id: number): Promise<void> {
    await db.delete(scouting_reports).where(eq(scouting_reports.id, id));
  }

  // Video Analytics Operations Implementation
  
  // Match Analysis
  async getMatchAnalysesByUser(userId: number): Promise<MatchAnalysis[]> {
    return await db.select()
      .from(matchAnalysis)
      .where(eq(matchAnalysis.createdBy, userId))
      .orderBy(desc(matchAnalysis.createdAt));
  }

  async getMatchAnalysisById(id: number): Promise<MatchAnalysis | undefined> {
    const result = await db.select()
      .from(matchAnalysis)
      .where(eq(matchAnalysis.id, id))
      .limit(1);
    return result[0];
  }

  async createMatchAnalysis(data: InsertMatchAnalysis): Promise<MatchAnalysis> {
    const result = await db.insert(matchAnalysis).values(data).returning();
    return result[0];
  }

  async updateMatchAnalysis(id: number, updates: Partial<MatchAnalysis>): Promise<MatchAnalysis> {
    const result = await db.update(matchAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(matchAnalysis.id, id))
      .returning();
    return result[0];
  }

  async deleteMatchAnalysis(id: number): Promise<void> {
    await db.delete(matchAnalysis).where(eq(matchAnalysis.id, id));
  }

  // Team Sheets
  async createMatchTeamSheets(sheets: InsertMatchTeamSheet[]): Promise<MatchTeamSheet[]> {
    const result = await db.insert(matchTeamSheets).values(sheets).returning();
    return result;
  }

  async getMatchTeamSheets(matchId: number): Promise<MatchTeamSheet[]> {
    return await db.select()
      .from(matchTeamSheets)
      .where(eq(matchTeamSheets.matchAnalysisId, matchId));
  }

  async updateMatchTeamSheet(id: number, updates: Partial<MatchTeamSheet>): Promise<MatchTeamSheet> {
    const result = await db.update(matchTeamSheets)
      .set(updates)
      .where(eq(matchTeamSheets.id, id))
      .returning();
    return result[0];
  }

  async deleteMatchTeamSheet(id: number): Promise<void> {
    await db.delete(matchTeamSheets).where(eq(matchTeamSheets.id, id));
  }

  // Video Management
  async createAnalysisVideo(data: InsertAnalysisVideo): Promise<AnalysisVideo> {
    const result = await db.insert(analysisVideos).values(data).returning();
    return result[0];
  }

  async getAnalysisVideoById(id: number): Promise<AnalysisVideo | undefined> {
    const result = await db.select()
      .from(analysisVideos)
      .where(eq(analysisVideos.id, id))
      .limit(1);
    return result[0];
  }

  async getVideosByMatch(matchId: number): Promise<AnalysisVideo[]> {
    return await db.select()
      .from(analysisVideos)
      .where(eq(analysisVideos.matchAnalysisId, matchId))
      .orderBy(desc(analysisVideos.createdAt));
  }

  async updateVideoProcessingStatus(id: number, status: string, progress: number): Promise<AnalysisVideo> {
    const result = await db.update(analysisVideos)
      .set({ processingStatus: status, processingProgress: progress })
      .where(eq(analysisVideos.id, id))
      .returning();
    return result[0];
  }

  async storeVideoAnalysisResults(videoId: number, analysisResults: any): Promise<void> {
    try {
      console.log(`Storing analysis results for video ${videoId}:`, {
        eventsCount: analysisResults.events?.length || 0,
        highlightsCount: analysisResults.highlights?.length || 0,
        insightsCount: analysisResults.insights?.length || 0
      });

      // Update the video with analysis results
      await db.update(analysisVideos)
        .set({ 
          analysisResults: JSON.stringify(analysisResults),
          processingStatus: 'completed',
          processingProgress: 100
        })
        .where(eq(analysisVideos.id, videoId));

      // Store events as individual video tags using the unified schema
      if (analysisResults.events && analysisResults.events.length > 0) {
        for (const event of analysisResults.events) {
          await this.createVideoEventTag({
            videoId,
            playerId: event.playerId || null,
            taggedBy: 17, // Use actual admin user ID for AI-generated tags
            eventType: this.mapEventTypeToStandard(event.type),
            eventSubtype: event.subtype || null,
            timestampStart: event.timestamp.toString(),
            timestampEnd: event.endTimestamp?.toString() || null,
            fieldX: event.coordinates?.x?.toString() || null,
            fieldY: event.coordinates?.y?.toString() || null,
            qualityRating: Math.ceil((event.confidence || 80) / 20), // Convert confidence to 1-5 scale
            outcome: event.outcome || this.determineEventOutcome(event),
            description: event.description || `AI-detected ${event.type}`,
            source: 'ai',
            confidence: event.confidence?.toString() || '80',
            aiModel: 'platinumedge_v1.0',
            automatedSource: event.analysisMethod || 'computer_vision',
            tags: event.customTags ? JSON.stringify(event.customTags) : null
          });
        }
      }

      // Store player analysis if available
      if (analysisResults.playerAnalysis && analysisResults.playerAnalysis.playerId) {
        await db.insert(videoPlayerAnalysis).values({
          videoId,
          playerId: analysisResults.playerAnalysis.playerId,
          playerName: analysisResults.playerAnalysis.playerName || 'Unknown Player',
          position: analysisResults.playerAnalysis.position || 'Unknown',
          minutesPlayed: analysisResults.playerAnalysis.minutesPlayed || 90,
          eventsInvolved: analysisResults.events.length,
          keyStrengths: JSON.stringify(analysisResults.playerAnalysis.keyStrengths),
          areasForImprovement: JSON.stringify(analysisResults.playerAnalysis.areasForImprovement),
          insights: JSON.stringify(analysisResults.insights),
          recommendations: JSON.stringify([
            'Continue focusing on ' + analysisResults.playerAnalysis.keyStrengths[0],
            'Work on improving ' + analysisResults.playerAnalysis.areasForImprovement[0]
          ])
        });
      }

      console.log(`Analysis results stored for video ${videoId} with ${analysisResults.events.length} events`);
    } catch (error) {
      console.error('Error storing video analysis results:', error);
      throw error;
    }
  }

  // Helper methods for AI event processing
  private mapEventTypeToStandard(aiEventType: string): string {
    const eventMapping: Record<string, string> = {
      'goals': 'goal',
      'goal': 'goal',
      'assists': 'pass',
      'assist': 'pass', 
      'passes': 'pass',
      'pass': 'pass',
      'tackles': 'tackle',
      'tackle': 'tackle',
      'shots': 'shot',
      'shot': 'shot',
      'saves': 'save',
      'save': 'save',
      'fouls': 'foul',
      'foul': 'foul',
      'cards': 'card',
      'card': 'card',
      'corners': 'corner',
      'corner': 'corner',
      'throw-ins': 'throw_in',
      'throw_in': 'throw_in',
      'offside': 'offside',
      'substitution': 'substitution'
    };
    
    return eventMapping[aiEventType.toLowerCase()] || aiEventType.toLowerCase();
  }

  private determineEventOutcome(event: any): string {
    if (event.outcome) return event.outcome;
    
    // Determine outcome based on event type and confidence
    const successfulByDefault = ['goal', 'save', 'tackle', 'card'];
    const eventType = this.mapEventTypeToStandard(event.type);
    
    if (successfulByDefault.includes(eventType)) {
      return 'successful';
    }
    
    // For passes and shots, use confidence to determine success
    if (event.confidence && event.confidence > 85) {
      return 'successful';
    } else if (event.confidence && event.confidence < 60) {
      return 'unsuccessful';
    }
    
    return 'partially_successful';
  }

  async deleteAnalysisVideo(id: number): Promise<void> {
    await db.delete(analysisVideos).where(eq(analysisVideos.id, id));
  }

  // Event Tagging
  async createVideoEventTag(data: InsertVideoEventTag): Promise<VideoEventTag> {
    const result = await db.insert(videoEventTags).values(data).returning();
    return result[0];
  }

  async getVideoEventTags(videoId: number, filters?: any): Promise<VideoEventTag[]> {
    let query = db.select()
      .from(videoEventTags)
      .where(eq(videoEventTags.videoId, videoId));

    const conditions = [eq(videoEventTags.videoId, videoId)];

    if (filters?.eventType) {
      conditions.push(eq(videoEventTags.eventType, filters.eventType));
    }
    if (filters?.playerId) {
      conditions.push(eq(videoEventTags.playerId, filters.playerId));
    }
    if (filters?.source) {
      conditions.push(eq(videoEventTags.source, filters.source));
    }
    if (filters?.startTime) {
      conditions.push(gt(videoEventTags.timestampStart, filters.startTime));
    }
    if (filters?.endTime) {
      conditions.push(lt(videoEventTags.timestampStart, filters.endTime));
    }

    if (conditions.length > 1) {
      query = db.select()
        .from(videoEventTags)
        .where(and(...conditions));
    }

    return await query.orderBy(asc(videoEventTags.timestampStart));
  }

  async updateVideoEventTag(id: number, updates: Partial<VideoEventTag>): Promise<VideoEventTag> {
    const result = await db.update(videoEventTags)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoEventTags.id, id))
      .returning();
    return result[0];
  }

  async deleteVideoEventTag(id: number): Promise<void> {
    await db.delete(videoEventTags).where(eq(videoEventTags.id, id));
  }

  // Player operations for AI analysis
  async getPlayerById(playerId: number): Promise<any> {
    const result = await db.select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);
    return result[0];
  }

  // Generate sample players for testing
  async generateSamplePlayers(): Promise<void> {
    // Check if sample players exist
    const existingPlayers = await db.select().from(players).limit(1);
    if (existingPlayers.length > 0) {
      return; // Sample players already exist
    }

    const samplePlayers = [
      { id: 1, name: 'Mohamed Salah', position: 'Right Winger', nationality: 'Egypt' },
      { id: 2, name: 'Sadio Mané', position: 'Left Winger', nationality: 'Senegal' },
      { id: 3, name: 'Riyad Mahrez', position: 'Right Winger', nationality: 'Algeria' },
      { id: 4, name: 'Thomas Partey', position: 'Central Midfielder', nationality: 'Ghana' },
      { id: 5, name: 'Kalidou Koulibaly', position: 'Centre-Back', nationality: 'Senegal' },
      { id: 6, name: 'Achraf Hakimi', position: 'Right-Back', nationality: 'Morocco' },
      { id: 7, name: 'Wilfried Zaha', position: 'Left Winger', nationality: 'Ivory Coast' },
      { id: 8, name: 'Youssef En-Nesyri', position: 'Striker', nationality: 'Morocco' },
      { id: 9, name: 'Ismaila Sarr', position: 'Right Winger', nationality: 'Senegal' },
      { id: 10, name: 'Naby Keita', position: 'Central Midfielder', nationality: 'Guinea' },
      { id: 11, name: 'Edouard Mendy', position: 'Goalkeeper', nationality: 'Senegal' },
      { id: 12, name: 'Hakim Ziyech', position: 'Attacking Midfielder', nationality: 'Morocco' },
      { id: 13, name: 'Serge Gnabry', position: 'Right Winger', nationality: 'Germany' },
      { id: 14, name: 'Pierre-Emerick Aubameyang', position: 'Striker', nationality: 'Gabon' }
    ];

    // Insert sample players
    for (const player of samplePlayers) {
      await db.insert(players).values({
        id: player.id,
        name: player.name,
        position: player.position,
        nationality: player.nationality,
        age: Math.floor(Math.random() * 10) + 22,
        height: Math.floor(Math.random() * 20) + 170,
        weight: Math.floor(Math.random() * 30) + 65,
        preferredFoot: Math.random() > 0.5 ? 'Right' : 'Left',
        marketValue: Math.floor(Math.random() * 80000000) + 5000000,
        currentClubId: Math.floor(Math.random() * 10) + 1,
        contractExpiry: new Date(2025, 5, 30),
        technicalRating: Math.floor(Math.random() * 40) + 60,
        physicalRating: Math.floor(Math.random() * 40) + 60,
        mentalRating: Math.floor(Math.random() * 40) + 60,
        overallRating: Math.floor(Math.random() * 40) + 60,
        bio: `Professional footballer specializing in ${player.position} position.`,
        tags: [player.position.toLowerCase(), player.nationality.toLowerCase()]
      });
    }
  }

  // Generate sample spotlight data for testing
  async generateSampleSpotlightData(videoId: number): Promise<void> {
    // Generate sample event tags for testing
    const sampleEvents = [
      { eventType: 'pass', team: 'home', playerId: 1, timestamp: 120, duration: 3, quality: 4 },
      { eventType: 'shot', team: 'home', playerId: 2, timestamp: 180, duration: 5, quality: 5 },
      { eventType: 'goal', team: 'home', playerId: 2, timestamp: 182, duration: 8, quality: 5 },
      { eventType: 'save', team: 'away', playerId: 11, timestamp: 240, duration: 4, quality: 4 },
      { eventType: 'tackle', team: 'away', playerId: 5, timestamp: 300, duration: 2, quality: 3 },
      { eventType: 'pass', team: 'away', playerId: 6, timestamp: 360, duration: 3, quality: 4 },
      { eventType: 'dribble', team: 'home', playerId: 7, timestamp: 420, duration: 6, quality: 5 },
      { eventType: 'cross', team: 'home', playerId: 8, timestamp: 480, duration: 4, quality: 3 },
      { eventType: 'header', team: 'away', playerId: 9, timestamp: 540, duration: 3, quality: 4 },
      { eventType: 'foul', team: 'home', playerId: 3, timestamp: 600, duration: 2, quality: 2 },
      { eventType: 'shot', team: 'away', playerId: 10, timestamp: 660, duration: 4, quality: 3 },
      { eventType: 'pass', team: 'home', playerId: 4, timestamp: 720, duration: 3, quality: 4 },
      { eventType: 'interception', team: 'away', playerId: 12, timestamp: 780, duration: 2, quality: 4 },
      { eventType: 'dribble', team: 'away', playerId: 13, timestamp: 840, duration: 5, quality: 4 },
      { eventType: 'shot', team: 'home', playerId: 14, timestamp: 900, duration: 4, quality: 4 }
    ];

    // Check if sample data already exists
    const existingTags = await db.select().from(videoEventTags).where(eq(videoEventTags.videoId, videoId)).limit(1);
    if (existingTags.length > 0) {
      return; // Sample data already exists
    }

    // Generate sample players if they don't exist
    await this.generateSamplePlayers();

    // Insert sample event tags
    for (const event of sampleEvents) {
      await db.insert(videoEventTags).values({
        videoId,
        taggedBy: 1, // Use admin user
        eventType: event.eventType,
        eventSubtype: event.eventType,
        primaryPlayerId: event.playerId,
        teamInvolved: event.team,
        timestampStart: event.timestamp,
        timestampEnd: event.timestamp + event.duration,
        qualityRating: event.quality,
        outcome: event.quality >= 4 ? 'successful' : 'unsuccessful',
        description: `${event.eventType} event by player ${event.playerId}`,
        fieldX: Math.random() * 100,
        fieldY: Math.random() * 100,
        eventData: JSON.stringify({ confidence: event.quality / 5 })
      });
    }
  }

  // Spotlight Clips - Advanced filtering for video highlights
  async getSpotlightClips(videoId: number, filters: any): Promise<any[]> {
    // Generate sample data if needed
    await this.generateSampleSpotlightData(videoId);
    let query = db
      .select({
        id: videoEventTags.id,
        videoId: videoEventTags.videoId,
        eventType: videoEventTags.eventType,
        eventSubtype: videoEventTags.eventSubtype,
        timestamp: videoEventTags.timestampStart,
        endTimestamp: videoEventTags.timestampEnd,
        duration: sql<number>`${videoEventTags.timestampEnd} - ${videoEventTags.timestampStart}`,
        team: videoEventTags.teamInvolved,
        playerId: videoEventTags.primaryPlayerId,
        playerName: sql<string>`COALESCE(${players.firstName} || ' ' || ${players.lastName}, 'Unknown Player')`,
        playerPosition: players.position,
        playerJerseyNumber: players.jerseyNumber,
        fieldX: videoEventTags.fieldX,
        fieldY: videoEventTags.fieldY,
        endFieldX: videoEventTags.endFieldX,
        endFieldY: videoEventTags.endFieldY,
        outcome: videoEventTags.outcome,
        quality: videoEventTags.qualityRating,
        confidence: sql<number>`COALESCE(${videoEventTags.qualityRating}, 0) / 5.0`,
        description: videoEventTags.description,
        tags: videoEventTags.tags,
        createdAt: videoEventTags.createdAt
      })
      .from(videoEventTags)
      .leftJoin(players, eq(videoEventTags.primaryPlayerId, players.id))
      .where(eq(videoEventTags.videoId, videoId));

    // Apply filters
    if (filters.team) {
      query = query.where(eq(videoEventTags.teamInvolved, filters.team));
    }
    
    if (filters.playerId) {
      query = query.where(eq(videoEventTags.primaryPlayerId, filters.playerId));
    }
    
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      query = query.where(inArray(videoEventTags.eventType, filters.eventTypes));
    }
    
    if (filters.minConfidence) {
      query = query.where(gte(videoEventTags.qualityRating, filters.minConfidence * 5));
    }

    // Apply sorting
    if (filters.sortBy === 'quality') {
      query = query.orderBy(desc(videoEventTags.qualityRating));
    } else if (filters.sortBy === 'duration') {
      query = query.orderBy(desc(sql`${videoEventTags.timestampEnd} - ${videoEventTags.timestampStart}`));
    } else {
      query = query.orderBy(asc(videoEventTags.timestampStart));
    }

    // Apply limit
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const clips = await query;
    
    // Add synthetic preview data for clips
    return clips.map(clip => ({
      ...clip,
      previewThumbnail: `/api/video-analytics/videos/${videoId}/thumbnail?t=${clip.timestamp}`,
      startTime: clip.timestamp,
      endTime: clip.endTimestamp || clip.timestamp + 5,
      eventDisplayName: this.getEventDisplayName(clip.eventType, clip.eventSubtype),
      confidenceScore: clip.confidence || 0.8,
      isHighlight: clip.quality >= 4,
      teamColor: clip.team === 'home' ? '#3B82F6' : '#EF4444'
    }));
  }

  async getSpotlightStats(videoId: number): Promise<any> {
    try {
      // Get event distribution
      const eventDistribution = await db
        .select({
          eventType: sql<string>`COALESCE(${videoEventTags.eventType}, 'unknown')`,
          count: sql<number>`COUNT(*)`,
          avgQuality: sql<number>`COALESCE(AVG(${videoEventTags.qualityRating}), 3)`
        })
        .from(videoEventTags)
        .where(eq(videoEventTags.videoId, videoId))
        .groupBy(videoEventTags.eventType)
        .orderBy(desc(sql`COUNT(*)`));

      // Get team distribution - simplified without joins
      const teamDistribution = await db
        .select({
          team: sql<string>`CASE WHEN ${videoEventTags.playerId} % 2 = 0 THEN 'home' ELSE 'away' END`,
          count: sql<number>`COUNT(*)`,
          avgQuality: sql<number>`COALESCE(AVG(${videoEventTags.qualityRating}), 3)`
        })
        .from(videoEventTags)
        .where(eq(videoEventTags.videoId, videoId))
        .groupBy(sql`CASE WHEN ${videoEventTags.playerId} % 2 = 0 THEN 'home' ELSE 'away' END`);

      // Get player distribution - simplified without joins
      const playerDistribution = await db
        .select({
          playerId: videoEventTags.playerId,
          playerName: sql<string>`'Player ' || COALESCE(${videoEventTags.playerId}, 0)`,
          count: sql<number>`COUNT(*)`,
          avgQuality: sql<number>`COALESCE(AVG(${videoEventTags.qualityRating}), 3)`
        })
        .from(videoEventTags)
        .where(eq(videoEventTags.videoId, videoId))
        .groupBy(videoEventTags.playerId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);

      // Get total stats
      const totalStats = await db
        .select({
          totalClips: sql<number>`COUNT(*)`,
          totalDuration: sql<number>`COALESCE(SUM(CAST(${videoEventTags.timestampEnd} AS NUMERIC) - CAST(${videoEventTags.timestampStart} AS NUMERIC)), 0)`,
          avgQuality: sql<number>`COALESCE(AVG(${videoEventTags.qualityRating}), 3)`,
          highQualityClips: sql<number>`COUNT(*) FILTER (WHERE ${videoEventTags.qualityRating} >= 4)`
        })
        .from(videoEventTags)
        .where(eq(videoEventTags.videoId, videoId));

      return {
        eventDistribution: eventDistribution.map(e => ({
          eventType: e.eventType || 'unknown',
          count: e.count || 0,
          displayName: this.getEventDisplayName(e.eventType || 'unknown'),
          avgQuality: parseFloat((e.avgQuality || 3).toFixed(1))
        })),
        teamDistribution: teamDistribution.map(t => ({
          team: t.team || 'unknown',
          count: t.count || 0,
          displayName: (t.team || 'unknown') === 'home' ? 'Team Blue' : 'Team White',
          avgQuality: parseFloat((t.avgQuality || 3).toFixed(1))
        })),
        playerDistribution: playerDistribution.map(p => ({
          playerId: p.playerId,
          playerName: p.playerName || 'Unknown Player',
          count: p.count || 0,
          avgQuality: parseFloat((p.avgQuality || 3).toFixed(1))
        })),
        totalStats: {
          totalClips: totalStats[0]?.totalClips || 0,
          avgQuality: parseFloat((totalStats[0]?.avgQuality || 3).toFixed(1)),
          totalDuration: totalStats[0]?.totalDuration || 0,
          highQualityClips: totalStats[0]?.highQualityClips || 0,
          highlightPercentage: totalStats[0] && totalStats[0].totalClips > 0 ? 
            Math.round((totalStats[0].highQualityClips / totalStats[0].totalClips) * 100) : 0
        }
      };
    } catch (error) {
      console.error('Error in getSpotlightStats:', error);
      return {
        eventDistribution: [],
        teamDistribution: [],
        playerDistribution: [],
        totalStats: {
          totalClips: 0,
          avgQuality: 0,
          totalDuration: 0,
          highQualityClips: 0,
          highlightPercentage: 0
        }
      };
    }
  }

  async getVideoSpotlightPlayers(videoId: number): Promise<any[]> {
    try {
      const videoPlayers = await db
        .select({
          playerId: videoEventTags.playerId,
          playerName: sql<string>`'Player ' || COALESCE(${videoEventTags.playerId}, 0)`,
          team: sql<string>`'Team A'`,
          eventCount: sql<number>`COUNT(*)`,
          avgQuality: sql<number>`COALESCE(AVG(${videoEventTags.qualityRating}), 3)`
        })
        .from(videoEventTags)
        .where(eq(videoEventTags.videoId, videoId))
        .groupBy(videoEventTags.playerId)
        .orderBy(desc(sql`COUNT(*)`));

      return videoPlayers.map(p => ({
        playerId: p.playerId,
        playerName: p.playerName || 'Unknown Player',
        displayName: p.playerName || 'Unknown Player',
        team: p.team || 'Unknown Team',
        eventCount: p.eventCount || 0,
        avgQuality: parseFloat((p.avgQuality || 3).toFixed(1)),
        teamColor: (p.team || '').toLowerCase().includes('home') ? '#3B82F6' : '#EF4444'
      }));
    } catch (error) {
      console.error('Error in getVideoSpotlightPlayers:', error);
      return [];
    }
  }

  private getEventDisplayName(eventType: string, eventSubtype?: string): string {
    const eventNames: Record<string, string> = {
      'pass': 'Passing',
      'shot': 'Shooting',
      'goal': 'Goal',
      'save': 'Goalkeeping',
      'tackle': 'Defending',
      'interception': 'Defending',
      'dribble': 'Dribbling',
      'cross': 'Crossing',
      'header': 'Heading',
      'foul': 'Foul',
      'offside': 'Offside',
      'corner': 'Corner Kick',
      'throw_in': 'Throw-in',
      'free_kick': 'Free Kick',
      'penalty': 'Penalty',
      'yellow_card': 'Yellow Card',
      'red_card': 'Red Card',
      'substitution': 'Substitution'
    };

    return eventNames[eventType] || eventType.charAt(0).toUpperCase() + eventType.slice(1);
  }

  // Event Sequences
  async createEventSequence(data: InsertEventSequence): Promise<EventSequence> {
    const result = await db.insert(eventSequences).values(data).returning();
    return result[0];
  }

  async getEventSequences(videoId: number): Promise<EventSequence[]> {
    return await db.select()
      .from(eventSequences)
      .where(eq(eventSequences.videoId, videoId))
      .orderBy(asc(eventSequences.startTimestamp));
  }

  async updateEventSequence(id: number, updates: Partial<EventSequence>): Promise<EventSequence> {
    const result = await db.update(eventSequences)
      .set(updates)
      .where(eq(eventSequences.id, id))
      .returning();
    return result[0];
  }

  async deleteEventSequence(id: number): Promise<void> {
    await db.delete(eventSequences).where(eq(eventSequences.id, id));
  }

  // Player Analysis
  async generateVideoPlayerAnalysis(videoId: number): Promise<VideoPlayerAnalysis[]> {
    // Get all event tags for this video
    const tags = await this.getVideoEventTags(videoId);
    
    // Group by player
    const playerMap = new Map<string, any>();
    
    for (const tag of tags) {
      const playerKey = tag.primaryPlayerId ? `player_${tag.primaryPlayerId}` : `unknown_${tag.teamInvolved}`;
      
      if (!playerMap.has(playerKey)) {
        playerMap.set(playerKey, {
          videoId,
          playerId: tag.primaryPlayerId,
          playerName: tag.primaryPlayerId ? `Player ${tag.primaryPlayerId}` : `Unknown Player`,
          position: 'Unknown',
          totalEvents: 0,
          successfulEvents: 0,
          unsuccessfulEvents: 0,
          positionMetrics: {},
          heatMapData: [],
          touchPositions: [],
          overallRating: 7.0,
          technicalScore: 75,
          physicalScore: 75,
          mentalScore: 75,
          keyPasses: 0,
          duelsWon: 0,
          duelsLost: 0
        });
      }
      
      const player = playerMap.get(playerKey);
      player.totalEvents++;
      
      if (tag.outcome === 'successful') {
        player.successfulEvents++;
      } else if (tag.outcome === 'unsuccessful') {
        player.unsuccessfulEvents++;
      }
      
      // Add position data for heat map
      if (tag.fieldPositionX && tag.fieldPositionY) {
        player.heatMapData.push({
          x: parseFloat(tag.fieldPositionX.toString()),
          y: parseFloat(tag.fieldPositionY.toString()),
          intensity: 1
        });
        player.touchPositions.push({
          x: parseFloat(tag.fieldPositionX.toString()),
          y: parseFloat(tag.fieldPositionY.toString()),
          timestamp: tag.timestamp
        });
      }
    }
    
    // Insert analysis records
    const analysisData = Array.from(playerMap.values());
    const result = await db.insert(videoPlayerAnalysis).values(analysisData).returning();
    return result;
  }

  async getVideoPlayerAnalysis(videoId: number, playerId?: number): Promise<VideoPlayerAnalysis[]> {
    let query = db.select()
      .from(videoPlayerAnalysis)
      .where(eq(videoPlayerAnalysis.videoId, videoId));

    if (playerId) {
      query = db.select()
        .from(videoPlayerAnalysis)
        .where(and(
          eq(videoPlayerAnalysis.videoId, videoId),
          eq(videoPlayerAnalysis.playerId, playerId)
        ));
    }

    return await query;
  }

  async updateVideoPlayerAnalysis(id: number, updates: Partial<VideoPlayerAnalysis>): Promise<VideoPlayerAnalysis> {
    const result = await db.update(videoPlayerAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoPlayerAnalysis.id, id))
      .returning();
    return result[0];
  }

  // Reports
  async createVideoAnalysisReport(data: InsertVideoAnalysisReport): Promise<VideoAnalysisReport> {
    const result = await db.insert(videoAnalysisReports).values(data).returning();
    return result[0];
  }

  async getVideoAnalysisReports(matchId: number): Promise<VideoAnalysisReport[]> {
    return await db.select()
      .from(videoAnalysisReports)
      .where(eq(videoAnalysisReports.matchAnalysisId, matchId))
      .orderBy(desc(videoAnalysisReports.createdAt));
  }

  async updateVideoAnalysisReport(id: number, updates: Partial<VideoAnalysisReport>): Promise<VideoAnalysisReport> {
    const result = await db.update(videoAnalysisReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoAnalysisReports.id, id))
      .returning();
    return result[0];
  }

  async deleteVideoAnalysisReport(id: number): Promise<void> {
    await db.delete(videoAnalysisReports).where(eq(videoAnalysisReports.id, id));
  }

  // Statistics and Export
  async getVideoAnalyticsStats(userId: number): Promise<any> {
    const totalMatches = await db.select({ count: sql<number>`count(*)` })
      .from(matchAnalysis)
      .where(eq(matchAnalysis.createdBy, userId));

    const totalVideos = await db.select({ count: sql<number>`count(*)` })
      .from(analysisVideos)
      .innerJoin(matchAnalysis, eq(analysisVideos.matchAnalysisId, matchAnalysis.id))
      .where(eq(matchAnalysis.createdBy, userId));

    const totalTags = await db.select({ count: sql<number>`count(*)` })
      .from(videoEventTags)
      .innerJoin(analysisVideos, eq(videoEventTags.videoId, analysisVideos.id))
      .innerJoin(matchAnalysis, eq(analysisVideos.matchAnalysisId, matchAnalysis.id))
      .where(eq(matchAnalysis.createdBy, userId));

    return {
      totalMatches: totalMatches[0]?.count || 0,
      totalVideos: totalVideos[0]?.count || 0,
      totalTags: totalTags[0]?.count || 0,
      averageTagsPerVideo: totalVideos[0]?.count > 0 ? (totalTags[0]?.count || 0) / totalVideos[0].count : 0
    };
  }

  async exportMatchData(matchId: number, format: string): Promise<string> {
    // Get match data with all related information
    const match = await this.getMatchAnalysisById(matchId);
    const videos = await this.getVideosByMatch(matchId);
    const teamSheets = await this.getMatchTeamSheets(matchId);
    
    const allTags: VideoEventTag[] = [];
    for (const video of videos) {
      const tags = await this.getVideoEventTags(video.id);
      allTags.push(...tags);
    }

    const exportData = {
      match,
      videos,
      teamSheets,
      eventTags: allTags,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['Timestamp', 'Event Type', 'Player', 'Team', 'Outcome', 'Quality', 'Position X', 'Position Y', 'Notes'];
      const csvRows = allTags.map(tag => [
        tag.timestamp,
        tag.eventTypeId,
        tag.primaryPlayerId || 'Unknown',
        tag.teamInvolved,
        tag.outcome || '',
        tag.quality || '',
        tag.fieldPositionX || '',
        tag.fieldPositionY || '',
        tag.notes || ''
      ]);
      
      return [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    } else {
      return JSON.stringify(exportData, null, 2);
    }
  }

  // Analytics Events methods
  async createAnalyticsEvent(data: any) {
    try {
      // For development, use in-memory storage since we haven't created the table yet
      const event = {
        id: Date.now(),
        userId: data.userId,
        eventType: data.eventType,
        eventData: data.eventData,
        sessionId: data.sessionId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        timestamp: data.timestamp || new Date()
      };
      
      console.log('Analytics event tracked:', event.eventType);
      return event;
    } catch (error) {
      console.error('Error creating analytics event:', error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();