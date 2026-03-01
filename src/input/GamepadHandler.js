/**
 * GamepadHandler: Polls Gamepad API.
 * Thrust: Y (3) or stick up. Thrust left/right: X (2), B (1). Rotate: stick X only. Fire: A (0) or R1 (5).
 * Supports playerIndex for local 2P: 0 = first gamepad, 1 = second gamepad.
 */
export class GamepadHandler {
  constructor(playerIndex = 0) {
    this.playerIndex = playerIndex;
    this.gamepadIndex = null;
    this.lastFire = false;
  }

  /**
   * Check for connected gamepads; use the one at playerIndex (0 = first, 1 = second).
   */
  poll() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let found = 0;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        if (found === this.playerIndex) {
          this.gamepadIndex = i;
          return;
        }
        found++;
      }
    }
    this.gamepadIndex = null;
  }

  /**
   * Get input state from gamepad. Only reads from this player's assigned gamepad index.
   * thrust = forward, thrustLeft = lateral left, thrustRight = lateral right (add momentum in that direction).
   */
  getInput() {
    const result = {
      thrust: false,
      thrustLeft: false,
      thrustRight: false,
      rotateLeft: false,
      rotateRight: false,
      fire: false,
    };
    if (this.gamepadIndex == null) return result;
    const gp = navigator.getGamepads?.()[this.gamepadIndex];
    if (!gp || !gp.connected) return result;

    // Y (3) or left stick up = thrust forward
    result.thrust = gp.axes[1] < -0.3 || (gp.buttons[3]?.pressed ?? false);
    // X (2) = thrust left (momentum left), B (1) = thrust right (momentum right)
    result.thrustLeft = gp.buttons[2]?.pressed ?? false;
    result.thrustRight = gp.buttons[1]?.pressed ?? false;
    // Left stick X only for rotation (d-pad / stick, not face buttons)
    result.rotateLeft = gp.axes[0] < -0.3;
    result.rotateRight = gp.axes[0] > 0.3;
    const fireBtn = gp.buttons[0]?.pressed || gp.buttons[5]?.pressed;
    result.fire = fireBtn && !this.lastFire;
    this.lastFire = fireBtn;

    return result;
  }

  isConnected() {
    if (this.gamepadIndex == null) return false;
    const gp = navigator.getGamepads?.()[this.gamepadIndex];
    return gp?.connected ?? false;
  }
}
