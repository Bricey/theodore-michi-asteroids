/**
 * GamepadHandler: Polls Gamepad API, maps to { thrust, rotateLeft, rotateRight, fire }.
 */
export class GamepadHandler {
  constructor() {
    this.gamepadIndex = null;
    this.lastFire = false;
  }

  /**
   * Check for connected gamepads and use first available.
   */
  poll() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        this.gamepadIndex = i;
        break;
      }
    }
  }

  /**
   * Get input state from gamepad.
   * @returns {{ thrust: boolean, rotateLeft: boolean, rotateRight: boolean, fire: boolean }}
   */
  getInput() {
    const result = { thrust: false, rotateLeft: false, rotateRight: false, fire: false };
    const gp = navigator.getGamepads?.()[this.gamepadIndex ?? 0];
    if (!gp || !gp.connected) return result;

    // Left stick Y (axis 1) negative = up = thrust
    result.thrust = gp.axes[1] < -0.3;
    // Left stick X (axis 0) for rotation
    result.rotateLeft = gp.axes[0] < -0.3;
    result.rotateRight = gp.axes[0] > 0.3;
    // Face buttons: A (0) or R1 (5) for fire
    const fireBtn = gp.buttons[0]?.pressed || gp.buttons[5]?.pressed;
    result.fire = fireBtn && !this.lastFire;
    this.lastFire = fireBtn;

    return result;
  }

  isConnected() {
    const gp = navigator.getGamepads?.()[this.gamepadIndex ?? 0];
    return gp?.connected ?? false;
  }
}
