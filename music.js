class BirthdayMusicBox {
  constructor() {
    this.audio = new Audio('assets/kadhal_anukkal.mp3?v=12');
    this.audio.loop = false; // We use our own custom fading loop!
    this.audio.volume = 0.0;
    this.isPlaying = false;
    this.isFadingOut = false;
    this.audioCtx = null;

    // Monitor playback time to trigger smooth fade-out near the end of the song
    this.audio.addEventListener('timeupdate', () => {
      if (this.isPlaying && this.audio.duration && !this.isFadingOut) {
        if (this.audio.currentTime >= this.audio.duration - 3.5) {
          this.isFadingOut = true;
          this.fadeOutAndLoop();
        }
      }
    });
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.isFadingOut = false;
    this.audio.currentTime = 0;
    this.audio.volume = 0.0;
    
    this.audio.play().then(() => {
      this.fadeIn();
    }).catch(e => {
      console.log("Audio play blocked by browser. Handled via click handler.", e);
    });
  }

  // Fade-in capped at 0.6 (40% lower than original 1.0)
  fadeIn() {
    let vol = 0.0;
    this.audio.volume = vol;
    const interval = setInterval(() => {
      if (!this.isPlaying || this.isFadingOut) {
        clearInterval(interval);
        return;
      }
      vol += 0.03;
      if (vol >= 0.6) {
        vol = 0.6;
        clearInterval(interval);
      }
      this.audio.volume = vol;
    }, 125); // ~2.5s total fade-in time
  }

  // Fade-out from 0.6 to 0.0
  fadeOutAndLoop() {
    let vol = this.audio.volume;
    const interval = setInterval(() => {
      if (!this.isPlaying) {
        clearInterval(interval);
        return;
      }
      vol -= 0.03;
      if (vol <= 0.0) {
        vol = 0.0;
        clearInterval(interval);
        
        // Loop: restart the song and fade it back in!
        this.audio.currentTime = 0;
        this.isFadingOut = false;
        this.fadeIn();
      }
      this.audio.volume = vol;
    }, 125); // ~2.5s total fade-out time
  }

  stop() {
    this.isPlaying = false;
    this.isFadingOut = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.volume = 0.0;
    }
  }

  // Synthesize a highly realistic, loud mechanical camera click (shutter noise + mirror tick)
  playCameraShutter() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const ctx = this.audioCtx;
    const startTime = ctx.currentTime;
    
    // 1. White Noise Shutter Snap
    const bufferSize = ctx.sampleRate * 0.09;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, startTime);
    filter.Q.setValueAtTime(3.0, startTime);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.85, startTime + 0.005); // Louder snap!
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    // 2. High-frequency Metallic Mirror Click
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, startTime); // High metallic chime
    
    oscGain.gain.setValueAtTime(0, startTime);
    oscGain.gain.linearRampToValueAtTime(0.5, startTime + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    // Start both
    noise.start(startTime);
    osc.start(startTime);
    
    noise.stop(startTime + 0.09);
    osc.stop(startTime + 0.04);
  }
}

window.birthdayMusicBox = new BirthdayMusicBox();
