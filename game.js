// ===========================
// GAME STATE AND LOGIC
// ===========================

// audio handles (loaded in setup to avoid preload issues)
let weatherSounds = {};
let celebrationSound = null;
let treasureSpawnSound = null;

// UI overlay images (loaded in preload)
let uiBackgroundImg, uiBorderImg, uiCompassImg;

// game center (computed each frame for fullscreen layout)
let gameCenterX = 0;
let gameCenterY = 0;

// pause
let isPaused = false;

// diagnostics
let lastFatalError = null;
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global error caught', message, source, lineno, colno, error);
  lastFatalError = message || (error && error.toString());
};


let gameState = 'PLAYING'; // PLAYING, ROUND_END, MATCH_END
let uiMode = 'B'; // 'A' = minimal (track only), 'B' = full UI (HUD, overlays, etc.)
let obstacles = [];
let players = [];
let winner = null;
let endReason = '';
let currentTotalPixels = 0;

let treasureNode = -1;
let treasureSpawnTimer = 0;
let treasureSpawnDelay = 0;

let weatherState = 'CALM'; // CALM, STORM_COMING, STORM
let weatherTimer = 0;
let weatherPhaseDuration = 0;
let weatherPhaseProgress = 0;
let roundTransitionTimer = 0;
let previousRoundTerrainSignature = '';
let terrainNodeSet = new Set(); // rebuilt after obstacle generation for O(1) lookups

let redShipWins = 0;
let greenShipWins = 0;
let roundsPlayed = 0;
let roundResults = []; // per-round winner: 'red ship' or 'green ship'

// ===========================
// OBSTACLE GENERATION
// ===========================

function rebuildTerrainSet() {
  terrainNodeSet.clear();
  for (let obs of obstacles) {
    for (let nodeObj of obs.nodes) {
      terrainNodeSet.add(nodeObj.index);
    }
  }
}

function isTerrainNode(node) {
  return terrainNodeSet.has(node);
}

function generateObstacles() {
  obstacles = [];
  let playerNodes = players.map(player => player.getCurrentNode());
  let forbiddenNodes = [treasureNode, ...playerNodes, players[0].startNode, players[1].startNode];
  let maxAttempts = 1000;
  let currentPixels = 0;

  for (let attempts = 0; attempts < maxAttempts && currentPixels < currentTotalPixels; attempts++) {
    let remainingPixels = currentTotalPixels - currentPixels;
    if (remainingPixels < CONFIG.OBSTACLE_MIN_SIZE) break;

    let blobSize = Math.floor(randomRange(CONFIG.OBSTACLE_MIN_SIZE, CONFIG.OBSTACLE_MAX_SIZE + 1));
    blobSize = Math.min(blobSize, remainingPixels);

    let startNode = Math.floor(Math.random() * CONFIG.TRACK_LEN);

    let blob = [];
    for (let i = 0; i < blobSize; i++) {
      blob.push(wrapIndex(startNode + i));
    }

    if (blob.some(node => forbiddenNodes.includes(node))) continue;

    let tooClose = obstacles.some(existingObstacle =>
      blob.some(node =>
        existingObstacle.nodes.some(existingNode =>
          circularDistance(node, existingNode.index) < CONFIG.OBSTACLE_MIN_SEP
        )
      )
    );

    if (!tooClose) {
      obstacles.push({
        nodes: blob.map(n => ({ index: n }))
      });
      currentPixels += blobSize;
    }
  }
}

function getTerrainSignature() {
  let nodes = new Array(CONFIG.TRACK_LEN).fill('0');
  for (let n of terrainNodeSet) nodes[n] = '1';
  return nodes.join('');
}

function generateDistinctRoundTerrain() {
  let nextSignature = '';
  let maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    generateObstacles();
    rebuildTerrainSet();
    nextSignature = getTerrainSignature();

    if (previousRoundTerrainSignature === '' || nextSignature !== previousRoundTerrainSignature) {
      break;
    }
  }

  previousRoundTerrainSignature = nextSignature;
}

// ===========================
// TREASURE LOGIC
// ===========================

function scheduleTreasureSpawn() {
  treasureNode = -1;
  treasureSpawnTimer = 0;
  treasureSpawnDelay = randomRange(CONFIG.TREASURE_SPAWN_MIN_MS, CONFIG.TREASURE_SPAWN_MAX_MS) / 1000;
}

