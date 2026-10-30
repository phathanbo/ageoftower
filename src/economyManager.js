import { ERAS } from './eras.js';
import { TILE } from './mapGen.js';
import { sounds } from './audio.js';

export class EconomyManager {
  constructor(engine) {
    this.engine = engine;
  }

  // พัฒนายกยุคสมัย (Age Evolution)
  evolveEra() {
    if (this.engine.currentEraIndex >= ERAS.length - 1) return;
    const requiredWave = (this.engine.currentEraIndex + 1) * 10;
    if (this.engine.wave <= requiredWave) {
      sounds.playError();
      this.engine.ui.notify(`ยังไม่สามารถพัฒนายุคได้! ต้องผ่านระลอกที่ ${requiredWave} ขึ้นไปก่อน (ปัจจุบัน: เวฟ ${this.engine.wave})`);
      return;
    }

    const nextEra = ERAS[this.engine.currentEraIndex + 1];
    const cost = nextEra.upgradeCost;

    const missingGold = Math.max(0, cost.gold - this.engine.gold);
    const missingSci = Math.max(0, cost.science - this.engine.science);

    if (missingGold > 0 || missingSci > 0) {
      sounds.playError();
      const reasons = [];
      if (missingGold > 0) reasons.push(`ขาดทอง ${missingGold} 🪙`);
      if (missingSci > 0) reasons.push(`ขาดวิจัย ${missingSci} 🔬`);
      this.engine.ui.notify(`⚠️ พัฒนายุคไม่สำเร็จ! ${reasons.join(' และ ')} (ระดมทุนวิจัยได้ที่ 🏪 ตลาด)`);
      if (this.engine.ui.flashShortage) {
        if (missingGold > 0) this.engine.ui.flashShortage('gold');
        if (missingSci > 0) this.engine.ui.flashShortage('sci');
      }
      return;
    }

    this.engine.gold -= cost.gold;
    this.engine.science -= cost.science;
    this.engine.currentEraIndex += 1;

    sounds.playAgeUp();
    sounds.currentEraTheme = this.engine.currentEraIndex;
    sounds.stopBGM();
    sounds.startBGM(this.engine.currentEraIndex);
    this.engine.triggerCelebration();

    this.engine.ui.updateEra(this.engine.currentEraIndex);
    this.engine.ui.populateTowerDeck(ERAS[this.engine.currentEraIndex].towers, this.engine);

    // บัฟอารยธรรมถ่ายทอดสู่ป้อมยุคเก่า (Legacy Era Synergy)
    let legacyCount = 0;
    for (const t of this.engine.towers) {
      if (t.eraIndex < this.engine.currentEraIndex) {
        legacyCount++;
        if (t.data.damage) t.data.damage = Math.round(t.data.damage * 1.25);
        if (t.data.range) t.data.range = Math.round(t.data.range * 1.10);
        this.engine.createIncomeParticle(t.c, t.r, 'ERA BOOST!✨');
      }
    }

    if (legacyCount > 0) {
      this.engine.ui.notify(`🎉 พัฒนาก้าวสู่อารยธรรมใหม่: ${this.engine.currentEra.name}! (ป้อมเดิม ${legacyCount} ป้อมได้รับบัฟวิวัฒนาการ +25% ดาเมจ)`);
    } else {
      this.engine.ui.notify(`🎉 พัฒนาก้าวสู่อารยธรรมใหม่: ${this.engine.currentEra.name}!`);
    }
    this.engine.ui.updateStats(this.engine);
    if (this.engine.ui.renderTowerSelection) this.engine.ui.renderTowerSelection(this.engine.currentEra.towers);

    if (this.engine.currentEraIndex === ERAS.length - 1) {
      this.engine.ui.notify('🌟 บรรลุสู่ยุคเทคโนโลยีอวกาศขั้นสูงสุดแล้ว! ปกป้องอาณานิคมให้สำเร็จ!');
    }
  }

  // ระบบตลาดแลกเปลี่ยนทรัพยากร (Resource Market Transactions)
  buyMarketGoods(type, amount) {
    let goldCost = 0;
    let gainText = '';

    if (type === 'wood') {
      if (amount === 35) goldCost = 60;
      else if (amount === 100) goldCost = 150;
      else if (amount === 250) goldCost = 320;
    } else if (type === 'science') {
      if (amount === 25) goldCost = 80;
      else if (amount === 70) goldCost = 200;
      else if (amount === 180) goldCost = 450;
    }

    if (goldCost <= 0) return;

    if (this.engine.gold < goldCost) {
      sounds.playError();
      this.engine.ui.notify(`เหรียญทองไม่เพียงพอ! ต้องการ ${goldCost} 🪙`);
      return;
    }

    this.engine.gold -= goldCost;
    if (type === 'wood') {
      this.engine.wood += amount;
      gainText = `+${amount} 🪵 ท่อนไม้`;
    } else if (type === 'science') {
      this.engine.science += amount;
      gainText = `+${amount} 🔬 แต้มวิจัย`;
    }

    sounds.playTone(600, 'triangle', 0.1, 0.2);
    sounds.playTone(880, 'sine', 0.15, 0.2);
    this.engine.ui.notify(`🏪 ซื้อสำเร็จ! แลกเปลี่ยน ${goldCost} 🪙 ได้รับ ${gainText}`);
    this.engine.ui.updateStats(this.engine);
    if (this.engine.ui.renderMarket) this.engine.ui.renderMarket();
  }

