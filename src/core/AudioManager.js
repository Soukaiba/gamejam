import { clamp, randomRange } from "../utils/math.js";

export class AudioManager {
  constructor(audioStateNode) {
    this.audioStateNode = audioStateNode;
    this.context = null;
    this.masterGain = null;
    this.windGain = null;
    this.musicGain = null;
    this.musicClock = 0;
    this.musicStep = 0;
    this.nextMusicTime = 0;
    this.nextCreakTime = randomRange(7, 12);
    this.started = false;
    this.muted = false;
    this.awakeningLevel = 0;
    this.volume = 0.7; // user-adjustable master volume, 0..1
    this.baseGain = 0.22; // internal mix level the volume slider scales
  }

  async resume() {
    if (!this.context) {
      this.setup();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.started = true;
  }

  setup() {
    const context = new AudioContext();
    const masterGain = context.createGain();
    masterGain.gain.value = this.muted ? 0 : this.baseGain * this.volume;
    masterGain.connect(context.destination);

    const windGain = context.createGain();
    windGain.gain.value = 0.04;
    windGain.connect(masterGain);

    const windFilter = context.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 800;
    windFilter.Q.value = 0.5;
    windFilter.connect(windGain);

    const windNoise = this.createNoiseSource(context);
    windNoise.connect(windFilter);
    windNoise.start();

    const musicGain = context.createGain();
    musicGain.gain.value = 0.008;
    musicGain.connect(masterGain);

    this.context = context;
    this.masterGain = masterGain;
    this.windGain = windGain;
    this.musicGain = musicGain;
  }

  createNoiseSource(context) {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * 0.34;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.baseGain * this.volume;
    }

    this.audioStateNode.textContent = this.muted ? "Audio: Muted" : "Audio: On";
  }

  setMasterVolume(volume) {
    this.volume = clamp(volume, 0, 1);
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.baseGain * this.volume;
    }
  }

  setCircusAwake(level) {
    this.awakeningLevel = clamp(level, 0, 1);
  }

  playFootstep({ sprinting = false, crouching = false } = {}) {
    if (!this.context || this.muted) {
      return;
    }

    const now = this.context.currentTime;
    const duration = crouching ? 0.05 : 0.08;

    const buffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * duration), this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      const envelope = 1 - index / channel.length;
      channel[index] = (Math.random() * 2 - 1) * envelope;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = randomRange(140, 220);
    filter.Q.value = 0.9;

    const gain = this.context.createGain();
    const peak = (crouching ? 0.02 : sprinting ? 0.055 : 0.038) + this.awakeningLevel * 0.004;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + duration + 0.02);
  }

  update(deltaTime) {
    if (!this.started || !this.context || this.muted) {
      return;
    }

    this.musicClock += deltaTime;
    this.windGain.gain.value += ((0.045 - this.awakeningLevel * 0.008) - this.windGain.gain.value)
      * Math.min(deltaTime * 0.5, 1);
    this.musicGain.gain.value += ((0.01 + this.awakeningLevel * 0.052) - this.musicGain.gain.value)
      * Math.min(deltaTime * 0.7, 1);

    if (this.musicClock >= this.nextMusicTime) {
      this.playCarnivalNote();
    }

    if (this.musicClock >= this.nextCreakTime) {
      this.playCreak();
      this.nextCreakTime = this.musicClock + randomRange(9, 16);
    }
  }

  playCarnivalNote() {
    const sequence = [220, 262, 311, 262, 233, 294, 349, 294];
    const note = sequence[this.musicStep % sequence.length];
    const now = this.context.currentTime;
    const duration = 1;

    const oscillator = this.context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(note, now);

    const shimmer = this.context.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(note * 1.5, now);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.036 + this.awakeningLevel * 0.03, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    shimmer.connect(gain);
    gain.connect(this.musicGain);

    oscillator.start(now);
    shimmer.start(now);
    oscillator.stop(now + duration + 0.04);
    shimmer.stop(now + duration + 0.04);

    this.musicStep += 1;
    this.nextMusicTime = this.musicClock + 0.78;
  }

  playCreak() {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(randomRange(110, 150), now);
    oscillator.frequency.exponentialRampToValueAtTime(randomRange(55, 75), now + 1.2);

    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = randomRange(260, 440);
    filter.Q.value = 3;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.012 + this.awakeningLevel * 0.012, now + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + 1.28);
  }

  playTicketMagic() {
    if (!this.context || this.muted) {
      return;
    }

    const now = this.context.currentTime;
    const root = this.context.createOscillator();
    root.type = "sine";
    root.frequency.setValueAtTime(330, now);
    root.frequency.linearRampToValueAtTime(660, now + 0.9);

    const shimmer = this.context.createOscillator();
    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(880, now);
    shimmer.frequency.linearRampToValueAtTime(1320, now + 0.9);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    root.connect(gain);
    shimmer.connect(gain);
    gain.connect(this.masterGain);

    root.start(now);
    shimmer.start(now);
    root.stop(now + 1.15);
    shimmer.stop(now + 1.15);
  }

  playGateClose() {
    if (!this.context || this.muted) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(95, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + 1.6);

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 260;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + 1.72);
  }
}