function pickTreasureNode() {
  let p1 = players[0].getCurrentNode();
  let p2 = players[1].getCurrentNode();

  // always forbid player positions (and their start nodes) entirely
  let forbiddenNodes = [players[0].startNode, players[1].startNode, p1, p2];
  let candidates = [];

  for (let node = 0; node < CONFIG.TRACK_LEN; node++) {
    if (forbiddenNodes.includes(node)) continue;
    if (isTerrainNode(node)) continue;
    candidates.push(node);
  }

  if (candidates.length === 0) {
    treasureNode = -1;
    return;
  }

  // determine the longest arc between the two players
  let distCW = circularDistanceCW(p1, p2);
  let distCCW = circularDistanceCW(p2, p1);
  let arcStart, arcLen;
  if (distCW >= distCCW) {
    arcStart = p1;
    arcLen = distCW;
  } else {
    arcStart = p2;
    arcLen = distCCW;
  }

  // calculate middle third of that arc
  let third = Math.floor(arcLen / 3);
  let zoneStart = wrapIndex(arcStart + third);
  let zoneLen = Math.max(0, arcLen - 2 * third);

  // build set of allowed nodes inside the middle third
  let zoneSet = new Set();
  for (let i = 0; i < zoneLen; i++) {
    zoneSet.add(wrapIndex(zoneStart + i));
  }

  // filter candidates to those falling inside the zone, if any
  let validZone = candidates.filter(n => zoneSet.has(n));
  let usable = validZone.length > 0 ? validZone : candidates;

  treasureNode = usable[Math.floor(Math.random() * usable.length)];

  try {
    if (treasureSpawnSound && typeof treasureSpawnSound.play === 'function') {
      treasureSpawnSound.setVolume(CONFIG.SOUND_VOLUMES.TREASURESPAWN !== undefined ? CONFIG.SOUND_VOLUMES.TREASURESPAWN : 0.5);
      treasureSpawnSound.play();
    }
  } catch (_) { }
}

function updateTreasureSpawn(dt) {
  if (treasureNode !== -1) return;
  if (weatherState !== 'CALM') return;

  treasureSpawnTimer += dt;
  if (treasureSpawnTimer >= treasureSpawnDelay) {
    pickTreasureNode();
  }
}

// ===========================
// WEATHER LOGIC
// ===========================

function setWeatherState(nextState) {
  weatherState = nextState;
  weatherTimer = 0;
  weatherPhaseProgress = 0;

  if (nextState === 'CALM') {
    weatherPhaseDuration = randomRange(CONFIG.CALM_MIN_MS, CONFIG.CALM_MAX_MS) / 1000;
  } else if (nextState === 'STORM_COMING') {
    weatherPhaseDuration = randomRange(CONFIG.STORM_COMING_MIN_MS, CONFIG.STORM_COMING_MAX_MS) / 1000;
  } else {
    weatherPhaseDuration = randomRange(CONFIG.STORM_MIN_MS, CONFIG.STORM_MAX_MS) / 1000;
  }

  // sound handling: keep all tracks playing to avoid transition gaps, toggle volume
  Object.entries(weatherSounds).forEach(([key, s]) => {
    try {
      if (s && typeof s.loop === 'function') {
        if (!s._startedLooping) {
          s.loop();
          s._startedLooping = true;
        }
        if (key === nextState) {
          s.setVolume(CONFIG.SOUND_VOLUMES[key] !== undefined ? CONFIG.SOUND_VOLUMES[key] : 0.5);
        } else {
          s.setVolume(0);
        }
      }
    } catch (_) { }
  });
}

function resetWeatherCycle(extraCalmMs = 0) {
  setWeatherState('CALM');
  if (extraCalmMs > 0) {
    // convert milliseconds to seconds (weatherPhaseDuration stored in seconds)
    weatherPhaseDuration += extraCalmMs / 1000;
  }
}

function resolveStormStrike() {
  // Treasure in open ocean gets swept away by the storm.
  // Player kills are handled by the continuous per-frame storm check in draw().
  if (treasureNode !== -1 && !isTerrainNode(treasureNode)) {
    scheduleTreasureSpawn();
  }
}

function updateWeather(dt) {
  weatherTimer += dt;
  weatherPhaseProgress = constrain(weatherTimer / weatherPhaseDuration, 0, 1);

  if (weatherTimer < weatherPhaseDuration) return;

  if (weatherState === 'CALM') {
    setWeatherState('STORM_COMING');
    return;
  }

  if (weatherState === 'STORM_COMING') {
    let stormHappens = Math.random() < CONFIG.STORM_STRIKE_CHANCE;

    if (stormHappens) {
      resolveStormStrike();
      // always enter STORM state so sound + visuals play even if the round ended
      setWeatherState('STORM');
    } else {
      // storm dissipates — back to calm
      setWeatherState('CALM');
    }
    return;
  }

  setWeatherState('CALM');
}

// ===========================
// ROUND AND MATCH FLOW
// ===========================

