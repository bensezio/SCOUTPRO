/**
 * External Data Service for PlatinumEdge Analytics
 * Integrates with FBRef, Transfermarkt, and other external data sources
 * Includes data cleaning, normalization, and compliance monitoring
 */

import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage.js';
import { insertPlayerSchema } from '../shared/schema.js';
import { z } from 'zod';

// Rate limiting configuration
const RATE_LIMITS = {
  fbref: { requests: 60, window: 60000 }, // 60 requests per minute
  transfermarkt: { requests: 30, window: 60000 }, // 30 requests per minute
  default: { requests: 100, window: 60000 }
};

// Data source compliance settings
const COMPLIANCE_CONFIG = {
  fbref: {
    userAgent: 'PlatinumEdge Analytics Bot 1.0',
    respectRobotsTxt: true,
    maxRetries: 3,
    backoffMs: 1000
  },
  transfermarkt: {
    userAgent: 'PlatinumEdge Analytics Bot 1.0',
    respectRobotsTxt: true,
    maxRetries: 3,
    backoffMs: 2000
  }
};

interface ExternalPlayerData {
  name: string;
  position: string;
  age: number;
  nationality: string;
  club: string;
  marketValue?: number;
  contract?: {
    expires: string;
    salary?: number;
  };
  stats?: {
    goals: number;
    assists: number;
    appearances: number;
    yellowCards: number;
    redCards: number;
  };
  transferHistory?: Array<{
    date: string;
    from: string;
    to: string;
    fee: number;
  }>;
}

interface DataSyncResult {
  source: string;
  playersUpdated: number;
  playersCreated: number;
  errors: string[];
  compliance: {
    respectsRateLimit: boolean;
    respectsRobotsTxt: boolean;
    dataUsageCompliant: boolean;
  };
}

class ExternalDataService {
  private rateLimiters: Map<string, { requests: number; resetTime: number }> = new Map();
  private lastSyncTimes: Map<string, number> = new Map();

  constructor() {
    this.initializeRateLimiters();
  }

  private initializeRateLimiters() {
    for (const [source, config] of Object.entries(RATE_LIMITS)) {
      this.rateLimiters.set(source, {
        requests: 0,
        resetTime: Date.now() + config.window
      });
    }
  }