  buildTower(c, r, towerTemplate) {
    const tileType = this.engine.mapData.grid[r][c];

    // ตรวจสอบโควตาขีดจำกัดจำนวนป้อม (Tower Capacity Limit)
    if (this.engine.towerCount >= this.engine.maxTowers) {
      sounds.playError();
      this.engine.ui.notify(`⚠️ ถึงขีดจำกัดป้อมแล้ว! (${this.engine.towerCount}/${this.engine.maxTowers} 🏰) รื้อถอนป้อมเก่า, ข้ามยุคสมัย หรือวิจัย "การบริหารอาณานิคม" เพิ่ม`);
      if (this.engine.ui.flashShortage) {
        this.engine.ui.flashShortage('towers');
      }
      return false;
    }

    if (tileType === TILE.PATH || tileType === TILE.SPAWN || tileType === TILE.NEXUS) {
      sounds.playError();
      this.engine.ui.notify('สร้างไม่ได้! ห้ามสร้างขวางเส้นทางเดินของข้าศึก');
      return;
    }

    if (tileType === TILE.WATER) {
      sounds.playError();
      this.engine.ui.notify('สร้างไม่ได้! ไม่สามารถสร้างป้อมปราการบนผืนน้ำได้');
      return;
    }

    if (tileType === TILE.OBSTACLE) {
      sounds.playError();
      this.engine.ui.notify('สร้างไม่ได้! หน้าผาหินสูงชันเกินกว่าจะตั้งป้อม');
      return;
    }

    if (tileType === TILE.TOWER) {
      sounds.playError();
      this.engine.ui.notify('สร้างไม่ได้! มีป้อมปราการตั้งอยู่แล้วที่ช่องนี้');
      return;
    }

    const isStrategicDais = (tileType === TILE.BUILD_ZONE);

    const missingGold = Math.max(0, towerTemplate.cost.gold - this.engine.gold);
    const missingWood = Math.max(0, towerTemplate.cost.wood - this.engine.wood);

    if (missingGold > 0 || missingWood > 0) {
      sounds.playError();
      const reasons = [];
      if (missingGold > 0) reasons.push(`ขาดทอง ${missingGold} 🪙`);
      if (missingWood > 0) reasons.push(`ขาดไม้ ${missingWood} 🪵`);
      
      this.engine.ui.notify(`⚠️ ไม่สามารถสร้างได้! ${reasons.join(' และ ')} (จัดซื้อไม้ได้ที่ 🏪 ตลาด)`);
      if (this.engine.ui.flashShortage) {
        if (missingGold > 0) this.engine.ui.flashShortage('gold');
        if (missingWood > 0) this.engine.ui.flashShortage('wood');
      }
      return;
    }

    this.engine.gold -= towerTemplate.cost.gold;
    this.engine.wood -= towerTemplate.cost.wood;

    const newTower = {
      id: Date.now() + Math.random(),
      c,
      r,
      level: 1,
      eraIndex: this.engine.currentEraIndex,
      data: JSON.parse(JSON.stringify(towerTemplate)),
      lastShot: 0,
      incomeTimer: 0,
      targeting: 'first',
      totalDamage: 0,
      kills: 0,
      totalEarned: 0,
      isStrategicDais,
      originalTileType: tileType
    };

    this.engine.mapData.grid[r][c] = TILE.TOWER;
    this.engine.towers.push(newTower);
    sounds.playBuild();
    this.engine.createBuildParticles(c, r);

    if (isStrategicDais) {
      this.engine.createIncomeParticle(c, r, '🌟HIGH GROUND!🌟');
      this.engine.ui.notify(`👑 สร้างป้อมบนแท่นยุทธศาสตร์! ได้รับบัฟพิเศษ [ระยะยิง +25%] และ [พลังโจมตี +20%] ทันที!`);
    } else {
      this.engine.ui.notify(`🏰 สร้างป้อมปราการบนพื้นหญ้าสำเร็จ!`);
    }

    this.engine.ui.updateStats(this.engine);
    return true;
  }

  upgradeTower(tower) {
    const maxLevel = 5;
    if (tower.level >= maxLevel) {
      sounds.playError();
      this.engine.ui.notify(`ป้อมนี้ถึงระดับสูงสุดแล้ว! (Max Lv.${maxLevel})`);
      return;
    }

    const cost = Math.round(tower.data.cost.gold * 1.5 * tower.level);
    if (this.engine.gold < cost) {
      sounds.playError();
      this.engine.ui.notify(`เหรียญทองไม่พอสำหรับอัปเกรด (ต้องการ ${cost} 🪙)`);
      return;
    }

    this.engine.gold -= cost;
    tower.level += 1;
    tower.data.damage = Math.round(tower.data.damage * 1.4);
    tower.data.range = Math.round(tower.data.range * 1.15);
    if (tower.data.income) {
      tower.data.income.gold = Math.round(tower.data.income.gold * 1.5);
      tower.data.income.science = Math.round(tower.data.income.science * 1.5);
    }

    sounds.playTone(660, 'triangle', 0.2, 0.15);
    this.engine.createBuildParticles(tower.c, tower.r);
    this.engine.ui.updateStats(this.engine);
    this.engine.ui.showTowerDetail(tower);
  }

