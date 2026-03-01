/**
 * Game: Main game scene. Physics, spawning, input, collisions, network sync.
 */
import { Ship } from '../entities/Ship.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Projectile } from '../entities/Projectile.js';
import { Powerup } from '../entities/Powerup.js';
import { Explosion } from '../entities/Explosion.js';
import { InputManager } from '../managers/InputManager.js';
import { NetworkManager } from '../managers/NetworkManager.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { ScoreManager } from '../managers/ScoreManager.js';
import { wrapSprite } from '../utils/screenWrap.js';
import { NETWORK } from '../config/networkConfig.js';
import { PHYSICS } from '../config/gameConfig.js';

export class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.isHost = this.registry.get('isHost') ?? true;
    this.gameMode = this.registry.get('gameMode') ?? 'cooperative';
    this.roomCode = this.registry.get('roomCode') ?? '';

    this.ships = [];
    this.projectiles = [];
    this.remoteShips = new Map();
    this.remoteProjectiles = new Map();
    this.lastShipStateSent = 0;
    this.lastTickSent = 0;
    this.fireCooldown = 0;
    this.rapidFireUntil = 0;

    this.scoreManager = new ScoreManager(this, this.gameMode);
    this.spawnManager = new SpawnManager(this, this.isHost);
    this.network = new NetworkManager(this);
    this.inputManager = new InputManager(this, 0);

    // Local ship: host = player1, guest = player2
    this.localPlayerId = this.isHost ? 'player1' : 'player2';
    this.localShip = new Ship(this, width / 2, height / 2, this.localPlayerId);
    this.ships.push(this.localShip);

    // Second input for local 2P Combat (same machine): use second keyboard set
    this.inputManagerP2 = this.gameMode === 'combat' ? new InputManager(this, 1) : null;

    // UI
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontFamily: 'sans-serif', fontSize: '24px', color: '#fff' });
    this.livesText = this.add.text(20, 50, 'Lives: 3', { fontFamily: 'sans-serif', fontSize: '24px', color: '#fff' });
    this.roomCodeText = this.add.text(width - 20, 20, '', { fontFamily: 'sans-serif', fontSize: '20px', color: '#aaa' }).setOrigin(1, 0);

    // Collision groups (plain groups so overlap uses each sprite's body correctly)
    this.physics.add.group(this.ships);
    this.projectileGroup = this.add.group();
    this.asteroidGroup = this.add.group();
    this.powerupGroup = this.add.group();

    // Looping thrust SFX (start/stop controlled in update from input)
    this.thrustSound = this.sound.add('sfx-thrust', { loop: true });
    this.anyThrusting = false;

    this.setupNetwork();
    this.setupCollisions();
    this.spawnInitialWave();
  }

  setupNetwork() {
    if (this.isHost) {
      this.network.createRoom().then((code) => {
        this.roomCodeText.setText(`Room: ${code}`);
      }).catch((err) => {
        this.roomCodeText.setText('Network error');
        console.error(err);
      });
    } else if (this.roomCode) {
      this.network.joinRoom(this.roomCode).then(() => {
        this.roomCodeText.setText('Connected');
      }).catch((err) => {
        this.roomCodeText.setText('Join failed');
        console.error(err);
      });
    }

    this.network.on('data', (data) => this.handleNetworkData(data));
    this.network.on('disconnect', () => this.handleDisconnect());
    this.network.on('connected', (data) => {
      if (this.isHost && this.network.conn) {
        this.network.send({
          type: 'JOIN_ACCEPT',
          gameMode: this.gameMode,
        });
      }
    });
  }

  handleNetworkData(data) {
    if (!data || !data.type) return;
    switch (data.type) {
      case 'JOIN_ACCEPT':
        break;
      case 'TICK_STATE':
        this.applyTickState(data);
        break;
      case 'SHIP_STATE':
        this.applyShipState(data);
        break;
      case 'PROJECTILE':
        this.applyProjectileState(data);
        break;
      case 'HIT':
        this.applyHit(data);
        break;
      case 'GAME_OVER':
        this.endGame(data.winner, data.score);
        break;
      default:
        break;
    }
  }

  applyTickState(data) {
    if (this.isHost) return;
    (data.asteroids || []).forEach((a) => {
      let obj = this.remoteAsteroids?.get(a.id);
      if (!obj) {
        obj = new Asteroid(this, a.x, a.y, a.size, a.id);
        this.asteroidGroup.add(obj);
        if (!this.remoteAsteroids) this.remoteAsteroids = new Map();
        this.remoteAsteroids.set(a.id, obj);
      }
      obj.x = a.x;
      obj.y = a.y;
      obj.body.velocity.set(a.vx, a.vy);
      obj.rotation = a.rotation;
    });
  }

  applyShipState(data) {
    if (data.playerId === this.localPlayerId) return;
    let ship = this.remoteShips.get(data.playerId);
    if (!ship) {
      ship = new Ship(this, data.x, data.y, data.playerId);
      this.remoteShips.set(data.playerId, ship);
      this.ships.push(ship);
    }
    ship.x = data.x;
    ship.y = data.y;
    ship.body.velocity.set(data.vx, data.vy);
    ship.rotation = data.rotation;
  }

  applyProjectileState(data) {
    if (data.ownerId === this.localPlayerId) return;
    let proj = this.remoteProjectiles.get(data.id);
    if (!proj) {
      proj = new Projectile(this, data.x, data.y, data.angle, data.ownerId, data.id);
      this.projectileGroup.add(proj);
      proj.launch(data.angle);
      this.remoteProjectiles.set(data.id, proj);
    }
    proj.x = data.x;
    proj.y = data.y;
  }

  applyHit(data) {
    if (this.isHost) return;
    const asteroid = this.spawnManager.asteroids.find((a) => a.asteroidId === data.asteroidId);
    if (asteroid) this.spawnManager.removeAsteroid(asteroid);
  }

  handleDisconnect() {
    this.roomCodeText.setText('Disconnected');
  }

  setupCollisions() {
    this.physics.add.overlap(
      this.projectileGroup,
      this.asteroidGroup,
      (proj, ast) => this.onProjectileHitAsteroid(proj, ast),
      null,
      this
    );
    this.physics.add.overlap(
      this.ships,
      this.asteroidGroup,
      (ship, ast) => this.onShipHitAsteroid(ship, ast),
      null,
      this
    );
    this.physics.add.overlap(
      this.ships,
      this.powerupGroup,
      (ship, pwr) => this.onShipPickupPowerup(ship, pwr),
      null,
      this
    );

    if (this.gameMode === 'combat') {
      this.physics.add.overlap(
        this.projectileGroup,
        this.ships,
        (proj, ship) => this.onProjectileHitShip(proj, ship),
        null,
        this
      );
    }
  }

  onProjectileHitShip(proj, ship) {
    if (proj.ownerId === ship.playerId) return;
    if (ship.isDead) return;
    this.projectileGroup.remove(proj);
    proj.destroy();
    this.scoreManager.addCombatScore(proj.ownerId, 50);
    const lives = this.scoreManager.loseLife(ship.playerId);
    if (lives <= 0) {
      this.killShip(ship, false);
      this.time.delayedCall(1500, () => this.checkGameOver());
    } else {
      this.killShip(ship, true);
    }
  }

  onProjectileHitAsteroid(proj, ast) {
    if (!proj.body) return;
    this.projectileGroup.remove(proj);
    proj.destroy();
    const asteroid = ast.asteroidId ? ast : this.spawnManager.asteroids.find((a) => a === ast);
    if (!asteroid) return;
    this.asteroidGroup.remove(asteroid);
    this.scoreManager.addAsteroidScore(proj.ownerId || 'player1', asteroid.asteroidSize);

    // Scale the explosion to the asteroid's size category
    const explosionParams = {
      large:  { count: 20, speed: 160, duration: 800, size: 5 },
      medium: { count: 12, speed: 110, duration: 600, size: 3 },
      small:  { count:  7, speed:  70, duration: 450, size: 2 },
    };
    const params = explosionParams[asteroid.asteroidSize] ?? explosionParams.medium;
    new Explosion(this, asteroid.x, asteroid.y, { ...params, color: 0xaaaaaa });

    this.sound.play('sfx-explode');

    const powerup = this.spawnManager.spawnPowerup(asteroid.x, asteroid.y);
    if (powerup) this.powerupGroup.add(powerup);
    const children = this.spawnManager.splitAsteroid(asteroid);
    children.forEach((c) => { this.asteroidGroup.add(c); c.launch(); });
    if (this.network.connected) {
      this.network.send({ type: 'HIT', asteroidId: asteroid.asteroidId });
    }
  }

  onShipHitAsteroid(ship, ast) {
    if (ship.isDead) return;
    const lives = this.scoreManager.loseLife(ship.playerId);
    if (lives <= 0) {
      this.killShip(ship, false);
      this.time.delayedCall(1500, () => this.checkGameOver());
    } else {
      this.killShip(ship, true);
    }
  }

  onShipPickupPowerup(ship, pwr) {
    this.powerupGroup.remove(pwr);
    this.sound.play('sfx-powerup');
    switch (pwr.powerupType) {
      case 'extra_life':
        this.scoreManager.addLife(ship.playerId);
        break;
      case 'rapid_fire':
        this.rapidFireUntil = this.time.now + 5000;
        break;
      case 'score_multiplier':
        this.scoreManager.setScoreMultiplier(2);
        this.time.delayedCall(10000, () => this.scoreManager.setScoreMultiplier(1));
        break;
      default:
        break;
    }
    this.spawnManager.removePowerup(pwr);
  }

  /**
   * Play the explosion effect, hide the ship and disable its body.
   * @param {Ship} ship
   * @param {boolean} respawn - Whether to schedule a respawn after 3 seconds.
   */
  killShip(ship, respawn = true) {
    ship.isDead = true;
    ship.setVisible(false);
    ship.body.enable = false;

    this.sound.play('sfx-die');
    new Explosion(this, ship.x, ship.y, {
      count:    18,
      speed:    140,
      duration: 750,
      // Green debris for the player ship; red tint as an accent ring
      color: ship.playerId === 'player1' ? 0x00ff88 : 0x4488ff,
      size: 4,
    });

    if (respawn) {
      this.time.delayedCall(3000, () => this.respawnShip(ship));
    }
  }

  /**
   * Reposition ship to screen centre, re-enable physics, and play a
   * 1.5-second blink to signal invincibility.
   * @param {Ship} ship
   */
  respawnShip(ship) {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    ship.setPosition(cx, cy);
    ship.body.setVelocity(0, 0);
    ship.body.setAngularVelocity(0);
    ship.body.enable = true;
    ship.setVisible(true);
    ship.isDead = false;

    // Blink to signal brief post-respawn invincibility window (visual only)
    ship.isRespawning = true;
    this.tweens.add({
      targets: ship,
      alpha: 0,
      duration: 120,
      yoyo: true,
      repeat: 7,
      ease: 'Linear',
      onComplete: () => {
        ship.setAlpha(1);
        ship.isRespawning = false;
      },
    });
  }

  checkGameOver() {
    if (this.scoreManager.isGameOver()) {
      this.endGame(this.scoreManager.getWinner(), this.scoreManager.getTotalScore());
    }
  }

  endGame(winner, score) {
    this.registry.set('winner', winner);
    this.registry.set('score', score ?? this.scoreManager.getTotalScore());
    this.network.destroy();
    this.scene.start('GameOver');
  }

  spawnInitialWave() {
    if (this.isHost) {
      const asteroids = this.spawnManager.spawnWave();
      // Add to group first (PhysicsGroup resets velocity on add), then launch
      asteroids.forEach((a) => { this.asteroidGroup.add(a); a.launch(); });
    }
  }

  fire(ship) {
    if (this.fireCooldown > 0) return;
    const cooldown = this.rapidFireUntil > this.time.now ? 100 : 300;
    this.fireCooldown = cooldown;
    this.sound.play('sfx-shot');
    const proj = new Projectile(this, ship.x, ship.y, ship.rotation, ship.playerId);
    this.projectiles.push(proj);
    this.projectileGroup.add(proj);
    // Launch after group.add — PhysicsGroup resets velocity to 0 on add
    proj.launch(ship.rotation);
    if (this.network.connected) {
      this.network.send({
        type: 'PROJECTILE',
        id: proj.projectileId,
        x: ship.x,
        y: ship.y,
        angle: ship.rotation,
        ownerId: ship.playerId,
      });
    }
  }

  update(time, delta) {
    const input = this.inputManager.getInput();
    this.applyInputToShip(this.localShip, input);

    // Local 2P: second ship exists only when we have 2 ships (e.g. remote joined)
    if (this.gameMode === 'combat' && this.inputManagerP2 && this.ships[1]) {
      const input2 = this.inputManagerP2.getInput();
      this.applyInputToShip(this.ships[1], input2);
    }

    this.ships.forEach((s) => { if (!s.isDead) wrapSprite(this.physics.world, s); });
    this.projectileGroup.getChildren().forEach((p) => wrapSprite(this.physics.world, p));
    this.spawnManager.asteroids.forEach((a) => wrapSprite(this.physics.world, a));
    this.spawnManager.powerups.forEach((p) => wrapSprite(this.physics.world, p));

    this.projectileGroup.getChildren().forEach((p) => {
      if (p.isExpired?.()) {
        this.projectileGroup.remove(p);
        p.destroy();
      }
    });
    this.spawnManager.powerups.forEach((p) => {
      if (p.isExpired?.()) this.spawnManager.removePowerup(p);
    });

    if (this.fireCooldown > 0) this.fireCooldown -= delta;

    // Thrust SFX: play while any ship is thrusting, stop when none
    if (this.anyThrusting) {
      if (!this.thrustSound.isPlaying) this.thrustSound.play();
    } else {
      if (this.thrustSound.isPlaying) this.thrustSound.stop();
    }
    this.anyThrusting = false;

    this.scoreText.setText(`Score: ${this.scoreManager.getTotalScore()}`);
    this.livesText.setText(`Lives: ${this.scoreManager.getLives(this.localPlayerId)}`);

    if (this.isHost && this.spawnManager.getAsteroidCount() === 0) {
      this.spawnInitialWave();
    }

    if (this.network.connected) {
      if (time - this.lastShipStateSent > NETWORK.SYNC_INTERVAL_MS) {
        const s = this.localShip;
        this.network.send({
          type: 'SHIP_STATE',
          playerId: this.localPlayerId,
          x: s.x,
          y: s.y,
          vx: s.body.velocity.x,
          vy: s.body.velocity.y,
          rotation: s.rotation,
        });
        this.lastShipStateSent = time;
      }
      if (this.isHost && time - this.lastTickSent > NETWORK.SYNC_INTERVAL_MS) {
        this.network.send({
          type: 'TICK_STATE',
          asteroids: this.spawnManager.asteroids.map((a) => ({
            id: a.asteroidId,
            x: a.x,
            y: a.y,
            vx: a.body?.velocity?.x ?? 0,
            vy: a.body?.velocity?.y ?? 0,
            rotation: a.rotation ?? 0,
            size: a.asteroidSize,
          })),
        });
        this.lastTickSent = time;
      }
    }
  }

  applyInputToShip(ship, input) {
    if (!ship || !ship.body || ship.isDead) return;
    if (input.thrust) {
      this.anyThrusting = true;
      ship.applyThrust?.();
    } else if (input.brake) ship.brake?.();
    else ship.stopThrust?.();
    if (input.rotateLeft) ship.rotateLeft?.();
    else if (input.rotateRight) ship.rotateRight?.();
    else ship.stopRotation?.();
    if (input.fire) this.fire(ship);
  }
}
