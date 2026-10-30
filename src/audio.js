// Sound synthesis using Web Audio API (Zero audio assets required, 100% lightweight & offline ready)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.activeVoices = 0;
    this.maxPolyphony = 12; // จำกัดโพลีโฟนีป้องกันเสียงแตก/หอนเวลามีป้อมยิงพร้อมกันเยอะ

    // ดนตรีพื้นหลัง BGM Synthesizer
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmGain = null;
    this.currentEraTheme = 0; // 0: Tribal/Stone, 1: Medieval/Kingdom, 2: Industrial, 3: Modern, 4: Sci-Fi
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      // Low-pass master filter เพื่อลดความแหลมบาดหู (anti-harshness filter)
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

      this.masterGain.connect(this.masterFilter);
      this.masterFilter.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.activeVoices >= this.maxPolyphony) return;

    try {
      this.activeVoices++;
      // สุ่ม Pitch เล็กน้อย +-5% เพื่อความเป็นธรรมชาติ ไม่โมโนโทน
      const pitchVariance = 0.95 + Math.random() * 0.1;
      const actualFreq = freq * pitchVariance;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(actualFreq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);

      setTimeout(() => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      }, duration * 1000);
    } catch (e) {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    }
  }

  playShoot(eraIndex = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.activeVoices >= this.maxPolyphony) return;
    this.activeVoices++;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch randomization เล็กน้อยเพื่อให้เสียงปืนแต่ละนัดมีมิติ
    const pitchMod = 0.93 + Math.random() * 0.14;

    if (eraIndex === 0) {
      // Stone age: low punchy thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (eraIndex === 1) {
      // Medieval: bow string twang
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (eraIndex === 2) {
      // Industrial: mechanical shot
      osc.type = 'square';
      osc.frequency.setValueAtTime(260 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (eraIndex === 3) {
      // Modern: heavy cannon / rocket punch
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.22);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Sci-Fi / Space: clean resonant synth pew
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.16);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    setTimeout(() => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    }, 220);
  }

  playHit() {
    this.playTone(70, 'triangle', 0.07, 0.14);
  }

  playBuild() {
    this.playTone(520, 'sine', 0.08, 0.12);
    setTimeout(() => this.playTone(680, 'sine', 0.1, 0.12), 60);
  }

  playAgeUp() {
    const notes = [261.6, 329.6, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.15);
      }, idx * 75);
    });
  }

  playError() {
    this.playTone(140, 'triangle', 0.14, 0.14);
  }

  // ==================== BGM BACKGROUND MUSIC SYSTEM ====================
  // Procedural Battle Music Generator สไตล์ Kingdom Rush / Fantasy Battle
  // เล่นลูปกลองรบ (War Drums) + เบสเดินคอร์ด (Bassline) + ท่วงทำนองเครื่องสายอัศวิน (Orchestral Melody)
  startBGM(eraIndex = 1) {
    if (this.muted || this.bgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    this.currentEraTheme = eraIndex;
    this.bgmStep = 0;

    if (!this.bgmGain) {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.09, this.ctx.currentTime); // ระดับเสียง BGM พอดี ไม่กลบ SFX
      this.bgmGain.connect(this.masterGain);
    }

    // 5 Era-specific Melody & Bassline Themes (เพลงเปลี่ยนตามยุค 5 อารยธรรม)
    const eraThemes = [
      // Era 0: Stone Age (Tribal Pentatonic, จังหวะดิบ หนาทุ้ม ชนเผ่าดึกดำบรรพ์)
      {
        bass: [65.41, 65.41, 73.42, 82.41, 65.41, 65.41, 98.00, 82.41], // C2, D2, E2, G2
        melody: [
          261.63, 0, 293.66, 329.63, 0, 392.00, 329.63, 0,
          293.66, 329.63, 261.63, 0, 196.00, 0, 220.00, 261.63
        ],
        oscType: 'triangle',
        tempo: 128
      },
      // Era 1: Medieval Kingdom (Dorian Epic Horns & Strings สไตล์ Kingdom Rush)
      {
        bass: [73.42, 73.42, 87.31, 98.00, 110.00, 110.00, 98.00, 87.31], // D2, F2, G2, A2
        melody: [
          293.66, 0, 349.23, 392.00, 440.00, 0, 523.25, 440.00,
          392.00, 440.00, 349.23, 0, 293.66, 0, 220.00, 261.63
        ],
        oscType: 'sawtooth',
        tempo: 136
      },
      // Era 2: Industrial Steampunk (Minor Marching, จังหวะจักรกลฟันเฟืองกระแทกแน่น)
      {
        bass: [82.41, 82.41, 98.00, 82.41, 110.00, 98.00, 82.41, 73.42], // E2, G2, A2
        melody: [
          329.63, 329.63, 0, 392.00, 440.00, 392.00, 329.63, 0,
          493.88, 0, 440.00, 392.00, 329.63, 0, 293.66, 329.63
        ],
        oscType: 'square',
        tempo: 132
      },
      // Era 3: Modern Warfare (Synthesizer Arpeggio, หน่วยรบไฮเทค ดุดัน เร่งเร้า)
      {
        bass: [55.00, 55.00, 65.41, 73.42, 55.00, 55.00, 82.41, 73.42], // A1, C2, D2
        melody: [
          440.00, 523.25, 659.25, 523.25, 440.00, 392.00, 440.00, 0,
          587.33, 523.25, 440.00, 392.00, 329.63, 392.00, 440.00, 0
        ],
        oscType: 'sawtooth',
        tempo: 140
      },
      // Era 4: Galactic Space Age (Sci-Fi Ambient & Cosmic Pulse ดนตรีอวกาศเวิ้งว้าง)
      {
        bass: [65.41, 77.78, 87.31, 98.00, 65.41, 87.31, 116.54, 98.00], // C2, Eb2, F2, G2
        melody: [
          523.25, 0, 622.25, 698.46, 783.99, 0, 932.33, 783.99,
          698.46, 783.99, 622.25, 0, 523.25, 622.25, 698.46, 0
        ],
        oscType: 'sine',
        tempo: 126
      }
    ];

    const currentTheme = eraThemes[Math.min(this.currentEraTheme, eraThemes.length - 1)];
    const tempo = currentTheme.tempo;
    const stepDuration = (60 / tempo) / 2; // 1/8 note
    const bassNotes = currentTheme.bass;
    const melodyNotes = currentTheme.melody;

    const tick = () => {
      if (!this.bgmPlaying || this.muted) return;
      const now = this.ctx.currentTime;
      const step = this.bgmStep;

      // 1. กลองรบ (War Drums / Taiko Kick & Snare Percussion)
      if (step % 4 === 0) {
        // Kick Drum หนักแน่น
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'triangle';
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.16);
        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.linearRampToValueAtTime(0.001, now + 0.16);
        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.16);
      } else if (step % 4 === 2) {
        // Marching Snare / Hi-hat
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'sawtooth';
        snareOsc.frequency.setValueAtTime(220, now);
        snareOsc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        snareGain.gain.setValueAtTime(0.08, now);
        snareGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        snareOsc.connect(snareGain);
        snareGain.connect(this.bgmGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.08);
      }

      // 2. เสียงเดินเบส (Epic Bassline)
      const bFreq = bassNotes[Math.floor(step / 2) % bassNotes.length];
      if (bFreq && step % 2 === 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = (this.currentEraTheme >= 3 ? 'sawtooth' : 'triangle');
        bOsc.frequency.setValueAtTime(bFreq, now);
        bGain.gain.setValueAtTime(0.18, now);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 1.8);
        bOsc.connect(bGain);
        bGain.connect(this.bgmGain);
        bOsc.start(now);
        bOsc.stop(now + stepDuration * 1.8);
      }

      // 3. ท่วงทำนอง (Battle Horn / Strings Melody)
      const mFreq = melodyNotes[step % melodyNotes.length];
      if (mFreq > 0) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = currentTheme.oscType || 'sawtooth';
        mOsc.frequency.setValueAtTime(mFreq, now);
        mGain.gain.setValueAtTime(0.07, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.5);
        mOsc.connect(mGain);
        mGain.connect(this.bgmGain);
        mOsc.start(now);
        mOsc.stop(now + stepDuration * 1.5);
      }

      this.bgmStep = (this.bgmStep + 1) % 64;
      this.bgmTimer = setTimeout(tick, stepDuration * 1000);
    };

    tick();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime);
    }
    if (this.muted) {
      this.stopBGM();
    } else {
      this.startBGM(this.currentEraTheme);
    }
    return this.muted;
  }
}

export const sounds = new SoundManager();
