import { GameApp } from "./src/GameApp.js";

const app = new GameApp({
  canvas: document.getElementById("game-canvas"),
  openingQuote: document.getElementById("opening-quote"),
  startScreen: document.getElementById("start-screen"),
  startButton: document.getElementById("start-button"),
  pointerHint: document.getElementById("pointer-hint"),
  interactPrompt: document.getElementById("interact-prompt"),
  inspectPrompt: document.getElementById("inspect-prompt"),
  inspectClose: document.getElementById("inspect-close"),
  objectiveText: document.getElementById("objective-text"),
  audioState: document.getElementById("audio-state"),
  statusBar: document.getElementById("status-bar"),
  controlsHint: document.getElementById("controls-hint"),
  inventoryHint: document.getElementById("inventory-hint"),
  inventoryPanel: document.getElementById("inventory-panel"),
  inventoryList: document.getElementById("inventory-list"),
  inventoryClose: document.getElementById("inventory-close"),
  shell: document.getElementById("game-shell"),
  vignette: document.getElementById("vignette"),
  settingsButton: document.getElementById("settings-button"),
  settingsPanel: document.getElementById("settings-panel"),
  settingsClose: document.getElementById("settings-close"),
  settingsResume: document.getElementById("settings-resume"),
  sensitivityInput: document.getElementById("setting-sensitivity"),
  volumeInput: document.getElementById("setting-volume"),
  fovInput: document.getElementById("setting-fov"),
  invertYInput: document.getElementById("setting-invert-y"),
});

app.start();
