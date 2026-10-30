import { sounds } from './audio.js';

export class SpellManager {
  constructor(engine) {
    this.engine = engine;
    this.selectedSpellId = 'meteor';
    this.isCastingSpell = false;
    this.spellAnimation = null;

    this.spells = {
      meteor: {
        id: 'meteor',
        name: 'ฝนอุกกาบาต',
        icon: '☄️',
        level: 1,
        energy: 0,
        maxEnergy: 100, // สะสมพลังงานจากการโจมตี 100 แต้ม
        cooldown: 0,
        maxCooldown: 12,
        mastery: null // 'blaze' | 'supernova'
      },
      blizzard: {
        id: 'blizzard',
        name: 'พายุหิมะเยือกแข็ง',
        icon: '❄️',
        level: 1,
        energy: 0,
        maxEnergy: 140, // สกิลหยุดทั้งแมพ ต้องสะสม 140 แต้ม
        cooldown: 0,
        maxCooldown: 15,
        mastery: null // 'shatter' | 'absolute_zero'
      },
      lightning: {
        id: 'lightning',
        name: 'อัสนีบาตสายฟ้า',
        icon: '⚡',
        level: 1,
        energy: 0,
        maxEnergy: 80,  // สกิลสายฟ้าต่อเนื่อง 80 แต้ม
        cooldown: 0,
        maxCooldown: 8,
        mastery: null // 'overcharge' | 'thunderstorm'
      }
    };
  }

  // ระบบกักเก็บพลังงานเวทจากการโจมตีของป้อม (Spell Energy Harvesting System)
  gainSpellEnergy(damageAmount) {
    const energyGain = Math.max(1, Math.round(damageAmount * 0.08));
    for (const key of Object.keys(this.spells)) {
      const sp = this.spells[key];
      if (sp.energy < sp.maxEnergy) {
        const prev = sp.energy;
        sp.energy = Math.min(sp.maxEnergy, sp.energy + energyGain);
        if (prev < sp.maxEnergy && sp.energy >= sp.maxEnergy) {
          sounds.playTone(980, 'sine', 0.25, 0.2);
          this.engine.ui.notify(`⚡ มหาเวท [${sp.icon} ${sp.name}] ชาร์จพลังงานเต็ม 100% แล้ว! พร้อมปลดปล่อย!`);
        }
      }
    }
  }

  getSpellStats(spellId = this.selectedSpellId) {
    const sp = this.spells[spellId] || this.spells.meteor;
    const lv = sp.level || 1;
    const mastery = sp.mastery;

    if (spellId === 'blizzard') {
      const baseDamage = 60 + (lv * 40) + Math.floor(this.engine.wave * (8 + lv * 5));
      const freezeDuration = 3.5 + (lv * 0.6) + (mastery === 'absolute_zero' ? 2.5 : 0);
      const cooldown = Math.max(12, 24 - (lv * 2));
      const nextCost = 25 + (lv * 22);
      return {
        id: 'blizzard',
        name: sp.name,
        icon: sp.icon,
        level: lv,
        damage: baseDamage,
        freezeDuration,
        cooldown,
        nextCost,
        isMax: lv >= 5,
        mastery
      };
    } else if (spellId === 'lightning') {
      const baseDamage = 130 + (lv * 75) + Math.floor(this.engine.wave * (18 + lv * 12));
      const chainCount = 4 + (lv * 2) + (mastery === 'thunderstorm' ? 6 : 0);
      const cooldown = Math.max(6, 12 - (lv * 1.2));
      const nextCost = 20 + (lv * 18);
      return {
        id: 'lightning',
        name: sp.name,
        icon: sp.icon,
        level: lv,
        damage: baseDamage,
        chainCount,
        cooldown,
        nextCost,
        isMax: lv >= 5,
        mastery
      };
    } else {
      const baseDamage = 120 + (lv * 65) + Math.floor(this.engine.wave * (16 + lv * 10));
      const baseRadius = 2.0 + (lv * 0.3) + (mastery === 'supernova' ? 1.4 : 0);
      const cooldown = Math.max(8, 16 - (lv * 1.5));
      const slowPct = Math.min(0.85, 0.40 + (lv * 0.08));
      const slowDuration = 3.2 + (lv * 0.5);
      const nextCost = 25 + (lv * 20);
      return {
        id: 'meteor',
        name: sp.name,
        icon: sp.icon,
        level: lv,
        damage: baseDamage,
        radius: baseRadius,
        cooldown,
        slowPct,
        slowDuration,
        nextCost,
        isMax: lv >= 5,
        mastery
      };
    }
  }