  findCounterpartInCurrentEra(tower) {
    if (tower.eraIndex >= this.engine.currentEraIndex) return null;
    const currentTowers = ERAS[this.engine.currentEraIndex].towers;
    const oldType = tower.data.type;
    const oldDamageType = tower.data.damageType;

    let match = currentTowers.find(t => t.type === oldType && t.damageType === oldDamageType);
    if (!match) {
      match = currentTowers.find(t => t.type === oldType);
    }
    if (!match) {
      match = currentTowers[0];
    }
    return match;
  }

  getModernizeCost(tower) {
    const counterpart = this.findCounterpartInCurrentEra(tower);
    if (!counterpart) return null;
    const baseNewGold = counterpart.cost.gold || 100;
    const baseNewWood = counterpart.cost.wood || 30;
    const oldRefundGold = Math.round((tower.data.cost.gold || 50) * 0.7);
    const oldRefundWood = Math.round((tower.data.cost.wood || 20) * 0.7);

    const goldCost = Math.max(30, Math.round((baseNewGold - oldRefundGold) * 0.85));
    const woodCost = Math.max(10, Math.round((baseNewWood - oldRefundWood) * 0.85));
    const scienceCost = Math.max(15, (this.engine.currentEraIndex - tower.eraIndex) * 20);

    return { gold: goldCost, wood: woodCost, science: scienceCost, counterpart };
  }

  modernizeTower(tower) {
    const costInfo = this.getModernizeCost(tower);
    if (!costInfo) {
      sounds.playError();
      this.engine.ui.notify('ป้อมนี้อยู่ในยุคปัจจุบันแล้ว!');
      return;
    }

    if (this.engine.gold < costInfo.gold || this.engine.wood < costInfo.wood || this.engine.science < costInfo.science) {
      sounds.playError();
      this.engine.ui.notify(`ทรัพยากรไม่เพียงพอสำหรับยกระดับ! ต้องการ ${costInfo.gold}🪙 ${costInfo.wood}🪵 ${costInfo.science}🔬`);
      return;
    }

    this.engine.gold -= costInfo.gold;
    this.engine.wood -= costInfo.wood;
    this.engine.science -= costInfo.science;

    const newCounterpart = costInfo.counterpart;
    const preservedLevel = tower.level;
    const preservedKills = tower.kills || 0;
    const preservedDmg = tower.totalDamage || 0;
    const preservedEarned = tower.totalEarned || 0;

    tower.eraIndex = this.engine.currentEraIndex;
    tower.data = JSON.parse(JSON.stringify(newCounterpart));

    for (let l = 1; l < preservedLevel; l++) {
      if (tower.data.damage) tower.data.damage = Math.round(tower.data.damage * 1.4);
      if (tower.data.range) tower.data.range = Math.round(tower.data.range * 1.15);
      if (tower.data.income) {
        if (tower.data.income.gold) tower.data.income.gold = Math.round(tower.data.income.gold * 1.5);
        if (tower.data.income.science) tower.data.income.science = Math.round(tower.data.income.science * 1.5);
      }
    }

    tower.level = preservedLevel;
    tower.kills = preservedKills;
    tower.totalDamage = preservedDmg;
    tower.totalEarned = preservedEarned;

    sounds.playTone(880, 'triangle', 0.2, 0.15);
    sounds.playTone(1100, 'sine', 0.25, 0.2);
    this.engine.createBuildParticles(tower.c, tower.r);
    this.engine.createIncomeParticle(tower.c, tower.r, '🚀MODERNIZED!');
    this.engine.ui.notify(`✨ ยกระดับป้อมปราการสู่ [${newCounterpart.name}] แห่ง ${this.engine.currentEra.name} สำเร็จ!`);
    this.engine.ui.updateStats(this.engine);
    this.engine.ui.showTowerDetail(tower);
  }

  sellTower(tower) {
    const refundGold = Math.round(tower.data.cost.gold * 0.7 * tower.level);
    const refundWood = Math.round(tower.data.cost.wood * 0.7);
    this.engine.gold += refundGold;
    this.engine.wood += refundWood;

    const restoreType = tower.originalTileType !== undefined ? tower.originalTileType : (tower.isStrategicDais ? TILE.BUILD_ZONE : TILE.EMPTY);
    this.engine.mapData.grid[tower.r][tower.c] = restoreType;
    this.engine.towers = this.engine.towers.filter(t => t !== tower);
    this.engine.selectedPlacedTower = null;
    this.engine.ui.hideTowerDetail();
    this.engine.ui.updateStats(this.engine);
    sounds.playTone(320, 'sine', 0.1, 0.1);
  }
}
