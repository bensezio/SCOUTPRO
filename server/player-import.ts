import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { authenticateToken, type AuthenticatedRequest } from "./auth-routes";
import { requireFeature, checkUsageLimit, trackFeatureAccess } from "./middleware/permission-check";
import { insertPlayerSchema, insertPlayerStatsSchema } from "@shared/schema";
import { z } from "zod";
import * as XLSX from 'xlsx';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV and Excel files
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.csv') ||
        file.originalname.toLowerCase().endsWith('.xlsx') ||
        file.originalname.toLowerCase().endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Enhanced player import schema with validation
const bulkPlayerImportSchema = z.object({
  players: z.array(z.object({
    // Core player information
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    nationality: z.string().min(2, "Nationality is required"),
    position: z.enum(['Goalkeeper', 'Centre-Back', 'Left-Back', 'Right-Back', 'Wing-Back', 'Sweeper', 'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder', 'Left Midfielder', 'Right Midfielder', 'Box-to-Box Midfielder', 'Left Winger', 'Right Winger', 'Centre-Forward', 'Striker', 'Second Striker', 'False 9']),
    
    // Physical attributes
    height: z.number().min(150).max(220).optional(),
    weight: z.number().min(50).max(120).optional(),
    
    // Optional attributes
    secondaryPosition: z.string().optional(),
    currentClub: z.string().optional(),
    marketValue: z.string().optional(),
    contractUntil: z.string().optional(),
    preferredFoot: z.enum(['Right', 'Left', 'Both']).optional(),
    
    // Contact and representation
    agentName: z.string().optional(),
    agentContact: z.string().optional(),
    playerPhone: z.string().optional(),
    playerEmail: z.string().email().optional(),
    
    // Performance data (current season)
    currentSeasonStats: z.object({
      season: z.string().default("2024-25"),
      matchesPlayed: z.number().min(0).optional(),
      goals: z.number().min(0).optional(),
      assists: z.number().min(0).optional(),
      yellowCards: z.number().min(0).optional(),
      redCards: z.number().min(0).optional(),
      minutesPlayed: z.number().min(0).optional(),
      averageRating: z.string().optional(),
    }).optional(),
    
    // Additional metadata
    bio: z.string().optional(),
    tags: z.array(z.string()).optional(),
    scoutingNotes: z.string().optional(),
    isActive: z.boolean().default(true),
  }))
});

// Comprehensive market value parser to handle different formats
const parseMarketValue = (value: string): string => {
  if (!value || value.trim() === '') return '';
  
  // Remove any whitespace
  value = value.trim();
  
  // Handle different currency formats
  // Examples: €5,000,000 | €5000000 | 5000000 | $5,000,000 | £5,000,000
  let cleanValue = value;
  
  // Remove currency symbols
  cleanValue = cleanValue.replace(/^[€$£¥₹]/g, '');
  
  // If it's already in the correct format (€50,000), return as is
  if (value.match(/^€[\d,]+$/)) {
    return value;
  }
  
  // Remove commas and spaces for processing
  const numericValue = cleanValue.replace(/[,\s]/g, '');
  
  // Validate it's a number
  if (!/^\d+$/.test(numericValue)) {
    throw new Error(`Invalid market value format: ${value}. Use format: €50,000 or €50000 or 50000`);
  }
  
  // Format with commas and € symbol
  const formatted = parseInt(numericValue).toLocaleString('en-US');
  return `€${formatted}`;
};

// Enhanced file type detection
const detectFileType = (filename: string, buffer: Buffer): 'csv' | 'excel' => {
  const extension = filename.toLowerCase().split('.').pop();
  
  // Check by extension first
  if (extension === 'csv') return 'csv';
  if (extension === 'xlsx' || extension === 'xls') return 'excel';
  
  // Check by file signature if extension is unclear
  const signature = buffer.slice(0, 4).toString('hex');
  if (signature === '504b0304') return 'excel'; // ZIP signature (Excel files are ZIP archives)
  
  // Default to CSV for text files
  return 'csv';
};