function getWinsToClaim() {
  return Math.floor(CONFIG.BEST_OF_ROUNDS / 2) + 1;
}

function startRound(extraCalmMs = 0) {
  gameState = 'PLAYING';
  winner = null;
  endReason = '';
  roundTransitionTimer = 0;
  // apply global reduction factor so there are 25% fewer terrain pixels than the base value
  currentTotalPixels = Math.floor(CONFIG.OBSTACLE_STARTING_PIXELS * (CONFIG.OBSTACLE_STARTING_REDUCTION || 1));

  let clockwiseNode = 1;
  let counterclockwiseNode = CONFIG.TRACK_LEN - 1;

  let randomize = Math.random() < 0.5;
  let player1Node = randomize ? clockwiseNode : counterclockwiseNode;
  let player2Node = randomize ? counterclockwiseNode : clockwiseNode;

  players = [
    new Player(player1Node, color(CONFIG.COLORS.player1), 'red ship', CONFIG.PLAYER1_LEFT, CONFIG.PLAYER1_RIGHT),
    new Player(player2Node, color(CONFIG.COLORS.player2), 'green ship', CONFIG.PLAYER2_LEFT, CONFIG.PLAYER2_RIGHT)
  ];

  scheduleTreasureSpawn();
  resetWeatherCycle(extraCalmMs);
  generateDistinctRoundTerrain();
}

function startMatch() {
  redShipWins = 0;
  greenShipWins = 0;
  roundsPlayed = 0;
  roundResults = [];
  startRound();
}

function concludeRound(roundWinner, reason, startNextRoundNow = false, extraCalmMs = 0) {
  if (gameState !== 'PLAYING') return;

  if (roundWinner === 'red ship') redShipWins += 1;
  if (roundWinner === 'green ship') greenShipWins += 1;

  roundResults.push(roundWinner);
  roundsPlayed += 1;

  let winsToClaim = getWinsToClaim();
  let matchDone = redShipWins >= winsToClaim || greenShipWins >= winsToClaim || roundsPlayed >= CONFIG.BEST_OF_ROUNDS;

  if (matchDone) {
    gameState = 'MATCH_END';

    if (redShipWins > greenShipWins) {
      winner = 'red ship';
      endReason = 'wins the match ' + redShipWins + '-' + greenShipWins;
    } else if (greenShipWins > redShipWins) {
      winner = 'green ship';
      endReason = 'wins the match ' + greenShipWins + '-' + redShipWins;
    } else {
      winner = 'draw';
      endReason = 'match tied after five rounds';
    }

    // mute all weather sounds on match end
    Object.values(weatherSounds).forEach(s => {
      try { if (s && typeof s.setVolume === 'function') s.setVolume(0); } catch (_) { }
    });

    // play celebration once
    try {
      if (celebrationSound && typeof celebrationSound.play === 'function') {
        celebrationSound.setVolume(CONFIG.SOUND_VOLUMES.CELEBRATION !== undefined ? CONFIG.SOUND_VOLUMES.CELEBRATION : 0.5);
        celebrationSound.play();
      }
    } catch (_) { }

    return;
  }

  if (startNextRoundNow) {
    startRound(extraCalmMs);
    return;
  }

  gameState = 'ROUND_END';
  winner = roundWinner;
  endReason = reason;
  roundTransitionTimer = 0;
}

function checkRoundWinConditions() {
  if (treasureNode === -1) return;

  let p1Win = players[0].isAlive && players[0].checkTreasureWin(treasureNode);
  let p2Win = players[1].isAlive && players[1].checkTreasureWin(treasureNode);

  if (p1Win && p2Win) {
    // both grabbed at once: no score, restart the round
    startRound(CONFIG.CALM_EXTRA_ON_TREASURE_MS);
  } else if (p1Win) {
    concludeRound('red ship', 'seized the treasure', true, CONFIG.CALM_EXTRA_ON_TREASURE_MS);
  } else if (p2Win) {
    concludeRound('green ship', 'seized the treasure', true, CONFIG.CALM_EXTRA_ON_TREASURE_MS);
  }
}

function updateRoundTransition(dt) {
  if (gameState !== 'ROUND_END') return;

  roundTransitionTimer += dt;
  if (roundTransitionTimer >= CONFIG.ROUND_TRANSITION_SECONDS) {
    startRound();
  }
}

// ===========================
// P5.JS MAIN FUNCTIONS
// ===========================

function preload() {
  uiBackgroundImg = loadImage('public/background.png');
  uiBorderImg = loadImage('public/border.png');
  uiCompassImg = loadImage('public/compass.png');
}

