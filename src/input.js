export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jumpPressed: false,
      jumpReleased: false,
      isJumpHeld: false,
      tonguePressed: false,
      cLeft: false,
      cRight: false
    };

    this.mouse = {
      isDown: false,
      deltaX: 0,
      deltaY: 0
    };

    this.cameraYaw = 0;
    this.onDialogueAdvance = null;

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
      if (code === 'KeyA') this.keys.left = true;
      if (code === 'KeyD') this.keys.right = true;
      
      if (code === 'Space') {
        if (!this.keys.isJumpHeld) {
          this.keys.jumpPressed = true;
        }
        this.keys.isJumpHeld = true;
        if (this.onDialogueAdvance) this.onDialogueAdvance();
      }

      if (code === 'KeyE') {
        this.keys.tonguePressed = true;
      }

      if (code === 'KeyQ') this.keys.cLeft = true;
      if (code === 'KeyR') this.keys.cRight = true;

      if (code === 'Enter') {
        if (this.onDialogueAdvance) this.onDialogueAdvance();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
      if (code === 'KeyA') this.keys.left = false;
      if (code === 'KeyD') this.keys.right = false;

      if (code === 'Space') {
        this.keys.jumpReleased = true;
        this.keys.isJumpHeld = false;
      }

      if (code === 'KeyQ') this.keys.cLeft = false;
      if (code === 'KeyR') this.keys.cRight = false;
    });

    // Control de ratón para órbita de cámara y disparo de lengua
    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (e.button === 0) {
        // Clic izquierdo: disparar lengua
        this.keys.tonguePressed = true;
        if (this.onDialogueAdvance) this.onDialogueAdvance();
      }
      if (e.button === 2 || e.button === 0) {
        this.mouse.isDown = true;
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isDown || document.pointerLockElement) {
        this.mouse.deltaX += e.movementX || 0;
        this.mouse.deltaY += e.movementY || 0;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    // Stick izquierdo
    const deadzone = 0.2;
    const ax0 = gp.axes[0];
    const ax1 = gp.axes[1];

    if (Math.abs(ax0) > deadzone) {
      if (ax0 < -deadzone) this.keys.left = true;
      if (ax0 > deadzone) this.keys.right = true;
    }
    if (Math.abs(ax1) > deadzone) {
      if (ax1 < -deadzone) this.keys.forward = true;
      if (ax1 > deadzone) this.keys.backward = true;
    }

    // Botones A (salto) y X/Gatillo (lengua)
    if (gp.buttons[0] && gp.buttons[0].pressed) {
      if (!this.keys.isJumpHeld) this.keys.jumpPressed = true;
      this.keys.isJumpHeld = true;
    } else if (this.keys.isJumpHeld) {
      this.keys.jumpReleased = true;
      this.keys.isJumpHeld = false;
    }

    if (gp.buttons[2] && gp.buttons[2].pressed) {
      this.keys.tonguePressed = true;
    }
  }

  resetOneShots() {
    this.keys.jumpPressed = false;
    this.keys.jumpReleased = false;
    this.keys.tonguePressed = false;
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }
}
