import * as THREE from "three";
import { GAME_CONFIG } from "./config.js";
import { InputController } from "./core/InputController.js";
import { AudioManager } from "./core/AudioManager.js";
import { CollisionWorld } from "./core/CollisionWorld.js";
import { InteractionSystem } from "./core/InteractionSystem.js";
import { InspectionSystem } from "./core/InspectionSystem.js";
import { InventorySystem } from "./core/InventorySystem.js";
import { PlayerHands } from "./entities/PlayerHands.js";
import { PhaseOneController } from "./systems/PhaseOneController.js";
import { CircusEnvironment } from "./world/CircusEnvironment.js";
import { SettingsManager } from "./core/SettingsManager.js";
import { clamp, yawForward, yawRight } from "./utils/math.js";

export class GameApp {
  constructor(nodes) {
    this.nodes = nodes;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.camera.fov,
      16 / 9,
      GAME_CONFIG.camera.near,
      GAME_CONFIG.camera.far,
    );
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: nodes.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(nodes.shell.clientWidth, nodes.shell.clientHeight, false);

    this.settings = new SettingsManager();
    this.camera.fov = this.settings.get("fov");
    this.camera.updateProjectionMatrix();

    this.input = new InputController(nodes.canvas);
    this.audio = new AudioManager(nodes.audioState);
    this.audio.setMasterVolume(this.settings.get("volume"));
    this.environment = new CircusEnvironment(this.scene);
    this.hands = new PlayerHands(this.camera);
    this.interaction = new InteractionSystem(nodes.interactPrompt);
    this.inspection = new InspectionSystem(this.camera, nodes.inspectPrompt);
    this.inventory = new InventorySystem(
      nodes.inventoryPanel,
      nodes.inventoryList,
      (item) => this.inspectInventoryItem(item),
    );
    this.phase = new PhaseOneController({
      environment: this.environment,
      audio: this.audio,
      interaction: this.interaction,
      inspection: this.inspection,
      inventory: this.inventory,
      objectiveText: nodes.objectiveText,
    });
    this.collisionWorld = new CollisionWorld(GAME_CONFIG.movement.radius);

    this.player = {
      position: new THREE.Vector3(
        GAME_CONFIG.world.startPosition.x,
        GAME_CONFIG.world.startPosition.y,
        GAME_CONFIG.world.startPosition.z,
      ),
      velocity: new THREE.Vector3(),
      verticalVelocity: 0,
      yaw: 0,
      pitch: 0,
      eyeHeight: GAME_CONFIG.camera.standingEyeHeight,
      crouchWeight: 0,
      bobTime: 0,
      bobAmount: 0,
      onGround: true,
    };

    this.openingTimer = 0;
    this.openingFinished = false;
    this.started = false;
    this.paused = false;
    this.footstepDistance = 0;

    this.handleResize = this.handleResize.bind(this);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.animate = this.animate.bind(this);

