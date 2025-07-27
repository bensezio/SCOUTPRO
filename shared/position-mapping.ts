// Enhanced position mapping that matches the FOOTBALL_POSITIONS constant
export const POSITION_MAPPING = {
  // Goalkeepers
  'Goalkeeper': 'GK',
  
  // Defenders
  'Centre-Back': 'CB',
  'Left-Back': 'LB',
  'Right-Back': 'RB',
  'Wing-Back': 'WB',
  'Sweeper': 'SW',
  
  // Midfielders
  'Defensive Midfielder': 'CDM',
  'Central Midfielder': 'CM',
  'Attacking Midfielder': 'CAM',
  'Left Midfielder': 'LM',
  'Right Midfielder': 'RM',
  'Box-to-Box Midfielder': 'B2B',
  
  // Forwards
  'Left Winger': 'LW',
  'Right Winger': 'RW',
  'Centre-Forward': 'CF',
  'Striker': 'ST',
  'Second Striker': 'SS',
  'False 9': 'F9'
} as const;

// Reverse mapping for search functionality
export const ABBREVIATION_MAPPING = Object.fromEntries(
  Object.entries(POSITION_MAPPING).map(([full, abbr]) => [abbr, full])
);

// Get abbreviation from full position name
export function getPositionAbbreviation(fullPosition: string): string {
  return POSITION_MAPPING[fullPosition as keyof typeof POSITION_MAPPING] || fullPosition;
}

// Get full position name from abbreviation
export function getFullPositionName(abbreviation: string): string {
  return ABBREVIATION_MAPPING[abbreviation] || abbreviation;
}

// Enhanced search function that works with both abbreviations and full names
export function searchPositions(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  
  // Search in full names (case-insensitive, partial matches)
  const fullNameMatches = Object.keys(POSITION_MAPPING).filter(position =>
    position.toLowerCase().includes(normalizedQuery)
  );
  
  // Search in abbreviations (case-insensitive, partial matches)
  const abbreviationMatches = Object.keys(ABBREVIATION_MAPPING).filter(abbr =>
    abbr.toLowerCase().includes(normalizedQuery)
  ).map(abbr => ABBREVIATION_MAPPING[abbr]);
  
  // Also search for common variations and synonyms
  const synonyms: Record<string, string[]> = {
    'defender': ['Centre-Back', 'Left-Back', 'Right-Back', 'Wing-Back', 'Sweeper'],
    'midfielder': ['Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder', 'Left Midfielder', 'Right Midfielder', 'Box-to-Box Midfielder'],
    'forward': ['Left Winger', 'Right Winger', 'Centre-Forward', 'Striker', 'Second Striker', 'False 9'],
    'attack': ['Left Winger', 'Right Winger', 'Centre-Forward', 'Striker', 'Second Striker', 'False 9'],
    'winger': ['Left Winger', 'Right Winger'],
    'back': ['Centre-Back', 'Left-Back', 'Right-Back', 'Wing-Back'],
    'center': ['Centre-Back', 'Centre-Forward', 'Central Midfielder'],
    'centre': ['Centre-Back', 'Centre-Forward', 'Central Midfielder']
  };
  
  const synonymMatches = Object.entries(synonyms)
    .filter(([key]) => key.toLowerCase().includes(normalizedQuery))
    .flatMap(([, positions]) => positions);
  
  // Combine and deduplicate all matches
  return [...new Set([...fullNameMatches, ...abbreviationMatches, ...synonymMatches])];
}

// New function to find position matches for backend filtering
export function findPositionMatches(query: string): { fullNames: string[], abbreviations: string[] } {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return { fullNames: [], abbreviations: [] };
  
  const fullNames = Object.keys(POSITION_MAPPING).filter(position =>
    position.toLowerCase().includes(normalizedQuery)
  );
  
  const abbreviations = Object.keys(ABBREVIATION_MAPPING).filter(abbr =>
    abbr.toLowerCase().includes(normalizedQuery)
  );
  
  return { fullNames, abbreviations };
}

// Get all positions for dropdowns
export function getAllPositions(): Array<{value: string, label: string, abbreviation: string}> {
  return Object.entries(POSITION_MAPPING).map(([full, abbr]) => ({
    value: full,
    label: full,
    abbreviation: abbr
  }));
}