// CSV template generation with proper escaping
const generateCSVTemplate = () => {
  const headers = [
    // Core Information
    'firstName', 'lastName', 'dateOfBirth', 'nationality', 'position',
    
    // Physical Attributes
    'height', 'weight', 'preferredFoot',
    
    // Club Information
    'currentClub', 'marketValue', 'contractUntil',
    
    // Contact Information
    'agentName', 'agentContact', 'playerPhone', 'playerEmail',
    
    // Performance Data
    'matchesPlayed', 'goals', 'assists', 'yellowCards', 'redCards', 'minutesPlayed', 'averageRating',
    
    // Additional Fields
    'bio', 'scoutingNotes', 'tags'
  ];
  
  // Sample data with proper CSV escaping for fields containing commas
  const sampleDataRows = [
    [
      'Kwame', 'Asante', '1999-03-15', 'Ghana', 'Central Midfielder',
      '178', '72', 'Right',
      'Hearts of Oak', '€50000', '2025-12-31',
      'John Smith', 'john@arksports.com', '+233123456789', 'kwame@email.com',
      '25', '5', '3', '2', '0', '2100', '7.2',
      'Versatile midfielder with excellent passing range', 'Strong potential for European football', 'midfield|ghana|technical'
    ],
    [
      'Fatima', 'Kone', '2001-07-22', 'Ivory Coast', 'Left Winger',
      '165', '58', 'Left',
      'ASEC Mimosas', '€35000', '2024-11-30',
      'Marie Dubois', 'marie@scoutnetwork.com', '+225987654321', 'fatima@email.com',
      '22', '8', '12', '1', '0', '1980', '7.8',
      'Pacey winger with exceptional dribbling skills', 'Ready for European transition', 'winger|ivory-coast|pace'
    ],
    [
      'Amara', 'Traore', '1998-11-08', 'Mali', 'Centre-Back',
      '188', '82', 'Right',
      'Stade Malien', '€75000', '2026-06-30',
      'Ibrahim Keita', 'ibrahim@westafricascouts.com', '+223456789012', 'amara@email.com',
      '28', '2', '1', '5', '1', '2520', '7.5',
      'Commanding center-back with strong aerial ability', 'Captain material with leadership qualities', 'defender|mali|leadership'
    ],
    [
      'Blessing', 'Okoro', '2000-04-12', 'Nigeria', 'Striker',
      '175', '70', 'Right',
      'Enyimba FC', '€60000', '2025-08-15',
      'Samuel Okafor', 'samuel@nigeriascouts.com', '+2348123456789', 'blessing@email.com',
      '24', '15', '4', '3', '0', '2160', '8.1',
      'Clinical finisher with pace and movement', 'Top scorer potential in European leagues', 'striker|nigeria|goalscorer'
    ]
  ];
  
  // Function to escape CSV field if it contains commas, quotes, or newlines
  const escapeCSVField = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };
  
  return {
    headers: headers.join(','),
    samples: sampleDataRows.map(row => row.map(escapeCSVField).join(',')).join('\n')
  };
};

