import { sounds } from './audio.js';

export class TechTreeManager {
  constructor(engine) {
    this.engine = engine;
    // เลเวลการวิจัยบัฟพลังงานและขีดความสามารถของป้อมแต่ละสาย (Science Tech Tree)
    this.techLevels = {
      attackPower: 0, // +15% ดาเมจต่อเลเวล
      attackRange: 0, // +10% ระยะยิงต่อเลเวล
      energyEfficiency: 0, // +20% ความเร็วการผลิตทอง/แต้มวิจัย
      towerCapacity: 0 // +2 โควตาป้อมต่อเลเวล
    };
    // แผนผังวิจัยแยกแต่ละประเภทป้อม (Tower-Specific Research Tech Tree)
    // towerResearches[towerId] = { rangeLevel: 0, speedLevel: 0, damageLevel: 0 }
    this.towerResearches = {};
  }

  researchTech(techKey) {
    const maxLevel = 5;
    const curLv = this.techLevels[techKey] || 0;
    if (curLv >= maxLevel) {
      sounds.playError();
      this.engine.ui.notify(`วิทยาการนี้ถึงระดับสูงสุดแล้ว! (Max Lv.${maxLevel})`);
      return;
    }

    const cost = 25 + curLv * 35; // ค่าใช้จ่ายแต้มวิจัย 25, 60, 95...

    if (this.engine.science < cost) {
      sounds.playError();
      this.engine.ui.notify(`แต้มวิจัยไม่พอ! ต้องการ ${cost} 🔬`);
      return;
    }

    this.engine.science -= cost;
    this.techLevels[techKey] = curLv + 1;
    sounds.playTone(720, 'sine', 0.15, 0.15);
    this.engine.ui.notify(`🔬 วิจัยสำเร็จ! อัปเกรดระดับ ${this.techLevels[techKey]}`);
    this.engine.ui.updateStats(this.engine);
    if (this.engine.ui.renderTechTree) this.engine.ui.renderTechTree();
  }

  // วิจัยแยกเฉพาะแต่ละป้อม (Tower Branch Research: damage, range, fireRate, mastery)
  getTowerResearch(towerId) {
    if (!this.towerResearches[towerId]) {
      this.towerResearches[towerId] = {
        damage: 0,
        range: 0,
        fireRate: 0,
        mastery: null // null | 'crit' | 'splash' | 'freeze'
      };
    }
    return this.towerResearches[towerId];
  }

  setTowerMastery(towerId, masteryKey) {
    const res = this.getTowerResearch(towerId);
    res.mastery = masteryKey;
    sounds.playTone(880, 'sine', 0.2, 0.15);
    const names = {
      crit: '⚡ สายสังหารคริติคอล (Critical Striker)',
      splash: '💥 สายระเบิดวงกว้าง (Heavy Cluster)',
      freeze: '❄️ สายเยือกแข็งพันธนาการ (Deep Freeze)'
    };
    this.engine.ui.notify(`🌟 ปลดล็อกพรสวรรค์ขั้นสูงสุด: ${names[masteryKey] || masteryKey}`);
    this.engine.ui.updateStats(this.engine);
    if (this.engine.ui.renderTechTree) this.engine.ui.renderTechTree();
  }

  researchTowerUpgrade(towerId, branch) {
    const maxLevel = 5;
    const res = this.getTowerResearch(towerId);
    const curLv = res[branch] || 0;
    if (curLv >= maxLevel) {
      sounds.playError();
      this.engine.ui.notify(`กิ่งการวิจัยนี้ถึงระดับสูงสุดแล้ว! (Max Lv.${maxLevel})`);
      return;
    }

    const cost = 15 + curLv * 20; // 15, 35, 55, 75... 🔬

    if (this.engine.science < cost) {
      sounds.playError();
      this.engine.ui.notify(`แต้มวิจัยไม่พอ! ต้องการ ${cost} 🔬`);
      return;
    }

    this.engine.science -= cost;
    res[branch] = curLv + 1;
    sounds.playTone(760, 'sine', 0.15, 0.15);
    
    const branchNames = {
      damage: 'พลังโจมตี (+15%)',
      range: 'ระยะยิง (+12%)',
      fireRate: 'ความเร็วการยิง (+12%)'
    };
    this.engine.ui.notify(`🔬 วิจัยสำเร็จ! ${branchNames[branch]} เป็น Lv.${res[branch]}`);
    this.engine.ui.updateStats(this.engine);
    if (this.engine.ui.renderTechTree) this.engine.ui.renderTechTree();
  }
}
