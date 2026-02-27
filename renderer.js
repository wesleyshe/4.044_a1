// ===========================
// RENDERING FUNCTIONS
// ===========================
console.log('renderer.js loaded');

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

  for (let i = 0; i < CONFIG.TRACK_LEN; i++) {
    let fillColor = base;

    if (weatherState === 'STORM_COMING') {
      let flicker = 0.5 + 0.5 * Math.sin(millis() / CONFIG.STORM_COMING_FLICKER_MS + i * 0.8);
      let darkMix = constrain((0.2 + 0.8 * weatherPhaseProgress) * flicker, 0, 1);
      fillColor = blendColor(base, dark, darkMix);
    } else if (weatherState === 'STORM') {
      let waveA = 0.5 + 0.5 * Math.sin(millis() / CONFIG.STORM_FLICKER_MS + i * 1.4);
      let waveB = 0.5 + 0.5 * Math.sin(millis() / (CONFIG.STORM_FLICKER_MS * 0.8) + i * 0.45 + 2.1);
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

function drawHUD(redWins, greenWins, currentRound) {
  fill(CONFIG.COLORS.text);
  textAlign(CENTER, CENTER);

  textSize(18);
  fill(CONFIG.COLORS.player1);
  text('red ship: ' + redWins, width / 2 - 180, 42);

  fill(CONFIG.COLORS.player2);
  text('green ship: ' + greenWins, width / 2 + 180, 42);

  fill(CONFIG.COLORS.textSecondary);
  textSize(16);
  text('round ' + currentRound + ' / ' + CONFIG.BEST_OF_ROUNDS, width / 2, 68);
}

function drawRoundResult(winner, endReason) {
  fill(0, 0, 0, 180);
  rectMode(CENTER);
  rect(width / 2, height / 2, 520, 220);

  textAlign(CENTER, CENTER);
  textSize(40);

  if (winner === 'draw') {
    fill(255, 255, 255);
    text('round draw', width / 2, height / 2 - 35);
  } else if (winner === 'red ship') {
    fill(CONFIG.COLORS.player1);
    text('red ship wins round', width / 2, height / 2 - 35);
  } else {
    fill(CONFIG.COLORS.player2);
    text('green ship wins round', width / 2, height / 2 - 35);
  }

  fill(CONFIG.COLORS.textSecondary);
  textSize(20);
  text(endReason.toLowerCase(), width / 2, height / 2 + 18);

  rectMode(CORNER);
}

function drawEndScreen(winner, endReason) {
  fill(0, 0, 0, 200);
  rectMode(CENTER);
  rect(width / 2, height / 2, 560, 280);

  fill(CONFIG.COLORS.text);
  textSize(48);
  textAlign(CENTER, CENTER);

  if (winner === 'draw') {
    fill(255, 255, 255);
    text('match draw', width / 2, height / 2 - 70);
  } else if (winner === 'red ship') {
    fill(CONFIG.COLORS.player1);
    text('red ship wins', width / 2, height / 2 - 70);
  } else {
    fill(CONFIG.COLORS.player2);
    text('green ship wins', width / 2, height / 2 - 70);
  }

  fill(CONFIG.COLORS.textSecondary);
  textSize(24);
  text(endReason.toLowerCase(), width / 2, height / 2 - 10);

  fill(CONFIG.COLORS.textTertiary);
  textSize(22);
  text('press r to restart match', width / 2, height / 2 + 55);

  rectMode(CORNER);
}
