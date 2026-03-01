/**
 * Phaser game configuration: resolution, physics, scale.
 * Base resolution 1920x1080, landscape orientation.
 */
export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
      fps: 60,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 640, height: 360 },
    max: { width: 1920, height: 1080 },
  },
  scene: [], // Populated in main.js
};

/** Physics constants for Asteroids-style entities */
export const PHYSICS = {
  SHIP: {
    DAMPING: true,
    DRAG: 0.99,
    MAX_VELOCITY: 200,
    ANGULAR_VELOCITY: 300,
    THRUST: 200,
  },
  ASTEROID: {
    DAMPING: false,
    DRAG: 0,
    MAX_VELOCITY: 150,
  },
  PROJECTILE: {
    DAMPING: false,
    DRAG: 0,
    VELOCITY: 400,
    VELOCITY_FAST: 620,
    LIFETIME_MS: 2000,
  },
  ROCKET: {
    VELOCITY: 650,
    LIFETIME_MS: 1500,
    EXPLOSION_RADIUS: 80,
  },
};
