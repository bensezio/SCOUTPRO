// Enhanced Video Analytics Constants
// Centralized constants for consistency across the video analytics system

export const VIDEO_EVENT_TYPES = {
  // Ball Actions
  PASS: 'pass',
  SHOT: 'shot',
  CROSS: 'cross',
  DRIBBLE: 'dribble',
  HEADER: 'header',
  FREE_KICK: 'free_kick',
  CORNER: 'corner',
  THROW_IN: 'throw_in',
  
  // Defensive Actions
  TACKLE: 'tackle',
  INTERCEPTION: 'interception',
  CLEARANCE: 'clearance',
  BLOCK: 'block',
  SAVE: 'save',
  
  // Physical Actions
  DUEL: 'duel',
  FOUL: 'foul',
  OFFSIDE: 'offside',
  
  // Other Events
  GOAL: 'goal',
  ASSIST: 'assist',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  OFFBALL_RUN: 'offball_run',
  PRESSING: 'pressing',
  POSITIONING: 'positioning'
} as const;

export const EVENT_SUBTYPES = {
  // Pass types
  SHORT_PASS: 'short_pass',
  LONG_PASS: 'long_pass',
  THROUGH_PASS: 'through_pass',
  BACK_PASS: 'back_pass',
  CROSS_PASS: 'cross_pass',
  
  // Shot types
  INSIDE_BOX: 'inside_box',
  OUTSIDE_BOX: 'outside_box',
  VOLLEY: 'volley',
  HALF_VOLLEY: 'half_volley',
  PENALTY: 'penalty',
  
  // Defensive actions
  STANDING_TACKLE: 'standing_tackle',
  SLIDING_TACKLE: 'sliding_tackle',
  AERIAL_DUEL: 'aerial_duel',
  GROUND_DUEL: 'ground_duel',
  
  // Movement types
  FORWARD_RUN: 'forward_run',
  OVERLAPPING_RUN: 'overlapping_run',
  DIAGONAL_RUN: 'diagonal_run',
  CHECKING_RUN: 'checking_run'
} as const;

export const OUTCOME_TYPES = {
  SUCCESSFUL: 'successful',
  UNSUCCESSFUL: 'unsuccessful',
  NEUTRAL: 'neutral'
} as const;

export const QUALITY_RATINGS = {
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  POOR: 2,
  VERY_POOR: 1
} as const;

export const ANALYSIS_TYPES = {
  FULL_MATCH: 'full_match',
  HIGHLIGHTS: 'highlights',
  OPPOSITION_FOCUS: 'opposition_focus',
  TACTICAL_ANALYSIS: 'tactical_analysis',
  PLAYER_FOCUS: 'player_focus',
  SET_PIECES: 'set_pieces'
} as const;

export const FIELD_ZONES = {
  DEFENSIVE_THIRD: 'defensive_third',
  MIDDLE_THIRD: 'middle_third',
  ATTACKING_THIRD: 'attacking_third',
  LEFT_WING: 'left_wing',
  RIGHT_WING: 'right_wing',
  CENTRAL: 'central',
  PENALTY_AREA: 'penalty_area',
  SIX_YARD_BOX: 'six_yard_box'
} as const;

