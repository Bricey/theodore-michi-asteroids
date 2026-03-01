/**
 * SpawnManager: Asteroid and powerup spawning. Host-authoritative.
 */
import { Asteroid } from '../entities/Asteroid.js';
import { ASTEROID_SIZE, ASTEROID_RADIUS } from '../utils/geometry.js';
import { Powerup, POWERUP_TYPES } from '../entities/Powerup.js';

const POWERUP_TYPES_LIST = Object.values(POWERUP_TYPES);

export class SpawnManager {
  constructor(scene, isHost) {
    this.scene = scene;
    this.isHost = isHost;
    this.wave = 0;
    this.asteroids = [];
    this.powerups = [];
  }

  spawnWave() {
    if (!this.isHost) return;
    this.wave++;
    const count = 3 + this.wave * 2;
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const margin = 50;

    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) x = Math.random() * width;
      else if (side === 1) x = width + margin;
      else if (side === 2) x = Math.random() * width;
      else x = -margin;
      if (side === 0) y = -margin;
      else if (side === 1) y = Math.random() * height;
      else if (side === 2) y = height + margin;
      else y = Math.random() * height;

      const asteroid = new Asteroid(this.scene, x, y, ASTEROID_SIZE.LARGE);
      this.asteroids.push(asteroid);
    }

    return this.asteroids;
  }

  spawnPowerup(x, y) {
    if (!this.isHost) return null;
    if (Math.random() > 0.3) return null;
    const type = POWERUP_TYPES_LIST[Math.floor(Math.random() * POWERUP_TYPES_LIST.length)];
    const powerup = new Powerup(this.scene, x, y, type);
    this.powerups.push(powerup);
    return powerup;
  }

  splitAsteroid(asteroid) {
    if (!this.isHost) return [];
    const nextSize = asteroid.asteroidSize - 1;
    if (nextSize < ASTEROID_SIZE.SMALL) return [];

    const newAsteroids = [];
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const offset = 20;
      const nx = asteroid.x + Math.cos(angle) * offset;
      const ny = asteroid.y + Math.sin(angle) * offset;
      const child = new Asteroid(this.scene, nx, ny, nextSize);
      newAsteroids.push(child);
      this.asteroids.push(child);
    }

    this.removeAsteroid(asteroid);
    return newAsteroids;
  }

  removeAsteroid(asteroid) {
    const i = this.asteroids.indexOf(asteroid);
    if (i >= 0) this.asteroids.splice(i, 1);
    asteroid.destroy();
  }

  removePowerup(powerup) {
    const i = this.powerups.indexOf(powerup);
    if (i >= 0) this.powerups.splice(i, 1);
    powerup.destroy();
  }

  getAsteroidCount() {
    return this.asteroids.length;
  }
}