// Excel template with African player examples
const generateExcelTemplate = () => {
  return {
    sheets: [
      {
        name: 'Players',
        headers: [
          'First Name', 'Last Name', 'Date of Birth (YYYY-MM-DD)', 'Nationality', 'Position',
          'Height (cm)', 'Weight (kg)', 'Preferred Foot', 'Current Club', 'Market Value',
          'Contract Until', 'Agent Name', 'Agent Contact', 'Player Phone', 'Player Email',
          'Matches Played', 'Goals', 'Assists', 'Yellow Cards', 'Red Cards', 'Minutes Played',
          'Average Rating', 'Bio', 'Scouting Notes', 'Tags (comma-separated)'
        ],
        sampleData: [
          ['Kwame', 'Asante', '1999-03-15', 'Ghana', 'Central Midfielder', 178, 72, 'Right', 'Hearts of Oak', '€50,000', '2025-12-31', 'John Smith', 'john@arksports.com', '+233123456789', 'kwame@email.com', 25, 5, 3, 2, 0, 2100, '7.2', 'Versatile midfielder with excellent passing range', 'Strong potential for European football', 'midfield,ghana,technical'],
          ['Fatima', 'Kone', '2001-07-22', 'Ivory Coast', 'Left Winger', 165, 58, 'Left', 'ASEC Mimosas', '€35,000', '2024-11-30', 'Marie Dubois', 'marie@scoutnetwork.com', '+225987654321', 'fatima@email.com', 22, 8, 12, 1, 0, 1980, '7.8', 'Pacey winger with exceptional dribbling skills', 'Ready for European transition', 'winger,ivory-coast,pace'],
          ['Amara', 'Traore', '1998-11-08', 'Mali', 'Centre-Back', 188, 82, 'Right', 'Stade Malien', '€75,000', '2026-06-30', 'Ibrahim Keita', 'ibrahim@westafricascouts.com', '+223456789012', 'amara@email.com', 28, 2, 1, 5, 1, 2520, '7.5', 'Commanding center-back with strong aerial ability', 'Captain material with leadership qualities', 'defender,mali,leadership'],
          ['Blessing', 'Okoro', '2000-04-12', 'Nigeria', 'Striker', 175, 70, 'Right', 'Enyimba FC', '€60,000', '2025-08-15', 'Samuel Okafor', 'samuel@nigeriascouts.com', '+2348123456789', 'blessing@email.com', 24, 15, 4, 3, 0, 2160, '8.1', 'Clinical finisher with pace and movement', 'Top scorer potential in European leagues', 'striker,nigeria,goalscorer']
        ]
      },
      {
        name: 'Position Guide',
        headers: ['Position Name', 'Category', 'Description'],
        sampleData: [
          ['Goalkeeper', 'Goalkeeper', 'Primary shot-stopper and defensive anchor'],
          ['Centre-Back', 'Defender', 'Central defensive pillar'],
          ['Left-Back', 'Defender', 'Left-sided defensive fullback'],
          ['Right-Back', 'Defender', 'Right-sided defensive fullback'],
          ['Wing-Back', 'Defender', 'Advanced fullback with attacking duties'],
          ['Sweeper', 'Defender', 'Deep-lying defensive organizer'],
          ['Defensive Midfielder', 'Midfielder', 'Defensive midfield anchor and shield'],
          ['Central Midfielder', 'Midfielder', 'Box-to-box central player'],
          ['Attacking Midfielder', 'Midfielder', 'Creative playmaker and assist provider'],
          ['Left Midfielder', 'Midfielder', 'Left-sided midfield support'],
          ['Right Midfielder', 'Midfielder', 'Right-sided midfield support'],
          ['Box-to-Box Midfielder', 'Midfielder', 'Complete midfielder covering all areas'],
          ['Left Winger', 'Forward', 'Left attacking winger with pace and crossing'],
          ['Right Winger', 'Forward', 'Right attacking winger with pace and crossing'],
          ['Centre-Forward', 'Forward', 'Central attacking focal point'],
          ['Striker', 'Forward', 'Primary goalscorer and finisher'],
          ['Second Striker', 'Forward', 'Supporting striker behind main striker'],
          ['False 9', 'Forward', 'Deep-lying forward creating space and chances']
        ]
      }
    ]
  };
};

