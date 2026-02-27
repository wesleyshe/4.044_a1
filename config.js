// ===========================
// GAME CONFIGURATION
// ===========================
console.log('config.js loaded');
// Adjust these parameters to customize the game behavior

const CONFIG = {
  // Track Configuration
  TRACK_LEN: 80,           // Number of discrete nodes on the track
  RING_RADIUS: 250,        // Radius of the circular track in pixels
  PIXEL_SIZE: 14,          // Size of each square pixel on the track

  // Movement Physics
  ACCEL: 200,              // Acceleration when pressing keys
  INERTIA: 0.95,           // Momentum (0-1, higher = more slippery/momentum, lower = tighter control)
  MAX_SPEED: 10,           // Maximum velocity
  // ships move more slowly on terrain; all other physics (inertia, drift) remain unchanged
  TERRAIN_SPEED_MULTIPLIER: 0.5, // Speed multiplier while sailing on brown terrain (50% speed)

  // Obstacles
  // starting count of terrain pixels; will be multiplied by REDUCTION_FACTOR when a round begins
  OBSTACLE_STARTING_PIXELS: 30, // Total number of pixels of obstacles at start
  OBSTACLE_STARTING_REDUCTION: 0.75, // Fraction of the starting pixels actually placed (25% fewer terrain)
  OBSTACLE_PIXEL_DECREMENT: 3,  // Number of pixels to decrease per cycle
  OBSTACLE_MIN_SEP: 3,     // Minimum separation between obstacles (in nodes)
  OBSTACLE_MIN_SIZE: 3,    // Minimum size of obstacle blob (in pixels)
  OBSTACLE_MAX_SIZE: 4,    // Maximum size of obstacle blob (in pixels)

  // Weather Phase Timing (in milliseconds)
  CALM_MIN_MS: 3000,                 // Calm phase min duration
  CALM_MAX_MS: 5000,                 // Calm phase max duration
  STORM_COMING_MIN_MS: 3000,         // Storm-coming phase min duration
  STORM_COMING_MAX_MS: 5000,         // Storm-coming phase max duration
  STORM_MIN_MS: 3000,                // Storm phase min duration
  STORM_MAX_MS: 5000,                // Storm phase max duration

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

  // Visual Settings
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 800,

  // Sound
  // value between 0 (mute) and 1 (full volume)
  SOUND_VOLUMES: {
    CALM: 1.0,
    STORM_COMING: 0.5,
    STORM: 0.5
  },

  // Colors
  COLORS: {
    background: [7, 49, 73],
    trackPixel: [126, 204, 235],
    oceanDark: [35, 108, 140],
    oceanLight: [188, 235, 255],
    player1: [255, 80, 80],
    player2: [80, 255, 80],
    treasure: [255, 220, 60],
    obstacle: [139, 94, 54],
    text: 255,
    textSecondary: 220,
    textTertiary: 180
  },

  // Player Controls
  PLAYER1_LEFT: 'A',
  PLAYER1_RIGHT: 'D',
  PLAYER2_LEFT: 'ArrowLeft',
  PLAYER2_RIGHT: 'ArrowRight'
};
