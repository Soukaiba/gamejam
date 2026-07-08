import * as THREE from "three";
import { GAME_CONFIG } from "../config.js";

export class PhaseOneController {
  constructor({
    environment,
    audio,
    interaction,
    inspection,
    inventory,
    objectiveText,
  }) {
    this.environment = environment;
    this.audio = audio;
    this.interaction = interaction;
    this.inspection = inspection;
    this.inventory = inventory;
    this.objectiveText = objectiveText;

    this.state = "idle";
    this.ticketSequenceTime = 0;
    this.sealingProgress = 0;
    this.ticketStored = false;
    this.ticketConsumed = false;
    this.ticketInteractable = null;
    this.registerInteractions();
  }

  registerInteractions() {
    this.ticketInteractable = this.interaction.register({
      id: "ticket",
      object: this.environment.ticket,
      prompt: () => "Press E or LMB to pick up the glowing ticket",
      distance: 2.35,
      enabled: () => !this.ticketConsumed && this.state === "exploring",
      onInteract: () => this.inspectTicket(),
    });

    this.interaction.register({
      id: "wagon-door",
      object: this.environment.serviceDoorPivot,
      prompt: () => this.environment.isServiceDoorOpen()
        ? "Press E or LMB to close the wagon door"
        : "Press E or LMB to open the wagon door",
      distance: 2.6,
      enabled: () => this.state === "exploring" || this.state === "gateOpen" || this.state === "sealed",
      onInteract: () => this.environment.toggleServiceDoor(),
    });
  }

  start() {
    this.state = "exploring";
    this.objectiveText.textContent = this.getCurrentObjectiveText();
  }

  inspectTicket() {
    if (this.inspection.isActive() || this.ticketConsumed) {
      return;
    }

    this.state = "ticketInspect";
    this.environment.prepareTicketForInspection();
    this.inspection.begin({
      id: "ticket",
      object: this.environment.ticket,
      prompt: "Ticket: hold right mouse and move to rotate. Press E to keep it.",
      targetPosition: new THREE.Vector3(0, -0.01, -0.4),
      targetRotation: new THREE.Euler(1.52, 0, 0),
      scaleMultiplier: 0.86,
      rotateWithHold: true,
      onConfirm: () => this.beginTicketAwakening(),
      onCancel: () => {
        this.state = "exploring";
        this.objectiveText.textContent = this.getCurrentObjectiveText();
        this.environment.restoreTicketAfterInspection();
      },
    });
    this.objectiveText.textContent = "The old ticket is finally close enough to read.";
  }

  beginTicketAwakening() {
    if ((this.state !== "exploring" && this.state !== "ticketInspect") || this.ticketConsumed) {
      return;
    }

    this.state = "awakening";
    this.ticketSequenceTime = 0;
    this.ticketConsumed = true;
    if (!this.ticketStored) {
      this.ticketStored = true;
      this.inventory.addItem({
        id: "circus-ticket",
        name: "Circus Ticket",
        image: this.environment.getTicketInventoryImage(),
        onInspect: () => this.inspectStoredTicket(),
      });
    }
    this.objectiveText.textContent = "The circus is waking up.";
    this.environment.beginTicketDissolve();
    this.environment.setAwakeningProgress(0.18);
    this.audio.playTicketMagic();
  }

  inspectStoredTicket() {
    if (this.inspection.isActive()) {
      return;
    }

    const preview = this.environment.createInventoryTicketPreview();
    this.inspection.begin({
      id: "circus-ticket-preview",
      object: preview,
      prompt: "Ticket: hold right mouse and move to rotate. Press E to put it away.",
      targetPosition: new THREE.Vector3(0, -0.01, -0.4),
      targetRotation: new THREE.Euler(1.52, 0, 0),
      scaleMultiplier: 0.86,
      rotateWithHold: true,
      onConfirm: () => {
        this.inspection.discard();
        this.objectiveText.textContent = this.getCurrentObjectiveText();
      },
      onCancel: () => {
        this.inspection.discard();
        this.objectiveText.textContent = this.getCurrentObjectiveText();
        return false;
      },
    });
    this.objectiveText.textContent = "The old ticket still hums in your hands.";
  }

  update(deltaTime, playerPosition) {
    if (this.state === "awakening") {
      this.ticketSequenceTime += deltaTime;
      const foldWindow = GAME_CONFIG.timing.ticketFoldDuration;
      const awakeningWindow = GAME_CONFIG.timing.awakeningDuration;

      if (this.ticketSequenceTime <= foldWindow) {
        this.environment.updateTicketDissolve(this.ticketSequenceTime / foldWindow);
        const earlyProgress = 0.18 + (this.ticketSequenceTime / foldWindow) * 0.18;
        this.environment.setAwakeningProgress(earlyProgress);
        this.audio.setCircusAwake(earlyProgress);
      } else {
        this.inspection.discard();
        this.environment.storeTicketInInventory();
        const progress = Math.min((this.ticketSequenceTime - foldWindow) / awakeningWindow, 1);
        const awakeningProgress = Math.max(0.36, progress);
        this.environment.setAwakeningProgress(awakeningProgress);
        this.environment.setGateOpenProgress(Math.max(0, (progress - 0.18) / 0.82));
        this.audio.setCircusAwake(awakeningProgress);

        if (progress >= 1) {
          this.state = "gateOpen";
          this.objectiveText.textContent = "Walk through the circus gate.";
        }
      }
    }

    if (this.state === "gateOpen" && playerPosition.z < GAME_CONFIG.world.gateLineZ) {
      this.state = "sealing";
      this.sealingProgress = this.environment.gateOpenProgress;
      this.objectiveText.textContent = "The gate closes behind you.";
      this.environment.sealExit();
      this.audio.playGateClose();
    }

    if (this.state === "sealing") {
      this.sealingProgress = Math.max(0, this.sealingProgress - deltaTime / GAME_CONFIG.timing.gateCloseDuration);
      this.environment.setGateOpenProgress(this.sealingProgress);

      if (this.sealingProgress <= 0) {
        this.state = "sealed";
        this.objectiveText.textContent = "Explore the silent circus.";
      }
    }
  }

  getCurrentObjectiveText() {
    if (this.state === "sealed") {
      return "Explore the silent circus.";
    }
    if (this.state === "gateOpen") {
      return "Walk through the circus gate.";
    }
    if (this.state === "awakening") {
      return "The circus is waking up.";
    }
    return "Find the glowing ticket.";
  }
}
