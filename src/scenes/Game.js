/**
 * Game: Main game scene. Physics, spawning, input, collisions, network sync.
 */
import { Ship } from '../entities/Ship.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Projectile } from '../entities/Projectile.js';
import { Rocket } from '../entities/Rocket.js';
import { Powerup } from '../entities/Powerup.js';
import { Explosion } from '../entities/Explosion.js';
import { InputManager } from '../managers/InputManager.js';
import { NetworkManager } from '../managers/NetworkManager.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { ScoreManager } from '../managers/ScoreManager.js';
import { wrapSprite } from '../utils/screenWrap.js';
import { ASTEROID_SIZE } from '../utils/geometry.js';
import { NETWORK } from '../config/networkConfig.js';
import { PHYSICS, PICKUP_RADIUS } from '../config/gameConfig.js';

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
    this.twoPlayerLocal = this.registry.get('twoPlayerLocal') ?? false;

    this.ships = [];
    this.projectiles = [];
    this.remoteShips = new Map();
    this.remoteProjectiles = new Map();
    this.lastShipStateSent = 0;
    this.lastTickSent = 0;
    this.fireCooldown = 0;
    this.fireCooldownP2 = 0; // Per-player cooldown for local 2P
    this.rapidFireUntil = 0;
    this.spreadShotUntil = 0;
    this.extendedRangeUntil = 0;
    this.rocketsRemaining = 0;
    this.rocketsRemainingP2 = 0;

    this.scoreManager = new ScoreManager(this, this.gameMode);
    this.spawnManager = new SpawnManager(this, this.isHost);
    this.network = new NetworkManager(this);
    this.inputManager = new InputManager(this, 0);

    const cx = width / 2;
    const cy = height / 2;

    if (this.twoPlayerLocal) {
      // Local 2P: two ships, two inputs (keyboard P1: arrows+space, P2: WASD; or two gamepads)
      this.localPlayerId = 'player1';
      this.localShip = new Ship(this, cx - 50, cy, 'player1');
      const shipP2 = new Ship(this, cx + 50, cy, 'player2');
      this.ships.push(this.localShip, shipP2);
      this.inputManagerP2 = new InputManager(this, 1);
    } else {
      // Online: one local ship (host = player1, guest = player2)
      this.localPlayerId = this.isHost ? 'player1' : 'player2';
      this.localShip = new Ship(this, cx, cy, this.localPlayerId);
      this.ships.push(this.localShip);
      this.inputManagerP2 = null;
    }

    // UI
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontFamily: 'sans-serif', fontSize: '24px', color: '#fff' });
    this.livesText = this.add.text(20, 50, 'Lives: 3', { fontFamily: 'sans-serif', fontSize: '24px', color: '#fff' });
    this.roomCodeText = this.add.text(width - 20, 20, '', { fontFamily: 'sans-serif', fontSize: '20px', color: '#aaa' }).setOrigin(1, 0);

    // Fullscreen toggle button
    this.fullscreenBtn = this.add.text(width - 24, height - 24, '⛶', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#aaa',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    this.fullscreenBtn.on('pointerdown', () => this.toggleFullscreen());

    // Collision groups: use Groups so overlap consistently sees all members each frame
    this.shipGroup = this.add.group();
    this.ships.forEach((s) => this.shipGroup.add(s));
    this.projectileGroup = this.add.group();
    this.rocketGroup = this.add.group();
    this.asteroidGroup = this.add.group();
    this.powerupGroup = this.add.group();

    // Unlock Web Audio on first user interaction (browsers block until then)
    this.audioUnlocked = false;
    const unlockAudio = () => {
      if (this.audioUnlocked) return;
      const ctx = this.sound.context;
      if (ctx && ctx.state === 'suspended') ctx.resume();
      this.audioUnlocked = true;
    };
    this.input.keyboard.once('keydown', unlockAudio);
    this.input.once('pointerdown', unlockAudio);

    this.setupNetwork();
    this.setupCollisions();
    this.spawnInitialWave();
  }

  /** Play a one-shot SFX if loaded and audio context is allowed (unlocked). */
  playSfx(key) {
    if (!this.audioUnlocked) return;
    if (!this.cache.audio.exists(key)) return;
    this.sound.play(key);
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
    } else {
      this.scale.startFullscreen();
    }
  }

  setupNetwork() {
    if (this.twoPlayerLocal) {
      this.roomCodeText.setText('Local 2P');
      return;
    }
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
      this.shipGroup.add(ship);
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
      this.shipGroup,
      this.asteroidGroup,
      (ship, ast) => this.onShipHitAsteroid(ship, ast),
      null,
      this
    );
    this.physics.add.overlap(
      this.shipGroup,
      this.powerupGroup,
      (ship, pwr) => this.onShipPickupPowerup(ship, pwr),
      null,
      this
    );
    this.physics.add.overlap(
      this.rocketGroup,
      this.asteroidGroup,
      (rocket, ast) => this.onRocketHitAsteroid(rocket, ast),
      null,
      this
    );
    this.physics.add.overlap(
      this.asteroidGroup,
      this.asteroidGroup,
      (ast1, ast2) => this.onAsteroidHitAsteroid(ast1, ast2),
      null,
      this
    );

    if (this.gameMode === 'combat') {
      this.physics.add.overlap(
        this.projectileGroup,
        this.shipGroup,
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
    // ast is the asteroid from overlap (any size); resolve from group or spawn list
    const asteroid = ast && (ast.asteroidId != null) ? ast : this.spawnManager.asteroids.find((a) => a === ast);
    if (asteroid && this.asteroidGroup.contains(asteroid)) {
      this.destroyAsteroid(asteroid, proj.ownerId || 'player1');
    }
  }

  /** Full destroy: explosion, score, powerup, split. Used by projectile/ship/rocket. */
  destroyAsteroid(asteroid, ownerId) {
    this.asteroidGroup.remove(asteroid);
    this.scoreManager.addAsteroidScore(ownerId, asteroid.asteroidSize);
    const explosionParams = {
      large:  { count: 20, speed: 160, duration: 800, size: 5 },
      medium: { count: 12, speed: 110, duration: 600, size: 3 },
      small:  { count:  7, speed:  70, duration: 450, size: 2 },
    };
    const params = explosionParams[asteroid.asteroidSize] ?? explosionParams.medium;
    new Explosion(this, asteroid.x, asteroid.y, { ...params, color: 0xaaaaaa });
    this.playSfx('sfx-explode');
    // Smallest asteroids: allow powerup drops but never spawn further asteroids
    const powerup = this.spawnManager.spawnPowerup(asteroid.x, asteroid.y);
    if (powerup) this.powerupGroup.add(powerup);
    if (asteroid.asteroidSize > ASTEROID_SIZE.SMALL) {
      const children = this.spawnManager.splitAsteroid(asteroid);
      children.forEach((c) => {
        c.body.updateFromGameObject();
        this.asteroidGroup.add(c);
        c.launch();
      });
    } else {
      // Ensure smallest asteroids are fully removed from the spawn manager
      this.spawnManager.removeAsteroid(asteroid);
    }
    if (this.network.connected) {
      this.network.send({ type: 'HIT', asteroidId: asteroid.asteroidId });
    }
  }

  /** Break only: explosion + split, no score/powerup. Used by asteroid-asteroid collision. */
  breakAsteroidOnly(asteroid) {
    const explosionParams = {
      large:  { count: 20, speed: 160, duration: 800, size: 5 },
      medium: { count: 12, speed: 110, duration: 600, size: 3 },
      small:  { count:  7, speed:  70, duration: 450, size: 2 },
    };
    const params = explosionParams[asteroid.asteroidSize] ?? explosionParams.medium;
    new Explosion(this, asteroid.x, asteroid.y, { ...params, color: 0x888888 });
    this.playSfx('sfx-explode');
    this.asteroidGroup.remove(asteroid);
    // Smallest asteroids just vanish on break (no further splitting)
    if (asteroid.asteroidSize <= ASTEROID_SIZE.SMALL) {
      this.spawnManager.removeAsteroid(asteroid);
      return;
    }
    const children = this.spawnManager.splitAsteroidOnly(asteroid);
    children.forEach((c) => {
      c.body.updateFromGameObject();
      this.asteroidGroup.add(c);
      c.launch();
    });
  }

  onShipHitAsteroid(ship, ast) {
    if (ship.isDead) return;
    // Asteroid breaks apart on ship collision (score + powerup + split)
    const asteroid = ast.asteroidId ? ast : this.spawnManager.asteroids.find((a) => a === ast);
    if (asteroid && this.asteroidGroup.contains(asteroid)) {
      this.destroyAsteroid(asteroid, ship.playerId);
    }
    const lives = this.scoreManager.loseLife(ship.playerId);
    if (lives <= 0) {
      this.killShip(ship, false);
      this.time.delayedCall(1500, () => this.checkGameOver());
    } else {
      this.killShip(ship, true);
    }
  }

  /** Break asteroid on asteroid-asteroid collision: explosion + split, no score/powerup. */
  onAsteroidHitAsteroid(ast1, ast2) {
    if (ast1 === ast2 || !ast1.active || !ast2.active) return;
    const a1 = ast1.asteroidId ? ast1 : this.spawnManager.asteroids.find((a) => a === ast1);
    const a2 = ast2.asteroidId ? ast2 : this.spawnManager.asteroids.find((a) => a === ast2);
    if (a1 && this.asteroidGroup.contains(a1)) this.breakAsteroidOnly(a1);
    if (a2 && this.asteroidGroup.contains(a2)) this.breakAsteroidOnly(a2);
  }

  onRocketHitAsteroid(rocket, ast) {
    if (!rocket.body) return;
    const rx = rocket.x;
    const ry = rocket.y;
    const ownerId = rocket.ownerId || 'player1';
    this.rocketGroup.remove(rocket);
    rocket.destroy();
    this.explodeRocketAt(rx, ry, ownerId);
  }

  /** Missile explosion: SFX, visual, destroy all asteroids in 400px radius. */
  explodeRocketAt(rx, ry, ownerId) {
    this.playSfx('sfx-missile-explode');
    new Explosion(this, rx, ry, {
      count: 30,
      speed: 250,
      duration: 1200,
      size: 8,
      color: 0xff3333,
    });
    const radius = PHYSICS.ROCKET.EXPLOSION_RADIUS;
    const inRadius = this.spawnManager.asteroids.filter((asteroid) => {
      if (!asteroid.active) return false;
      const dx = asteroid.x - rx;
      const dy = asteroid.y - ry;
      return dx * dx + dy * dy <= radius * radius;
    });
    inRadius.forEach((asteroid) => this.destroyAsteroid(asteroid, ownerId));
  }

  onShipPickupPowerup(ship, pwr) {
    if (!pwr.active) return;
    this.powerupGroup.remove(pwr);
    this.playSfx('sfx-powerup');
    const thirtySec = 30000;
    switch (pwr.powerupType) {
      case 'rapid_fire':
        this.rapidFireUntil = this.time.now + thirtySec;
        break;
      case 'extended_range':
        this.extendedRangeUntil = this.time.now + thirtySec;
        break;
      case 'spread_shot':
        this.spreadShotUntil = this.time.now + thirtySec;
        break;
      case 'missile':
        if (this.twoPlayerLocal) {
          if (ship.playerId === 'player1') this.rocketsRemaining += 1;
          else this.rocketsRemainingP2 += 1;
        } else this.rocketsRemaining += 1;
        break;
      default:
        break;
    }
    this.spawnManager.removePowerup(pwr);
  }

  /** Distance-based pickup fallback — ensures reliable pickup even when physics overlap misses. */
  checkPowerupPickups() {
    const powerups = this.spawnManager.powerups.slice();
    this.ships.forEach((ship) => {
      if (ship.isDead) return;
      powerups.forEach((pwr) => {
        if (!pwr.active) return;
        const dist = Phaser.Math.Distance.Between(ship.x, ship.y, pwr.x, pwr.y);
        if (dist < PICKUP_RADIUS) this.onShipPickupPowerup(ship, pwr);
      });
    });
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

    this.playSfx('sfx-die');
    new Explosion(this, ship.x, ship.y, {
      count:    18,
      speed:    140,
      duration: 750,
      // Red/blue debris to match ship tint
      color: ship.playerId === 'player1' ? 0xff6666 : 0x6666ff,
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
    const dx = this.twoPlayerLocal ? (ship.playerId === 'player2' ? 50 : -50) : 0;

    ship.setPosition(cx + dx, cy);
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
    const cooldown = this.twoPlayerLocal
      ? (ship.playerId === 'player1' ? this.fireCooldown : this.fireCooldownP2)
      : this.fireCooldown;
    if (cooldown > 0) return;
    const now = this.time.now;
    const rockets = this.twoPlayerLocal
      ? (ship.playerId === 'player1' ? this.rocketsRemaining : this.rocketsRemainingP2)
      : this.rocketsRemaining;
    const useRocket = rockets > 0 && (this.twoPlayerLocal || ship.playerId === this.localPlayerId);
    if (useRocket) {
      if (this.twoPlayerLocal) {
        if (ship.playerId === 'player1') this.rocketsRemaining--;
        else this.rocketsRemainingP2--;
      } else this.rocketsRemaining--;
      if (this.twoPlayerLocal) {
        if (ship.playerId === 'player1') this.fireCooldown = 200;
        else this.fireCooldownP2 = 200;
      } else this.fireCooldown = 200;
      this.playSfx('sfx-missile-fire');
      const rocket = new Rocket(this, ship.x, ship.y, ship.rotation, ship.playerId);
      this.rocketGroup.add(rocket);
      rocket.launch(ship.rotation);
      return;
    }
    const shotCooldown = this.rapidFireUntil > now ? 100 : 300;
    if (this.twoPlayerLocal) {
      if (ship.playerId === 'player1') this.fireCooldown = shotCooldown;
      else this.fireCooldownP2 = shotCooldown;
    } else this.fireCooldown = shotCooldown;
    this.playSfx('sfx-shot');
    const spread = this.spreadShotUntil > now;
    const angles = spread ? [ship.rotation, ship.rotation + Math.PI] : [ship.rotation];
    for (const angle of angles) {
      const proj = new Projectile(this, ship.x, ship.y, angle, ship.playerId);
      this.projectiles.push(proj);
      this.projectileGroup.add(proj);
      proj.launch(angle);
      if (this.network.connected) {
        this.network.send({
          type: 'PROJECTILE',
          id: proj.projectileId,
          x: ship.x,
          y: ship.y,
          angle,
          ownerId: ship.playerId,
        });
      }
    }
  }

  update(time, delta) {
    const input = this.inputManager.getInput();
    this.applyInputToShip(this.localShip, input);

    // Local 2P: second input controls second ship (coop and combat)
    if (this.inputManagerP2 && this.ships[1]) {
      const input2 = this.inputManagerP2.getInput();
      this.applyInputToShip(this.ships[1], input2);
    }

    this.checkPowerupPickups();

    this.ships.forEach((s) => { if (!s.isDead) wrapSprite(this.physics.world, s); });
    this.projectileGroup.getChildren().forEach((p) => wrapSprite(this.physics.world, p));
    this.rocketGroup.getChildren().forEach((r) => wrapSprite(this.physics.world, r));
    this.spawnManager.asteroids.forEach((a) => wrapSprite(this.physics.world, a));
    this.spawnManager.powerups.forEach((p) => wrapSprite(this.physics.world, p));

    this.projectileGroup.getChildren().forEach((p) => {
      if (p.isExpired?.()) {
        this.projectileGroup.remove(p);
        p.destroy();
      }
    });
    this.rocketGroup.getChildren().forEach((r) => {
      if (r.isExpired?.()) {
        const rx = r.x;
        const ry = r.y;
        const ownerId = r.ownerId || 'player1';
        this.rocketGroup.remove(r);
        r.destroy();
        this.explodeRocketAt(rx, ry, ownerId);
      }
    });
    this.spawnManager.powerups.forEach((p) => {
      if (p.isExpired?.()) this.spawnManager.removePowerup(p);
    });
    // Small asteroids self-detonate after a fixed lifetime
    if (PHYSICS.ASTEROID.SELF_DESTRUCT_SMALL_MS > 0) {
      const now = this.time.now;
      // Copy array because breaking asteroids mutates spawnManager.asteroids
      this.spawnManager.asteroids.slice().forEach((asteroid) => {
        if (
          asteroid.asteroidSize === ASTEROID_SIZE.SMALL &&
          asteroid.spawnTime != null &&
          now - asteroid.spawnTime > PHYSICS.ASTEROID.SELF_DESTRUCT_SMALL_MS
        ) {
          this.breakAsteroidOnly(asteroid);
        }
      });
    }

    if (this.fireCooldown > 0) this.fireCooldown -= delta;
    if (this.twoPlayerLocal && this.fireCooldownP2 > 0) this.fireCooldownP2 -= delta;

    this.scoreText.setText(`Score: ${this.scoreManager.getTotalScore()}`);
    if (this.twoPlayerLocal) {
      this.livesText.setText(
        `P1: ${this.scoreManager.getLives('player1')} (red)  |  P2: ${this.scoreManager.getLives('player2')} (blue)`
      );
    } else {
      this.livesText.setText(`Lives: ${this.scoreManager.getLives(this.localPlayerId)}`);
    }

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
    if (!this.audioUnlocked && (input.thrust || input.thrustLeft || input.thrustRight || input.fire || input.rotateLeft || input.rotateRight)) {
      const ctx = this.sound.context;
      if (ctx && ctx.state === 'suspended') ctx.resume();
      this.audioUnlocked = true;
    }
    const anyThrust = input.thrust || input.thrustLeft || input.thrustRight;
    if (anyThrust) {
      ship.body.setAcceleration(0, 0);
      if (input.thrust) ship.applyThrust?.();
      if (input.thrustLeft) ship.applyThrustLeft?.();
      if (input.thrustRight) ship.applyThrustRight?.();
    } else if (input.brake) ship.brake?.();
    else ship.stopThrust?.();
    if (input.rotateLeft) ship.rotateLeft?.();
    else if (input.rotateRight) ship.rotateRight?.();
    else ship.stopRotation?.();
    if (input.fire) this.fire(ship);
  }
}
