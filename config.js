// ===========================
// GAME CONFIGURATION
// ===========================
// Adjust these parameters to customize the game behavior

const CONFIG = {
  // Track Configuration
  TRACK_LEN: 90,           // Number of discrete nodes on the track
  RING_RADIUS: 342,        // Radius of the circular track in pixels
  PIXEL_SIZE: 18,          // Size of each square pixel on the track

  // Movement Physics
  ACCEL: 2000,              // Acceeration when pressing keys
  INERTIA: 0.95,           // Momentum (0-1, higher = more slippery/momentum, lower = tighter control)
  MAX_SPEED: 40,           // Maximum velocity
  // ships move more slowly on terrain; all other physics (inertia, drift) remain unchanged
  TERRAIN_SPEED_MULTIPLIER: 1.0, // Speed mufltiplier while sailing on brown terrain (50% speed)

  // Obstacles
  // starting count of terrain pixels; will be multiplied by REDUCTION_FACTOR when a round begins
  OBSTACLE_STARTING_PIXELS: 30, // Total number of pixels of obstacles at start
  OBSTACLE_STARTING_REDUCTION: 0.75, // Fraction of the starting pixels actually placed (25% fewer terrain)
  OBSTACLE_MIN_SEP: 3,     // Minimum separation between obstacles (in nodes)
  OBSTACLE_MIN_SIZE: 3,    // Minimum size of obstacle blob (in pixels)
  OBSTACLE_MAX_SIZE: 4,    // Maximum size of obstacle blob (in pixels)

  // Weather Phase Timing (in milliseconds)
  CALM_MIN_MS: 2000,                 // Calm phase min duration
  CALM_MAX_MS: 3500,                 // Calm phase max duration
  STORM_COMING_MIN_MS: 2000,         // Storm-coming phase min duration
  STORM_COMING_MAX_MS: 3500,         // Storm-coming phase max duration
  STORM_MIN_MS: 3000,                // Storm phase min duration
  STORM_MAX_MS: 6000,                // Storm phase max duration

  // Storm strike chance: probability (0-1) that STORM_COMING leads to STORM.
  // The remaining chance (1 - this value) means the storm dissipates back to CALM.
  STORM_STRIKE_CHANCE: 0.75,           // 75% chance storm actually hits

  // Weather Flicker Speeds (smaller = faster)
  STORM_COMING_FLICKER_MS: 220,      // Slow flicker speed for storm-coming phase
  STORM_FLICKER_MS: 70,              // Fast flicker speed for storm phase

  // Storm-coming Movement Feel
  STORM_COMING_ACCEL_MULTIPLIER: 0.55,    // Lower input response while storm is coming
  STORM_COMING_MAX_SPEED_MULTIPLIER: 0.7, // Lower top speed while storm is coming
  STORM_COMING_INERTIA: 0.88,             // Extra drag (lower = more sluggish)
  STORM_COMING_DRIFT_FORCE: 70,           // Side-to-side instability strength
  STORM_COMING_SWAY_MS: 240,              // Instability sway period

  // Treasure Timing (in milliseconds)
  TREASURE_SPAWN_MIN_MS: 1200,       // Minimum delay before treasure appears each round
  TREASURE_SPAWN_MAX_MS: 3500,       // Maximum delay before treasure appears each round

  // Special event timings
  CALM_EXTRA_ON_TREASURE_MS: 3000,   // Additional calm period awarded immediately after treasure is claimed

  // Match Flow
  BEST_OF_ROUNDS: 5,
  ROUND_TRANSITION_SECONDS: 2.0,

  // ---- Weather UI Effects (Mode B only) ----

  // Compass Shake
  COMPASS_SHAKE_STORM_COMING_DEG: 2.5,  // Max rotation in degrees during storm-coming
  COMPASS_SHAKE_STORM_DEG: 10,          // Max rotation in degrees during storm
  COMPASS_SHAKE_STORM_COMING_MS: 300,   // Sway period (ms) for storm-coming (slower = gentler)
  COMPASS_SHAKE_STORM_MS: 80,           // Sway period (ms) for storm (faster = more violent)

  // Rain
  RAIN_STORM_COMING_COUNT: 120,         // Number of rain lines during storm-coming
  RAIN_STORM_COUNT: 350,                // Number of rain lines during storm
  RAIN_STORM_COMING_LENGTH: 18,         // Rain streak length (px) during storm-coming
  RAIN_STORM_LENGTH: 30,                // Rain streak length (px) during storm
  RAIN_STORM_COMING_WEIGHT: 1,          // Rain line thickness during storm-coming
  RAIN_STORM_WEIGHT: 2,                 // Rain line thickness during storm
  RAIN_STORM_COMING_ALPHA: 80,          // Rain opacity (0-255) during storm-coming
  RAIN_STORM_ALPHA: 140,                // Rain opacity (0-255) during storm
  RAIN_STORM_COMING_SPEED: 12,          // Rain fall speed multiplier during storm-coming
  RAIN_STORM_SPEED: 25,                 // Rain fall speed multiplier during storm
  RAIN_ANGLE_DEG: 15,                   // Rain slant angle in degrees (0 = vertical)
  RAIN_COLOR: [180, 200, 220],          // Rain streak color [R, G, B]

  // Background Darkening / Flash
  BACKGROUND_STORM_COMING_DARKEN: 100,  // Black overlay opacity (0-255) during storm-coming
  BACKGROUND_STORM_FLASH_MIN: 60,       // Storm flash overlay min opacity
  BACKGROUND_STORM_FLASH_MAX: 160,      // Storm flash overlay max opacity
  BACKGROUND_STORM_FLASH_MS: 120,       // Storm flash oscillation period (ms)

  // Pause Overlay
  PAUSE_DIM_ALPHA: 120,                // Black overlay opacity (0-255) when paused

  // ---- Scoreboard ----
  SCOREBOARD_Y_FRAC: 0.025,             // Vertical center as fraction of window height
  SCOREBOARD_BOX_SIZE: 44,              // Size of each treasure box (px)
  SCOREBOARD_BOX_GAP: 48,              // Gap between boxes (px)
  SCOREBOARD_BOX_ROUNDING: 4,          // Corner rounding (px)
  SCOREBOARD_UNCLAIMED_COLOR: [60, 50, 40],       // Dark brown for unclaimed rounds
  SCOREBOARD_UNCLAIMED_STROKE: [120, 100, 70],    // Border for unclaimed boxes
  SCOREBOARD_STROKE_WEIGHT: 2,         // Box border thickness
  SCOREBOARD_ICON_INSET: 5,            // Inset for the treasure diamond shape inside the box

  // ---- Victory Ribbons (Match End) ----
  RIBBON_COUNT: 80,                    // Number of ribbon strands
  RIBBON_LENGTH: 90,                   // Length of each ribbon strand (px)
  RIBBON_WIDTH: 8,                     // Width / stroke thickness of each ribbon
  RIBBON_SPEED: 6,                     // Fall speed multiplier
  RIBBON_SWAY_AMOUNT: 30,             // Horizontal sway amplitude (px)
  RIBBON_SWAY_SPEED_MS: 400,          // Sway oscillation period (ms)
  RIBBON_ALPHA: 200,                   // Ribbon opacity (0-255)
  RIBBON_CURL_AMOUNT: 25,             // Horizontal curl wave amplitude (px)
  RIBBON_CURL_SEGMENTS: 4,            // Number of curl waves along the ribbon length

  // Sound
  // value between 0 (mute) and 1 (full volume)
  SOUND_VOLUMES: {
    CALM: 0.5,
    STORM_COMING: 0.5,
    STORM: 0.5,
    CELEBRATION: 0.75,
    TREASURESPAWN: 0.5

  },

  // Colors
  COLORS: {
    background: [0, 0, 0],
    trackPixel: [126, 204, 235],
    oceanDark: [35, 108, 140],
    oceanLight: [188, 235, 255],
    player1: [255, 80, 80],
    player2: [80, 255, 80],
    treasure: [255, 220, 60],
    obstacle: [139, 94, 54]
  },

  // Player Controls
  PLAYER1_LEFT: 'A',
  PLAYER1_RIGHT: 'D',
  PLAYER2_LEFT: 'ArrowLeft',
  PLAYER2_RIGHT: 'ArrowRight'
};

