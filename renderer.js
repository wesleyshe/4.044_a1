// ===========================
// RENDERING FUNCTIONS
// ===========================
function blendColor(from, to, amount) {
  return [
    lerp(from[0], to[0], amount),
    lerp(from[1], to[1], amount),
    lerp(from[2], to[2], amount)
  ];
}

function drawTrack(weatherState = 'CALM', weatherPhaseProgress = 0) {
  let base = CONFIG.COLORS.trackPixel;
  let dark = CONFIG.COLORS.oceanDark;
  let light = CONFIG.COLORS.oceanLight;
  let t = millis();

  for (let i = 0; i < CONFIG.TRACK_LEN; i++) {
    let fillColor = base;

    if (weatherState === 'STORM_COMING') {
      let flicker = 0.5 + 0.5 * Math.sin(t / CONFIG.STORM_COMING_FLICKER_MS + i * 0.8);
      let darkMix = constrain((0.2 + 0.8 * weatherPhaseProgress) * flicker, 0, 1);
      fillColor = blendColor(base, dark, darkMix);
    } else if (weatherState === 'STORM') {
      let waveA = 0.5 + 0.5 * Math.sin(t / CONFIG.STORM_FLICKER_MS + i * 1.4);
      let waveB = 0.5 + 0.5 * Math.sin(t / (CONFIG.STORM_FLICKER_MS * 0.8) + i * 0.45 + 2.1);
      let darkMix = constrain(0.45 + 0.5 * waveA, 0, 1);
      let lightMix = constrain(0.2 + 0.65 * waveB, 0, 1);
      fillColor = blendColor(base, dark, darkMix);
      fillColor = blendColor(fillColor, light, lightMix);
    }

    drawSquarePixel(i, fillColor);
  }
}

function drawObstacles(obstacles) {
  for (let obs of obstacles) {
    for (let nodeObj of obs.nodes) {
      drawSquarePixel(nodeObj.index, CONFIG.COLORS.obstacle, 1.0);
    }
  }
}

function drawTreasure(treasureNode) {
  let pulse = 1.2 + 0.15 * Math.sin(millis() / 120);
  drawSquarePixel(treasureNode, CONFIG.COLORS.treasure, pulse);
}

// ===========================
// WEATHER UI EFFECTS (Mode B)
// ===========================

// Persistent rain drop pool – seeded once, recycled every frame
let _rainDrops = [];

function _ensureRainDrops(count) {
  while (_rainDrops.length < count) {
    _rainDrops.push({ x: Math.random(), y: Math.random(), seed: Math.random() });
  }
}

/**
 * Draw the background image with weather-dependent darkening / flash overlay.
 */
function drawWeatherBackground(img, ws, progress) {
  image(img, 0, 0, width, height);

  if (ws === 'STORM_COMING') {
    let alpha = CONFIG.BACKGROUND_STORM_COMING_DARKEN * progress;
    noStroke();
    fill(0, 0, 0, alpha);
    rect(0, 0, width, height);
  } else if (ws === 'STORM') {
    let osc = 0.5 + 0.5 * Math.sin(millis() / CONFIG.BACKGROUND_STORM_FLASH_MS);
    let alpha = lerp(CONFIG.BACKGROUND_STORM_FLASH_MIN, CONFIG.BACKGROUND_STORM_FLASH_MAX, osc);
    noStroke();
    fill(0, 0, 0, alpha);
    rect(0, 0, width, height);
  }
}

/**
 * Draw compass image with weather-dependent shake.
 */