// Enhanced validation function for both CSV and Excel data
const validatePlayerData = (playerData: any, rowIndex: number) => {
  const errors: string[] = [];
  
  // Required fields validation
  if (!playerData.firstName || playerData.firstName.trim() === '') {
    errors.push(`Row ${rowIndex}: First name is required`);
  }
  
  if (!playerData.lastName || playerData.lastName.trim() === '') {
    errors.push(`Row ${rowIndex}: Last name is required`);
  }
  
  if (!playerData.dateOfBirth || playerData.dateOfBirth.trim() === '') {
    errors.push(`Row ${rowIndex}: Date of birth is required`);
  } else {
    // Date format validation
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(playerData.dateOfBirth)) {
      errors.push(`Row ${rowIndex}: Date of birth must be in YYYY-MM-DD format`);
    } else {
      // Age validation
      const birthDate = new Date(playerData.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 40) {
        errors.push(`Row ${rowIndex}: Invalid age: ${age}. Players must be between 16-40 years old`);
      }
    }
  }
  
  if (!playerData.nationality || playerData.nationality.trim() === '') {
    errors.push(`Row ${rowIndex}: Nationality is required`);
  }
  
  if (!playerData.position || playerData.position.trim() === '') {
    errors.push(`Row ${rowIndex}: Position is required`);
  }
  
  // Market value validation (skip validation if already numeric)
  if (playerData.marketValue && typeof playerData.marketValue === 'string' && playerData.marketValue.trim() !== '') {
    try {
      // Convert string market value to numeric
      const cleanValue = playerData.marketValue.toString().replace(/[€$£¥₹₦,\s]/g, '').trim();
      const numericValue = parseFloat(cleanValue);
      if (!isNaN(numericValue)) {
        playerData.marketValue = numericValue;
      } else {
        errors.push(`Row ${rowIndex}: Invalid market value format: ${playerData.marketValue}`);
      }
    } catch (error) {
      errors.push(`Row ${rowIndex}: ${error.message}`);
    }
  }
  
  // Email validation
  if (playerData.playerEmail && playerData.playerEmail.trim() !== '') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(playerData.playerEmail)) {
      errors.push(`Row ${rowIndex}: Invalid email format: ${playerData.playerEmail}`);
    }
  }
  
  // Height and weight validation
  if (playerData.height && (playerData.height < 150 || playerData.height > 220)) {
    errors.push(`Row ${rowIndex}: Height must be between 150-220 cm`);
  }
  
  if (playerData.weight && (playerData.weight < 50 || playerData.weight > 120)) {
    errors.push(`Row ${rowIndex}: Weight must be between 50-120 kg`);
  }
  
  return errors;
};

// CSV parser with robust error handling
const parseCSVFile = (csvContent: string) => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('CSV Headers:', headers);
  const players = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    // Parse CSV line handling quoted fields with commas
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Skip empty rows
    if (values.every(v => v === '')) continue;
    
    // Map values to headers
    const player: any = {};
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // Map CSV headers to expected field names (handle both formats)
      const fieldMap: { [key: string]: string } = {
        'firstName': 'firstName',
        'First Name': 'firstName',
        'lastName': 'lastName',
        'Last Name': 'lastName',
        'dateOfBirth': 'dateOfBirth',
        'Date of Birth (YYYY-MM-DD)': 'dateOfBirth',
        'nationality': 'nationality',
        'Nationality': 'nationality',
        'position': 'position',
        'Position': 'position',
        'height': 'height',
        'Height (cm)': 'height',
        'weight': 'weight',
        'Weight (kg)': 'weight',
        'preferredFoot': 'preferredFoot',
        'Preferred Foot': 'preferredFoot',
        'currentClub': 'currentClub',
        'Current Club': 'currentClub',
        'marketValue': 'marketValue',
        'Market Value': 'marketValue',
        'contractUntil': 'contractUntil',
        'Contract Until': 'contractUntil',
        'agentName': 'agentName',
        'Agent Name': 'agentName',
        'agentContact': 'agentContact',
        'Agent Contact': 'agentContact',
        'playerPhone': 'playerPhone',
        'Player Phone': 'playerPhone',
        'playerEmail': 'playerEmail',
        'Player Email': 'playerEmail',
        'matchesPlayed': 'matchesPlayed',
        'Matches Played': 'matchesPlayed',
        'goals': 'goals',
        'Goals': 'goals',
        'assists': 'assists',
        'Assists': 'assists',
        'yellowCards': 'yellowCards',
        'Yellow Cards': 'yellowCards',
        'redCards': 'redCards',
        'Red Cards': 'redCards',
        'minutesPlayed': 'minutesPlayed',
        'Minutes Played': 'minutesPlayed',
        'averageRating': 'averageRating',
        'Average Rating': 'averageRating',
        'bio': 'bio',
        'Bio': 'bio',
        'scoutingNotes': 'scoutingNotes',
        'Scouting Notes': 'scoutingNotes',
        'tags': 'tags',
        'Tags (comma-separated)': 'tags'
      };
      
      const fieldName = fieldMap[header] || header;
      
      // Convert numeric fields
      if (['height', 'weight', 'matchesPlayed', 'goals', 'assists', 'yellowCards', 'redCards', 'minutesPlayed'].includes(fieldName)) {
        player[fieldName] = value ? parseInt(value) : null;
      } else if (fieldName === 'marketValue') {
        // Extract numeric value from market value format (€50000 -> 50000)
        if (value && value.toString().trim() !== '') {
          const cleanValue = value.toString().replace(/[€$£¥₹₦,\s]/g, '').trim();
          const numericValue = parseFloat(cleanValue);
          player[fieldName] = isNaN(numericValue) ? null : numericValue;
        } else {
          player[fieldName] = null;
        }
      } else if (fieldName === 'tags') {
        player[fieldName] = value ? value.split('|').map(t => t.trim()) : [];
      } else {
        player[fieldName] = value;
      }
    });
    
    players.push(player);
  }
  
  return players;
};

