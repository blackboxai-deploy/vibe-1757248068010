// Audio Manager for Subway Surfers Game
// Handles background music and sound effects using Web Audio API

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private musicVolume: number = 0.3;
  private soundVolume: number = 0.7;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeAudio();
    this.loadAudioAssets();
  }

  private async initializeAudio(): Promise<void> {
    try {
      // Create AudioContext with compatibility for older browsers
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Handle browser autoplay policies
      if (this.audioContext.state === 'suspended') {
        document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
        document.addEventListener('touchstart', this.resumeAudioContext.bind(this), { once: true });
        document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true });
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.fallbackToHTMLAudio();
    }
  }

  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }

  private fallbackToHTMLAudio(): void {
    // Fallback for browsers that don't support Web Audio API
    console.log('Using HTML Audio API as fallback');
  }

  private async loadAudioAssets(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Generate synthetic sounds using Web Audio API oscillators
      await Promise.all([
        this.generateSound('jump', 'square', 400, 0.1),
        this.generateSound('slide', 'sawtooth', 200, 0.15),
        this.generateSound('coin', 'sine', 800, 0.1),
        this.generateSound('powerup', 'triangle', 600, 0.2),
        this.generateSound('hit', 'square', 150, 0.3),
        this.generateSound('gameover', 'sawtooth', 100, 0.5),
        this.generateBackgroundMusic()
      ]);
    } catch (error) {
      console.warn('Failed to load audio assets:', error);
    }
  }

  private async generateSound(
    name: string, 
    waveType: OscillatorType, 
    frequency: number, 
    duration: number
  ): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate the waveform
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (waveType) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
      }

      // Apply envelope (attack, decay, sustain, release)
      const envelope = this.applyEnvelope(t, duration);
      data[i] = sample * envelope * 0.3; // Reduce volume
    }

    this.sounds.set(name, buffer);
  }

  private applyEnvelope(time: number, duration: number): number {
    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = 0.7;
    const releaseTime = duration * 0.3;

    if (time < attackTime) {
      return time / attackTime;
    } else if (time < attackTime + decayTime) {
      return 1 - (1 - sustainLevel) * ((time - attackTime) / decayTime);
    } else if (time < duration - releaseTime) {
      return sustainLevel;
    } else {
      return sustainLevel * ((duration - time) / releaseTime);
    }
  }

  private async generateBackgroundMusic(): Promise<void> {
    if (!this.audioContext) return;

    // Generate a simple upbeat background loop
    const sampleRate = this.audioContext.sampleRate;
    const duration = 8; // 8 second loop
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Create a simple melody with bass line
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const beat = (t % 1) * 4; // 4/4 time
      
      // Bass line (lower frequency)
      const bassFreq = 80;
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.3;
      
      // Melody (higher frequency, changes with beat)
      const melodyFreqs = [200, 250, 300, 250]; // Simple progression
      const melodyFreq = melodyFreqs[Math.floor(beat) % 4];
      const melody = Math.sin(2 * Math.PI * melodyFreq * t) * 0.2;
      
      // Hi-hat like rhythm
      const hihat = (Math.random() * 2 - 1) * 0.1 * (Math.sin(t * 32) > 0.5 ? 1 : 0);
      
      const sample = bass + melody + hihat;
      leftChannel[i] = sample * 0.4;
      rightChannel[i] = sample * 0.4;
    }

    this.musicBuffer = buffer;
  }

  public playSound(soundName: string): void {
    if (!this.audioContext || !this.isInitialized || this.isMuted) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.soundVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error);
    }
  }

  public playMusic(): void {
    if (!this.audioContext || !this.musicBuffer || !this.isInitialized || this.isMuted) return;

    try {
      // Stop existing music
      if (this.musicSource) {
        this.musicSource.stop();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.musicBuffer;
      source.loop = true;
      gainNode.gain.value = this.musicVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
      this.musicSource = source;
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  public pauseMusic(): void {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
        this.musicSource = null;
      } catch (error) {
        console.warn('Failed to pause music:', error);
      }
    }
  }

  public stopMusic(): void {
    this.pauseMusic();
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // If music is currently playing, update the volume
    if (this.musicSource) {
      this.stopMusic();
      this.playMusic();
    }
  }

  public setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  public cleanup(): void {
    this.stopMusic();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.sounds.clear();
    this.musicBuffer = null;
    this.isInitialized = false;
  }

  // Utility method to create custom sound effects
  public createCustomSound(
    name: string,
    frequencies: number[],
    duration: number,
    waveType: OscillatorType = 'sine'
  ): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Mix multiple frequencies
      for (const freq of frequencies) {
        switch (waveType) {
          case 'sine':
            sample += Math.sin(2 * Math.PI * freq * t) / frequencies.length;
            break;
          case 'square':
            sample += Math.sign(Math.sin(2 * Math.PI * freq * t)) / frequencies.length;
            break;
          case 'sawtooth':
            sample += (2 * (t * freq - Math.floor(t * freq + 0.5))) / frequencies.length;
            break;
          case 'triangle':
            sample += (2 * Math.abs(2 * (t * freq - Math.floor(t * freq + 0.5))) - 1) / frequencies.length;
            break;
        }
      }

      const envelope = this.applyEnvelope(t, duration);
      data[i] = sample * envelope * 0.3;
    }

    this.sounds.set(name, buffer);
  }
}