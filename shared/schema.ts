import { pgTable, text, serial, integer, timestamp, boolean, jsonb, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management for scouts, agents, and admins
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("scout"), // scout, agent, admin, super_admin
  organizationId: integer("organization_id"),
  profileImage: text("profile_image"),
  phone: text("phone"),
  country: text("country"),
  city: text("city"),
  bio: text("bio"),
  expertise: text("expertise"), // JSON array of specializations
  languages: text("languages"), // JSON array of languages spoken
  experience: text("experience"), // Years of experience
  certifications: text("certifications"), // JSON array of certifications
  socialLinks: text("social_links"), // JSON object of social media links
  preferredContactMethod: text("preferred_contact_method").default("email"), // email, phone, whatsapp
  timezone: text("timezone"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  nationality: text("nationality"),
  
  // Verification status
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by"),
  verificationNotes: text("verification_notes"),
  verificationDocuments: text("verification_documents"), // JSON array of document URLs
  
  // Account status
  isActive: boolean("is_active").default(true),
  isSuspended: boolean("is_suspended").default(false),
  suspendedAt: timestamp("suspended_at"),
  suspendedBy: integer("suspended_by"),
  suspensionReason: text("suspension_reason"),
  
  // Authentication
  lastLogin: timestamp("last_login"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Security
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  
  // Subscription & Monetization
  subscriptionTier: text("subscription_tier").default("freemium"), // freemium, scoutpro, agent_club
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, cancelled, past_due
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  freeTrialUsed: boolean("free_trial_used").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  creditsRemaining: integer("credits_remaining").default(5), // Free tier credits
  totalCreditsUsed: integer("total_credits_used").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  
  // Independent analysis settings
  freeAnalysisUsed: boolean("free_analysis_used").default(false),
  totalIndependentAnalyses: integer("total_independent_analyses").default(0),
  
  // Super admin overrides
  subscriptionOverride: boolean("subscription_override").default(false),
  subscriptionOverrideReason: text("subscription_override_reason"),
  subscriptionOverrideBy: integer("subscription_override_by"),
  subscriptionOverrideAt: timestamp("subscription_override_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session management for secure authentication
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User activity logs for admin monitoring
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // login, logout, profile_update, password_change, etc.
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Admin actions audit log
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  targetUserId: integer("target_user_id").references(() => users.id),
  action: text("action").notNull(), // suspend_user, reset_password, activate_user, etc.
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Email notifications and communication management
export const emailNotifications = pgTable("email_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // verification, welcome, password_reset, suspension, etc.
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending"), // pending, sent, failed, delivered
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
  sentBy: integer("sent_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User verification requests
export const userVerificationRequests = pgTable("user_verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestType: text("request_type").notNull(), // email_verification, identity_verification, professional_verification
  status: text("status").default("pending"), // pending, approved, rejected, expired
  documents: text("documents"), // JSON array of uploaded document URLs
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
});

// Football clubs and organizations
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // club, academy, federation, agency
  country: text("country").notNull(),
  city: text("city"),
  logoUrl: text("logo_url"),
  website: text("website"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  description: text("description"),
  founded: integer("founded"),
  stadiumName: text("stadium_name"),
  stadiumCapacity: integer("stadium_capacity"),
  leagueName: text("league_name"),
  totalMembers: integer("total_members").default(0),
  isVerified: boolean("is_verified").default(false),
  
  // PDF Branding Configuration for Agencies
  brandingConfig: jsonb("branding_config"), // Custom branding settings for PDF generation
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Player profiles
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  nationality: text("nationality").notNull(),
  position: text("position").notNull(), // GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST
  secondaryPosition: text("secondary_position"),
  currentClubId: integer("current_club_id"),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  preferredFoot: text("preferred_foot"), // left, right, both
  marketValue: decimal("market_value", { precision: 10, scale: 2 }),
  profileImageUrl: text("profile_image_url"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Player performance statistics
export const player_stats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  season: text("season").notNull(), // e.g., "2024-25"
  matchesPlayed: integer("matches_played").default(0),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  yellowCards: integer("yellow_cards").default(0),
  redCards: integer("red_cards").default(0),
  minutesPlayed: integer("minutes_played").default(0),
  // Advanced stats
  passAccuracy: decimal("pass_accuracy", { precision: 5, scale: 2 }),
  shotAccuracy: decimal("shot_accuracy", { precision: 5, scale: 2 }),
  tackles: integer("tackles").default(0),
  interceptions: integer("interceptions").default(0),
  aerialDuelsWon: integer("aerial_duels_won").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video content for players
export const player_videos = pgTable("player_videos", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  videoType: text("video_type").notNull(), // highlight, match, training, skill
  uploadedBy: integer("uploaded_by"),
  isPublic: boolean("is_public").default(true),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Match performance tracking
export const match_performances = pgTable("match_performances", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  matchDate: date("match_date").notNull(),
  opponent: text("opponent").notNull(),
  competition: text("competition"),
  minutesPlayed: integer("minutes_played").default(0),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  shots: integer("shots").default(0),
  shotsOnTarget: integer("shots_on_target").default(0),
  passes: integer("passes").default(0),
  passesCompleted: integer("passes_completed").default(0),
  tackles: integer("tackles").default(0),
  interceptions: integer("interceptions").default(0),
  fouls: integer("fouls").default(0),
  yellowCards: integer("yellow_cards").default(0),
  redCards: integer("red_cards").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scouting reports
export const scouting_reports = pgTable("scouting_reports", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  scoutId: integer("scout_id").notNull(),
  title: text("title").notNull(),
  overallRating: integer("overall_rating").notNull(), // 1-10 scale
  technicalRating: integer("technical_rating").notNull(),
  physicalRating: integer("physical_rating").notNull(),
  mentalRating: integer("mental_rating").notNull(),
  tacticalRating: integer("tactical_rating").notNull(),
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  detailedReport: text("detailed_report"),
  recommendation: text("recommendation"), // sign, monitor, pass
  potentialLevel: text("potential_level"), // high, medium, low
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Reports for storing generated insights
export const aiReports = pgTable("ai_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // player_analysis, market_comparison, scouting_summary, tactical_fit, development_path
  playerId: integer("player_id"),
  playerName: text("player_name").notNull(),
  generatedBy: integer("generated_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // AI Content
  aiInsights: text("ai_insights").notNull(),
  keyFindings: jsonb("key_findings").notNull(), // Array of strings
  recommendations: jsonb("recommendations").notNull(), // Array of strings
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  dataSourcesUsed: jsonb("data_sources_used").notNull(), // Array of sources
  
  // Request context
  context: text("context"),
  specificQuestions: jsonb("specific_questions"), // Array of questions
  
  // Metadata
  processingTime: integer("processing_time"), // milliseconds
  isPublic: boolean("is_public").default(false),
  tags: jsonb("tags"), // Array of tags for categorization
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video Analysis and Management System
export const videoUploads = pgTable("video_uploads", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Video metadata
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  duration: integer("duration"), // seconds
  resolution: text("resolution"), // 1920x1080, 1280x720, etc.
  format: text("format").notNull(), // mp4, avi, mov, etc.
  
  // Storage information
  storageProvider: text("storage_provider").notNull(), // aws_s3, google_drive, local
  storageUrl: text("storage_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  
  // Video categorization
  videoType: text("video_type").notNull(), // match, training, skills, highlights
  matchId: integer("match_id"), // reference to matches table
  competition: text("competition"), // league, tournament name
  opponent: text("opponent"),
  matchDate: date("match_date"),
  
  // Analysis status
  analysisStatus: text("analysis_status").default("pending"), // pending, processing, completed, failed
  aiAnalysisCompleted: boolean("ai_analysis_completed").default(false),
  computerVisionProcessed: boolean("computer_vision_processed").default(false),
  
  // Metadata
  tags: jsonb("tags"), // Array of tags
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video Analysis Results from AI/Computer Vision
export const videoAnalysis = pgTable("video_analysis", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videoUploads.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // Computer Vision Results
  playerTrackingData: jsonb("player_tracking_data"), // Coordinates, movement patterns
  ballTrackingData: jsonb("ball_tracking_data"), // Ball position and movement
  heatmapData: jsonb("heatmap_data"), // Player positioning heatmap
  
  // Performance Metrics
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }), // meters
  sprintDistance: decimal("sprint_distance", { precision: 8, scale: 2 }), // meters
  maxSpeed: decimal("max_speed", { precision: 5, scale: 2 }), // km/h
  averageSpeed: decimal("average_speed", { precision: 5, scale: 2 }), // km/h
  
  // Technical Analysis
  touches: integer("touches"),
  passes: integer("passes"),
  passAccuracy: decimal("pass_accuracy", { precision: 5, scale: 2 }), // percentage
  shots: integer("shots"),
  shotsOnTarget: integer("shots_on_target"),
  dribbles: integer("dribbles"),
  dribblesSuccessful: integer("dribbles_successful"),
  
  // Tactical Analysis
  positionHeatmap: jsonb("position_heatmap"), // Field position data
  passNetwork: jsonb("pass_network"), // Passing connections
  defensiveActions: jsonb("defensive_actions"), // Tackles, interceptions, etc.
  
  // AI-Generated Insights
  performanceScore: integer("performance_score"), // 0-100
  keyMoments: jsonb("key_moments"), // Array of timestamped moments
  strengths: jsonb("strengths"), // Array of identified strengths
  weaknesses: jsonb("weaknesses"), // Array of areas for improvement
  recommendations: jsonb("recommendations"), // Array of development suggestions
  
  // Processing metadata
  processingTime: integer("processing_time"), // milliseconds
  confidenceScore: integer("confidence_score"), // 0-100
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video Tags/Events (LongoMatch-style tagging)
export const videoTags = pgTable("video_tags", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videoUploads.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  taggedBy: integer("tagged_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Tag information
  tagType: text("tag_type").notNull(), // goal, assist, pass, shot, dribble, tackle, etc.
  tagCategory: text("tag_category").notNull(), // offensive, defensive, technical, physical
  
  // Timing
  startTime: integer("start_time").notNull(), // seconds from video start
  endTime: integer("end_time"), // seconds from video start (for event ranges)
  
  // Spatial data
  fieldPosition: jsonb("field_position"), // x, y coordinates on field
  
  // Event details
  eventData: jsonb("event_data"), // Additional event-specific data
  outcome: text("outcome"), // successful, unsuccessful, partial
  quality: integer("quality"), // 1-5 rating
  
  // Metadata
  notes: text("notes"),
  isKeyMoment: boolean("is_key_moment").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Predictive Models and Player Potential
export const playerPredictions = pgTable("player_predictions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  generatedBy: integer("generated_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Potential Assessment
  overallPotential: integer("overall_potential"), // 0-100
  technicalPotential: integer("technical_potential"), // 0-100
  physicalPotential: integer("physical_potential"), // 0-100
  mentalPotential: integer("mental_potential"), // 0-100
  
  // Market Value Prediction
  currentMarketValue: decimal("current_market_value", { precision: 10, scale: 2 }),
  predictedMarketValue1Year: decimal("predicted_market_value_1_year", { precision: 10, scale: 2 }),
  predictedMarketValue3Years: decimal("predicted_market_value_3_years", { precision: 10, scale: 2 }),
  predictedMarketValue5Years: decimal("predicted_market_value_5_years", { precision: 10, scale: 2 }),
  
  // Injury Risk Assessment
  injuryRiskScore: integer("injury_risk_score"), // 0-100 (higher = more risk)
  injuryRiskFactors: jsonb("injury_risk_factors"), // Array of risk factors
  recommendedLoadManagement: jsonb("recommended_load_management"), // Training recommendations
  
  // Career Trajectory
  peakAgeEstimate: integer("peak_age_estimate"), // estimated peak age
  careerLongevityScore: integer("career_longevity_score"), // 0-100
  developmentTrajectory: jsonb("development_trajectory"), // Growth curve data
  
  // European League Readiness
  europeReadinessScore: integer("europe_readiness_score"), // 0-100
  recommendedLeagues: jsonb("recommended_leagues"), // Array of suitable leagues
  adaptationTimeframe: text("adaptation_timeframe"), // immediate, 6_months, 1_year, etc.
  
  // Model metadata
  modelVersion: text("model_version").notNull(),
  confidenceLevel: integer("confidence_level"), // 0-100
  dataQuality: integer("data_quality"), // 0-100
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Match Data
export const matchData = pgTable("match_data", {
  id: serial("id").primaryKey(),
  matchId: text("match_id").notNull().unique(), // External match ID
  
  // Match information
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  competition: text("competition").notNull(),
  matchDate: timestamp("match_date").notNull(),
  venue: text("venue"),
  
  // Match state
  status: text("status").notNull(), // scheduled, live, completed, postponed
  currentMinute: integer("current_minute"),
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  
  // Real-time events
  events: jsonb("events"), // Array of match events
  
  // Players involved
  playerIds: jsonb("player_ids"), // Array of player IDs being tracked
  
  // Metadata
  dataSource: text("data_source").notNull(), // api_provider, manual_entry
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Advanced Video Analytics - Match Context
export const matchAnalysis = pgTable("match_analysis", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Match Context
  matchDate: timestamp("match_date").notNull(),
  competition: text("competition").notNull(),
  venue: text("venue"),
  weather: text("weather"),
  temperature: integer("temperature"),
  attendance: integer("attendance"),
  
  // Teams
  homeTeamId: integer("home_team_id").references(() => organizations.id),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamId: integer("away_team_id").references(() => organizations.id),
  awayTeamName: text("away_team_name").notNull(),
  
  // Formation & Tactics
  homeFormation: text("home_formation"), // "4-4-2", "4-3-3", etc.
  awayFormation: text("away_formation"),
  homeTactics: jsonb("home_tactics"), // Tactical setup details
  awayTactics: jsonb("away_tactics"),
  
  // Match Result
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  matchStatus: text("match_status").default("pending"), // pending, in_progress, completed
  
  // Analysis Settings
  analysisType: text("analysis_type").notNull(), // full_match, highlights, opposition_focus
  focusAreas: jsonb("focus_areas"), // Array of analysis focus areas
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Sheets for Match Analysis
export const matchTeamSheets = pgTable("match_team_sheets", {
  id: serial("id").primaryKey(),
  matchAnalysisId: integer("match_analysis_id").notNull().references(() => matchAnalysis.id, { onDelete: "cascade" }),
  team: text("team").notNull(), // "home" or "away"
  
  // Starting XI
  startingXI: jsonb("starting_xi").notNull(), // Array of player objects with positions
  substitutes: jsonb("substitutes"), // Array of substitute players
  
  // Formation details
  formation: text("formation").notNull(),
  captain: text("captain"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Video Files for Analysis
export const analysisVideos = pgTable("analysis_videos", {
  id: serial("id").primaryKey(),
  matchAnalysisId: integer("match_analysis_id").notNull().references(() => matchAnalysis.id, { onDelete: "cascade" }),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // File Information
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  duration: integer("duration"), // seconds
  resolution: text("resolution"), // "1920x1080", etc.
  format: text("format"), // mp4, avi, mov, url
  
  // Storage
  filePath: text("file_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  streamingUrl: text("streaming_url"),
  
  // Processing Status
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  processingProgress: integer("processing_progress").default(0), // 0-100
  
  // Video Type and Metadata
  videoType: text("video_type").notNull(), // full_match, first_half, second_half, highlights, custom_clip
  title: text("title"),
  description: text("description"),
  uploadType: text("upload_type").default("file"), // file, url
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Football Event Types and Categories
export const eventTypes = pgTable("event_types", {
  id: serial("id").primaryKey(),
  
  // Event Classification
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // passing, shooting, defending, possession, set_pieces, etc.
  subcategory: text("subcategory"),
  
  // Position Relevance
  relevantPositions: jsonb("relevant_positions"), // Array of positions this event is relevant for
  
  // Hotkey for Quick Tagging
  hotkey: text("hotkey").unique(),
  
  // Display Properties
  color: text("color").default("#3B82F6"),
  icon: text("icon"),
  description: text("description"),
  
  // Metrics
  hasQualityRating: boolean("has_quality_rating").default(true),
  hasOutcome: boolean("has_outcome").default(true),
  hasFieldPosition: boolean("has_field_position").default(true),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video Event Tags - The Core Tagging System (Aligned with actual DB structure)
export const videoEventTags = pgTable("video_event_tags", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => analysisVideos.id, { onDelete: "cascade" }),
  playerId: integer("player_id"), // Player performing the action
  taggedBy: integer("tagged_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Event Type (using actual DB column names)
  eventType: text("event_type").notNull(), // "goal", "pass", "tackle", etc.
  eventSubtype: text("event_subtype"), // Optional subtype
  
  // Timing
  timestampStart: decimal("timestamp_start").notNull(), // seconds from video start
  timestampEnd: decimal("timestamp_end"), // for events with duration
  
  // Field Position (using actual DB column names)
  fieldX: decimal("field_x"), // 0-100 (% of field width)
  fieldY: decimal("field_y"), // 0-100 (% of field height)
  
  // Event Quality & Outcome
  qualityRating: integer("quality_rating"), // 1-5 rating
  outcome: text("outcome"), // "successful", "unsuccessful", "partially_successful"
  description: text("description"), // Event description/notes
  
  // AI-Specific Fields (backward compatible)
  source: text("source").default("manual"), // "manual", "ai", "hybrid"
  confidence: decimal("confidence"), // AI confidence score (0-100)
  aiModel: text("ai_model"), // AI model version that generated this event
  automatedSource: text("automated_source"), // "computer_vision", "audio_analysis", "pattern_recognition"
  
  // Tags and Labels
  tags: jsonb("tags"), // Array of custom tags
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Sequence Analysis - Linking Related Events
export const eventSequences = pgTable("event_sequences", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => analysisVideos.id, { onDelete: "cascade" }),
  
  // Sequence Details
  name: text("name").notNull(), // "Goal Buildup", "Pressing Sequence", etc.
  description: text("description"),
  
  // Events in Sequence
  eventIds: jsonb("event_ids").notNull(), // Array of videoEventTags IDs
  
  // Timing
  startTimestamp: integer("start_timestamp").notNull(),
  endTimestamp: integer("end_timestamp").notNull(),
  
  // Analysis
  sequenceType: text("sequence_type"), // attack, defense, transition, set_piece
  outcome: text("outcome"), // goal, shot, turnover, clearance, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Player Performance Analysis from Video
export const videoPlayerAnalysis = pgTable("video_player_analysis", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => analysisVideos.id, { onDelete: "cascade" }),
  playerId: integer("player_id"), // Can be null for opposition players
  playerName: text("player_name").notNull(), // For opposition players without profiles
  
  // Basic Stats
  minutesPlayed: integer("minutes_played"),
  position: text("position").notNull(),
  
  // Event Counts
  totalEvents: integer("total_events").default(0),
  successfulEvents: integer("successful_events").default(0),
  unsuccessfulEvents: integer("unsuccessful_events").default(0),
  
  // Position-Specific Metrics
  positionMetrics: jsonb("position_metrics"), // Tailored metrics per position
  
  // Heat Map Data
  heatMapData: jsonb("heat_map_data"), // Array of position coordinates with time spent
  
  // Touch Map
  touchPositions: jsonb("touch_positions"), // All touch positions on field
  
  // Performance Scores
  overallRating: decimal("overall_rating", { precision: 3, scale: 1 }), // 1.0-10.0
  technicalScore: integer("technical_score"), // 1-100
  physicalScore: integer("physical_score"), // 1-100
  mentalScore: integer("mental_score"), // 1-100
  
  // Key Performance Indicators
  keyPasses: integer("key_passes").default(0),
  duelsWon: integer("duels_won").default(0),
  duelsLost: integer("duels_lost").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analysis Reports and Insights
export const videoAnalysisReports = pgTable("video_analysis_reports", {
  id: serial("id").primaryKey(),
  matchAnalysisId: integer("match_analysis_id").notNull().references(() => matchAnalysis.id, { onDelete: "cascade" }),
  generatedBy: integer("generated_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Report Details
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // team_performance, player_focus, opposition_analysis, tactical_analysis
  
  // Content
  executiveSummary: text("executive_summary"),
  keyFindings: jsonb("key_findings"), // Array of key insights
  detailedAnalysis: text("detailed_analysis"),
  
  // Data and Visualizations
  chartData: jsonb("chart_data"), // Data for charts and graphs
  heatMaps: jsonb("heat_maps"), // Heat map data
  passNetworks: jsonb("pass_networks"), // Pass network analysis
  
  // Recommendations
  recommendations: jsonb("recommendations"), // Array of actionable insights
  areasForImprovement: jsonb("areas_for_improvement"),
  
  // Export and Sharing
  isPublic: boolean("is_public").default(false),
  shareToken: text("share_token").unique(),
  pdfUrl: text("pdf_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Player Performance in Matches
export const livePlayerStats = pgTable("live_player_stats", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchData.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // Real-time statistics
  minutesPlayed: integer("minutes_played").default(0),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  shots: integer("shots").default(0),
  shotsOnTarget: integer("shots_on_target").default(0),
  passes: integer("passes").default(0),
  passesCompleted: integer("passes_completed").default(0),
  crosses: integer("crosses").default(0),
  crossesCompleted: integer("crosses_completed").default(0),
  dribbles: integer("dribbles").default(0),
  dribblesSuccessful: integer("dribbles_successful").default(0),
  tackles: integer("tackles").default(0),
  interceptions: integer("interceptions").default(0),
  clearances: integer("clearances").default(0),
  fouls: integer("fouls").default(0),
  yellowCards: integer("yellow_cards").default(0),
  redCards: integer("red_cards").default(0),
  
  // Physical data
  distanceCovered: decimal("distance_covered", { precision: 8, scale: 2 }), // meters
  sprintsCovered: integer("sprints_covered").default(0),
  maxSpeed: decimal("max_speed", { precision: 5, scale: 2 }), // km/h
  
  // Position data
  averagePosition: jsonb("average_position"), // x, y coordinates
  heatmapData: jsonb("heatmap_data"), // Position frequency data
  
  // Performance rating
  liveRating: decimal("live_rating", { precision: 3, scale: 1 }), // 1.0-10.0
  
  // Metadata
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Comprehensive Tagging Events System
export const taggingEvents = pgTable("tagging_events", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  videoId: integer("video_id").notNull(),
  playerId: integer("player_id"),
  playerName: text("player_name").notNull(),
  teamId: integer("team_id"),
  teamName: text("team_name").notNull(),
  userId: integer("user_id").notNull(), // User who created the tag
  
  // Event timing and positioning
  timestampStart: integer("timestamp_start").notNull(), // seconds
  timestampEnd: integer("timestamp_end"), // seconds (for duration events)
  minute: integer("minute").notNull(), // match minute
  fieldPositionX: integer("field_position_x"), // 0-100 (field percentage)
  fieldPositionY: integer("field_position_y"), // 0-100 (field percentage)
  
  // Event categorization
  eventCategory: text("event_category").notNull(), // passing, shooting, defensive, etc.
  eventType: text("event_type").notNull(), // Short Pass Key, Standing Tackle Crucial, etc.
  eventSubType: text("event_sub_type"), // Simple, Key, Crucial, Unsuccessful
  
  // Event outcome and quality
  isSuccessful: boolean("is_successful").notNull().default(true),
  qualityRating: integer("quality_rating").notNull(), // 1-5 scale
  confidenceScore: integer("confidence_score").default(100), // 0-100 (AI confidence)
  
  // Event details and metadata
  eventValue: jsonb("event_value"), // Flexible data: distance, speed, accuracy, etc.
  eventNotes: text("event_notes"),
  isKeyAction: boolean("is_key_action").default(false),
  isCrucialAction: boolean("is_crucial_action").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
});

// Player Performance Metrics (aggregated from tagging events)
export const playerPerformanceMetrics = pgTable("player_performance_metrics", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  playerId: integer("player_id").notNull(),
  playerName: text("player_name").notNull(),
  teamId: integer("team_id"),
  teamName: text("team_name").notNull(),
  
  // General match info
  position: text("position").notNull(),
  jerseyNumber: integer("jersey_number"),
  gameTime: integer("game_time").notNull(), // minutes played
  
  // Passing metrics
  shortPassSimple: integer("short_pass_simple").default(0),
  shortPassKey: integer("short_pass_key").default(0),
  shortPassUnsuccessful: integer("short_pass_unsuccessful").default(0),
  shortPassAssist: integer("short_pass_assist").default(0),
  longPassSimple: integer("long_pass_simple").default(0),
  longPassKey: integer("long_pass_key").default(0),
  longPassAssist: integer("long_pass_assist").default(0),
  longPassUnsuccessful: integer("long_pass_unsuccessful").default(0),
  
  // Defensive metrics
  standingTackleSimple: integer("standing_tackle_simple").default(0),
  standingTackleCrucial: integer("standing_tackle_crucial").default(0),
  standingTackleUnsuccessful: integer("standing_tackle_unsuccessful").default(0),
  slidingTackleSimple: integer("sliding_tackle_simple").default(0),
  slidingTackleCrucial: integer("sliding_tackle_crucial").default(0),
  slidingTackleUnsuccessful: integer("sliding_tackle_unsuccessful").default(0),
  interceptionSimple: integer("interception_simple").default(0),
  interceptionCrucial: integer("interception_crucial").default(0),
  
  // Shooting metrics
  totalGoals: integer("total_goals").default(0),
  totalGoalsPer90: decimal("total_goals_per_90", { precision: 5, scale: 2 }),
  closeShotsOnTarget: integer("close_shots_on_target").default(0),
  longShotsOnTarget: integer("long_shots_on_target").default(0),
  totalShots: integer("total_shots").default(0),
  shotAccuracy: decimal("shot_accuracy", { precision: 5, scale: 2 }),
  
  // Physical duel metrics
  groundDuelsWon: integer("ground_duels_won").default(0),
  groundDuelsLost: integer("ground_duels_lost").default(0),
  aerialDuelsWon: integer("aerial_duels_won").default(0),
  aerialDuelsLost: integer("aerial_duels_lost").default(0),
  
  // Overall rating
  overallRating: decimal("overall_rating", { precision: 3, scale: 1 }),
  positionSpecificRating: decimal("position_specific_rating", { precision: 3, scale: 1 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isActive: true,
  isSuspended: true,
  suspendedAt: true,
  suspendedBy: true,
  lastLogin: true,
  emailVerificationToken: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  twoFactorSecret: true,
  loginAttempts: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({
  id: true,
  timestamp: true,
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  timestamp: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  isVerified: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  marketValue: z.union([
    z.string().transform((val) => val === "" ? null : parseFloat(val)),
    z.number(),
    z.null()
  ]).optional()
});

export const insertPlayerStatsSchema = createInsertSchema(player_stats).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerVideoSchema = createInsertSchema(player_videos).omit({
  id: true,
  createdAt: true,
});

export const insertMatchPerformanceSchema = createInsertSchema(match_performances).omit({
  id: true,
  createdAt: true,
});

export const insertScoutingReportSchema = createInsertSchema(scouting_reports).omit({
  id: true,
  createdAt: true,
});

export const insertAIReportSchema = createInsertSchema(aiReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Video Analytics Insert Schemas
export const insertMatchAnalysisSchema = createInsertSchema(matchAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchTeamSheetSchema = createInsertSchema(matchTeamSheets).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisVideoSchema = createInsertSchema(analysisVideos).omit({
  id: true,
  createdAt: true,
});

export const insertEventTypeSchema = createInsertSchema(eventTypes).omit({
  id: true,
  createdAt: true,
});

export const insertVideoEventTagSchema = createInsertSchema(videoEventTags).omit({
  id: true,
  createdAt: true,
});

export const insertEventSequenceSchema = createInsertSchema(eventSequences).omit({
  id: true,
  createdAt: true,
});

export const insertVideoPlayerAnalysisSchema = createInsertSchema(videoPlayerAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoAnalysisReportSchema = createInsertSchema(videoAnalysisReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;

export type PlayerStats = typeof player_stats.$inferSelect;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;

export type PlayerVideo = typeof player_videos.$inferSelect;
export type InsertPlayerVideo = z.infer<typeof insertPlayerVideoSchema>;

export type MatchPerformance = typeof match_performances.$inferSelect;
export type InsertMatchPerformance = z.infer<typeof insertMatchPerformanceSchema>;

export type ScoutingReport = typeof scouting_reports.$inferSelect;
export type InsertScoutingReport = z.infer<typeof insertScoutingReportSchema>;

export type AIReport = typeof aiReports.$inferSelect;
export type InsertAIReport = z.infer<typeof insertAIReportSchema>;

// Video Analytics Types
export type MatchAnalysis = typeof matchAnalysis.$inferSelect;
export type InsertMatchAnalysis = z.infer<typeof insertMatchAnalysisSchema>;

export type MatchTeamSheet = typeof matchTeamSheets.$inferSelect;
export type InsertMatchTeamSheet = z.infer<typeof insertMatchTeamSheetSchema>;

export type AnalysisVideo = typeof analysisVideos.$inferSelect;
export type InsertAnalysisVideo = z.infer<typeof insertAnalysisVideoSchema>;

export type EventType = typeof eventTypes.$inferSelect;
export type InsertEventType = z.infer<typeof insertEventTypeSchema>;

export type VideoEventTag = typeof videoEventTags.$inferSelect;
export type InsertVideoEventTag = z.infer<typeof insertVideoEventTagSchema>;

export type EventSequence = typeof eventSequences.$inferSelect;
export type InsertEventSequence = z.infer<typeof insertEventSequenceSchema>;

export type VideoPlayerAnalysis = typeof videoPlayerAnalysis.$inferSelect;
export type InsertVideoPlayerAnalysis = z.infer<typeof insertVideoPlayerAnalysisSchema>;

export type VideoAnalysisReport = typeof videoAnalysisReports.$inferSelect;
export type InsertVideoAnalysisReport = z.infer<typeof insertVideoAnalysisReportSchema>;

export const insertVideoUploadSchema = createInsertSchema(videoUploads).omit({
  id: true,
  analysisStatus: true,
  aiAnalysisCompleted: true,
  computerVisionProcessed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoAnalysisSchema = createInsertSchema(videoAnalysis).omit({
  id: true,
  processingTime: true,
  confidenceScore: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoTagSchema = createInsertSchema(videoTags).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerPredictionSchema = createInsertSchema(playerPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchDataSchema = createInsertSchema(matchData).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertLivePlayerStatsSchema = createInsertSchema(livePlayerStats).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export type VideoUpload = typeof videoUploads.$inferSelect;
export type InsertVideoUpload = z.infer<typeof insertVideoUploadSchema>;

export type VideoAnalysis = typeof videoAnalysis.$inferSelect;
export type InsertVideoAnalysis = z.infer<typeof insertVideoAnalysisSchema>;

export type VideoTag = typeof videoTags.$inferSelect;
export type InsertVideoTag = z.infer<typeof insertVideoTagSchema>;

export type PlayerPrediction = typeof playerPredictions.$inferSelect;
export type InsertPlayerPrediction = z.infer<typeof insertPlayerPredictionSchema>;

export type MatchData = typeof matchData.$inferSelect;
export type InsertMatchData = z.infer<typeof insertMatchDataSchema>;

export type LivePlayerStats = typeof livePlayerStats.$inferSelect;
export type InsertLivePlayerStats = z.infer<typeof insertLivePlayerStatsSchema>;

// Email notifications schemas
export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserVerificationRequestSchema = createInsertSchema(userVerificationRequests).omit({
  id: true,
  submittedAt: true,
});

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;

export type UserVerificationRequest = typeof userVerificationRequests.$inferSelect;
export type InsertUserVerificationRequest = z.infer<typeof insertUserVerificationRequestSchema>;

// Super Admin Platform Settings
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull(), // system, features, security, billing
  dataType: text("data_type").notNull().default("string"), // string, number, boolean, json
  isPublic: boolean("is_public").default(false), // Can be accessed by non-admins
  isEditable: boolean("is_editable").default(true), // Can be modified
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform Usage Analytics
export const platformAnalytics = pgTable("platform_analytics", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  metric: text("metric").notNull(), // daily_active_users, new_registrations, subscription_conversions, etc.
  value: integer("value").notNull(),
  additionalData: jsonb("additional_data"), // Extra metrics data
  createdAt: timestamp("created_at").defaultNow(),
});

// Reported Content Management
export const reportedContent = pgTable("reported_content", {
  id: serial("id").primaryKey(),
  reportedBy: integer("reported_by").notNull().references(() => users.id),
  contentType: text("content_type").notNull(), // user_profile, player_profile, scouting_report, comment
  contentId: integer("content_id").notNull(),
  reason: text("reason").notNull(), // spam, inappropriate, fraud, copyright, other
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, reviewed, resolved, dismissed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  actionTaken: text("action_taken"), // none, warning, suspension, deletion, content_removal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Super Admin Action Logs
export const superAdminLogs = pgTable("super_admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  action: text("action").notNull(), // subscription_override, user_deletion, platform_setting_change, etc.
  targetType: text("target_type"), // user, player, setting, subscription
  targetId: text("target_id"), // ID of affected entity
  details: jsonb("details"), // Complete action details
  reason: text("reason"), // Why the action was taken
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform Maintenance Mode
export const maintenanceMode = pgTable("maintenance_mode", {
  id: serial("id").primaryKey(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  message: text("message"), // Message to display to users
  allowedRoles: text("allowed_roles"), // JSON array of roles that can access during maintenance
  enabledBy: integer("enabled_by").notNull().references(() => users.id),
  disabledBy: integer("disabled_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for super admin tables
export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformAnalyticsSchema = createInsertSchema(platformAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertReportedContentSchema = createInsertSchema(reportedContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSuperAdminLogSchema = createInsertSchema(superAdminLogs).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceModeSchema = createInsertSchema(maintenanceMode).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for super admin tables
export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;

export type PlatformAnalytics = typeof platformAnalytics.$inferSelect;
export type InsertPlatformAnalytics = z.infer<typeof insertPlatformAnalyticsSchema>;

export type ReportedContent = typeof reportedContent.$inferSelect;
export type InsertReportedContent = z.infer<typeof insertReportedContentSchema>;

export type SuperAdminLog = typeof superAdminLogs.$inferSelect;
export type InsertSuperAdminLog = z.infer<typeof insertSuperAdminLogSchema>;

export type MaintenanceMode = typeof maintenanceMode.$inferSelect;
export type InsertMaintenanceMode = z.infer<typeof insertMaintenanceModeSchema>;

// Utility types for frontend
export interface PlayerWithStats extends Player {
  stats?: PlayerStats;
  currentClub?: Organization;
  videos?: PlayerVideo[];
  latestReport?: ScoutingReport;
}

export interface PlayerSearchFilters {
  searchQuery?: string;
  position?: string;
  nationality?: string;
  ageMin?: number;
  ageMax?: number;
  marketValueMin?: number;
  marketValueMax?: number;
  clubId?: number;
  hasVideos?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// Note: Football positions are now defined in shared/constants.ts as FOOTBALL_POSITIONS
// This ensures consistency across all forms and database operations

// African countries for dropdown
export const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon",
  "Cape Verde", "Central African Republic", "Chad", "Comoros", "Congo", "DR Congo",
  "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia",
  "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya",
  "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania",
  "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia",
  "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda",
  "Zambia", "Zimbabwe"
] as const;

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Basic, Pro, Enterprise
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull(), // monthly, yearly
  stripePriceId: text("stripe_price_id").notNull(),
  features: jsonb("features").notNull(), // JSON array of features
  maxCredits: integer("max_credits").notNull(),
  maxUsers: integer("max_users").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions for revenue tracking
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // subscription, report_purchase, credit_purchase, commission
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  description: text("description").notNull(),
  status: text("status").notNull(), // pending, completed, failed, refunded
  metadata: jsonb("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue from football brands and partnerships
export const brandPartnerships = pgTable("brand_partnerships", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  partnershipType: text("partnership_type").notNull(), // affiliate, sponsorship, commission
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }), // Percentage
  isActive: boolean("is_active").default(true),
  contactEmail: text("contact_email"),
  contractStart: date("contract_start"),
  contractEnd: date("contract_end"),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Brand revenue tracking
export const brandCommissions = pgTable("brand_commissions", {
  id: serial("id").primaryKey(),
  partnershipId: integer("partnership_id").notNull().references(() => brandPartnerships.id),
  userId: integer("user_id").references(() => users.id), // User who generated the commission
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceId: text("reference_id"), // External tracking ID
  status: text("status").notNull().default("pending"), // pending, paid, cancelled
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit usage tracking
export const creditUsage = pgTable("credit_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  feature: text("feature").notNull(), // ai_analysis, report_generation, player_comparison
  creditsUsed: integer("credits_used").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Skill Challenges for Players and Teams
export const skillChallenges = pgTable("skill_challenges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  challengeType: text("challenge_type").notNull(), // individual, team, technical, fitness
  category: text("category").notNull(), // dribbling, shooting, passing, defending, goalkeeping
  entryFee: decimal("entry_fee", { precision: 10, scale: 2 }).notNull(),
  prizePool: decimal("prize_pool", { precision: 10, scale: 2 }).notNull(),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationDeadline: timestamp("registration_deadline").notNull(),
  rules: text("rules").notNull(),
  judging: text("judging").notNull(), // How scoring/judging works
  status: text("status").notNull().default("upcoming"), // upcoming, active, completed, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenge Participants
export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => skillChallenges.id),
  participantId: integer("participant_id").notNull().references(() => users.id),
  participantType: text("participant_type").notNull(), // individual, team
  teamName: text("team_name"), // For team challenges
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, refunded
  submissionStatus: text("submission_status").default("not_submitted"), // not_submitted, submitted, judged
  score: decimal("score", { precision: 10, scale: 2 }),
  rank: integer("rank"),
  videoUrl: text("video_url"), // Submitted performance video
  notes: text("notes"), // Judge notes
  registeredAt: timestamp("registered_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  judgedAt: timestamp("judged_at"),
});

// Challenge Leaderboards
export const challengeLeaderboards = pgTable("challenge_leaderboards", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => skillChallenges.id),
  participantId: integer("participant_id").notNull().references(() => users.id),
  score: decimal("score", { precision: 10, scale: 2 }).notNull(),
  rank: integer("rank").notNull(),
  prizeAwarded: decimal("prize_awarded", { precision: 10, scale: 2 }),
  prizeStatus: text("prize_status").default("pending"), // pending, paid, claimed
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feature Entitlements and Permissions
export const featureEntitlements = pgTable("feature_entitlements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  feature: text("feature").notNull(), // ai_analytics, video_tagging, pdf_export, api_access, bulk_upload
  isEnabled: boolean("is_enabled").default(false),
  usageLimit: integer("usage_limit"), // Monthly limit for feature usage
  usedThisMonth: integer("used_this_month").default(0),
  lastReset: timestamp("last_reset").defaultNow(),
  grantedBy: integer("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Site-wide Analytics and Metrics
export const siteAnalytics = pgTable("site_analytics", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  metric: text("metric").notNull(), // daily_active_users, conversions, revenue, feature_usage
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  category: text("category"), // user_engagement, monetization, feature_adoption
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Engagement Tracking
export const userEngagement = pgTable("user_engagement", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // page_view, feature_use, report_download, video_upload
  page: text("page"),
  feature: text("feature"),
  duration: integer("duration"), // Time spent in seconds
  metadata: jsonb("metadata"),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversion Tracking
export const conversionEvents = pgTable("conversion_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(), // subscription_upgrade, feature_unlock, report_purchase
  fromTier: text("from_tier"), // Previous subscription tier
  toTier: text("to_tier"), // New subscription tier
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  conversionPath: text("conversion_path"), // Page journey leading to conversion
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Independent Player Analysis - User-uploaded players for analysis
export const independentPlayers = pgTable("independent_players", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Player information matching actual database structure
  name: text("player_name").notNull(),
  age: integer("age"),
  position: text("position").notNull(),
  nationality: text("nationality"),
  dateOfBirth: date("date_of_birth"),
  preferredFoot: text("preferred_foot"),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  marketValue: text("market_value"),
  currentClub: text("current_club"),
  contractExpiresDate: date("contract_expires_date"),
  agentEmail: text("agent_email"),
  agentPhone: text("agent_phone"),
  playerEmail: text("player_email"),
  additionalNotes: text("additional_notes"),
  
  // Status and admin fields
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Independent Analysis Sessions - Track usage and billing
export const independentAnalysisSessions = pgTable("independent_analysis_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  independentPlayerId: integer("independent_player_id").notNull().references(() => independentPlayers.id, { onDelete: "cascade" }),
  
  // Session details
  sessionType: text("session_type").notNull(), // initial_analysis, re_analysis, comparison
  analysisType: text("analysis_type").notNull(), // performance, scouting, valuation, comparison
  
  // Cost and billing
  costType: text("cost_type").notNull(), // free_trial, credits, subscription, one_time_payment
  creditsCharged: integer("credits_charged").default(0),
  amountCharged: decimal("amount_charged", { precision: 10, scale: 2 }).default("0.00"),
  
  // Analysis results
  resultsGenerated: jsonb("results_generated"),
  processingTime: integer("processing_time"), // seconds
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI confidence score
  
  // User interaction
  viewed: boolean("viewed").default(false),
  downloadedPdf: boolean("downloaded_pdf").default(false),
  shared: boolean("shared").default(false),
  feedbackRating: integer("feedback_rating"), // 1-5 stars
  feedbackNotes: text("feedback_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit Purchase History
export const creditPurchases = pgTable("credit_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Purchase details
  creditsAmount: integer("credits_amount").notNull(),
  pricePerCredit: decimal("price_per_credit", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),
  
  // Payment processing
  paymentProvider: text("payment_provider").notNull(), // stripe, paypal, manual
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed, refunded
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  
  // Bonus credits and promotions
  bonusCredits: integer("bonus_credits").default(0),
  promotionCode: text("promotion_code"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Promotion Requests - Users requesting independent players be added to main database
export const promotionRequests = pgTable("promotion_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  independentPlayerId: integer("independent_player_id").notNull().references(() => independentPlayers.id, { onDelete: "cascade" }),
  
  // Request details
  requestReason: text("request_reason").notNull(),
  additionalInfo: text("additional_info"),
  suggestedClub: text("suggested_club"),
  suggestedLeague: text("suggested_league"),
  
  // Processing
  status: text("status").notNull().default("pending"), // pending, approved, rejected, needs_more_info
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
  adminNotes: text("admin_notes"),
  
  // Payment for promotion (optional premium feature)
  promotionFee: decimal("promotion_fee", { precision: 10, scale: 2 }).default("0.00"),
  paymentStatus: text("payment_status").default("not_required"), // not_required, pending, paid
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for independent player analysis
export const insertIndependentPlayerSchema = createInsertSchema(independentPlayers);
export const insertIndependentAnalysisSessionSchema = createInsertSchema(independentAnalysisSessions);
export const insertCreditPurchaseSchema = createInsertSchema(creditPurchases);
export const insertPromotionRequestSchema = createInsertSchema(promotionRequests);

// Types for independent player analysis
export type IndependentPlayer = typeof independentPlayers.$inferSelect;
export type InsertIndependentPlayer = z.infer<typeof insertIndependentPlayerSchema>;
export type IndependentAnalysisSession = typeof independentAnalysisSessions.$inferSelect;
export type InsertIndependentAnalysisSession = z.infer<typeof insertIndependentAnalysisSessionSchema>;
export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = z.infer<typeof insertCreditPurchaseSchema>;
export type PromotionRequest = typeof promotionRequests.$inferSelect;
export type InsertPromotionRequest = z.infer<typeof insertPromotionRequestSchema>;