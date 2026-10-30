import { ENEMY_TYPES } from './eras.js';
import { sounds } from './audio.js';

export class WaveManager {
  constructor(engine) {
    this.engine = engine;
    this.wave = 1;
    this.isWaveRunning = false;
    this.autoWave = false;
    this.autoWaveTimer = 0;
    this.waveSpawnTimer = 0;
    this.enemiesToSpawn = [];
  }

  startNextWave() {
    if (this.isWaveRunning) return;
    sounds.init();
    this.isWaveRunning = true;

    // ตรวจสอบว่าเป็น Boss Wave หรือไม่ (ทุกๆ 5 เวฟ)
    const isBossWave = (this.wave % 5 === 0);

    // คำนวณจำนวนและชนิดศัตรูตามเวฟและยุค
    const enemyCount = isBossWave ? Math.max(16, Math.round((22 + this.wave * 7) * 0.75)) : (22 + this.wave * 7);
    const waveHpMultiplier = (1 + (this.wave - 1) * 0.20) * (1 + this.engine.currentEraIndex * 0.30);

    const availablePool = ENEMY_TYPES.filter(e => e.era <= this.engine.currentEraIndex);
    if (!availablePool.length) return;

    const sorted = [...availablePool].sort((a, b) => a.hp - b.hp);

    let weakGroup, midGroup, strongGroup;
    if (sorted.length === 1) {
      weakGroup = sorted;
      midGroup = sorted;
      strongGroup = sorted;
    } else if (sorted.length === 2) {
      weakGroup = [sorted[0]];
      midGroup = [sorted[0]];
      strongGroup = [sorted[1]];
    } else {
      const idx1 = Math.max(1, Math.floor(sorted.length * 0.35));
      const idx2 = Math.max(idx1 + 1, Math.floor(sorted.length * 0.7));
      weakGroup = sorted.slice(0, idx1);
      midGroup = sorted.slice(idx1, idx2);
      strongGroup = sorted.slice(idx2);
      if (!strongGroup.length) strongGroup = [sorted[sorted.length - 1]];
      if (!midGroup.length) midGroup = weakGroup;
    }

    const weakCount = Math.max(1, Math.round(enemyCount * 0.50));
    const midCount = Math.max(0, Math.round(enemyCount * 0.30));
    const strongCount = Math.max(0, enemyCount - weakCount - midCount);

    const pick = (pool) => {
      const p = (pool && pool.length) ? pool : sorted;
      return p[Math.floor(Math.random() * p.length)];
    };

    const rawList = [
      ...Array.from({ length: weakCount }, () => pick(weakGroup)),
      ...Array.from({ length: midCount }, () => pick(midGroup)),
      ...Array.from({ length: strongCount }, () => pick(strongGroup))
    ].filter(Boolean);

    const shuffleGroup = (arr) => arr.sort(() => Math.random() - 0.5);
    const finalList = [
      ...shuffleGroup(rawList.slice(0, weakCount)),
      ...shuffleGroup(rawList.slice(weakCount, weakCount + midCount)),
      ...shuffleGroup(rawList.slice(weakCount + midCount))
    ].filter(Boolean);

    this.enemiesToSpawn = finalList.map((template, idx) => {
      const scaledHp = Math.round(template.hp * waveHpMultiplier);
      let trait = null;
      let shield = 0;
      let maxShield = 0;
      let isStealthed = false;

      if (this.wave >= 3 && Math.random() < 0.28) {
        const roll = Math.random();
        if (roll < 0.35) {
          trait = 'shielded';
          shield = Math.round(scaledHp * 0.45);
          maxShield = shield;
        } else if (roll < 0.65) {
          trait = 'healer';
        } else {
          trait = 'stealthed';
          isStealthed = true;
        }
      }

      return {
        ...template,
        hp: scaledHp,
        maxHp: scaledHp,
        trait,
        shield,
        maxShield,
        isStealthed,
        healCooldown: 3.0,
        speed: template.speed,
        baseSpeed: template.speed,
        slowTimer: 0,
        gridX: this.engine.mapData.path[0].c,
        gridY: this.engine.mapData.path[0].r,
        pathIdx: 0,
        isBoss: false,
        driftPhase: Math.random() * Math.PI * 2,
        laneOffset: (idx % 2 === 0 ? 0.45 : -0.45) + (Math.random() - 0.5) * 0.2
      };
    });

    if (isBossWave) {
      const bossBase = sorted[sorted.length - 1];
      const bossHp = Math.round(bossBase.hp * waveHpMultiplier * 4.5);
      const bossEnemy = {
        ...bossBase,
        name: `👑 ${bossBase.name} (จอมทัพบอส)`,
        hp: bossHp,
        maxHp: bossHp,
        speed: Math.max(0.32, bossBase.speed * 0.75),
        baseSpeed: Math.max(0.32, bossBase.speed * 0.75),
        slowTimer: 0,
        gridX: this.engine.mapData.path[0].c,
        gridY: this.engine.mapData.path[0].r,
        pathIdx: 0,
        isBoss: true,
        size: Math.round((bossBase.size || 20) * 1.55),
        reward: bossBase.reward * 5,
        laneOffset: 0,
        driftPhase: 0,
        skillCooldown: 7.0,
        hasSummonedMinions: false
      };
      this.enemiesToSpawn.push(bossEnemy);
      this.engine.ui.notify(`⚠️ คำเตือน: ระลอกที่ ${this.wave} เป็นศึก BOSS WAVE! จอมทัพบอสกำลังเคลื่อนพล!`);
      this.engine.screenShake = 12;
      sounds.playTone(90, 'sawtooth', 0.6, 0.4);
    }

    this.waveSpawnTimer = 0;
    this.engine.ui.updateStats(this.engine);
    sounds.playTone(220, 'sawtooth', 0.3, 0.15);
  }

