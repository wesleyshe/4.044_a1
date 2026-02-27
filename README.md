# Pirate Treasure Hunt

A two-player p5.js game where a red ship and a green ship race around a 1D sea lane to claim a yellow treasure first.

## Configuration

All game parameters live in `config.js`.  Weather cycles have three states – **calm**, **storm coming** and **storm** – and each state's duration is now controlled by its own min/max values.  Adjust the following fields to tweak pacing:

```js
// weather timing in milliseconds
CALM_MIN_MS, CALM_MAX_MS            // calm period range
STORM_COMING_MIN_MS, STORM_COMING_MAX_MS // warning phase range
STORM_MIN_MS, STORM_MAX_MS          // storm phase range

// terrain and obstacle settings
OBSTACLE_STARTING_PIXELS           // base number of terrain pixels
OBSTACLE_STARTING_REDUCTION        // fraction of base that is actually placed (use 0.75 to cut count by 25%)
OBSTACLE_MIN_SIZE                  // minimum blob size (now 3)

// special events
CALM_EXTRA_ON_TREASURE_MS          // extra calm time after treasure is claimed

// treasure spawn rules
// - never on a ship's current or start node
// - appears within the middle third of the longer circular gap between players

// sound settings
// SOUND_VOLUME – master volume for weather sound effects (0.0 to 1.0)
// audio files must live in public/ and are mapped by state:
//   calm.mp3, storm coming.mp3, storm.mp3

// rendering tweaks / debugging
// * players are always drawn; if a ship is hiding on terrain a colored outline
//   is added so you still know where it is (prevents "screen disappears" when
//   both boats hide simultaneously)
// * invalid node indices are ignored and logged to console to avoid blanking
//   the canvas; if you see such warnings it indicates a logic error elsewhere
//   in the code.
```

Other options such as obstacle counts, player controls, colours, etc. are also available in the same file.
