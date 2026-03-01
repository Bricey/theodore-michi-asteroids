/**
 * VirtualJoystick: Touch-based joystick and fire button for mobile.
 * Minimal custom implementation (no external plugin).
 */
export class VirtualJoystick {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.radius = options.radius ?? 80;
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

    // Joystick base
    this.base = this.scene.add.circle(baseX, baseY, radius, 0x333333, 0.5);
    this.base.setScrollFactor(0);
    this.base.setDepth(1000);
    this.base.setInteractive({ useHandCursor: false });

    // Joystick thumb
    this.thumb = this.scene.add.circle(baseX, baseY, radius * 0.4, 0x666666, 0.7);
    this.thumb.setScrollFactor(0);
    this.thumb.setDepth(1001);

    // Fire button
    this.fireBtn = this.scene.add.circle(fireX, fireY, 60, 0xcc3333, 0.6);
    this.fireBtn.setScrollFactor(0);
    this.fireBtn.setDepth(1000);
    this.fireBtn.setInteractive({ useHandCursor: false });

    this.base.on('pointerdown', (ptr) => this.onStickDown(ptr));
    this.scene.input.on('pointermove', (ptr) => this.onStickMove(ptr));
    this.scene.input.on('pointerup', (ptr) => this.onStickUp(ptr));
    this.fireBtn.on('pointerdown', () => { this.fireDown = true; });
    this.fireBtn.on('pointerup', () => { this.fireDown = false; });
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
   * @returns {{ thrust: boolean, rotateLeft: boolean, rotateRight: boolean, fire: boolean }}
   */
  getInput() {
    const threshold = 0.3;
    const normX = this.stickX / this.radius;
    const normY = -this.stickY / this.radius;
    const fire = this.fireDown && !this.lastFire;
    this.lastFire = this.fireDown;

    return {
      thrust: normY > threshold,
      rotateLeft: normX < -threshold,
      rotateRight: normX > threshold,
      fire,
    };
  }

  setVisible(visible) {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
    this.fireBtn.setVisible(visible);
  }
}