    for (const collider of this.environment.getColliders()) {
      this.collisionWorld.addRectCollider(collider);
    }
  }

  start() {
    this.input.attach();
    this.bindUi();
    this.handleResize();
    this.updateCameraPosition();
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    requestAnimationFrame(this.animate);
  }

  bindUi() {
    this.nodes.startButton.addEventListener("click", () => this.beginExperience());
    this.nodes.canvas.addEventListener("click", this.handleCanvasClick);
    this.nodes.inventoryClose.addEventListener("click", () => this.closeInventory());
    this.nodes.inspectClose.addEventListener("click", () => this.inspection.cancel());

    this.nodes.settingsButton.addEventListener("click", () => this.openSettings());
    this.nodes.settingsClose.addEventListener("click", () => this.closeSettings());
    this.nodes.settingsResume.addEventListener("click", () => this.closeSettings());

    this.nodes.sensitivityInput.value = this.settings.get("sensitivity");
    this.nodes.volumeInput.value = this.settings.get("volume");
    this.nodes.fovInput.value = this.settings.get("fov");
    this.nodes.invertYInput.checked = this.settings.get("invertY");

    this.nodes.sensitivityInput.addEventListener("input", (event) => {
      this.settings.set("sensitivity", Number(event.target.value));
    });
    this.nodes.volumeInput.addEventListener("input", (event) => {
      const volume = Number(event.target.value);
      this.settings.set("volume", volume);
      this.audio.setMasterVolume(volume);
    });
    this.nodes.fovInput.addEventListener("input", (event) => {
      const fov = Number(event.target.value);
      this.settings.set("fov", fov);
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    });
    this.nodes.invertYInput.addEventListener("change", (event) => {
      this.settings.set("invertY", event.target.checked);
    });
  }

  async beginExperience() {
    if (this.started || !this.openingFinished) {
      return;
    }

    this.started = true;
    this.nodes.startScreen.classList.add("hidden");
    this.nodes.statusBar.classList.remove("hidden");
    this.nodes.controlsHint.classList.remove("hidden");
    this.nodes.audioState.classList.remove("hidden");
    this.nodes.inventoryHint.classList.remove("hidden");
    this.nodes.settingsButton.classList.remove("hidden");
    this.input.requestPointerLock();
    await this.audio.resume();
    this.phase.start();
  }

  async handleCanvasClick() {
    if (!this.started) {
      return;
    }

    if (!this.paused && !this.inventory.isOpen() && !this.input.pointerLocked) {
      this.input.requestPointerLock();
      this.nodes.pointerHint.classList.add("hidden");
    }

    await this.audio.resume();
  }

  handleResize() {
    const { clientWidth, clientHeight } = this.nodes.shell;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(clientWidth, clientHeight, false);
  }

  animate() {
    const deltaTime = Math.min(this.clock.getDelta(), 0.05);
    const elapsedTime = this.clock.elapsedTime;

    this.update(deltaTime, elapsedTime);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }

  update(deltaTime, elapsedTime) {
    if (this.input.consumeAction("KeyM")) {
      this.audio.toggleMute();
    }

    if (this.input.consumeAction("Escape") && this.started) {
      if (this.paused) {
        this.closeSettings();
      } else if (this.inspection.isActive()) {
        this.inspection.cancel();
      } else if (this.inventory.isOpen()) {
        this.closeInventory();
      } else {
        this.openSettings();
      }
    }

    if (this.paused) {
      this.input.consumeLookDelta();
      this.input.consumeAction("MouseLeft");
      this.updateCameraPosition();
      return;
    }

    this.updateOpeningOverlay(deltaTime);

    if (this.input.consumeAction("KeyB") && this.started) {
      if (this.inventory.isOpen()) {
        this.closeInventory();
      } else {
        this.openInventory();
      }
    }

    if (this.input.consumeAction("KeyC")) {
      if (this.inspection.isActive()) {
        this.inspection.cancel();
      } else if (this.inventory.isOpen()) {
        this.closeInventory();
      }
    }

    const inspectLook = this.input.consumeLookDelta();

    if (this.inspection.isActive()) {
      this.inspection.update(deltaTime, inspectLook, this.input.isMouseDown("MouseRight"));
      this.nodes.inspectClose.classList.remove("hidden");
      if (this.input.consumeAction("KeyE")) {
        this.inspection.confirm();
      }
    } else if (!this.inventory.isOpen()) {
      this.nodes.inspectClose.classList.add("hidden");
      this.updateLook(inspectLook);
    } else {
      this.nodes.inspectClose.classList.add("hidden");
    }

    if (this.started && !this.inventory.isOpen() && !this.inspection.isActive()) {
      this.updateMovement(deltaTime);
      this.interaction.update(this.camera, this.player.position);
      const ePressed = this.input.consumeAction("KeyE");
      const leftClicked = this.input.consumeAction("MouseLeft");

      if (ePressed || leftClicked) {
        this.interaction.interact();
      }
    } else {
      this.input.consumeAction("MouseLeft");
      this.interaction.clearCurrent();
      this.nodes.pointerHint.classList.add("hidden");
    }

    if (this.started) {
      this.phase.update(deltaTime, this.player.position);
    }

    this.environment.update(deltaTime, elapsedTime);
    this.audio.update(deltaTime);
    this.updatePointerHint();
    this.updateCameraPosition();
    this.updateHands(deltaTime);
  }

  updateOpeningOverlay(deltaTime) {
    if (this.openingFinished) {
      return;
    }

    this.openingTimer += deltaTime;
    if (this.openingTimer >= GAME_CONFIG.timing.openingQuoteDuration) {
      this.nodes.openingQuote.classList.remove("visible");
      this.nodes.openingQuote.classList.add("hidden");
    }

    if (this.openingTimer >= GAME_CONFIG.timing.openingQuoteDuration + GAME_CONFIG.timing.openingFadeDuration) {
      this.openingFinished = true;
      this.nodes.startScreen.classList.remove("hidden");
    }
  }

  updatePointerHint() {
    if (!this.started || this.inventory.isOpen() || this.inspection.isActive()) {
      this.nodes.pointerHint.classList.add("hidden");
      this.nodes.controlsHint.classList.add("hidden");
      return;
    }

    this.nodes.controlsHint.classList.remove("hidden");

    if (this.input.pointerLocked) {
      this.nodes.pointerHint.classList.add("hidden");
      return;
    }

    this.nodes.pointerHint.classList.remove("hidden");
  }

  updateLook(look) {
    if (!this.input.pointerLocked) {
      return;
    }

    const sensitivity = GAME_CONFIG.camera.mouseSensitivity * this.settings.get("sensitivity");
    const invert = this.settings.get("invertY") ? -1 : 1;

    this.player.yaw -= look.x * sensitivity;
    this.player.pitch = clamp(
      this.player.pitch - look.y * sensitivity * invert,
      -1.2,
      1.2,
    );

    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;
  }

  updateMovement(deltaTime) {
    const direction = new THREE.Vector3();
    const forward = yawForward(this.player.yaw);
    const right = yawRight(this.player.yaw);
    const crouching = this.input.isDown("ControlLeft") || this.input.isDown("ControlRight");
    const sprinting = (this.input.isDown("ShiftLeft") || this.input.isDown("ShiftRight")) && !crouching;

    if (this.input.isDown("KeyW") || this.input.isDown("ArrowUp")) {
      direction.add(forward);
    }
    if (this.input.isDown("KeyS") || this.input.isDown("ArrowDown")) {
      direction.sub(forward);
    }
    if (this.input.isDown("KeyA") || this.input.isDown("ArrowLeft")) {
      direction.sub(right);
    }
    if (this.input.isDown("KeyD") || this.input.isDown("ArrowRight")) {
      direction.add(right);
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();
    }

    const targetSpeed = crouching
      ? GAME_CONFIG.movement.crouchSpeed
      : sprinting
        ? GAME_CONFIG.movement.sprintSpeed
        : GAME_CONFIG.movement.walkSpeed;
    const desiredVelocity = direction.multiplyScalar(targetSpeed);
    const accel = this.player.onGround ? GAME_CONFIG.movement.acceleration : GAME_CONFIG.movement.airAcceleration;
    const accelLerp = 1 - Math.exp(-deltaTime * accel);

    this.player.velocity.x += (desiredVelocity.x - this.player.velocity.x) * accelLerp;
    this.player.velocity.z += (desiredVelocity.z - this.player.velocity.z) * accelLerp;

    if (direction.lengthSq() === 0 && this.player.onGround) {
      const decay = Math.exp(-GAME_CONFIG.movement.damping * deltaTime);
      this.player.velocity.x *= decay;
      this.player.velocity.z *= decay;
    }

    if (this.input.consumeAction("Space") && this.player.onGround && !crouching) {
      this.player.verticalVelocity = GAME_CONFIG.movement.jumpSpeed;
      this.player.onGround = false;
    }

    this.player.verticalVelocity -= GAME_CONFIG.movement.gravity * deltaTime;
    this.player.position.y += this.player.verticalVelocity * deltaTime;
    if (this.player.position.y <= 0) {
      this.player.position.y = 0;
      this.player.verticalVelocity = 0;
      this.player.onGround = true;
    }

    const movement = {
      x: this.player.velocity.x * deltaTime,
      z: this.player.velocity.z * deltaTime,
    };
    const attemptedX = this.player.position.x + movement.x;
    const attemptedZ = this.player.position.z + movement.z;
    const resolved = this.collisionWorld.resolve(this.player.position, movement);

    if (resolved.x !== attemptedX) {
      this.player.velocity.x = 0;
    }
    if (resolved.z !== attemptedZ) {
      this.player.velocity.z = 0;
    }

    const bounds = GAME_CONFIG.world.playableBounds;
    const clampedX = clamp(resolved.x, bounds.minX, bounds.maxX);
    const clampedZ = clamp(resolved.z, bounds.minZ, bounds.maxZ);

    if (clampedX !== resolved.x) {
      this.player.velocity.x = 0;
    }
    if (clampedZ !== resolved.z) {
      this.player.velocity.z = 0;
    }

    this.player.position.x = clampedX;
    this.player.position.z = clampedZ;

    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    const moveAlpha = clamp(speed / GAME_CONFIG.movement.sprintSpeed, 0, 1);
    if (moveAlpha > 0.08) {
      this.player.bobTime += deltaTime * GAME_CONFIG.movement.bobFrequency * (sprinting ? 1.25 : 1);
    }
    this.player.bobAmount = Math.sin(this.player.bobTime) * GAME_CONFIG.movement.bobAmplitude * moveAlpha;

    this.updateFootsteps(deltaTime, speed, this.player.onGround, sprinting, crouching);
    this.player.crouchWeight += ((crouching ? 1 : 0) - this.player.crouchWeight) * (1 - Math.exp(-deltaTime * 10));
    const targetEyeHeight = crouching
      ? GAME_CONFIG.camera.crouchingEyeHeight
      : GAME_CONFIG.camera.standingEyeHeight;
    this.player.eyeHeight += (targetEyeHeight - this.player.eyeHeight) * (1 - Math.exp(-deltaTime * 10));
  }

  updateFootsteps(deltaTime, speed, onGround, sprinting, crouching) {
    const MOVING_THRESHOLD = 0.6;
    const STRIDE_LENGTH = crouching ? 1.15 : sprinting ? 2.05 : 1.65;

    if (!onGround || speed < MOVING_THRESHOLD) {
      this.footstepDistance = 0;
      return;
    }

    this.footstepDistance += speed * deltaTime;
    if (this.footstepDistance >= STRIDE_LENGTH) {
      this.footstepDistance = 0;
      this.audio.playFootstep({ sprinting, crouching });
    }
  }

  updateCameraPosition() {
    this.camera.position.set(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight + this.player.bobAmount,
      this.player.position.z,
    );
  }

  updateHands(deltaTime) {
    this.hands.update(deltaTime, {
      bob: this.player.bobAmount,
      crouchWeight: this.player.crouchWeight,
      inspectWeight: this.inspection.isActive() ? 1 : 0,
      reachWeight: this.inspection.isActive() ? 1 : 0,
    });
  }

  openSettings() {
    if (!this.started || this.paused) {
      return;
    }

    this.paused = true;
    this.nodes.settingsPanel.classList.remove("hidden");
    this.nodes.controlsHint.classList.add("hidden");
    this.input.releasePointerLock();
    this.nodes.pointerHint.classList.add("hidden");
  }

  closeSettings() {
    if (!this.paused) {
      return;
    }

    this.paused = false;
    this.nodes.settingsPanel.classList.add("hidden");
    this.nodes.controlsHint.classList.remove("hidden");
    if (!this.inventory.isOpen() && !this.inspection.isActive()) {
      this.input.requestPointerLock();
    }
  }

  handleVisibilityChange() {
    if (document.hidden && this.started && !this.paused) {
      this.openSettings();
    }
  }

  openInventory() {
    this.inventory.toggle();
    this.input.releasePointerLock();
    this.nodes.pointerHint.classList.add("hidden");
  }

  closeInventory() {
    this.inventory.close();
  }

  inspectInventoryItem(item) {
    this.closeInventory();
    this.input.requestPointerLock();
    item.onInspect?.();
  }
}