  upgradeSpellResearch(spellId = this.selectedSpellId) {
    const sp = this.spells[spellId];
    if (!sp) return;
    const stats = this.getSpellStats(spellId);
    if (stats.isMax) {
      sounds.playError();
      this.engine.ui.notify(`สกิล ${sp.name} ได้รับการวิจัยถึงระดับสูงสุดแล้ว! (Max Lv.5)`);
      return;
    }

    if (this.engine.science < stats.nextCost) {
      sounds.playError();
      this.engine.ui.notify(`แต้มวิจัยไม่พอ! ต้องการ ${stats.nextCost} 🔬 (ปัจจุบันมี: ${this.engine.science} 🔬)`);
      return;
    }

    this.engine.science -= stats.nextCost;
    sp.level += 1;
    sp.maxCooldown = this.getSpellStats(spellId).cooldown;

    sounds.playTone(840, 'triangle', 0.25, 0.2);
    this.engine.ui.notify(`✨ วิจัยสำเร็จ! อัปเกรด [${sp.icon} ${sp.name}] เป็น Lv.${sp.level} พลังทำลายล้างสูงขึ้นและคูลดาวน์ลดลง!`);
    this.engine.ui.updateStats(this.engine);
    if (this.engine.ui.renderTechTree) this.engine.ui.renderTechTree();
  }

  setSpellMastery(spellId, masteryKey) {
    const sp = this.spells[spellId];
    if (!sp) return;
    if (sp.level < 3) {
      sounds.playError();
      this.engine.ui.notify(`ต้องวิจัยสกิล ${sp.name} ให้ถึงระดับ Lv.3 ก่อน จึงจะปลดล็อกสายเฉพาะทางได้!`);
      return;
    }
    sp.mastery = masteryKey;
    sounds.playTone(920, 'sine', 0.3, 0.2);

    const names = {
      blaze: '🔥 เปลวเพลิงนรกานต์ (Infernal Blaze - เผาไหม้ต่อเนื่อง 4 วินาที)',
      supernova: '💥 อภิมหาซูเปอร์โนวา (Supernova Blast - ขยายรัศมีระเบิดกว้างขึ้น +50%)',
      shatter: '❄️ น้ำแข็งทลายวิญญาณ (Frost Shatter - เป้าหมายแช่แข็งระเบิดดาเมจคริติคอล)',
      absolute_zero: '🧊 ศูนย์สัมบูรณ์ (Absolute Zero - แช่แข็งหยุดเวลานานขึ้น +2.5 วินาที)',
      overcharge: '⚡ อัสนีบาตฟ้าผ่าซ้ำ (High Voltage - ดาเมจสายฟ้าแรงขึ้น x2.0 เท่า)',
      thunderstorm: '⛈️ วายุสายฟ้าผ่าลูกโซ่ (Chain Surge - กระโดดชิ่งเพิ่มขึ้น +6 เป้าหมาย)'
    };
    this.engine.ui.notify(`🌟 ปลดล็อกสายเฉพาะทาง: ${names[masteryKey] || masteryKey}`);
    this.engine.ui.updateStats(this.engine);
    if (this.engine.ui.renderTechTree) this.engine.ui.renderTechTree();
  }

