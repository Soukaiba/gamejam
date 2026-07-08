import * as THREE from "three";

export class InspectionSystem {
  constructor(camera, promptNode) {
    this.camera = camera;
    this.promptNode = promptNode;
    this.anchor = new THREE.Group();
    this.anchor.position.set(0, -0.14, -1.18);
    this.camera.add(this.anchor);

    this.active = null;
    this.tempPosition = new THREE.Vector3();
  }

  begin({
    id,
    object,
    prompt,
    onConfirm,
    onCancel,
    targetPosition = new THREE.Vector3(0.12, -0.02, -0.08),
    targetRotation = new THREE.Euler(-0.08, 0, 0.04),
    scaleMultiplier = 1.45,
    rotateWithHold = false,
  }) {
    if (this.active) {
      return false;
    }

    const originalParent = object.parent;
    const originalPosition = object.position.clone();
    const originalQuaternion = object.quaternion.clone();
    const originalScale = object.scale.clone();

    this.anchor.attach(object);

    this.active = {
      id,
      object,
      prompt,
      onConfirm,
      onCancel,
      originalParent,
      originalPosition,
      originalQuaternion,
      originalScale,
      targetPosition,
      targetRotation,
      targetScale: originalScale.clone().multiplyScalar(scaleMultiplier),
      rotateWithHold,
      spinX: 0,
      spinY: 0,
      elapsed: 0,
    };

    this.syncPrompt();
    return true;
  }

  isActive() {
    return Boolean(this.active);
  }

  getCurrentId() {
    return this.active?.id ?? null;
  }

  getCurrentObject() {
    return this.active?.object ?? null;
  }

  update(deltaTime, lookDelta, rotateHeld = false) {
    if (!this.active) {
      this.promptNode.classList.add("hidden");
      return;
    }

    const { object, targetPosition, targetRotation, targetScale } = this.active;
    this.active.elapsed += deltaTime;

    const moveLerp = 1 - Math.exp(-deltaTime * 8);
    object.position.lerp(targetPosition, moveLerp);
    object.scale.lerp(targetScale, 1 - Math.exp(-deltaTime * 7));

    if (!this.active.rotateWithHold || rotateHeld) {
      this.active.spinY -= lookDelta.x * 0.008;
      this.active.spinX -= lookDelta.y * 0.008;
    }

    object.rotation.x = targetRotation.x + this.active.spinX;
    object.rotation.y = targetRotation.y + this.active.spinY;
    object.rotation.z = targetRotation.z;

    this.syncPrompt();
  }

  confirm() {
    if (!this.active) {
      return;
    }

    this.active.onConfirm?.(this.active);
  }

  cancel() {
    if (!this.active) {
      return;
    }

    const shouldRestore = this.active.onCancel?.(this.active);
    if (shouldRestore !== false) {
      this.restore();
    }
  }

  restore() {
    if (!this.active) {
      return;
    }

    const { object, originalParent, originalPosition, originalQuaternion, originalScale } = this.active;
    originalParent.attach(object);
    object.position.copy(originalPosition);
    object.quaternion.copy(originalQuaternion);
    object.scale.copy(originalScale);
    this.active = null;
    this.promptNode.classList.add("hidden");
  }

  discard() {
    if (!this.active) {
      return;
    }

    this.anchor.remove(this.active.object);
    this.active = null;
    this.promptNode.classList.add("hidden");
  }

  syncPrompt() {
    if (!this.active) {
      this.promptNode.classList.add("hidden");
      return;
    }

    this.promptNode.textContent = this.active.prompt;
    this.promptNode.classList.remove("hidden");
  }
}
