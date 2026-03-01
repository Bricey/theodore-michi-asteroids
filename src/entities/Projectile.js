/**
 * Projectile: Bullet fired by ship. Destroyed on hit or timeout.
 */
import { PHYSICS } from '../config/gameConfig.js';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, angle, ownerId, id = null) {
    super(scene, x, y, 'bullet_placeholder');
    this.ownerId = ownerId;
    this.projectileId = id ?? `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.spawnTime = scene.time.now;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(8, 8);
    this.setRotation(angle);
    this.body.setCircle(4);
    this.body.setDamping(false);
    this.body.setDrag(0);
    this.body.setMaxVelocity(PHYSICS.PROJECTILE.VELOCITY);
  }

  /**
   * Apply directional velocity. Must be called AFTER the projectile is added to a PhysicsGroup,
   * because PhysicsGroup.createCallbackHandler resets velocity to 0 on add.
   */
  launch(angle) {
    this.scene.physics.velocityFromRotation(angle, PHYSICS.PROJECTILE.VELOCITY, this.body.velocity);
  }

  isExpired() {
    return this.scene.time.now - this.spawnTime > PHYSICS.PROJECTILE.LIFETIME_MS;
  }
}
