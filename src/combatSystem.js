export class CombatSystem {
  constructor(engine) {
    this.engine = engine;
  }

  // คำนวณอัตราความเสียหายตามระบบแพ้ทางเกราะ (Damage Effectiveness / Armor Matrix)
  calculateTypeModifier(damageType, armorType) {
    if (!damageType || !armorType) return 1.0;
    // blunt: ทุบ/ระเบิด กระแทกเกราะเบาและฝูงมอนกระจาย แต่สะท้อนเกราะเหล็กหนา
    if (damageType === 'blunt') {
      if (armorType === 'light' || armorType === 'beast') return 1.60;
      if (armorType === 'heavy') return 0.55;
      return 1.0;
    }
    // pierce: ทะลวงเกราะหนา/มอนตัวใหญ่ แต่ยิงมอนเบา/ฝูงกระจายไม่คุ้ม
    if (damageType === 'pierce') {
      if (armorType === 'heavy') return 1.75;
      if (armorType === 'light') return 0.60;
      return 1.0;
    }
    // magic / energy: สลายสัตว์ป่า/บาเรีย ละลายทุกสิ่งที่ไม่มีเกราะเวท
    if (damageType === 'magic') {
      if (armorType === 'beast') return 1.65;
      if (armorType === 'light') return 1.30;
      if (armorType === 'heavy') return 0.85;
      return 1.1;
    }
    return 1.0;
  }

  applyDamage(proj) {
    const dmgType = proj.damageType || 'blunt';
    const sourceTower = proj.sourceTower;

    if (proj.splash > 0) {
      this.engine.screenShake = Math.max(this.engine.screenShake, Math.min(8, proj.splash * 0.12));
      this.engine.createImpactRing(proj.target.gridX, proj.target.gridY, proj.color || '#f97316', proj.splash * 0.4);
      const splashTiles = proj.splash / 45;
      for (const e of this.engine.enemies) {
        const d = Math.hypot(e.gridX - proj.target.gridX, e.gridY - proj.target.gridY);
        if (d <= splashTiles) {
          const mod = this.calculateTypeModifier(dmgType, e.armorType);
          let finalHit = Math.round(proj.damage * mod);

          // ถ้าเป้าหมายมีบาเรีย (Shield): หักล้างจากบาเรียก่อน
          if (e.shield && e.shield > 0) {
            if (dmgType !== 'magic') {
              finalHit = Math.round(finalHit * 0.5);
              this.engine.createIncomeParticle(e.gridX, e.gridY, '🛡️SHIELD BLOCKED!');
            } else {
              this.engine.createIncomeParticle(e.gridX, e.gridY, '⚡SHIELD SHATTER!');
            }
            if (e.shield >= finalHit) {
              e.shield -= finalHit;
              finalHit = 0;
            } else {
              finalHit -= e.shield;
              e.shield = 0;
            }
          }

          e.hp -= finalHit;
          e.lastHitBy = sourceTower;
          e.hitFlashTimer = 0.1;

          if (finalHit > 0) {
            this.engine.gainSpellEnergy(finalHit);
          }

          if (sourceTower) {
            sourceTower.totalDamage = (sourceTower.totalDamage || 0) + finalHit;
          }

          if (mod >= 1.35) {
            this.engine.createIncomeParticle(e.gridX, e.gridY, '💥WEAK!');
          }
          if (proj.slow > 0) {
            // ป้องกัน Slow Stacking เกินขีดจำกัด (Slow Cap 75% เพื่อป้องกันเกมล็อคนิ่งถาวร)
            e.slowTimer = Math.max(e.slowTimer || 0, proj.slowDuration || 2.0);
            const effectiveSlow = Math.min(0.75, proj.slow);
            e.speed = Math.max(e.baseSpeed * 0.25, e.baseSpeed * (1 - effectiveSlow));
          }
        }
      }
    } else {
      const mod = this.calculateTypeModifier(dmgType, proj.target.armorType);
      let finalHit = Math.round(proj.damage * mod);

      if (proj.target.shield && proj.target.shield > 0) {
        if (dmgType !== 'magic') {
          finalHit = Math.round(finalHit * 0.5);
          this.engine.createIncomeParticle(proj.target.gridX, proj.target.gridY, '🛡️SHIELD BLOCKED!');
        } else {
          this.engine.createIncomeParticle(proj.target.gridX, proj.target.gridY, '⚡SHIELD SHATTER!');
        }
        if (proj.target.shield >= finalHit) {
          proj.target.shield -= finalHit;
          finalHit = 0;
        } else {
          finalHit -= proj.target.shield;
          proj.target.shield = 0;
        }
      }

      proj.target.hp -= finalHit;
      proj.target.lastHitBy = sourceTower;
      proj.target.hitFlashTimer = 0.09;

      if (finalHit > 0) {
        this.engine.gainSpellEnergy(finalHit);
      }

      this.engine.createImpactRing(proj.target.gridX, proj.target.gridY, proj.color || '#fde047', 14);

      if (sourceTower) {
        sourceTower.totalDamage = (sourceTower.totalDamage || 0) + finalHit;
      }

      if (mod >= 1.35) {
        this.engine.createIncomeParticle(proj.target.gridX, proj.target.gridY, '🎯CRIT!');
      } else if (mod <= 0.8) {
        this.engine.createIncomeParticle(proj.target.gridX, proj.target.gridY, '🛡️RESIST');
      }
      if (proj.slow > 0) {
        proj.target.slowTimer = Math.max(proj.target.slowTimer || 0, proj.slowDuration || 2.0);
        const effectiveSlow = Math.min(0.75, proj.slow);
        proj.target.speed = Math.max(proj.target.baseSpeed * 0.25, proj.target.baseSpeed * (1 - effectiveSlow));
      }
    }

    if (sourceTower && this.engine.selectedPlacedTower === sourceTower) {
      this.engine.ui.showTowerDetail(sourceTower);
    }
  }
}