// Position-specific event mappings
export const POSITION_RELEVANT_EVENTS = {
  'Goalkeeper': [
    VIDEO_EVENT_TYPES.SAVE,
    VIDEO_EVENT_TYPES.CLEARANCE,
    VIDEO_EVENT_TYPES.PASS,
    VIDEO_EVENT_TYPES.THROW_IN,
    VIDEO_EVENT_TYPES.FREE_KICK
  ],
  'Centre-Back': [
    VIDEO_EVENT_TYPES.TACKLE,
    VIDEO_EVENT_TYPES.INTERCEPTION,
    VIDEO_EVENT_TYPES.CLEARANCE,
    VIDEO_EVENT_TYPES.HEADER,
    VIDEO_EVENT_TYPES.PASS,
    VIDEO_EVENT_TYPES.DUEL
  ],
  'Full-Back': [
    VIDEO_EVENT_TYPES.TACKLE,
    VIDEO_EVENT_TYPES.INTERCEPTION,
    VIDEO_EVENT_TYPES.CROSS,
    VIDEO_EVENT_TYPES.PASS,
    VIDEO_EVENT_TYPES.DRIBBLE,
    VIDEO_EVENT_TYPES.OFFBALL_RUN
  ],
  'Defensive Midfielder': [
    VIDEO_EVENT_TYPES.TACKLE,
    VIDEO_EVENT_TYPES.INTERCEPTION,
    VIDEO_EVENT_TYPES.PASS,
    VIDEO_EVENT_TYPES.DUEL,
    VIDEO_EVENT_TYPES.PRESSING,
    VIDEO_EVENT_TYPES.POSITIONING
  ],
  'Central Midfielder': [
    VIDEO_EVENT_TYPES.PASS,
    VIDEO_EVENT_TYPES.DRIBBLE,
    VIDEO_EVENT_TYPES.SHOT,
    VIDEO_EVENT_TYPES.ASSIST,
    VIDEO_EVENT_TYPES.TACKLE,
    VIDEO_EVENT_TYPES.INTERCEPTION
  ],
  'Attacking Midfielder': [
    VIDEO_EVENT_TYPES.PASS,
    VIDEO_EVENT_TYPES.DRIBBLE,
    VIDEO_EVENT_TYPES.SHOT,
    VIDEO_EVENT_TYPES.ASSIST,
    VIDEO_EVENT_TYPES.CROSS,
    VIDEO_EVENT_TYPES.OFFBALL_RUN
  ],
  'Winger': [
    VIDEO_EVENT_TYPES.CROSS,
    VIDEO_EVENT_TYPES.DRIBBLE,
    VIDEO_EVENT_TYPES.SHOT,
    VIDEO_EVENT_TYPES.ASSIST,
    VIDEO_EVENT_TYPES.PASS,
    VIDEO_EVENT_TYPES.OFFBALL_RUN
  ],
  'Striker': [
    VIDEO_EVENT_TYPES.SHOT,
    VIDEO_EVENT_TYPES.GOAL,
    VIDEO_EVENT_TYPES.HEADER,
    VIDEO_EVENT_TYPES.DRIBBLE,
    VIDEO_EVENT_TYPES.ASSIST,
    VIDEO_EVENT_TYPES.OFFBALL_RUN
  ]
} as const;

// AI Analysis Focus Areas
export const AI_FOCUS_AREAS = {
  ATTACKING_PATTERNS: 'attacking_patterns',
  DEFENSIVE_TRANSITIONS: 'defensive_transitions',
  SET_PIECES: 'set_pieces',
  COUNTER_ATTACKS: 'counter_attacks',
  MIDFIELD_DOMINANCE: 'midfield_dominance',
  FINISHING: 'finishing',
  PASSING_PATTERNS: 'passing_patterns',
  PRESSING: 'pressing',
  WIDTH_PLAY: 'width_play',
  AERIAL_ABILITY: 'aerial_ability',
  PACE_AND_POWER: 'pace_and_power'
} as const;

// Performance Metrics Categories
export const PERFORMANCE_CATEGORIES = {
  TECHNICAL: 'technical',
  PHYSICAL: 'physical',
  MENTAL: 'mental',
  TACTICAL: 'tactical'
} as const;

// Export functions
export const getEventTypesForPosition = (position: string): string[] => {
  return POSITION_RELEVANT_EVENTS[position as keyof typeof POSITION_RELEVANT_EVENTS] || [];
};