  selectSpell(spellId) {
    if (!this.spells[spellId]) return;
    this.selectedSpellId = spellId;
    sounds.playTone(560, 'sine', 0.08, 0.08);
    this.engine.ui.notify(`✨ สลับมาใช้มหาเวท: [${this.spells[spellId].icon} ${this.spells[spellId].name}]`);
    if (this.engine.ui.updateSpellBar) {
      this.engine.ui.updateSpellBar(this.spells, this.selectedSpellId);
    }
  }

  castActiveSpell(targetC, targetR) {
    const sp = this.spells[this.selectedSpellId] || this.spells.meteor;
    if (sp.energy < sp.maxEnergy) {
      sounds.playError();
      const pct = Math.floor((sp.energy / sp.maxEnergy) * 100);
      this.engine.ui.notify(`พลังงานไม่พอ! ต้องโจมตีสะสมพลังงานก่อน (${pct}% / 100%)`);
      return;
    }

    if (sp.cooldown > 0) {
      sounds.playError();
      this.engine.ui.notify(`สกิล [${sp.name}] กำลังคูลดาวน์! (เหลือ ${Math.ceil(sp.cooldown)}s)`);
      return;
    }

    const stats = this.getSpellStats(sp.id);
    sp.cooldown = stats.cooldown;
    sp.energy = 0;

    if (sp.id === 'blizzard') {
      sounds.playTone(420, 'sine', 0.5, 0.25);
      this.engine.ui.notify(`❄️ มหาเวทพายุหิมะเยือกแข็งกำลังพัดถล่มสมรภูมิ!`);
      this.spellAnimation = {
        type: 'blizzard',
        targetC,
        targetR,
        timer: 0,
        duration: 0.4
      };
    } else if (sp.id === 'lightning') {
      sounds.playTone(680, 'sawtooth', 0.35, 0.25);
      this.engine.ui.notify(`⚡ อัสนีบาตฟาดสายฟ้าดิ่งผ่าลงจากฟากฟ้า!`);
      this.spellAnimation = {
        type: 'lightning',
        targetC,
        targetR,
        timer: 0,
        duration: 0.2
      };
    } else {
      sounds.playTone(380, 'sawtooth', 0.4, 0.2);
      this.engine.ui.notify(`☄️ มหาเวทอุกกาบาต Lv.${stats.level} กำลังดิ่งลงจากฟากฟ้า!`);
      this.spellAnimation = {
        type: 'meteor',
        targetC,
        targetR,
        timer: 0,
        duration: 0.55
      };
    }
  }

  detonateMeteorSpell(targetC, targetR) {
    const stats = this.getSpellStats('meteor');
    this.engine.screenShake = 10 + stats.level * 2;
    sounds.playTone(70, 'sawtooth', 0.6, 0.4);

    this.engine.createIncomeParticle(targetC, targetR, `💥LV.${stats.level} METEOR!💥`);

    const spellDmg = stats.damage;
    const spellRadius = stats.radius;
    let hitCount = 0;

    for (const e of this.engine.enemies) {
      const dist = Math.hypot(e.gridX - targetC, e.gridY - targetR);
      if (dist <= spellRadius) {
        e.hp -= spellDmg;
        e.hitFlashTimer = 0.25;
        if (hitCount < 4) {
          this.engine.createIncomeParticle(e.gridX, e.gridY, `-${spellDmg}💥`);
          hitCount++;
        }
        e.slowTimer = stats.slowDuration;
        e.speed = e.baseSpeed * (1 - stats.slowPct);

        if (stats.mastery === 'blaze') {
          e.burnTimer = 4.0;
          e.burnDps = Math.round(spellDmg * 0.15);
        }
      }
    }

    this.engine.createImpactRing(targetC, targetR, '#f97316', Math.round(spellRadius * 12));
    this.engine.createDeathGibs(targetC, targetR, '#ef4444');
    this.engine.createDeathGibs(targetC, targetR, '#fbbf24');
    this.engine.ui.updateStats(this.engine);
  }