// Excel parser with robust error handling
const parseExcelFile = (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length < 2) {
    throw new Error('Excel file must contain at least header and one data row');
  }
  
  const headers = jsonData[0] as string[];
  const players = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    
    // Skip empty rows
    if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) continue;
    
    const player: any = {};
    headers.forEach((header, index) => {
      const value = row[index] || '';
      
      // Map Excel headers to expected field names (more flexible)
      const fieldMap: { [key: string]: string } = {
        'First Name': 'firstName',
        'firstName': 'firstName',
        'Last Name': 'lastName',
        'lastName': 'lastName',
        'Date of Birth (YYYY-MM-DD)': 'dateOfBirth',
        'dateOfBirth': 'dateOfBirth',
        'Nationality': 'nationality',
        'nationality': 'nationality',
        'Position': 'position',
        'position': 'position',
        'Height (cm)': 'height',
        'height': 'height',
        'Weight (kg)': 'weight',
        'weight': 'weight',
        'Preferred Foot': 'preferredFoot',
        'preferredFoot': 'preferredFoot',
        'Current Club': 'currentClub',
        'currentClub': 'currentClub',
        'Market Value': 'marketValue',
        'marketValue': 'marketValue',
        'Contract Until': 'contractUntil',
        'contractUntil': 'contractUntil',
        'Agent Name': 'agentName',
        'agentName': 'agentName',
        'Agent Contact': 'agentContact',
        'agentContact': 'agentContact',
        'Player Phone': 'playerPhone',
        'playerPhone': 'playerPhone',
        'Player Email': 'playerEmail',
        'playerEmail': 'playerEmail',
        'Matches Played': 'matchesPlayed',
        'matchesPlayed': 'matchesPlayed',
        'Goals': 'goals',
        'goals': 'goals',
        'Assists': 'assists',
        'assists': 'assists',
        'Yellow Cards': 'yellowCards',
        'yellowCards': 'yellowCards',
        'Red Cards': 'redCards',
        'redCards': 'redCards',
        'Minutes Played': 'minutesPlayed',
        'minutesPlayed': 'minutesPlayed',
        'Average Rating': 'averageRating',
        'averageRating': 'averageRating',
        'Bio': 'bio',
        'bio': 'bio',
        'Scouting Notes': 'scoutingNotes',
        'scoutingNotes': 'scoutingNotes',
        'Tags (comma-separated)': 'tags',
        'tags': 'tags'
      };
      
      const fieldName = fieldMap[header] || header;
      
      // Convert numeric fields
      if (['height', 'weight', 'matchesPlayed', 'goals', 'assists', 'yellowCards', 'redCards', 'minutesPlayed'].includes(fieldName)) {
        player[fieldName] = value ? parseInt(value) : null;
      } else if (fieldName === 'tags') {
        player[fieldName] = value ? value.toString().split(',').map(t => t.trim()) : [];
      } else {
        player[fieldName] = value ? value.toString() : '';
      }
    });
    
    players.push(player);
  }
  
  return players;
};

