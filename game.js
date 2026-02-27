// ===========================
// GAME STATE AND LOGIC
// ===========================

let gameState = 'PLAYING'; // PLAYING, ROUND_END, MATCH_END
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

let redShipWins = 0;
let greenShipWins = 0;
let roundsPlayed = 0;

// ===========================
// OBSTACLE GENERATION
// ===========================

function isTerrainNode(node) {
  return obstacles.some(obs => obs.nodes.some(n => n.index === node));
}

function generateObstacles() {
  obstacles = [];
  let playerNodes = players.map(player => player.getCurrentNode());
  let forbiddenNodes = [treasureNode, ...playerNodes, players[0].startNode, players[1].startNode];
  let maxAttempts = 1000;
  let currentPixels = 0;
  let nextId = 1;

  for (let attempts = 0; attempts < maxAttempts && currentPixels < currentTotalPixels; attempts++) {
    let remainingPixels = currentTotalPixels - currentPixels;
    let blobSize = Math.floor(randomRange(CONFIG.OBSTACLE_MIN_SIZE, CONFIG.OBSTACLE_MAX_SIZE + 1));
    blobSize = Math.min(blobSize, remainingPixels);
    if (blobSize < 1) break;

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
        id: nextId++,
        nodes: blob.map(n => ({ index: n }))
      });
      currentPixels += blobSize;
    }
  }
}

function getTerrainSignature() {
  let nodes = new Array(CONFIG.TRACK_LEN).fill('0');
  for (let obs of obstacles) {
    for (let nodeObj of obs.nodes) {
      nodes[nodeObj.index] = '1';
    }
  }
  return nodes.join('');
}

function generateDistinctRoundTerrain() {
  let nextSignature = '';
  let maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    generateObstacles();
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
  let playerNodes = players.map(player => player.getCurrentNode());
  let forbiddenNodes = [players[0].startNode, players[1].startNode, ...playerNodes];
  let validNodes = [];

  for (let node = 0; node < CONFIG.TRACK_LEN; node++) {
    if (forbiddenNodes.includes(node)) continue;
    if (isTerrainNode(node)) continue;
    validNodes.push(node);
  }

  if (validNodes.length === 0) {
    treasureNode = -1;
    return;
  }

  treasureNode = validNodes[Math.floor(Math.random() * validNodes.length)];
}

function updateTreasureSpawn(dt) {
  if (treasureNode !== -1) return;

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
}

function resetWeatherCycle() {
  setWeatherState('CALM');
}

function resolveStormStrike() {
  let p1InOcean = !players[0].isHidden(obstacles);
  let p2InOcean = !players[1].isHidden(obstacles);

  // Treasure that is currently in ocean gets swept away by the storm.
  if (treasureNode !== -1 && !isTerrainNode(treasureNode)) {
    scheduleTreasureSpawn();
  }

  if (p1InOcean) players[0].isAlive = false;
  if (p2InOcean) players[1].isAlive = false;

  if (p1InOcean && p2InOcean) {
    concludeRound('draw', 'both ships were lost in the storm');
  } else if (p1InOcean) {
    concludeRound(players[1].name, 'survived the storm');
  } else if (p2InOcean) {
    concludeRound(players[0].name, 'survived the storm');
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
    resolveStormStrike();
    if (gameState === 'PLAYING') {
      setWeatherState('STORM');
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

function startRound() {
  gameState = 'PLAYING';
  winner = null;
  endReason = '';
  roundTransitionTimer = 0;
  currentTotalPixels = CONFIG.OBSTACLE_STARTING_PIXELS;

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
  resetWeatherCycle();
  generateDistinctRoundTerrain();
}

function startMatch() {
  redShipWins = 0;
  greenShipWins = 0;
  roundsPlayed = 0;
  startRound();
}

function concludeRound(roundWinner, reason, startNextRoundNow = false) {
  if (gameState !== 'PLAYING') return;

  if (roundWinner === 'red ship') redShipWins += 1;
  if (roundWinner === 'green ship') greenShipWins += 1;

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

    return;
  }

  if (startNextRoundNow) {
    startRound();
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
    concludeRound('draw', 'both ships seized the treasure', true);
  } else if (p1Win) {
    concludeRound('red ship', 'seized the treasure', true);
  } else if (p2Win) {
    concludeRound('green ship', 'seized the treasure', true);
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

function setup() {
  createCanvas(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  textAlign(CENTER, CENTER);
  textFont('Consolas');
  startMatch();
}

function draw() {
  background(CONFIG.COLORS.background);

  let dt = deltaTime / 1000;

  if (gameState === 'PLAYING') {
    updateWeather(dt);

    if (gameState === 'PLAYING') {
      updateTreasureSpawn(dt);

      for (let player of players) {
        player.update(dt, obstacles, weatherState, weatherPhaseProgress);
      }

      checkRoundWinConditions();
    }
  } else if (gameState === 'ROUND_END') {
    updateRoundTransition(dt);
  }

  drawTrack(weatherState, weatherPhaseProgress);
  drawObstacles(obstacles);
  if (treasureNode !== -1) drawTreasure(treasureNode);
  players.forEach(p => p.draw());
  drawHUD(redShipWins, greenShipWins, roundsPlayed + (gameState === 'PLAYING' ? 1 : 0));

  if (gameState === 'ROUND_END') {
    drawRoundResult(winner, endReason);
  } else if (gameState === 'MATCH_END') {
    drawEndScreen(winner, endReason);
  }
}

function keyPressed() {
  if (gameState === 'MATCH_END' && (key === 'r' || key === 'R')) {
    startMatch();
  }

  // Prevent default for arrow keys
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    return false;
  }
}