function setup() {
  try {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    textFont('Consolas');

    // load sounds non‑blocking; failures won't prevent setup
    if (typeof soundFormats === 'function') {
      try { soundFormats('mp3', 'm4a'); } catch (_) { }
    }
    if (typeof loadSound === 'function') {
      try {
        weatherSounds.CALM = loadSound('public/calm.mp3', () => { }, err => console.warn(err));
        weatherSounds.STORM_COMING = loadSound('public/storm coming.mp3', () => { }, err => console.warn(err));
        weatherSounds.STORM = loadSound('public/storm.m4a', () => { }, err => console.warn(err));
        celebrationSound = loadSound('public/celebration.mp3', () => { }, err => console.warn(err));
        treasureSpawnSound = loadSound('public/treasurespawn.mp3', () => { }, err => console.warn(err));
      } catch (e) {
        console.warn('exception loading sounds in setup', e);
      }
    }

    startMatch();
  } catch (e) {
    console.error('error in setup()', e);
    lastFatalError = e.toString();
  }
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    userStartAudio();
    // Restart weather state to kickstart loop with correct volume if it was blocked
    setWeatherState(weatherState);
  }
}

function draw() {
  if (lastFatalError) {
    background(0);
    fill(255, 0, 0);
    textSize(24);
    text('Fatal error: ' + lastFatalError, width / 2, height / 2);
    noLoop();
    return;
  }
  background(CONFIG.COLORS.background);

  // compute game center each frame (responsive to resize)
  gameCenterX = width / 2;
  gameCenterY = height / 2;

  let dt = Math.min(deltaTime / 1000, 0.1); // cap to 100ms to discard time spent paused

  if (gameState === 'PLAYING') {
    updateWeather(dt);

    if (gameState === 'PLAYING') {
      updateTreasureSpawn(dt);

      for (let player of players) {
        player.update(dt, weatherState, weatherPhaseProgress);
      }

      // continuous storm kill: any player at sea during STORM dies instantly
      if (weatherState === 'STORM') {
        for (let player of players) {
          if (player.isAlive && !player.isHidden()) {
            player.isAlive = false;
          }
        }
        // both dead: no score, restart the round
        if (!players[0].isAlive && !players[1].isAlive) {
          startRound();
        }
      }

      checkRoundWinConditions();
    }
  } else if (gameState === 'ROUND_END') {
    updateRoundTransition(dt);
  }

  // Mode B: draw fullscreen UI layers behind game (bottom-up Z order)
  if (uiMode === 'B') {
    drawWeatherBackground(uiBackgroundImg, weatherState, weatherPhaseProgress); // lowest layer + darken/flash
    drawWeatherCompass(uiCompassImg, weatherState, weatherPhaseProgress);       // middle layer + shake
    image(uiBorderImg, 0, 0, width, height);                                    // top UI layer (static)
  }
  drawScoreboard(roundResults, CONFIG.BEST_OF_ROUNDS);                           // scoreboard always visible
  drawWeatherRain(weatherState, weatherPhaseProgress);                           // rain always visible

  // game elements drawn on top of all UI layers
  drawTrack(weatherState, weatherPhaseProgress);
  drawObstacles(obstacles);
  if (treasureNode !== -1) drawTreasure(treasureNode);
  players.forEach(p => p.draw());

  // draw victory ribbons on match end
  if (gameState === 'MATCH_END' && winner) {
    drawVictoryRibbons(winner);
  }
}

function keyPressed() {
  // Toggle pause — must be checked before the isPaused guard
  if (key === 'p' || key === 'P') {
    isPaused = !isPaused;
    if (isPaused) {
      // mute all weather sounds
      Object.values(weatherSounds).forEach(s => {
        try { if (s && typeof s.setVolume === 'function') s.setVolume(0); } catch (_) { }
      });
      // draw pause overlay on the current frame, then freeze rendering
      noStroke();
      fill(0, 0, 0, CONFIG.PAUSE_DIM_ALPHA);
      rect(0, 0, width, height);
      fill(255, 255, 255, 200);
      textSize(32);
      text('PAUSED', width / 2, height / 2);
      noLoop();
    } else {
      // restore rendering and correct sound volume
      loop();
      setWeatherState(weatherState);
    }
  }

  // While paused, ignore all other keys
  if (isPaused) return;

  if (key === 'r' || key === 'R') {
    startMatch();
  }

  // Toggle fullscreen
  if (key === 'f' || key === 'F') {
    fullscreen(!fullscreen());
  }

  // Toggle UI mode: A = minimal, B = full
  if (key === 'u' || key === 'U') {
    uiMode = uiMode === 'A' ? 'B' : 'A';
  }

  // Ensure audio starts if blocked by browser policy
  if (getAudioContext().state !== 'running') {
    userStartAudio();
    setWeatherState(weatherState);
  }

  // Prevent default for arrow keys
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
