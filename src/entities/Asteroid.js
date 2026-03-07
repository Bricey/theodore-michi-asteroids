/**
 * Asteroid: Destructible obstacle with physics. Splits into smaller on hit.
 * Art: biggest (LARGE) = smiling, smaller (MEDIUM/SMALL) = sad face only.
 */
import { PHYSICS } from '../config/gameConfig.js';
import { createAsteroidPoints, ASTEROID_SIZE, ASTEROID_RADIUS } from '../utils/geometry.js';

/** Texture key by size: LARGE = happy, MEDIUM/SMALL = sad. */
const ASTEROID_TEXTURE = {
  [ASTEROID_SIZE.LARGE]: 'michi-happyFace',
  [ASTEROID_SIZE.MEDIUM]: 'michi-sadFace',
  [ASTEROID_SIZE.SMALL]: 'michi-sadFace',
};

function getAsteroidTextureKey(scene, size) {
  const key = ASTEROID_TEXTURE[size];
  return key && scene.textures.exists(key) ? key : 'asteroid_placeholder';
}

export class Asteroid extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, size = ASTEROID_SIZE.LARGE, id = null) {
    const textureKey = getAsteroidTextureKey(scene, size);
    super(scene, x, y, textureKey);
    this.asteroidSize = size;
    this.asteroidId = id ?? `ast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // Track lifetime so smallest asteroids can self-detonate
    this.spawnTime = scene.time.now;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const radius = ASTEROID_RADIUS[size] ?? 40;
    this.setDisplaySize(radius * 2, radius * 2);
    this.setOrigin(0.5, 0.5);
    // Small asteroids (radius 12) need a larger physics body so projectiles/ships reliably overlap
    const physicsRadius = size === ASTEROID_SIZE.SMALL ? 20 : Math.max(radius, 14);
    this.body.setCircle(physicsRadius);
    this.body.setDamping(PHYSICS.ASTEROID.DAMPING);
    this.body.setDrag(PHYSICS.ASTEROID.DRAG);
    this.body.setMaxVelocity(PHYSICS.ASTEROID.MAX_VELOCITY);
  }

  /**
   * Apply random velocity. Must be called AFTER the asteroid is added to a PhysicsGroup,
   * because PhysicsGroup.createCallbackHandler resets velocity to 0 on add.
   */
  launch() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setAngularVelocity((Math.random() - 0.5) * 100);
  }

  static createFromPoints(scene, x, y, size, id) {
    const radius = ASTEROID_RADIUS[size] ?? 40;
    const points = createAsteroidPoints(radius, 8);
    const polygon = scene.add.polygon(x, y, points, 0x888888);
    scene.physics.add.existing(polygon);
    polygon.asteroidSize = size;
    polygon.asteroidId = id ?? `ast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    polygon.body.setCircle(radius);
    polygon.body.setDamping(PHYSICS.ASTEROID.DAMPING);
    polygon.body.setDrag(PHYSICS.ASTEROID.DRAG);
    polygon.body.setMaxVelocity(PHYSICS.ASTEROID.MAX_VELOCITY);
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    polygon.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    polygon.body.setAngularVelocity((Math.random() - 0.5) * 100);
    return polygon;
  }
}
