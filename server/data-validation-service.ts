import { db } from "./db";
import { players, player_stats, organizations } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

/**
 * Data Validation Service for Player Analysis
 * Ensures data consistency and prevents analysis on non-existent players
 */

export interface PlayerValidationResult {
  isValid: boolean;
  playerId?: number;
  playerName?: string;
  errors?: string[];
}

export interface PlayersValidationResult {
  validPlayers: Array<{ id: number; name: string }>;
  invalidPlayers: string[];
  errors?: string[];
}

export class DataValidationService {
  
  /**
   * Validate single player exists in database
   */
  static async validatePlayer(playerName: string): Promise<PlayerValidationResult> {
    try {
      const player = await db
        .select({ 
          id: players.id,
          name: sql`${players.firstName} || ' ' || ${players.lastName}`.as('name')
        })
        .from(players)
        .where(
          and(
            sql`${players.firstName} || ' ' || ${players.lastName} = ${playerName}`,
            eq(players.isActive, true)
          )
        )
        .limit(1);

      if (player.length === 0) {
        return {
          isValid: false,
          errors: [`Player "${playerName}" not found in database`]
        };
      }

      return {
        isValid: true,
        playerId: player[0].id,
        playerName: player[0].name
      };
    } catch (error) {
      console.error('Player validation error:', error);
      return {
        isValid: false,
        errors: [`Database error validating player "${playerName}"`]
      };
    }
  }

  /**
   * Validate multiple players exist in database
   */
  static async validatePlayers(playerNames: string[]): Promise<PlayersValidationResult> {
    try {
      const validPlayers = await db
        .select({ 
          id: players.id,
          name: sql`${players.firstName} || ' ' || ${players.lastName}`.as('name')
        })
        .from(players)
        .where(
          and(
            inArray(sql`${players.firstName} || ' ' || ${players.lastName}`, playerNames),
            eq(players.isActive, true)
          )
        );

      const validPlayerNames = validPlayers.map(p => p.name);
      const invalidPlayers = playerNames.filter(name => !validPlayerNames.includes(name));

      return {
        validPlayers: validPlayers.map(p => ({ id: p.id, name: p.name })),
        invalidPlayers,
        errors: invalidPlayers.length > 0 ? 
          [`Players not found in database: ${invalidPlayers.join(', ')}`] : undefined
      };
    } catch (error) {
      console.error('Players validation error:', error);
      return {
        validPlayers: [],
        invalidPlayers: playerNames,
        errors: ['Database error validating players']
      };
    }
  }

  /**
   * Get live player data with statistics for analysis
   */
  static async getPlayerAnalysisData(playerId: number) {
    try {
      const playerData = await db
        .select({
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          name: sql`${players.firstName} || ' ' || ${players.lastName}`.as('name'),
          position: players.position,
          age: sql`EXTRACT(year FROM AGE(${players.dateOfBirth}))`.as('age'),
          nationality: players.nationality,
          height: players.height,
          weight: players.weight,
          preferredFoot: players.preferredFoot,
          marketValue: players.marketValue,
          club: organizations.name,
          // Statistics
          goals: player_stats.goals,
          assists: player_stats.assists,
          matchesPlayed: player_stats.matchesPlayed,
          averageRating: player_stats.averageRating,
          passAccuracy: player_stats.passAccuracy,
          shotAccuracy: player_stats.shotAccuracy,
          tackles: player_stats.tackles,
          interceptions: player_stats.interceptions,
          yellowCards: player_stats.yellowCards,
          redCards: player_stats.redCards,
          minutesPlayed: player_stats.minutesPlayed
        })
        .from(players)
        .leftJoin(organizations, eq(players.currentClubId, organizations.id))
        .leftJoin(player_stats, eq(players.id, player_stats.playerId))
        .where(
          and(
            eq(players.id, playerId),
            eq(players.isActive, true)
          )
        )
        .limit(1);

      return playerData[0] || null;
    } catch (error) {
      console.error('Error fetching player analysis data:', error);
      return null;
    }
  }

  /**
   * Validate database connection and data integrity
   */
  static async validateDataIntegrity(): Promise<{ isHealthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check if tables exist and have data
      const playerCount = await db.select({ count: sql`count(*)` }).from(players);
      const activePlayers = await db.select({ count: sql`count(*)` }).from(players).where(eq(players.isActive, true));
      
      if (Number(playerCount[0].count) === 0) {
        issues.push('No players found in database');
      }
      
      if (Number(activePlayers[0].count) === 0) {
        issues.push('No active players found in database');
      }

      // Check for players without statistics
      const playersWithoutStats = await db
        .select({ count: sql`count(*)` })
        .from(players)
        .leftJoin(player_stats, eq(players.id, player_stats.playerId))
        .where(
          and(
            eq(players.isActive, true),
            sql`${player_stats.playerId} IS NULL`
          )
        );

      if (Number(playersWithoutStats[0].count) > 0) {
        issues.push(`${playersWithoutStats[0].count} active players missing statistics`);
      }

      return {
        isHealthy: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Data integrity check failed:', error);
      return {
        isHealthy: false,
        issues: ['Database connection error during integrity check']
      };
    }
  }
}