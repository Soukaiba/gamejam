import * as THREE from "three";

export class InteractionSystem {
  constructor(promptNode) {
    this.promptNode = promptNode;
    this.entries = [];
    this.current = null;
    this.raycaster = new THREE.Raycaster();
    this.origin = new THREE.Vector2(0, 0);
    this.tempWorldPosition = new THREE.Vector3();
  }

  register(config) {
    const entry = {
      distance: 3,
      enabled: () => true,
      ...config,
    };

    this.entries.push(entry);
    return entry;
  }

  clearCurrent() {
    this.current = null;
    this.promptNode.classList.add("hidden");
  }

  update(camera, playerPosition, blocked = false) {
    if (blocked) {
      this.clearCurrent();
      return;
    }

    const candidates = this.entries
      .filter((entry) => entry.enabled())
      .map((entry) => entry.object);

    if (candidates.length === 0) {
      this.clearCurrent();
      return;
    }

    this.raycaster.setFromCamera(this.origin, camera);
    const intersections = this.raycaster.intersectObjects(candidates, true);

    this.current = null;
    for (const hit of intersections) {
      const entry = this.entries.find((candidate) => candidate.object === hit.object || candidate.object.getObjectById(hit.object.id));
      if (!entry || !entry.enabled()) {
        continue;
      }

      entry.object.getWorldPosition(this.tempWorldPosition);
      if (playerPosition.distanceTo(this.tempWorldPosition) <= entry.distance) {
        this.current = entry;
        break;
      }
    }

    if (!this.current) {
      this.promptNode.classList.add("hidden");
      return;
    }

    const prompt = typeof this.current.prompt === "function"
      ? this.current.prompt()
      : this.current.prompt;
    this.promptNode.textContent = prompt;
    this.promptNode.classList.remove("hidden");
  }

  interact() {
    if (!this.current) {
      return false;
    }

    this.current.onInteract?.(this.current);
    return true;
  }
}