  update(effectiveDt) {
    // จัดการระบบส่งเวฟอัตโนมัติ (Auto-Wave Trigger System)
    if (this.autoWave && !this.isWaveRunning && !this.engine.isGameOver) {
      if (this.wave % 5 === 0) {
        this.autoWave = false;
        if (this.engine.ui.updateAutoWaveButton) this.engine.ui.updateAutoWaveButton(false);
        this.engine.ui.notify('⚠️ ระบบหยุดออโต้เวฟชั่วคราว: เวฟถัดไปคือศึกจอมทัพบอส! กรุณาเตรียมป้อมปราการ');
      } else {
        this.autoWaveTimer = (this.autoWaveTimer || 0) + effectiveDt;
        if (this.autoWaveTimer >= 1.6) {
          this.autoWaveTimer = 0;
          this.startNextWave();
        }
      }
    } else {
      this.autoWaveTimer = 0;
    }

    // จัดการปล่อยมอนสเตอร์
    if (this.isWaveRunning && this.enemiesToSpawn.length > 0) {
      this.waveSpawnTimer += effectiveDt;
      const interval = (this.engine.enemies.length === 0 && this.enemiesToSpawn.length > 0) ? 0.35 : 0.8;
      if (this.waveSpawnTimer >= interval) {
        this.waveSpawnTimer = 0;
        const spawnCount = Math.min(this.enemiesToSpawn.length, Math.random() < 0.6 ? 2 : 1);
        for (let s = 0; s < spawnCount; s++) {
          const enemy = this.enemiesToSpawn.shift();
          this.engine.enemies.push(enemy);
        }
      }
    }

    // จบเวฟเมื่อศัตรูหมด
    if (this.isWaveRunning && this.enemiesToSpawn.length === 0 && this.engine.enemies.length === 0) {
      this.isWaveRunning = false;
      const completedWave = this.wave;
      this.wave++;
      
      const isBossWaveWin = (completedWave % 5 === 0);
      const bonusGold = isBossWaveWin ? (60 + completedWave * 12) : (25 + completedWave * 6);
      const bonusSci = isBossWaveWin ? (30 + completedWave * 8) : (15 + completedWave * 4);
      const bonusWood = isBossWaveWin ? (35 + completedWave * 9) : (18 + completedWave * 5);

      this.engine.gold += bonusGold;
      this.engine.science += bonusSci;
      this.engine.wood += bonusWood;

      if (isBossWaveWin) {
        this.engine.ui.notify(`👑 มหาชัยชนะ BOSS WAVE ${completedWave}! ได้รับ Wave Bounty (+${bonusGold}🪙 +${bonusWood}🪵 +${bonusSci}🔬)`);
        sounds.playTone(580, 'triangle', 0.4, 0.3);
      } else {
        this.engine.ui.notify(`🎉 เคลียร์เวฟที่ ${completedWave} สำเร็จ! ได้รับเงินรางวัลและเสบียง (+${bonusGold}🪙 +${bonusWood}🪵 +${bonusSci}🔬)`);
      }
      this.engine.ui.updateStats(this.engine);
    }
  }
}
