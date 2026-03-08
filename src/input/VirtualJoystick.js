/**
 * VirtualJoystick: Touch-based joystick and fire button for mobile.
 * Arcade-style controls with clear visibility for portrait play.
 */
export class VirtualJoystick {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.radius = options.radius ?? 100;
    this.baseX = options.x ?? 200;
    this.baseY = options.y ?? 900;
    this.fireX = options.fireX ?? 1720;
    this.fireY = options.fireY ?? 900;
    this.active = false;
    this.pointerId = null;
    this.stickX = 0;
    this.stickY = 0;
    this.lastFire = false;
    this.fireDown = false;

    this.create();
  }

  create() {
    const { baseX, baseY, radius, fireX, fireY } = this;

    // Joystick base: arcade-style dark ring with bright inner
    this.base = this.scene.add.circle(baseX, baseY, radius, 0x1a1a1a, 0.9);
    this.base.setStrokeStyle(4, 0x00ff88, 0.9);
    this.base.setScrollFactor(0);
    this.base.setDepth(1000);
    this.base.setInteractive({ useHandCursor: false });

    // Joystick thumb: high-contrast cap
    const thumbRadius = radius * 0.45;
    this.thumb = this.scene.add.circle(baseX, baseY, thumbRadius, 0x00ff88, 0.85);
    this.thumb.setStrokeStyle(3, 0xffffff, 0.6);
    this.thumb.setScrollFactor(0);
    this.thumb.setDepth(1001);

    // Fire button: arcade red with label
    const fireRadius = 72;
    this.fireBtn = this.scene.add.circle(fireX, fireY, fireRadius, 0xcc2222, 0.9);
    this.fireBtn.setStrokeStyle(4, 0xff4444, 1);
    this.fireBtn.setScrollFactor(0);
    this.fireBtn.setDepth(1000);
    this.fireBtn.setInteractive({ useHandCursor: false });
    this.fireLabel = this.scene.add.text(fireX, fireY, 'FIRE', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    this.base.on('pointerdown', (ptr) => this.onStickDown(ptr));
    this.scene.input.on('pointermove', (ptr) => this.onStickMove(ptr));
    this.scene.input.on('pointerup', (ptr) => this.onStickUp(ptr));
    // Fire button: separate pointer so joystick + fire work simultaneously
    this.fireBtn.on('pointerdown', () => { this.fireDown = true; });
    this.fireBtn.on('pointerup', () => { this.fireDown = false; });
    this.fireBtn.on('pointerupoutside', () => { this.fireDown = false; });
  }

  onStickDown(ptr) {
    this.active = true;
    this.pointerId = ptr.id;
  }

  onStickMove(ptr) {
    if (!this.active || ptr.id !== this.pointerId) return;
    const dx = ptr.x - this.baseX;
    const dy = ptr.y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.radius;
    if (dist > maxDist) {
      this.stickX = (dx / dist) * maxDist;
      this.stickY = (dy / dist) * maxDist;
    } else {
      this.stickX = dx;
      this.stickY = dy;
    }
    this.thumb.x = this.baseX + this.stickX;
    this.thumb.y = this.baseY + this.stickY;
  }

  onStickUp(ptr) {
    if (ptr.id === this.pointerId) {
      this.active = false;
      this.pointerId = null;
      this.stickX = 0;
      this.stickY = 0;
      this.thumb.x = this.baseX;
      this.thumb.y = this.baseY;
    }
  }

  /**
   * Get input state. Threshold ~0.3 for deadzone.
   * Stick up = thrust, down = brake, left/right = rotate.
   * @returns {{ thrust: boolean, brake: boolean, rotateLeft: boolean, rotateRight: boolean, fire: boolean }}
   */
  getInput() {
    const threshold = 0.3;
    const normX = this.stickX / this.radius;
    const normY = -this.stickY / this.radius;
    const fire = this.fireDown && !this.lastFire;
    this.lastFire = this.fireDown;

    return {
      thrust: normY > threshold,
      brake: normY < -threshold,
      rotateLeft: normX < -threshold,
      rotateRight: normX > threshold,
      fire,
    };
  }

  setVisible(visible) {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
    this.fireBtn.setVisible(visible);
    if (this.fireLabel) this.fireLabel.setVisible(visible);
  }
}