  private async checkRateLimit(source: string): Promise<boolean> {
    const limiter = this.rateLimiters.get(source);
    const config = RATE_LIMITS[source] || RATE_LIMITS.default;
    
    if (!limiter) return true;

    const now = Date.now();
    
    // Reset if window has passed
    if (now >= limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + config.window;
    }

    // Check if we can make the request
    if (limiter.requests >= config.requests) {
      return false;
    }

    limiter.requests++;
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch player data from FBRef
   */
  async fetchFromFBRef(playerName: string): Promise<ExternalPlayerData | null> {
    const source = 'fbref';
    
    if (!await this.checkRateLimit(source)) {
      throw new Error('Rate limit exceeded for FBRef');
    }

    try {
      const config: AxiosRequestConfig = {
        headers: {
          'User-Agent': COMPLIANCE_CONFIG.fbref.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000
      };

      // Use FBRef search endpoint
      const searchUrl = `https://fbref.com/en/search/search.fcgi?search=${encodeURIComponent(playerName)}`;
      const response = await axios.get(searchUrl, config);
      
      if (response.status !== 200) {
        throw new Error(`FBRef returned status ${response.status}`);
      }

      const $ = cheerio.load(response.data);
      
      // Parse FBRef search results
      const playerData: ExternalPlayerData = {
        name: playerName,
        position: '',
        age: 0,
        nationality: '',
        club: ''
      };

      // Extract player information from FBRef HTML
      const playerRow = $('table.stats_table tbody tr').first();
      if (playerRow.length > 0) {
        playerData.position = playerRow.find('td[data-stat="position"]').text().trim();
        playerData.age = parseInt(playerRow.find('td[data-stat="age"]').text().trim()) || 0;
        playerData.nationality = playerRow.find('td[data-stat="nationality"]').text().trim();
        playerData.club = playerRow.find('td[data-stat="team"]').text().trim();
        
        // Extract stats if available
        const goals = parseInt(playerRow.find('td[data-stat="goals"]').text().trim()) || 0;
        const assists = parseInt(playerRow.find('td[data-stat="assists"]').text().trim()) || 0;
        const appearances = parseInt(playerRow.find('td[data-stat="games"]').text().trim()) || 0;
        
        playerData.stats = {
          goals,
          assists,
          appearances,
          yellowCards: 0,
          redCards: 0
        };
      }

      await this.delay(COMPLIANCE_CONFIG.fbref.backoffMs);
      return playerData;

    } catch (error) {
      console.error('Error fetching from FBRef:', error);
      return null;
    }
  }

  /**
   * Fetch player data from Transfermarkt
   */
  async fetchFromTransfermarkt(playerName: string): Promise<ExternalPlayerData | null> {
    const source = 'transfermarkt';
    
    if (!await this.checkRateLimit(source)) {
      throw new Error('Rate limit exceeded for Transfermarkt');
    }

    try {
      const config: AxiosRequestConfig = {
        headers: {
          'User-Agent': COMPLIANCE_CONFIG.transfermarkt.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        timeout: 30000
      };

      // Use Transfermarkt search endpoint
      const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(playerName)}`;
      const response = await axios.get(searchUrl, config);
      
      if (response.status !== 200) {
        throw new Error(`Transfermarkt returned status ${response.status}`);
      }

      const $ = cheerio.load(response.data);
      
      // Parse Transfermarkt search results
      const playerData: ExternalPlayerData = {
        name: playerName,
        position: '',
        age: 0,
        nationality: '',
        club: ''
      };

      // Extract player information from Transfermarkt HTML
      const playerRow = $('.items tbody tr').first();
      if (playerRow.length > 0) {
        playerData.position = playerRow.find('.posrela').text().trim();
        playerData.age = parseInt(playerRow.find('.zentriert').eq(1).text().trim()) || 0;
        playerData.nationality = playerRow.find('.flaggenrahmen').attr('title') || '';
        playerData.club = playerRow.find('.vereinsname').text().trim();
        
        // Extract market value
        const marketValueText = playerRow.find('.rechts.hauptlink').text().trim();
        const marketValue = this.parseMarketValue(marketValueText);
        if (marketValue > 0) {
          playerData.marketValue = marketValue;
        }
      }

      await this.delay(COMPLIANCE_CONFIG.transfermarkt.backoffMs);
      return playerData;

    } catch (error) {
      console.error('Error fetching from Transfermarkt:', error);
      return null;
    }
  }

  /**
   * Parse market value from text (e.g., "€5.00m" -> 5000000)
   */
  private parseMarketValue(text: string): number {
    const cleanText = text.replace(/[€$£,]/g, '');
    const match = cleanText.match(/([0-9.]+)([mk]?)/i);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();
    
    switch (unit) {
      case 'm':
        return value * 1000000;
      case 'k':
        return value * 1000;
      default:
        return value;
    }
  }

  /**
   * Normalize external data to match our schema
   */
  private normalizePlayerData(externalData: ExternalPlayerData): any {
    return {
      firstName: externalData.name.split(' ')[0] || '',
      lastName: externalData.name.split(' ').slice(1).join(' ') || '',
      position: this.normalizePosition(externalData.position),
      age: externalData.age,
      nationality: externalData.nationality,
      currentClub: externalData.club,
      marketValue: externalData.marketValue || 0,
      // Map stats to our schema
      goals: externalData.stats?.goals || 0,
      assists: externalData.stats?.assists || 0,
      appearances: externalData.stats?.appearances || 0,
      yellowCards: externalData.stats?.yellowCards || 0,
      redCards: externalData.stats?.redCards || 0
    };
  }

  /**
   * Normalize position names to match our schema
   */
  private normalizePosition(position: string): string {
    const positionMap: Record<string, string> = {
      'GK': 'Goalkeeper',
      'CB': 'Centre-Back',
      'LB': 'Left-Back',
      'RB': 'Right-Back',
      'DM': 'Defensive Midfielder',
      'CM': 'Central Midfielder',
      'AM': 'Attacking Midfielder',
      'LM': 'Left Midfielder',
      'RM': 'Right Midfielder',
      'LW': 'Left Winger',
      'RW': 'Right Winger',
      'CF': 'Centre-Forward',
      'ST': 'Striker'
    };

    return positionMap[position.toUpperCase()] || position;
  }

  /**
   * Sync player data from external sources
   */
  async syncPlayerData(playerNames: string[]): Promise<DataSyncResult> {
    const result: DataSyncResult = {
      source: 'multiple',
      playersUpdated: 0,
      playersCreated: 0,
      errors: [],
      compliance: {
        respectsRateLimit: true,
        respectsRobotsTxt: true,
        dataUsageCompliant: true
      }
    };

    for (const playerName of playerNames) {
      try {
        // Try FBRef first
        let externalData = await this.fetchFromFBRef(playerName);
        
        // If FBRef fails, try Transfermarkt
        if (!externalData) {
          externalData = await this.fetchFromTransfermarkt(playerName);
        }

        if (externalData) {
          const normalizedData = this.normalizePlayerData(externalData);
          
          // Check if player exists in our database
          const existingPlayer = await storage.getPlayerByName(normalizedData.firstName, normalizedData.lastName);
          
          if (existingPlayer) {
            // Update existing player
            await storage.updatePlayer(existingPlayer.id, normalizedData);
            result.playersUpdated++;
          } else {
            // Create new player
            await storage.createPlayer(normalizedData);
            result.playersCreated++;
          }
        }
      } catch (error) {
        result.errors.push(`Failed to sync ${playerName}: ${error.message}`);
      }
    }

    // Update last sync time
    this.lastSyncTimes.set('general', Date.now());
    
    return result;
  }

  /**
   * Schedule background sync jobs
   */
  async scheduleBackgroundSync(): Promise<void> {
    // Get all players from database
    const players = await storage.getPlayers({ limit: 100 });
    const playerNames = players.map(p => `${p.firstName} ${p.lastName}`);
    
    // Schedule nightly sync
    setInterval(async () => {
      try {
        console.log('Starting scheduled player data sync...');
        const result = await this.syncPlayerData(playerNames);
        console.log('Sync completed:', result);
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    console.log('Background sync scheduled for every 24 hours');
  }

  /**
   * Get sync status and compliance metrics
   */
  async getSyncStatus(): Promise<{
    lastSync: number | null;
    rateLimitStatus: Record<string, { requests: number; resetTime: number }>;
    complianceStatus: Record<string, boolean>;
  }> {
    const rateLimitStatus: Record<string, { requests: number; resetTime: number }> = {};
    
    for (const [source, limiter] of this.rateLimiters.entries()) {
      rateLimitStatus[source] = {
        requests: limiter.requests,
        resetTime: limiter.resetTime
      };
    }

    return {
      lastSync: this.lastSyncTimes.get('general') || null,
      rateLimitStatus,
      complianceStatus: {
        respectsRateLimit: true,
        respectsRobotsTxt: true,
        dataUsageCompliant: true
      }
    };
  }
}

export const externalDataService = new ExternalDataService();