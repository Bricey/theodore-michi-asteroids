/**
 * Ship: Player-controlled vessel with Asteroids-style physics.
 * Uses theo-ship.png; falls back to ship_placeholder if not loaded.
 */
import { PHYSICS } from '../config/gameConfig.js';

export class Ship extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, playerId = 'player1') {
    const textureKey = scene.textures.exists('theo-ship') ? 'theo-ship' : 'ship_placeholder';
    super(scene, x, y, textureKey);
    this.playerId = playerId;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(32, 32);
    this.setScale(0.425);
    this.setOrigin(0.5, 0.5);
    // Very bright tint: red for player 1, green for player 2
    this.setTint(playerId === 'player1' ? 0xffaaaa : 0xaaffaa);
    this.configurePhysics();
  }

  configurePhysics(body = this.body) {
    body.setDamping(PHYSICS.SHIP.DAMPING);
    body.setDrag(PHYSICS.SHIP.DRAG);
    body.setMaxVelocity(PHYSICS.SHIP.MAX_VELOCITY);
    body.setCircle(9);
  }

  /** Reusable vector for adding thrust (avoids allocations). */
  _thrustVec = { x: 0, y: 0 };

  /** Add acceleration in a given direction (radians). Used for forward and lateral thrust. */
  addThrustInDirection(angle) {
    this.scene.physics.velocityFromRotation(angle, PHYSICS.SHIP.THRUST, this._thrustVec);
    this.body.acceleration.x += this._thrustVec.x;
    this.body.acceleration.y += this._thrustVec.y;
  }

  applyThrust() {
    this.addThrustInDirection(this.rotation);
  }

  /** Thrust left: add momentum perpendicular to ship (port side). */
  applyThrustLeft() {
    this.addThrustInDirection(this.rotation - Math.PI / 2);
  }

  /** Thrust right: add momentum perpendicular to ship (starboard). */
  applyThrustRight() {
    this.addThrustInDirection(this.rotation + Math.PI / 2);
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