  detonateBlizzardSpell(targetC, targetR) {
    const stats = this.getSpellStats('blizzard');
    this.engine.screenShake = 6;
    sounds.playTone(520, 'sine', 0.6, 0.3);

    this.engine.createIncomeParticle(targetC, targetR, `❄️BLIZZARD FREEZE!❄️`);

    const spellDmg = stats.damage;
    const freezeTime = stats.freezeDuration;
    let hitCount = 0;

    for (const e of this.engine.enemies) {
      e.hp -= spellDmg;
      e.hitFlashTimer = 0.25;
      e.slowTimer = freezeTime;
      e.speed = 0.03;

      if (hitCount < 4) {
        this.engine.createIncomeParticle(e.gridX, e.gridY, `❄️FROZEN!`);
        hitCount++;
      }

      if (stats.mastery === 'shatter') {
        e.hp -= Math.round(spellDmg * 0.4);
      }
    }

    this.engine.createImpactRing(targetC, targetR, '#38bdf8', 45);
    this.engine.createDeathGibs(targetC, targetR, '#38bdf8');
    this.engine.createDeathGibs(targetC, targetR, '#c3f4fe');
    this.engine.ui.updateStats(this.engine);
  }

  detonateLightningSpell(targetC, targetR) {
    const stats = this.getSpellStats('lightning');
    this.engine.screenShake = 12;
    sounds.playTone(180, 'sawtooth', 0.5, 0.3);

    this.engine.createIncomeParticle(targetC, targetR, `⚡LIGHTNING STRIKE!⚡`);

    let curDmg = stats.damage;
    if (stats.mastery === 'overcharge') {
      curDmg = Math.round(curDmg * 2.0);
    }

    const sortedEnemies = [...this.engine.enemies].sort((a, b) => {
      const da = Math.hypot(a.gridX - targetC, a.gridY - targetR);
      const db = Math.hypot(b.gridX - targetC, b.gridY - targetR);
      return da - db;
    });

    const hitEnemies = [];
    const maxChains = Math.min(stats.chainCount, sortedEnemies.length);

    for (let i = 0; i < maxChains; i++) {
      const e = sortedEnemies[i];
      e.hp -= curDmg;
      e.hitFlashTimer = 0.3;
      e.slowTimer = 1.8;
      e.speed = e.baseSpeed * 0.2;
      hitEnemies.push(e);

      this.engine.createIncomeParticle(e.gridX, e.gridY, `-${curDmg}⚡`);
      curDmg = Math.max(40, Math.round(curDmg * 0.85));
    }

    this.engine.createImpactRing(targetC, targetR, '#facc15', 30);
    this.engine.createDeathGibs(targetC, targetR, '#facc15');
    this.engine.createDeathGibs(targetC, targetR, '#fef08a');
    this.engine.ui.updateStats(this.engine);
  }

  update(dt) {
    // อัปเดตคูลดาวน์สกิล
    for (const key of Object.keys(this.spells)) {
      const sp = this.spells[key];
      if (sp.cooldown > 0) {
        sp.cooldown = Math.max(0, sp.cooldown - dt);
      }
    }

    if (this.engine.ui.updateSpellBar) {
      this.engine.ui.updateSpellBar(this.spells, this.selectedSpellId);
    }

    // อัปเดตอนิเมชันสกิล
    if (this.spellAnimation) {
      this.spellAnimation.timer += dt;
      if (this.spellAnimation.timer >= this.spellAnimation.duration) {
        const anim = this.spellAnimation;
        this.spellAnimation = null;
        if (anim.type === 'blizzard') {
          this.detonateBlizzardSpell(anim.targetC, anim.targetR);
        } else if (anim.type === 'lightning') {
          this.detonateLightningSpell(anim.targetC, anim.targetR);
        } else {
          this.detonateMeteorSpell(anim.targetC, anim.targetR);
        }
      }
    }
  }
}