// Enhanced player import processing with duplicate detection
const processPlayerImport = async (playersData: any[], userId: number) => {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
    duplicates: [] as string[]
  };
  
  // Check for duplicates within the import
  const nameMap = new Map<string, number>();
  const emailMap = new Map<string, number>();
  
  for (let i = 0; i < playersData.length; i++) {
    const player = playersData[i];
    
    try {
      // Validate player data
      const validationErrors = validatePlayerData(player, i + 1);
      if (validationErrors.length > 0) {
        results.failed++;
        results.errors.push(...validationErrors);
        continue;
      }
      
      // Check for duplicates in this import
      const fullName = `${player.firstName} ${player.lastName}`;
      if (nameMap.has(fullName)) {
        results.duplicates.push(`Row ${i + 1}: Duplicate player name "${fullName}" (also found in row ${nameMap.get(fullName)})`);
        results.failed++;
        continue;
      }
      nameMap.set(fullName, i + 1);
      
      if (player.playerEmail && emailMap.has(player.playerEmail)) {
        results.duplicates.push(`Row ${i + 1}: Duplicate email "${player.playerEmail}" (also found in row ${emailMap.get(player.playerEmail)})`);
        results.failed++;
        continue;
      }
      if (player.playerEmail) emailMap.set(player.playerEmail, i + 1);
      
      // Create player record
      const playerRecord = {
        firstName: player.firstName,
        lastName: player.lastName,
        dateOfBirth: player.dateOfBirth,
        nationality: player.nationality,
        position: player.position,
        height: player.height || null,
        weight: player.weight || null,
        secondaryPosition: player.secondaryPosition || null,
        // Note: currentClub text is not stored in database, only currentClubId
        // For now, store as bio information or skip club information from CSV
        marketValue: typeof player.marketValue === 'number' ? player.marketValue : null,
        preferredFoot: player.preferredFoot || null,
        bio: player.bio || null,
        isActive: player.isActive !== false
      };
      
      // Insert player into database
      const createdPlayer = await storage.createPlayer(playerRecord);
      
      // Create statistics record if provided
      if (player.currentSeasonStats) {
        const statsRecord = {
          playerId: createdPlayer.id,
          season: player.currentSeasonStats.season || "2024-25",
          matchesPlayed: player.currentSeasonStats.matchesPlayed || null,
          goals: player.currentSeasonStats.goals || null,
          assists: player.currentSeasonStats.assists || null,
          yellowCards: player.currentSeasonStats.yellowCards || null,
          redCards: player.currentSeasonStats.redCards || null,
          minutesPlayed: player.currentSeasonStats.minutesPlayed || null,
          averageRating: player.currentSeasonStats.averageRating || null
        };
        
        await storage.createPlayerStats(statsRecord);
      }
      
      results.successful++;
      
    } catch (error) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return results;
};

