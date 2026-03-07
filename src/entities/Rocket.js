/**
 * Rocket: Missile projectile — red, pulsing, explodes with 400px radius.
 * Used by the "missile" powerup (1 per pickup).
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

    this.setDisplaySize(16, 16);
    this.setTint(0xff0000);
    this.setRotation(angle);
    this.body.setCircle(8);
    this.body.setDamping(false);
    this.body.setDrag(0);
    this.body.setMaxVelocity(PHYSICS.ROCKET.VELOCITY);

    // Pulsing scale animation
    scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  launch(angle) {
    this.scene.physics.velocityFromRotation(angle, PHYSICS.ROCKET.VELOCITY, this.body.velocity);
  }

  isExpired() {
    return this.scene.time.now - this.spawnTime > PHYSICS.ROCKET.LIFETIME_MS;
  }
}