function drawWeatherCompass(img, ws, progress) {
  let angleDeg = 0;

  if (ws === 'STORM_COMING') {
    let maxDeg = CONFIG.COMPASS_SHAKE_STORM_COMING_DEG;
    let period = CONFIG.COMPASS_SHAKE_STORM_COMING_MS;
    // layered sine waves for organic shake, intensity ramps with progress
    let shake = Math.sin(millis() / period) * 0.7
              + Math.sin(millis() / (period * 0.6) + 1.3) * 0.3;
    angleDeg = maxDeg * shake * progress;
  } else if (ws === 'STORM') {
    let maxDeg = CONFIG.COMPASS_SHAKE_STORM_DEG;
    let period = CONFIG.COMPASS_SHAKE_STORM_MS;
    let shake = Math.sin(millis() / period) * 0.5
              + Math.sin(millis() / (period * 0.7) + 2.0) * 0.35
              + Math.sin(millis() / (period * 0.4) + 4.1) * 0.15;
    angleDeg = maxDeg * shake;
  }

  if (angleDeg === 0) {
    image(img, 0, 0, width, height);
  } else {
    push();
    translate(width / 2, height / 2);
    rotate(radians(angleDeg));
    imageMode(CENTER);
    image(img, 0, 0, width, height);
    imageMode(CORNER);
    pop();
  }
}

/**
 * Draw rain streaks across the screen.
 */
function drawWeatherRain(ws, progress) {
  if (ws !== 'STORM_COMING' && ws !== 'STORM') return;

  let count, len, weight, alpha, speed;
  if (ws === 'STORM_COMING') {
    count = Math.floor(CONFIG.RAIN_STORM_COMING_COUNT * progress);
    len = CONFIG.RAIN_STORM_COMING_LENGTH;
    weight = CONFIG.RAIN_STORM_COMING_WEIGHT;
    alpha = CONFIG.RAIN_STORM_COMING_ALPHA * progress;
    speed = CONFIG.RAIN_STORM_COMING_SPEED;
  } else {
    count = CONFIG.RAIN_STORM_COUNT;
    len = CONFIG.RAIN_STORM_LENGTH;
    weight = CONFIG.RAIN_STORM_WEIGHT;
    alpha = CONFIG.RAIN_STORM_ALPHA;
    speed = CONFIG.RAIN_STORM_SPEED;
  }

  if (count <= 0) return;
  _ensureRainDrops(count);

  let angleRad = radians(CONFIG.RAIN_ANGLE_DEG);
  let dx = Math.sin(angleRad) * len;
  let dy = Math.cos(angleRad) * len;
  let rc = CONFIG.RAIN_COLOR;
  let t = millis() / 1000;

  stroke(rc[0], rc[1], rc[2], alpha);
  strokeWeight(weight);

  for (let i = 0; i < count; i++) {
    let drop = _rainDrops[i];
    // animate y position using time, wrap around with modulo
    let yOff = (drop.y + t * speed * (0.8 + drop.seed * 0.4)) % 1.4 - 0.2;
    let xOff = (drop.x + t * speed * Math.sin(angleRad) * (0.8 + drop.seed * 0.4)) % 1.4 - 0.2;
    let x1 = xOff * width;
    let y1 = yOff * height;
    line(x1, y1, x1 + dx, y1 + dy);
  }
}

/**
 * Draw the scoreboard: 5 treasure boxes across the top border badge.
 * Each box shows the round result — player color if won, dark if unclaimed.
 */
function drawScoreboard(roundResults, totalRounds) {
  let boxSize = CONFIG.SCOREBOARD_BOX_SIZE;
  let gap = CONFIG.SCOREBOARD_BOX_GAP;
  let rounding = CONFIG.SCOREBOARD_BOX_ROUNDING;
  let inset = CONFIG.SCOREBOARD_ICON_INSET;
  let totalWidth = totalRounds * boxSize + (totalRounds - 1) * gap;
  let startX = width / 2 - totalWidth / 2;
  let topY = height * CONFIG.SCOREBOARD_Y_FRAC;

  for (let i = 0; i < totalRounds; i++) {
    let x = startX + i * (boxSize + gap);
    let y = topY;
    let result = roundResults[i]; // undefined if round not yet played

    // box background
    if (result === 'red ship') {
      fill(CONFIG.COLORS.player1);
      stroke(CONFIG.COLORS.player1[0], CONFIG.COLORS.player1[1], CONFIG.COLORS.player1[2], 180);
    } else if (result === 'green ship') {
      fill(CONFIG.COLORS.player2);
      stroke(CONFIG.COLORS.player2[0], CONFIG.COLORS.player2[1], CONFIG.COLORS.player2[2], 180);
    } else {
      fill(CONFIG.SCOREBOARD_UNCLAIMED_COLOR);
      stroke(CONFIG.SCOREBOARD_UNCLAIMED_STROKE);
    }
    strokeWeight(CONFIG.SCOREBOARD_STROKE_WEIGHT);
    rectMode(CORNER);
    rect(x, y, boxSize, boxSize, rounding);

    // treasure diamond icon inside
    let cx = x + boxSize / 2;
    let iconCy = y + boxSize / 2;
    let half = (boxSize - inset * 2) / 2;

    noStroke();
    if (result) {
      // bright gold diamond for claimed rounds
      fill(255, 220, 60);
    } else {
      // dim gold outline for unclaimed
      fill(CONFIG.SCOREBOARD_UNCLAIMED_STROKE);
    }
    beginShape();
    vertex(cx, iconCy - half);      // top
    vertex(cx + half, iconCy);      // right
    vertex(cx, iconCy + half);      // bottom
    vertex(cx - half, iconCy);      // left
    endShape(CLOSE);
  }
}

