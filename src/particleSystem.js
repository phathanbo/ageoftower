import { sounds } from './audio.js';

export class ParticleSystem {
  constructor(engine) {
    this.engine = engine;
    this.particles = [];
  }

  // สร้างเอฟเฟกต์แสงประกายปากกระบอกตอนป้อมยิง (Muzzle Flash FX)
  createMuzzleFlash(c, r, color) {
    this.particles.push({
      type: 'muzzle',
      c,
      r,
      color,
      radius: 12,
      maxRadius: 18,
      life: 0.15,
      maxLife: 0.15
    });
  }

  // สร้างเอฟเฟกต์วงระเบิดคลื่นกระแทกจุดปะทะ (Impact Shockwave FX)
  createImpactRing(c, r, color, maxRadius = 24) {
    this.particles.push({
      type: 'impact',
      c,
      r,
      color,
      radius: 4,
      maxRadius,
      life: 0.22,
      maxLife: 0.22
    });
  }

  // สร้างเอฟเฟกต์สะเก็ดชิ้นส่วนระเบิดกระจาย (Death Gibs / Particles)
  createDeathGibs(c, r, color) {
    if (this.particles.length > 120) return;

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i + (Math.random() - 0.5) * 0.5;
      const speed = 25 + Math.random() * 30;
      this.particles.push({
        type: 'gib',
        c,
        r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 12,
        offsetX: 0,
        offsetY: 0,
        color: color,
        size: Math.random() * 2.5 + 2,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  createBuildParticles(c, r) {
    if (this.particles.length > 120) return;
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        c,
        r,
        text: '✨',
        y: 0,
        vy: -15 - Math.random() * 15,
        life: 0.4
      });
    }
  }

  createIncomeParticle(c, r, text) {
    if (this.particles.length > 120) return;
    this.particles.push({
      c,
      r,
      text,
      y: 0,
      vy: -25,
      life: 0.7
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life -= dt;
      if (part.type === 'gib') {
        part.offsetX += part.vx * dt;
        part.offsetY += part.vy * dt;
        part.vy += 65 * dt; // Gravity
      } else if (part.type === 'muzzle' || part.type === 'impact') {
        const progress = 1 - (part.life / part.maxLife);
        part.radius = 4 + (part.maxRadius - 4) * progress;
      } else {
        part.y += (part.vy || -25) * dt;
      }
      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}
