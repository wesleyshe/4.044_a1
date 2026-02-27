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
    this.lastNode = startNode;
    this.totalDistance = 0;
  }

  getKeyCode(key) {
    if (key === 'ArrowLeft') return LEFT_ARROW;
    if (key === 'ArrowRight') return RIGHT_ARROW;
    if (key === 'ArrowUp') return UP_ARROW;
    if (key === 'ArrowDown') return DOWN_ARROW;
    return key.toUpperCase().charCodeAt(0);
  }

  reset() {
    this.position = this.startNode;
    this.velocity = 0;
    this.isAlive = true;
    this.lastNode = this.startNode;
    this.totalDistance = 0;
  }

  update(dt, obstacles, weatherState = 'CALM', weatherPhaseProgress = 0) {
    if (!this.isAlive) return;
    let onTerrain = this.isHidden(obstacles);
    let terrainSpeedMultiplier = onTerrain ? CONFIG.TERRAIN_SPEED_MULTIPLIER : 1.0;
    let accelMultiplier = terrainSpeedMultiplier;
    let maxSpeedMultiplier = terrainSpeedMultiplier;
    let inertia = CONFIG.INERTIA;
    let driftVelocity = 0;

    if (weatherState === 'STORM_COMING') {
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

    let oldPosition = this.position;
    let newPosition = this.position + this.velocity * dt;

    this.position = newPosition;
    this.totalDistance += Math.abs(newPosition - oldPosition);

    this.lastNode = this.getCurrentNode();
  }

  getCurrentNode() {
    return wrapIndex(Math.round(this.position));
  }

  isHidden(obstacles) {
    let node = this.getCurrentNode();
    for (let obstacle of obstacles) {
      if (obstacle.nodes.some(n => n.index === node)) {
        return true;
      }
    }
    return false;
  }

  checkTreasureWin(treasureNode) {
    let node = this.getCurrentNode();
    return node === treasureNode;
  }

  draw() {
    if (!this.isAlive) return;
    drawSquarePixel(this.getCurrentNode(), this.color, 1.0);
  }
}
