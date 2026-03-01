/**
 * InputManager: Abstract interface for keyboard, gamepad, and touch.
 * Returns { thrust, rotateLeft, rotateRight, fire }.
 */
import { GamepadHandler } from '../input/GamepadHandler.js';
import { VirtualJoystick } from '../input/VirtualJoystick.js';

export class InputManager {
  constructor(scene, playerIndex = 0) {
    this.scene = scene;
    this.playerIndex = playerIndex;
    this.gamepad = new GamepadHandler();
    this.virtualJoystick = null;
    this.useTouch = false;

    this.initKeyboard();
    this.detectMobile();
  }

  initKeyboard() {
    const cursors = this.scene.input.keyboard.createCursorKeys();
    const wasd = this.scene.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      fire: 'E',
    });

    // Player 1: arrows + space; Player 2: WASD
    if (this.playerIndex === 0) {
      this.keys = {
        thrust: cursors.up,
        brake: cursors.down,
        rotateLeft: cursors.left,
        rotateRight: cursors.right,
        fire: cursors.space,
      };
    } else {
      this.keys = {
        thrust: wasd.up,
        brake: wasd.down,
        rotateLeft: wasd.left,
        rotateRight: wasd.right,
        fire: wasd.fire,
      };
    }
  }

  detectMobile() {
    const ua = navigator.userAgent || navigator.vendor || '';
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua) || 'ontouchstart' in window;
    this.useTouch = isMobile;

    if (isMobile) {
      const w = this.scene.scale.width;
      const h = this.scene.scale.height;
      this.virtualJoystick = new VirtualJoystick(this.scene, {
        x: 200,
        y: h - 250,
        radius: 80,
        fireX: w - 200,
        fireY: h - 250,
      });
    }
  }

  /**
   * Get input state. Prioritizes touch on mobile, else gamepad, else keyboard.
   */
  getInput() {
    const result = { thrust: false, brake: false, rotateLeft: false, rotateRight: false, fire: false };

    if (this.useTouch && this.virtualJoystick) {
      const touch = this.virtualJoystick.getInput();
      result.thrust = touch.thrust;
      result.brake = touch.brake ?? false;
      result.rotateLeft = touch.rotateLeft;
      result.rotateRight = touch.rotateRight;
      result.fire = touch.fire;
      return result;
    }

    if (this.gamepad.isConnected()) {
      this.gamepad.poll();
      const gp = this.gamepad.getInput();
      result.thrust = gp.thrust;
      result.brake = gp.brake ?? false;
      result.rotateLeft = gp.rotateLeft;
      result.rotateRight = gp.rotateRight;
      result.fire = gp.fire;
      return result;
    }

    result.thrust = this.keys.thrust.isDown;
    result.brake = this.keys.brake.isDown;
    result.rotateLeft = this.keys.rotateLeft.isDown;
    result.rotateRight = this.keys.rotateRight.isDown;
    result.fire = Phaser.Input.Keyboard.JustDown(this.keys.fire);
    return result;
  }

  setTouchVisible(visible) {
    if (this.virtualJoystick) {
      this.virtualJoystick.setVisible(visible);
    }
  }
}
