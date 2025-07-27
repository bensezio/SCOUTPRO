// Comprehensive Football Tagging Event Types
// Based on PlatinumEdge Video Analysis specifications

export const EVENT_CATEGORIES = {
  PASSING: 'passing',
  SHOOTING: 'shooting',
  DEFENSIVE: 'defensive',
  GOALKEEPING: 'goalkeeping',
  PHYSICAL: 'physical',
  DRIBBLING: 'dribbling',
  POSSESSION: 'possession',
  BALL_CARRY: 'ball_carry',
  PASS_RECEIVING: 'pass_receiving',
  CHANCE_CREATION: 'chance_creation',
  BALL_PROGRESSION: 'ball_progression',
} as const;

export const EVENT_SUB_TYPES = {
  SIMPLE: 'simple',
  KEY: 'key',
  CRUCIAL: 'crucial',
  UNSUCCESSFUL: 'unsuccessful',
  ASSIST: 'assist',
  BRILLIANT: 'brilliant',
  GOAL_LINE: 'goal_line',
} as const;

export const COMPREHENSIVE_EVENT_TYPES = [
  // Passing Events
  { id: 'short_pass_simple', name: 'Short Pass Simple', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'S' },
  { id: 'short_pass_key', name: 'Short Pass Key', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+S' },
  { id: 'short_pass_unsuccessful', name: 'Short Pass Unsuccessful', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+S' },
  { id: 'short_pass_assist', name: 'Short Pass Assist', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.ASSIST, hotkey: 'Alt+S' },
  
  { id: 'long_pass_simple', name: 'Long Pass Simple', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'L' },
  { id: 'long_pass_key', name: 'Long Pass Key', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+L' },
  { id: 'long_pass_assist', name: 'Long Pass Assist', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.ASSIST, hotkey: 'Alt+L' },
  { id: 'long_pass_unsuccessful', name: 'Long Pass Unsuccessful', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+L' },
  
  { id: 'through_pass_simple', name: 'Through Pass Simple', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'T' },
  { id: 'through_pass_key', name: 'Through Pass Key', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+T' },
  { id: 'through_pass_assist', name: 'Through Pass Assist', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.ASSIST, hotkey: 'Alt+T' },
  { id: 'through_pass_unsuccessful', name: 'Through Pass Unsuccessful', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+T' },
  
  { id: 'cross_simple', name: 'Cross Simple', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'C' },
  { id: 'cross_key', name: 'Cross Key', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+C' },
  { id: 'cross_assist', name: 'Cross Assist', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.ASSIST, hotkey: 'Alt+C' },
  { id: 'cross_unsuccessful', name: 'Cross Unsuccessful', category: EVENT_CATEGORIES.PASSING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+C' },

  // Defensive Events
  { id: 'standing_tackle_simple', name: 'Standing Tackle Simple', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'D' },
  { id: 'standing_tackle_crucial', name: 'Standing Tackle Crucial', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.CRUCIAL, hotkey: 'Shift+D' },
  { id: 'standing_tackle_unsuccessful', name: 'Standing Tackle Unsuccessful', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+D' },
  
  { id: 'sliding_tackle_simple', name: 'Sliding Tackle Simple', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'X' },
  { id: 'sliding_tackle_crucial', name: 'Sliding Tackle Crucial', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.CRUCIAL, hotkey: 'Shift+X' },
  { id: 'sliding_tackle_unsuccessful', name: 'Sliding Tackle Unsuccessful', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+X' },
  
  { id: 'interception_simple', name: 'Interception Simple', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'I' },
  { id: 'interception_crucial', name: 'Interception Crucial', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.CRUCIAL, hotkey: 'Shift+I' },
  
  { id: 'clearance_simple', name: 'Clearance Simple', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'R' },
  { id: 'clearance_crucial', name: 'Clearance Crucial', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.CRUCIAL, hotkey: 'Shift+R' },
  { id: 'clearance_goal_line', name: 'Clearance Goal Line', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.GOAL_LINE, hotkey: 'Alt+R' },
  
  { id: 'pressure_simple', name: 'Pressure Simple', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'P' },
  { id: 'pressure_crucial', name: 'Pressure Crucial', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.CRUCIAL, hotkey: 'Shift+P' },
  { id: 'pressure_unsuccessful', name: 'Pressure Unsuccessful', category: EVENT_CATEGORIES.DEFENSIVE, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+P' },

  // Shooting Events
  { id: 'close_shot_on_target', name: 'Close Shot On Target', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'H' },
  { id: 'close_shot_goalpost', name: 'Close Shot Hit Goalpost', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Shift+H' },
  { id: 'goal_from_close_shot', name: 'Goal from Close Shot', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'G' },
  { id: 'long_shot_on_target', name: 'Long Shot On Target', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'J' },
  { id: 'long_shot_goalpost', name: 'Long Shot Hit Goalpost', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Shift+J' },
  { id: 'goal_from_long_shot', name: 'Goal from Long Shot', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Shift+G' },
  { id: 'goal_from_header', name: 'Goal from Header', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Alt+G' },
  { id: 'header_on_target', name: 'Header On Target', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Y' },
  { id: 'header_goalpost', name: 'Header Hit Goalpost', category: EVENT_CATEGORIES.SHOOTING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Shift+Y' },

  // Goalkeeping Events
  { id: 'goalkeeper_save_simple', name: 'Goalkeeper Save Simple', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'V' },
  { id: 'goalkeeper_save_key', name: 'Goalkeeper Save Key', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+V' },
  { id: 'goalkeeper_save_brilliant', name: 'Goalkeeper Save Brilliant', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.BRILLIANT, hotkey: 'Alt+V' },
  { id: 'goalkeeper_save_unsuccessful', name: 'Goalkeeper Save Unsuccessful', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+V' },
  
  { id: 'goalkeeper_handling_simple', name: 'Goalkeeper Handling Simple', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'N' },
  { id: 'goalkeeper_handling_key', name: 'Goalkeeper Handling Key', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+N' },
  { id: 'goalkeeper_handling_unsuccessful', name: 'Goalkeeper Handling Unsuccessful', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+N' },
  
  { id: 'goalkeeper_throw_simple', name: 'Goalkeeper Throw Simple', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'B' },
  { id: 'goalkeeper_throw_key', name: 'Goalkeeper Throw Key', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+B' },
  { id: 'goalkeeper_throw_unsuccessful', name: 'Goalkeeper Throw Unsuccessful', category: EVENT_CATEGORIES.GOALKEEPING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+B' },

  // Physical Duels
  { id: 'ground_duel_won', name: 'Ground Duel Won', category: EVENT_CATEGORIES.PHYSICAL, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Q' },
  { id: 'ground_duel_lost', name: 'Ground Duel Lost', category: EVENT_CATEGORIES.PHYSICAL, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+Q' },
  { id: 'aerial_duel_won', name: 'Aerial Duel Won', category: EVENT_CATEGORIES.PHYSICAL, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'W' },
  { id: 'aerial_duel_lost', name: 'Aerial Duel Lost', category: EVENT_CATEGORIES.PHYSICAL, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+W' },

  // Dribbling Events
  { id: 'dribble_simple', name: 'Dribble Simple', category: EVENT_CATEGORIES.DRIBBLING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'K' },
  { id: 'dribble_crucial', name: 'Dribble Crucial', category: EVENT_CATEGORIES.DRIBBLING, subType: EVENT_SUB_TYPES.CRUCIAL, hotkey: 'Shift+K' },
  { id: 'dribble_unsuccessful', name: 'Dribble Unsuccessful', category: EVENT_CATEGORIES.DRIBBLING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+K' },

  // Ball Carry Events
  { id: 'ball_carry_short', name: 'Ball Carry Short', category: EVENT_CATEGORIES.BALL_CARRY, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'M' },
  { id: 'ball_carry_medium', name: 'Ball Carry Medium', category: EVENT_CATEGORIES.BALL_CARRY, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Shift+M' },
  { id: 'ball_carry_long', name: 'Ball Carry Long', category: EVENT_CATEGORIES.BALL_CARRY, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'Alt+M' },

  // Pass Receiving Events
  { id: 'received_short_pass_simple', name: 'Received Short Pass Simple', category: EVENT_CATEGORIES.PASS_RECEIVING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'F' },
  { id: 'received_short_pass_key', name: 'Received Short Pass Key', category: EVENT_CATEGORIES.PASS_RECEIVING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+F' },
  { id: 'received_short_pass_unsuccessful', name: 'Received Short Pass Unsuccessful', category: EVENT_CATEGORIES.PASS_RECEIVING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+F' },
  
  { id: 'received_long_pass_simple', name: 'Received Long Pass Simple', category: EVENT_CATEGORIES.PASS_RECEIVING, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'E' },
  { id: 'received_long_pass_key', name: 'Received Long Pass Key', category: EVENT_CATEGORIES.PASS_RECEIVING, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+E' },
  { id: 'received_long_pass_unsuccessful', name: 'Received Long Pass Unsuccessful', category: EVENT_CATEGORIES.PASS_RECEIVING, subType: EVENT_SUB_TYPES.UNSUCCESSFUL, hotkey: 'Ctrl+E' },

  // Chance Creation & Ball Progression
  { id: 'secondary_assist', name: 'Secondary Assist', category: EVENT_CATEGORIES.CHANCE_CREATION, subType: EVENT_SUB_TYPES.KEY, hotkey: 'U' },
  { id: 'smart_action', name: 'Smart Action', category: EVENT_CATEGORIES.CHANCE_CREATION, subType: EVENT_SUB_TYPES.KEY, hotkey: 'Shift+U' },
  { id: 'progressive_run', name: 'Progressive Run', category: EVENT_CATEGORIES.BALL_PROGRESSION, subType: EVENT_SUB_TYPES.SIMPLE, hotkey: 'O' },
] as const;

// Event types grouped by category for UI organization
export const EVENT_TYPES_BY_CATEGORY = {
  [EVENT_CATEGORIES.PASSING]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.PASSING),
  [EVENT_CATEGORIES.DEFENSIVE]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.DEFENSIVE),
  [EVENT_CATEGORIES.SHOOTING]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.SHOOTING),
  [EVENT_CATEGORIES.GOALKEEPING]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.GOALKEEPING),
  [EVENT_CATEGORIES.PHYSICAL]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.PHYSICAL),
  [EVENT_CATEGORIES.DRIBBLING]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.DRIBBLING),
  [EVENT_CATEGORIES.BALL_CARRY]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.BALL_CARRY),
  [EVENT_CATEGORIES.PASS_RECEIVING]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.PASS_RECEIVING),
  [EVENT_CATEGORIES.CHANCE_CREATION]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.CHANCE_CREATION),
  [EVENT_CATEGORIES.BALL_PROGRESSION]: COMPREHENSIVE_EVENT_TYPES.filter(e => e.category === EVENT_CATEGORIES.BALL_PROGRESSION),
};

// Hotkey mapping for quick tagging
export const HOTKEY_MAP = COMPREHENSIVE_EVENT_TYPES.reduce((acc, eventType) => {
  acc[eventType.hotkey] = eventType;
  return acc;
}, {} as Record<string, typeof COMPREHENSIVE_EVENT_TYPES[number]>);

// Quality rating scale
export const QUALITY_RATINGS = [
  { value: 1, label: 'Poor', color: 'text-red-600' },
  { value: 2, label: 'Below Average', color: 'text-orange-600' },
  { value: 3, label: 'Average', color: 'text-yellow-600' },
  { value: 4, label: 'Good', color: 'text-green-600' },
  { value: 5, label: 'Excellent', color: 'text-blue-600' },
] as const;

// Field positions for tagging
export const FIELD_ZONES = {
  DEFENSIVE_THIRD: 'defensive_third',
  MIDFIELD: 'midfield',
  ATTACKING_THIRD: 'attacking_third',
  PENALTY_AREA: 'penalty_area',
  GOAL_AREA: 'goal_area',
  LEFT_WING: 'left_wing',
  RIGHT_WING: 'right_wing',
  CENTER: 'center',
} as const;

// Position-specific relevant events
export const POSITION_RELEVANT_EVENTS = {
  'Goalkeeper': ['goalkeeper_save_simple', 'goalkeeper_save_key', 'goalkeeper_save_brilliant', 'goalkeeper_handling_simple', 'goalkeeper_throw_simple'],
  'Centre-Back': ['standing_tackle_simple', 'standing_tackle_crucial', 'clearance_simple', 'clearance_crucial', 'interception_simple', 'aerial_duel_won', 'long_pass_simple'],
  'Full-Back': ['standing_tackle_simple', 'interception_simple', 'cross_simple', 'cross_key', 'dribble_simple', 'progressive_run'],
  'Defensive Midfielder': ['standing_tackle_simple', 'interception_simple', 'short_pass_simple', 'long_pass_simple', 'pressure_simple'],
  'Central Midfielder': ['short_pass_simple', 'short_pass_key', 'through_pass_simple', 'dribble_simple', 'secondary_assist', 'smart_action'],
  'Attacking Midfielder': ['short_pass_key', 'through_pass_key', 'secondary_assist', 'smart_action', 'dribble_crucial', 'close_shot_on_target'],
  'Winger': ['cross_simple', 'cross_key', 'dribble_simple', 'dribble_crucial', 'ball_carry_medium', 'close_shot_on_target'],
  'Striker': ['close_shot_on_target', 'goal_from_close_shot', 'header_on_target', 'goal_from_header', 'received_cross_simple', 'smart_action'],
} as const;

export type EventCategory = typeof EVENT_CATEGORIES[keyof typeof EVENT_CATEGORIES];
export type EventSubType = typeof EVENT_SUB_TYPES[keyof typeof EVENT_SUB_TYPES];
export type EventType = typeof COMPREHENSIVE_EVENT_TYPES[number];
export type QualityRating = typeof QUALITY_RATINGS[number];
export type FieldZone = typeof FIELD_ZONES[keyof typeof FIELD_ZONES];