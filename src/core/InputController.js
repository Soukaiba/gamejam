const RESERVED_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "KeyE",
  "KeyC",
  "KeyM",
  "KeyB",
  "Escape",
]);

export class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.actions = new Set();
    this.mouseButtons = new Set();
    this.lookDelta = { x: 0, y: 0 };
    this.pointerLocked = false;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  attach() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("contextmenu", this.handleContextMenu);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
  }

  detach() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("contextmenu", this.handleContextMenu);
    document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
  }

  requestPointerLock() {
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock?.();
    }
  }

  releasePointerLock() {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    }
  }

  handleKeyDown(event) {
    if (RESERVED_KEYS.has(event.code)) {
      event.preventDefault();
    }

    this.keys.add(event.code);

    if (["KeyE", "KeyC", "KeyM", "KeyB", "Space", "Escape"].includes(event.code)) {
      this.actions.add(event.code);
    }
  }

  handleKeyUp(event) {
    if (RESERVED_KEYS.has(event.code)) {
      event.preventDefault();
    }
    this.keys.delete(event.code);
  }

  handleMouseMove(event) {
    if (!this.pointerLocked) {
      return;
    }

    this.lookDelta.x += event.movementX;
    this.lookDelta.y += event.movementY;
  }

  handleMouseDown(event) {
    if (event.button === 0) {
      this.mouseButtons.add("MouseLeft");
      this.actions.add("MouseLeft");
    }

    if (event.button === 2) {
      event.preventDefault();
      this.mouseButtons.add("MouseRight");
      this.actions.add("MouseRight");
    }
  }

  handleMouseUp(event) {
    if (event.button === 0) {
      this.mouseButtons.delete("MouseLeft");
    }

    if (event.button === 2) {
      this.mouseButtons.delete("MouseRight");
    }
  }

  handleContextMenu(event) {
    event.preventDefault();
  }

  handlePointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.canvas;
  }

  isDown(code) {
    return this.keys.has(code);
  }

  isMouseDown(code) {
    return this.mouseButtons.has(code);
  }

  consumeLookDelta() {
    const delta = { ...this.lookDelta };
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;
    return delta;
  }

  consumeAction(code) {
    if (!this.actions.has(code)) {
      return false;
    }

    this.actions.delete(code);
    return true;
  }
}