// ===========================
// VICTORY RIBBONS
// ===========================

let _ribbons = [];

function _ensureRibbons(count) {
  while (_ribbons.length < count) {
    _ribbons.push({
      x: Math.random(),
      y: Math.random(),
      seed: Math.random(),
      swayOffset: Math.random() * Math.PI * 2,
      angle: (Math.random() - 0.5) * 1.4  // random tilt: -40° to +40° in radians
    });
  }
}

/**
 * Draw victory ribbons falling from top to bottom in the winner's color.
 * Each ribbon is a curly sine-wave stroke that animates over time.
 */
function drawVictoryRibbons(winnerName) {
  let ribbonColor;
  if (winnerName === 'red ship') {
    ribbonColor = CONFIG.COLORS.player1;
  } else if (winnerName === 'green ship') {
    ribbonColor = CONFIG.COLORS.player2;
  } else {
    return; // no ribbons for draw
  }

  let count = CONFIG.RIBBON_COUNT;
  _ensureRibbons(count);

  let len = CONFIG.RIBBON_LENGTH;
  let w = CONFIG.RIBBON_WIDTH;
  let speed = CONFIG.RIBBON_SPEED;
  let swayAmp = CONFIG.RIBBON_SWAY_AMOUNT;
  let swayMs = CONFIG.RIBBON_SWAY_SPEED_MS;
  let alpha = CONFIG.RIBBON_ALPHA;
  let curlAmp = CONFIG.RIBBON_CURL_AMOUNT;
  let curlSegs = CONFIG.RIBBON_CURL_SEGMENTS;
  let t = millis() / 1000;

  noFill();
  strokeCap(ROUND);

  for (let i = 0; i < count; i++) {
    let r = _ribbons[i];
    let fallSpeed = speed * (0.6 + r.seed * 0.8);
    let yOff = (r.y + t * fallSpeed * 0.15) % 1.3 - 0.15;
    let sway = Math.sin(millis() / swayMs + r.swayOffset) * swayAmp * (0.5 + r.seed * 0.5);
    let baseX = r.x * width + sway;
    let baseY = yOff * height;

    // color variation per ribbon
    let bright = 0.7 + r.seed * 0.3;
    stroke(ribbonColor[0] * bright, ribbonColor[1] * bright, ribbonColor[2] * bright, alpha);
    strokeWeight(w * (0.6 + r.seed * 0.4));

    // draw curly ribbon as a series of connected curve segments, rotated at its tilt angle
    let curlPhase = r.swayOffset + t * (1.5 + r.seed);
    let thisCurlAmp = curlAmp * (0.6 + r.seed * 0.8);
    let steps = 12;

    push();
    translate(baseX, baseY);
    rotate(r.angle);
    beginShape();
    for (let s = 0; s <= steps; s++) {
      let frac = s / steps;
      let py = frac * len;
      let curlWave = Math.sin(frac * curlSegs * TWO_PI + curlPhase) * thisCurlAmp;
      let px = curlWave;
      curveVertex(px, py);
      // duplicate first and last for catmull-rom spline ends
      if (s === 0 || s === steps) curveVertex(px, py);
    }
    endShape();
    pop();
  }
}