export function registerPlayerImportRoutes(app: Express) {
  
  // Get CSV template
  app.get('/api/players/template/csv', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const template = generateCSVTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="player_import_template.csv"');
      
      const csvContent = `${template.headers}\n${template.samples}`;
      res.send(csvContent);
      
    } catch (error) {
      console.error('Error generating CSV template:', error);
      res.status(500).json({ message: 'Failed to generate CSV template' });
    }
  });
  
  // Get Excel template (actual .xlsx file)
  app.get('/api/players/template/excel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Define headers
      const headers = [
        'First Name', 'Last Name', 'Date of Birth (YYYY-MM-DD)', 'Nationality', 'Position',
        'Height (cm)', 'Weight (kg)', 'Preferred Foot', 'Current Club', 'Market Value',
        'Contract Until', 'Agent Name', 'Agent Contact', 'Player Phone', 'Player Email',
        'Matches Played', 'Goals', 'Assists', 'Yellow Cards', 'Red Cards', 'Minutes Played',
        'Average Rating', 'Bio', 'Scouting Notes', 'Tags (comma-separated)'
      ];
      
      // Add sample data
      const sampleData = [
        ['Kwame', 'Asante', '1999-03-15', 'Ghana', 'Central Midfielder', 178, 72, 'Right', 'Hearts of Oak', '€50,000', '2025-12-31', 'John Smith', 'john@arksports.com', '+233123456789', 'kwame@email.com', 25, 5, 3, 2, 0, 2100, 7.2, 'Versatile midfielder with excellent passing range', 'Strong potential for European football', 'midfield,ghana,technical'],
        ['Fatima', 'Kone', '2001-07-22', 'Ivory Coast', 'Left Winger', 165, 58, 'Left', 'ASEC Mimosas', '€35,000', '2024-11-30', 'Marie Dubois', 'marie@scoutnetwork.com', '+225987654321', 'fatima@email.com', 22, 8, 12, 1, 0, 1980, 7.8, 'Pacey winger with exceptional dribbling skills', 'Ready for European transition', 'winger,ivory-coast,pace'],
        ['Amara', 'Traore', '1998-11-08', 'Mali', 'Centre-Back', 188, 82, 'Right', 'Stade Malien', '€75,000', '2026-06-30', 'Ibrahim Keita', 'ibrahim@westafricascouts.com', '+223456789012', 'amara@email.com', 28, 2, 1, 5, 1, 2520, 7.5, 'Commanding center-back with strong aerial ability', 'Captain material with leadership qualities', 'defender,mali,leadership'],
        ['Blessing', 'Okoro', '2000-04-12', 'Nigeria', 'Striker', 175, 70, 'Right', 'Enyimba FC', '€60,000', '2025-08-15', 'Samuel Okafor', 'samuel@nigeriascouts.com', '+2348123456789', 'blessing@email.com', 24, 15, 4, 3, 0, 2160, 8.1, 'Clinical finisher with pace and movement', 'Top scorer potential in European leagues', 'striker,nigeria,goalscorer']
      ];
      
      // Combine headers and sample data
      const playersData = [headers, ...sampleData];
      
      // Create Players worksheet
      const playersSheet = XLSX.utils.aoa_to_sheet(playersData);
      
      // Add Players worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, playersSheet, 'Players');
      
      // Position guide data
      const positionHeaders = ['Position Name', 'Category', 'Description'];
      const positionData = [
        ['Goalkeeper', 'Goalkeeper', 'Primary shot-stopper and defensive anchor'],
        ['Centre-Back', 'Defender', 'Central defensive pillar'],
        ['Left-Back', 'Defender', 'Left-sided defensive fullback'],
        ['Right-Back', 'Defender', 'Right-sided defensive fullback'],
        ['Wing-Back', 'Defender', 'Advanced fullback with attacking duties'],
        ['Sweeper', 'Defender', 'Deep-lying defensive organizer'],
        ['Defensive Midfielder', 'Midfielder', 'Defensive midfield anchor and shield'],
        ['Central Midfielder', 'Midfielder', 'Box-to-box central player'],
        ['Attacking Midfielder', 'Midfielder', 'Creative playmaker and assist provider'],
        ['Left Midfielder', 'Midfielder', 'Left-sided midfield support'],
        ['Right Midfielder', 'Midfielder', 'Right-sided midfield support'],
        ['Box-to-Box Midfielder', 'Midfielder', 'Complete midfielder covering all areas'],
        ['Left Winger', 'Forward', 'Left attacking winger with pace and crossing'],
        ['Right Winger', 'Forward', 'Right attacking winger with pace and crossing'],
        ['Centre-Forward', 'Forward', 'Central striker and target player'],
        ['Striker', 'Forward', 'Primary goalscorer and finisher'],
        ['Second Striker', 'Forward', 'Supporting striker behind main forward'],
        ['False 9', 'Forward', 'Dropping striker creating space and chances']
      ];
      
      // Combine position headers and data
      const positionSheetData = [positionHeaders, ...positionData];
      
      // Create Position Guide worksheet
      const positionSheet = XLSX.utils.aoa_to_sheet(positionSheetData);
      
      // Add Position Guide worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, positionSheet, 'Position Guide');
      
      // Set response headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="player_import_template.xlsx"');
      
      // Generate Excel file buffer and send
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);
      
    } catch (error) {
      console.error('Error generating Excel template:', error);
      res.status(500).json({ message: 'Failed to generate Excel template' });
    }
  });
  
  // Enhanced file upload and processing route
  app.post('/api/players/import/file', authenticateToken, requireFeature('bulkOperations'), upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      console.log(`Processing file: ${file.originalname}, size: ${file.size} bytes`);
      
      // Detect file type
      const fileType = detectFileType(file.originalname, file.buffer);
      
      let playersData = [];
      try {
        if (fileType === 'csv') {
          const csvContent = file.buffer.toString('utf-8');
          playersData = parseCSVFile(csvContent);
        } else if (fileType === 'excel') {
          playersData = parseExcelFile(file.buffer);
        } else {
          return res.status(400).json({ message: 'Unsupported file format. Please upload CSV or Excel files only' });
        }
      } catch (parseError: any) {
        console.error('File parsing error:', parseError);
        return res.status(400).json({ 
          message: 'Failed to parse file', 
          error: parseError.message,
          fileType: fileType,
          fileName: file.originalname
        });
      }
      
      if (playersData.length === 0) {
        return res.status(400).json({ message: 'No valid player data found in file' });
      }
      
      console.log(`Successfully parsed ${playersData.length} players from ${fileType} file`);
      
      // Process the import
      const results = await processPlayerImport(playersData, req.user!.id);
      
      // Track feature usage
      await trackFeatureAccess(req.user!.id, 'bulkOperations', {
        fileType: fileType,
        fileName: file.originalname,
        playersProcessed: playersData.length,
        successful: results.successful,
        failed: results.failed
      });
      
      res.json({
        message: 'Import completed',
        fileType: fileType,
        fileName: file.originalname,
        totalRows: playersData.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        duplicates: results.duplicates
      });
      
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ message: error.message || 'Failed to process file upload' });
    }
  });

  // Bulk import players (for direct JSON data)
  app.post('/api/players/import', authenticateToken, requireFeature('bulkOperations'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validation = bulkPlayerImportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid import data',
          errors: validation.error.errors
        });
      }
      
      const { players } = validation.data;
      
      // Process the import
      const results = await processPlayerImport(players, userId);
      
      res.json({
        message: 'Import completed',
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        duplicates: results.duplicates
      });
      
    } catch (error) {
      console.error('Error importing players:', error);
      res.status(500).json({ message: 'Failed to import players' });
    }
  });
  
  // Validate import data without saving
  app.post('/api/players/validate', authenticateToken, requireFeature('bulkOperations'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = bulkPlayerImportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validation.error.errors
        });
      }
      
      const { players } = validation.data;
      const validationResults = {
        totalPlayers: players.length,
        validPlayers: 0,
        invalidPlayers: 0,
        errors: [] as string[]
      };
      
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const errors = validatePlayerData(player, i + 1);
        
        if (errors.length > 0) {
          validationResults.invalidPlayers++;
          validationResults.errors.push(...errors);
        } else {
          validationResults.validPlayers++;
        }
      }
      
      res.json(validationResults);
      
    } catch (error) {
      console.error('Error validating players:', error);
      res.status(500).json({ message: 'Failed to validate players' });
    }
  });
  
  // Get import history/stats
  app.get('/api/players/import/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // This would typically come from a database table tracking imports
      // For now, we'll return current player statistics
      const players = await storage.getPlayers();
      
      const stats = {
        totalPlayers: players.length,
        playersByNationality: players.reduce((acc, player) => {
          acc[player.nationality] = (acc[player.nationality] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        playersByPosition: players.reduce((acc, player) => {
          acc[player.position] = (acc[player.position] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentImports: players.slice(-10).map(player => ({
          id: player.id,
          name: `${player.firstName} ${player.lastName}`,
          nationality: player.nationality,
          position: player.position,
          createdAt: player.createdAt
        }))
      };
      
      res.json(stats);
      
    } catch (error) {
      console.error('Error getting import history:', error);
      res.status(500).json({ message: 'Failed to get import history' });
    }
  });
  
  // Bulk player operations
  app.post('/api/players/bulk-update', authenticateToken, requireFeature('bulkOperations'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { playerIds, updates } = req.body;
      
      if (!Array.isArray(playerIds) || playerIds.length === 0) {
        return res.status(400).json({ message: 'Player IDs are required' });
      }
      
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const playerId of playerIds) {
        try {
          await storage.updatePlayer(playerId, updates);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Player ${playerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      res.json(results);
      
    } catch (error) {
      console.error('Error bulk updating players:', error);
      res.status(500).json({ message: 'Failed to bulk update players' });
    }
  });
  
  // NOTE: Removed duplicate /api/players/search route - using the main search route in routes.ts instead
}