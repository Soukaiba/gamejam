const STORAGE_KEY = "circus-remembers:settings";

const DEFAULTS = {
  sensitivity: 1, // multiplier applied on top of GAME_CONFIG.camera.mouseSensitivity
  volume: 0.7, // 0..1, applied on top of AudioManager's internal mix
  fov: 68,
  invertY: false,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * Loads/saves user-adjustable settings (sensitivity, volume, FOV, invert-Y)
 * to localStorage. Wrapped in try/catch throughout since localStorage can
 * throw in private-browsing or sandboxed contexts (see AGENTS.md).
 */
export class SettingsManager {
  constructor() {
    this.values = { ...DEFAULTS, ...this.load() };
  }

  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw);
      return {
        sensitivity: typeof parsed.sensitivity === "number" ? parsed.sensitivity : DEFAULTS.sensitivity,
        volume: typeof parsed.volume === "number" ? clamp01(parsed.volume) : DEFAULTS.volume,
        fov: typeof parsed.fov === "number" ? parsed.fov : DEFAULTS.fov,
        invertY: Boolean(parsed.invertY),
      };
    } catch (error) {
      return {};
    }
  }

  save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values));
    } catch (error) {
      // Ignore write failures (private browsing, storage disabled, etc.)
    }
  }

  get(key) {
    return this.values[key];
  }

  set(key, value) {
    this.values[key] = value;
    this.save();
  }

  reset() {
    this.values = { ...DEFAULTS };
    this.save();
  }
}
