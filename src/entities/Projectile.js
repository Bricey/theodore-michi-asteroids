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
    // Radius 6 so fast bullets don't tunnel through small asteroids
    this.body.setCircle(6);
    this.body.setDamping(false);
    this.body.setDrag(0);
    this.body.setMaxVelocity(PHYSICS.PROJECTILE.VELOCITY);
  }

  /**
   * Apply directional velocity. Must be called AFTER the projectile is added to a PhysicsGroup,
   * because PhysicsGroup.createCallbackHandler resets velocity to 0 on add.
   */
  launch(angle) {
    const speed = PHYSICS.PROJECTILE.VELOCITY;
    this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
  }

  isExpired() {
    const extended = this.scene.extendedRangeUntil > this.scene.time.now;
    const lifetime = extended ? PHYSICS.PROJECTILE.LIFETIME_EXTENDED_MS : PHYSICS.PROJECTILE.LIFETIME_MS;
    return this.scene.time.now - this.spawnTime > lifetime;
  }
}
