// ===========================
// UTILITY FUNCTIONS
// ===========================
/**
 * Wraps an index to the valid range [0, TRACK_LEN)
 */
function wrapIndex(index) {
  return ((index % CONFIG.TRACK_LEN) + CONFIG.TRACK_LEN) % CONFIG.TRACK_LEN;
}

/**
 * Calculates the circular distance between two nodes
 */
function circularDistance(a, b) {
  let diff = Math.abs(a - b);
  return Math.min(diff, CONFIG.TRACK_LEN - diff);
}

/**
 * Circular distance going clockwise from a to b (inclusive of steps taken).
 * Result is in [0, TRACK_LEN).
 */
function circularDistanceCW(a, b) {
  // wrap subtraction so it always yields a non-negative offset
  return wrapIndex(b - a);
}

/**
 * Returns a random number between min and max
 */
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Gets the pixel position (x, y) for a given node index
 */
function getPixelPosition(nodeIndex) {
  let angle = (nodeIndex / CONFIG.TRACK_LEN) * TWO_PI - HALF_PI;
  let x = gameCenterX + cos(angle) * CONFIG.RING_RADIUS;
  let y = gameCenterY + sin(angle) * CONFIG.RING_RADIUS;
  return { x, y, angle };
}

/**
 * Draws a square pixel at the given node index
 */
function drawSquarePixel(nodeIndex, fillColor, scaleFactor = 1.0) {
  if (!isFinite(nodeIndex)) return;

  let pos = getPixelPosition(nodeIndex);
  push();
  translate(pos.x, pos.y);
  rotate(pos.angle + HALF_PI);
  scale(scaleFactor);
  noStroke();
  fill(fillColor);
  rectMode(CENTER);
  square(0, 0, CONFIG.PIXEL_SIZE);
  pop();
}
