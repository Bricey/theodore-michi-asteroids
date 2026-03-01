/**
 * Rocket: Fast projectile that explodes on hit, destroying everything in a small radius.
 * Used by the "rockets" powerup (3 shots).
 */
import { PHYSICS } from '../config/gameConfig.js';

export class Rocket extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, angle, ownerId, id = null) {
    super(scene, x, y, 'bullet_placeholder');
    this.ownerId = ownerId;
    this.rocketId = id ?? `rocket_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.spawnTime = scene.time.now;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(10, 10);
    this.setTint(0xff6600);
    this.setRotation(angle);
    this.body.setCircle(5);
    this.body.setDamping(false);
    this.body.setDrag(0);
    this.body.setMaxVelocity(PHYSICS.ROCKET.VELOCITY);
  }

  launch(angle) {
    this.scene.physics.velocityFromRotation(angle, PHYSICS.ROCKET.VELOCITY, this.body.velocity);
  }

  isExpired() {
    return this.scene.time.now - this.spawnTime > PHYSICS.ROCKET.LIFETIME_MS;
  }
}
