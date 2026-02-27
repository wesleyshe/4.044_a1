# Pirate Treasure Hunt

A two-player p5.js game where a red ship and a green ship race around a 1D sea lane to claim a yellow treasure first.

## Configuration

All game parameters live in `config.js`.  Weather cycles have three states – **calm**, **storm coming** and **storm** – and each state's duration is now controlled by its own min/max values.  Adjust the following fields to tweak pacing:

```js
// weather timing in milliseconds
CALM_MIN_MS, CALM_MAX_MS            // calm period range
STORM_COMING_MIN_MS, STORM_COMING_MAX_MS // warning phase range
STORM_MIN_MS, STORM_MAX_MS          // storm phase range
```

Other options such as obstacle counts, player controls, colours, etc. are also available in the same file.
