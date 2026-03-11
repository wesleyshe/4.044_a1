// ===========================
// PLAYER CLASS
// ===========================
class Player {
  constructor(startNode, color, name, leftKey, rightKey) {
    this.startNode = startNode;
    this.position = startNode;
    this.velocity = 0;
    this.color = color;
    this.name = name;
    this.leftKeyCode = this.getKeyCode(leftKey);
    this.rightKeyCode = this.getKeyCode(rightKey);
    this.isAlive = true;
  }

  getKeyCode(key) {
    if (key === 'ArrowLeft') return LEFT_ARROW;
    if (key === 'ArrowRight') return RIGHT_ARROW;
    return key.toUpperCase().charCodeAt(0);
  }

  update(dt, weatherState = 'CALM', weatherPhaseProgress = 0) {
    if (!this.isAlive) return;
    let onTerrain = this.isHidden();

    // base multipliers stem from terrain; ships on terrain move slower but otherwise behave normally
    let accelMultiplier = onTerrain ? CONFIG.TERRAIN_SPEED_MULTIPLIER : 1.0;
    let maxSpeedMultiplier = onTerrain ? CONFIG.TERRAIN_SPEED_MULTIPLIER : 1.0;
    let inertia = CONFIG.INERTIA;
    let driftVelocity = 0;

    // only apply storm‑coming behaviour when the player is in open water
    if (!onTerrain && weatherState === 'STORM_COMING') {
      let stormIntensity = 0.25 + 0.75 * weatherPhaseProgress;
      accelMultiplier *= lerp(1, CONFIG.STORM_COMING_ACCEL_MULTIPLIER, stormIntensity);
      maxSpeedMultiplier *= lerp(1, CONFIG.STORM_COMING_MAX_SPEED_MULTIPLIER, stormIntensity);
      inertia = lerp(CONFIG.INERTIA, CONFIG.STORM_COMING_INERTIA, stormIntensity);

      let driftA = Math.sin(millis() / CONFIG.STORM_COMING_SWAY_MS + this.startNode * 0.55);
      let driftB = Math.sin(millis() / (CONFIG.STORM_COMING_SWAY_MS * 0.66) + this.startNode * 1.9);
      driftVelocity = CONFIG.STORM_COMING_DRIFT_FORCE * stormIntensity * (0.65 * driftA + 0.35 * driftB);
    }

    let accel = 0;
    if (keyIsDown(this.leftKeyCode)) {
      accel = -CONFIG.ACCEL;
    }
    if (keyIsDown(this.rightKeyCode)) {
      accel = CONFIG.ACCEL;
    }

    this.velocity += accel * dt * accelMultiplier;
    this.velocity += driftVelocity * dt;
    this.velocity *= inertia;
    let maxSpeed = CONFIG.MAX_SPEED * maxSpeedMultiplier;
    this.velocity = constrain(this.velocity, -maxSpeed, maxSpeed);

    let newPosition = this.position + this.velocity * dt;

    if (!isFinite(newPosition)) {
      newPosition = this.startNode;
      this.velocity = 0;
    }

    this.position = newPosition;
  }

  getCurrentNode() {
    return wrapIndex(Math.round(this.position));
  }

  isHidden() {
    return isTerrainNode(this.getCurrentNode());
  }

  checkTreasureWin(treasureNode) {
    return this.getCurrentNode() === treasureNode;
  }

  draw() {
    if (!this.isAlive) return;

    const node = this.getCurrentNode();
    const hidden = this.isHidden();

    // always draw the ship, even if hidden; add an outline when on terrain so it
    // remains visible in case both players hide simultaneously
    drawSquarePixel(node, this.color, 1.0);

    if (hidden) {
      // outline
      push();
      let pos = getPixelPosition(node);
      translate(pos.x, pos.y);
      rotate(pos.angle + HALF_PI);
      noFill();
      stroke(this.color);
      strokeWeight(2);
      rectMode(CENTER);
      square(0, 0, CONFIG.PIXEL_SIZE + 2);
      pop();
    }
  }
}