export const getEventTypeLabel = (eventType: string): string => {
  const labels: Record<string, string> = {
    [VIDEO_EVENT_TYPES.PASS]: 'Pass',
    [VIDEO_EVENT_TYPES.SHOT]: 'Shot',
    [VIDEO_EVENT_TYPES.CROSS]: 'Cross',
    [VIDEO_EVENT_TYPES.DRIBBLE]: 'Dribble',
    [VIDEO_EVENT_TYPES.HEADER]: 'Header',
    [VIDEO_EVENT_TYPES.FREE_KICK]: 'Free Kick',
    [VIDEO_EVENT_TYPES.CORNER]: 'Corner',
    [VIDEO_EVENT_TYPES.THROW_IN]: 'Throw In',
    [VIDEO_EVENT_TYPES.TACKLE]: 'Tackle',
    [VIDEO_EVENT_TYPES.INTERCEPTION]: 'Interception',
    [VIDEO_EVENT_TYPES.CLEARANCE]: 'Clearance',
    [VIDEO_EVENT_TYPES.BLOCK]: 'Block',
    [VIDEO_EVENT_TYPES.SAVE]: 'Save',
    [VIDEO_EVENT_TYPES.DUEL]: 'Duel',
    [VIDEO_EVENT_TYPES.FOUL]: 'Foul',
    [VIDEO_EVENT_TYPES.OFFSIDE]: 'Offside',
    [VIDEO_EVENT_TYPES.GOAL]: 'Goal',
    [VIDEO_EVENT_TYPES.ASSIST]: 'Assist',
    [VIDEO_EVENT_TYPES.YELLOW_CARD]: 'Yellow Card',
    [VIDEO_EVENT_TYPES.RED_CARD]: 'Red Card',
    [VIDEO_EVENT_TYPES.SUBSTITUTION]: 'Substitution',
    [VIDEO_EVENT_TYPES.OFFBALL_RUN]: 'Off-Ball Run',
    [VIDEO_EVENT_TYPES.PRESSING]: 'Pressing',
    [VIDEO_EVENT_TYPES.POSITIONING]: 'Positioning'
  };
  
  return labels[eventType] || eventType;
};

// Match formations for compatibility
export const MATCH_FORMATIONS = [
  '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '4-1-4-1', '3-4-3', '5-3-2', '4-5-1'
];

// Legacy FOOTBALL_EVENT_TYPES for compatibility (will be migrated to VIDEO_EVENT_TYPES)
export const FOOTBALL_EVENT_TYPES = [
  { id: 'pass', name: 'Pass', hotkey: 'p', category: 'Technical' },
  { id: 'shot', name: 'Shot', hotkey: 's', category: 'Technical' },
  { id: 'cross', name: 'Cross', hotkey: 'c', category: 'Technical' },
  { id: 'dribble', name: 'Dribble', hotkey: 'd', category: 'Technical' },
  { id: 'header', name: 'Header', hotkey: 'h', category: 'Physical' },
  { id: 'tackle', name: 'Tackle', hotkey: 't', category: 'Defensive' },
  { id: 'interception', name: 'Interception', hotkey: 'i', category: 'Defensive' },
  { id: 'clearance', name: 'Clearance', hotkey: 'l', category: 'Defensive' },
  { id: 'save', name: 'Save', hotkey: 'v', category: 'Defensive' },
  { id: 'duel', name: 'Duel', hotkey: 'u', category: 'Physical' },
  { id: 'foul', name: 'Foul', hotkey: 'f', category: 'Physical' },
  { id: 'goal', name: 'Goal', hotkey: 'g', category: 'Technical' },
  { id: 'assist', name: 'Assist', hotkey: 'a', category: 'Technical' },
  { id: 'offball_run', name: 'Off-Ball Run', hotkey: 'r', category: 'Tactical' },
  { id: 'pressing', name: 'Pressing', hotkey: 'e', category: 'Tactical' },
  { id: 'positioning', name: 'Positioning', hotkey: 'o', category: 'Tactical' }
] as const;