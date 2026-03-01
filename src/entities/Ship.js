/**
 * Ship: Player-controlled vessel with Asteroids-style physics.
 * Placeholder: triangle texture. Swap with setTexture('ship') for final art.
 */
import { PHYSICS } from '../config/gameConfig.js';

export class Ship extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, playerId = 'player1') {
    const textureKey = 'ship_placeholder';
    super(scene, x, y, textureKey);
    this.playerId = playerId;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(32, 32);
    this.configurePhysics();
  }

  configurePhysics(body = this.body) {
    body.setDamping(PHYSICS.SHIP.DAMPING);
    body.setDrag(PHYSICS.SHIP.DRAG);
    body.setMaxVelocity(PHYSICS.SHIP.MAX_VELOCITY);
    body.setCircle(12);
  }

  applyThrust() {
    this.scene.physics.velocityFromRotation(
      this.rotation,
      PHYSICS.SHIP.THRUST,
      this.body.acceleration
    );
  }

  brake() {
    const vel = this.body.velocity;
    const speed = vel.length();
    if (speed < 5) {
      this.body.setVelocity(0, 0);
      this.body.setAcceleration(0);
      return;
    }
    // Apply reverse acceleration along current velocity direction
    this.body.acceleration.x = -(vel.x / speed) * PHYSICS.SHIP.THRUST;
    this.body.acceleration.y = -(vel.y / speed) * PHYSICS.SHIP.THRUST;
  }

  stopThrust() {
    this.body.setAcceleration(0);
  }

  rotateLeft() {
    this.body.setAngularVelocity(-PHYSICS.SHIP.ANGULAR_VELOCITY);
  }

  rotateRight() {
    this.body.setAngularVelocity(PHYSICS.SHIP.ANGULAR_VELOCITY);
  }

  stopRotation() {
    this.body.setAngularVelocity(0);
  }
}
