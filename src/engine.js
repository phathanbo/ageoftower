import { ERAS, ENEMY_TYPES } from './eras.js';
import { MapGenerator, TILE } from './mapGen.js';
import { IsometricRenderer } from './renderer.js';
import { sounds } from './audio.js';
import { WaveManager } from './waveManager.js';
import { CombatSystem } from './combatSystem.js';
import { EconomyManager } from './economyManager.js';
import { TechTreeManager } from './techTree.js';
import { SpellManager } from './spellManager.js';
import { ParticleSystem } from './particleSystem.js';

// Minimalist pure-canvas celebration confetti (Zero external dependencies)
function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#f43f5e'];

  for (let i = 0; i < 90; i++) {
    pieces.push({
      x: canvas.width * 0.5,
      y: canvas.height * 0.6,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 14 - 6,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.2,
      life: 1.0
    });
  }

  let animId;
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of pieces) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.rot += p.vRot;
      p.life -= 0.015;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (alive) {
      animId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animId);
      canvas.remove();
    }
  };
  render();
}

export class GameEngine {
  constructor(canvas, uiHooks) {
    this.canvas = canvas;
    this.renderer = new IsometricRenderer(canvas);
    this.ui = uiHooks;

    // ระบบสถานะทรัพยากร
    this.gold = 180;
    this.wood = 90;
    this.science = 20;
    this.nexusHp = 1000;
    this.nexusMaxHp = 1000;

    // ยุคปัจจุบันเริ่มต้นที่ยุคหิน (Era 0)
    this.currentEraIndex = 0;

    // แผนที่สมรภูมิขนาดยักษ์ (18 คอลัมน์ x 14 แถว)
    this.mapGen = new MapGenerator(18, 14);
    this.mapData = null;

    // เอนทิตีต่างๆ
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.screenShake = 0;

    // เริ่มต้นระบบย่อย (Subsystems)
    this.particleSystem = new ParticleSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.techTree = new TechTreeManager(this);
    this.economy = new EconomyManager(this);
    this.waveManager = new WaveManager(this);
    this.spellManager = new SpellManager(this);

    // การควบคุมเมาส์
    this.hoverTile = null;
    this.selectedTowerType = null;
    this.selectedPlacedTower = null;

    // ลูปและเวลา
    this.lastTime = 0;
    this.gameSpeed = 1;
    this.isGameOver = false;
    this.isVictory = false;

    this.initMap();
    this.bindEvents();
  }

  // Getters & Setters for Subsystem Delegation
  get particles() {
    return this.particleSystem.particles;
  }
  set particles(val) {
    this.particleSystem.particles = val;
  }

  get techLevels() {
    return this.techTree.techLevels;
  }
  get towerResearches() {
    return this.techTree.towerResearches;
  }

  get wave() {
    return this.waveManager.wave;
  }
  set wave(val) {
    this.waveManager.wave = val;
  }

  get isWaveRunning() {
    return this.waveManager.isWaveRunning;
  }
  set isWaveRunning(val) {
    this.waveManager.isWaveRunning = val;
  }

  get autoWave() {
    return this.waveManager.autoWave;
  }
  set autoWave(val) {
    this.waveManager.autoWave = val;
  }

  get autoWaveTimer() {
    return this.waveManager.autoWaveTimer;
  }
  set autoWaveTimer(val) {
    this.waveManager.autoWaveTimer = val;
  }

  get waveSpawnTimer() {
    return this.waveManager.waveSpawnTimer;
  }
  set waveSpawnTimer(val) {
    this.waveManager.waveSpawnTimer = val;
  }

  get enemiesToSpawn() {
    return this.waveManager.enemiesToSpawn;
  }
  set enemiesToSpawn(val) {
    this.waveManager.enemiesToSpawn = val;
  }

  get spells() {
    return this.spellManager.spells;
  }
  get selectedSpellId() {
    return this.spellManager.selectedSpellId;
  }
  set selectedSpellId(val) {
    this.spellManager.selectedSpellId = val;
  }

  get isCastingSpell() {
    return this.spellManager.isCastingSpell;
  }
  set isCastingSpell(val) {
    this.spellManager.isCastingSpell = val;
  }

  get spellAnimation() {
    return this.spellManager.spellAnimation;
  }
  set spellAnimation(val) {
    this.spellManager.spellAnimation = val;
  }

  get currentEra() {
    return ERAS[this.currentEraIndex];
  }

  // คำนวณขีดจำกัดป้อมที่สร้างได้ (Tower Capacity Cap)
  // เริ่มต้นที่ 8 ป้อมในยุคหิน + เพิ่มยุคละ 2 ป้อม + เพิ่มจากวิจัยวิทยาการเลเวลละ 2 ป้อม
  get maxTowers() {
    const eraBonus = (this.currentEraIndex || 0) * 2;
    const techBonus = ((this.techLevels && this.techLevels.towerCapacity) || 0) * 2;
    return 8 + eraBonus + techBonus;
  }

  get towerCount() {
    return this.towers ? this.towers.length : 0;
  }

  // Delegated Particle methods
  createMuzzleFlash(c, r, color) {
    this.particleSystem.createMuzzleFlash(c, r, color);
  }
  createImpactRing(c, r, color, maxRadius) {
    this.particleSystem.createImpactRing(c, r, color, maxRadius);
  }
  createDeathGibs(c, r, color) {
    this.particleSystem.createDeathGibs(c, r, color);
  }
  createBuildParticles(c, r) {
    this.particleSystem.createBuildParticles(c, r);
  }
  createIncomeParticle(c, r, text) {
    this.particleSystem.createIncomeParticle(c, r, text);
  }
  triggerCelebration() {
    triggerConfetti();
  }

  // Delegated TechTree methods
  researchTech(techKey) {
    return this.techTree.researchTech(techKey);
  }
  getTowerResearch(towerId) {
    return this.techTree.getTowerResearch(towerId);
  }
  setTowerMastery(towerId, masteryKey) {
    return this.techTree.setTowerMastery(towerId, masteryKey);
  }
  researchTowerUpgrade(towerId, branch) {
    return this.techTree.researchTowerUpgrade(towerId, branch);
  }

  // Delegated Economy methods
  evolveEra() {
    return this.economy.evolveEra();
  }
  buyMarketGoods(type, amount) {
    return this.economy.buyMarketGoods(type, amount);
  }
  buildTower(c, r, towerTemplate) {
    return this.economy.buildTower(c, r, towerTemplate);
  }
  upgradeTower(tower) {
    return this.economy.upgradeTower(tower);
  }
  findCounterpartInCurrentEra(tower) {
    return this.economy.findCounterpartInCurrentEra(tower);
  }
  getModernizeCost(tower) {
    return this.economy.getModernizeCost(tower);
  }
  modernizeTower(tower) {
    return this.economy.modernizeTower(tower);
  }
  sellTower(tower) {
    return this.economy.sellTower(tower);
  }

  // Delegated WaveManager methods
  startNextWave() {
    return this.waveManager.startNextWave();
  }

  // Delegated Spell methods
  gainSpellEnergy(damageAmount) {
    return this.spellManager.gainSpellEnergy(damageAmount);
  }
  getSpellStats(spellId) {
    return this.spellManager.getSpellStats(spellId);
  }
  upgradeSpellResearch(spellId) {
    return this.spellManager.upgradeSpellResearch(spellId);
  }
  setSpellMastery(spellId, masteryKey) {
    return this.spellManager.setSpellMastery(spellId, masteryKey);
  }
  selectSpell(spellId) {
    return this.spellManager.selectSpell(spellId);
  }
  castActiveSpell(targetC, targetR) {
    return this.spellManager.castActiveSpell(targetC, targetR);
  }

  // Delegated Combat methods
  calculateTypeModifier(damageType, armorType) {
    return this.combatSystem.calculateTypeModifier(damageType, armorType);
  }
  applyDamage(proj) {
    return this.combatSystem.applyDamage(proj);
  }

  initMap(customSeed) {
    const seed = customSeed || Math.floor(Math.random() * 1000000);
    this.mapData = this.mapGen.generate(seed);
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particleSystem.particles = [];
    this.isWaveRunning = false;
    this.selectedPlacedTower = null;
    this.ui.updateSeed(seed);
    this.ui.updateStats(this);
    this.ui.renderTowerSelection(this.currentEra.towers);
  }

  bindEvents() {
    const handlePointerMove = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const tile = this.renderer.screenToGrid(sx, sy);

      if (
        tile.c >= 0 && tile.c < this.mapData.cols &&
        tile.r >= 0 && tile.r < this.mapData.rows
      ) {
        this.hoverTile = tile;
      } else {
        this.hoverTile = null;
      }
    };

    const handlePointerAction = (clientX, clientY) => {
      sounds.init();
      if (this.isGameOver) return;
      handlePointerMove(clientX, clientY);
      if (!this.hoverTile) return;

      const { c, r } = this.hoverTile;

      if (this.isCastingSpell) {
        this.castActiveSpell(c, r);
        this.isCastingSpell = false;
        return;
      }

      const existingTower = this.towers.find(t => t.c === c && t.r === r);

      if (existingTower) {
        this.selectedPlacedTower = existingTower;
        this.ui.showTowerDetail(existingTower);
        sounds.playTone(400, 'sine', 0.08, 0.08);
        return;
      }

      this.selectedPlacedTower = null;
      this.ui.hideTowerDetail();

      if (this.selectedTowerType) {
        const built = this.buildTower(c, r, this.selectedTowerType);
        // หากสร้างสำเร็จ ให้ยกเลิกการเลือกป้อมทันที ป้องกันการเผลอคลิกซ้ำลั่นสร้างป้อมอื่น
        if (built && this.ui.deselectTower) {
          this.ui.deselectTower();
        }
      }
    };

    this.canvas.addEventListener('mousemove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverTile = null;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // คลิกขวาเพื่อยกเลิกการเลือกป้อมและปิดการดูรายละเอียดป้อมทันที (Deselect / Cancel Build Mode)
      if (this.selectedTowerType || this.selectedPlacedTower) {
        this.selectedTowerType = null;
        this.selectedPlacedTower = null;
        if (this.ui.deselectTower) this.ui.deselectTower();
        this.ui.hideTowerDetail();
        sounds.playTone(300, 'sine', 0.05, 0.05);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      handlePointerAction(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        handlePointerAction(touch.clientX, touch.clientY);
      }
    }, { passive: true });
  }

  update(dt) {
    const effectiveDt = dt * this.gameSpeed;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - effectiveDt * 30);
    }

    // อัปเดตระลอกศัตรู (Wave Subsystem)
    this.waveManager.update(effectiveDt);

    // อัปเดตระบบมหาเวท (Spell Subsystem)
    this.spellManager.update(effectiveDt);

    // อัปเดตการเคลื่อนที่และ Trait ของศัตรู
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= effectiveDt;
      }

      if (e.slowTimer > 0) {
        e.slowTimer -= effectiveDt;
        if (e.slowTimer <= 0) {
          e.speed = e.baseSpeed;
        }
      }

      if (e.burnTimer > 0) {
        e.burnTimer -= effectiveDt;
        const burnDmgThisFrame = (e.burnDps || 40) * effectiveDt;
        e.hp -= burnDmgThisFrame;
        e.hitFlashTimer = 0.1;
      }

      if (e.trait === 'healer') {
        e.healCooldown = (e.healCooldown || 3.0) - effectiveDt;
        if (e.healCooldown <= 0) {
          e.healCooldown = 3.5;
          let healedAny = false;
          for (const ally of this.enemies) {
            if (ally !== e && ally.hp < ally.maxHp) {
              const distToAlly = Math.hypot(ally.gridX - e.gridX, ally.gridY - e.gridY);
              if (distToAlly <= 2.2) {
                const healAmount = Math.round(ally.maxHp * 0.15);
                ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
                this.createIncomeParticle(ally.gridX, ally.gridY, `+${healAmount}💚`);
                healedAny = true;
              }
            }
          }
          if (healedAny) {
            sounds.playTone(520, 'sine', 0.1, 0.1);
          }
        }
      }

      if (e.isStealthed && e.pathIdx >= Math.floor(this.mapData.path.length * 0.45)) {
        e.isStealthed = false;
        this.createIncomeParticle(e.gridX, e.gridY, '👁️REVEALED!');
        sounds.playTone(380, 'triangle', 0.1, 0.15);
      }

      if (e.isBoss) {
        e.skillCooldown = (e.skillCooldown || 7.0) - effectiveDt;
        if (e.skillCooldown <= 0) {
          e.skillCooldown = 8.5;
          this.screenShake = 10;
          sounds.playTone(85, 'sawtooth', 0.5, 0.35);
          this.createIncomeParticle(e.gridX, e.gridY, '⚡ROAR STUN!⚡');
          this.ui.notify(`⚡ บอสคำรามกึกก้อง! ป้อมปราการโดยรอบหยุดชะงัก 2.5 วินาที!`);

          for (const t of this.towers) {
            const d = Math.hypot(t.c - e.gridX, t.r - e.gridY);
            if (d <= 3.2) {
              t.stunTimer = 2.5;
              this.createIncomeParticle(t.c, t.r, '💤STUN');
            }
          }
        }

        if (!e.hasSummonedMinions && (e.hp / e.maxHp) <= 0.5) {
          e.hasSummonedMinions = true;
          this.screenShake = 12;
          sounds.playTone(130, 'square', 0.6, 0.4);
          this.createIncomeParticle(e.gridX, e.gridY, '⚔️SUMMON MINIONS!⚔️');
          this.ui.notify(`🛡️ บอสอยู่ในภาวะวิกฤต! เรียกลูกสมุนคุ้มกันทัพบุกจู่โจมฉับพลัน!`);

          const minionPool = ENEMY_TYPES.filter(m => m.era <= this.currentEraIndex && m.id !== e.id);
          const minionTemplate = minionPool.length ? minionPool[0] : e;
          for (let m = 0; m < 2; m++) {
            this.enemies.push({
              ...minionTemplate,
              name: `บริวารของ ${e.title}`,
              hp: Math.round(minionTemplate.hp * (1 + (this.wave - 1) * 0.20)),
              maxHp: Math.round(minionTemplate.hp * (1 + (this.wave - 1) * 0.20)),
              speed: minionTemplate.speed * 1.15,
              baseSpeed: minionTemplate.speed * 1.15,
              slowTimer: 0,
              gridX: e.gridX + (m === 0 ? 0.3 : -0.3),
              gridY: e.gridY + (m === 0 ? -0.2 : 0.2),
              pathIdx: Math.max(0, e.pathIdx),
              isBoss: false,
              laneOffset: m === 0 ? 0.5 : -0.5
            });
          }
        }
      }

      const targetNode = this.mapData.path[e.pathIdx + 1];
      if (!targetNode) {
        this.nexusHp -= Math.round(e.hp * 0.35);
        this.enemies.splice(i, 1);
        sounds.playTone(110, 'sawtooth', 0.3, 0.2);

        if (this.nexusHp <= 0) {
          this.nexusHp = 0;
          this.gameOver();
        }
        this.ui.updateStats(this);
        continue;
      }

      const dx = targetNode.c - e.gridX;
      const dy = targetNode.r - e.gridY;
      const dist = Math.hypot(dx, dy);
      const step = e.speed * effectiveDt;

      if (dist <= step) {
        e.gridX = targetNode.c;
        e.gridY = targetNode.r;
        e.pathIdx++;
      } else {
        e.gridX += (dx / dist) * step;
        e.gridY += (dy / dist) * step;
      }
    }

    // การทำงานของป้อม: โจมตี & ผลิตทรัพยากร
    const dmgMultiplier = 1 + (this.techLevels.attackPower * 0.15);
    const rangeMultiplier = 1 + (this.techLevels.attackRange * 0.10);
    const intervalReduction = Math.max(0.4, 1 - (this.techLevels.energyEfficiency * 0.12));

    for (const tower of this.towers) {
      if (tower.stunTimer > 0) {
        tower.stunTimer -= effectiveDt;
        continue;
      }

      if (tower.data.type === 'economy' || tower.data.type === 'research') {
        if (this.isWaveRunning) {
          tower.incomeTimer = (tower.incomeTimer || 0) + effectiveDt;
          const highGroundBonus = tower.isStrategicDais ? 1.35 : 1.0;
          const targetInterval = (tower.data.interval * intervalReduction) / highGroundBonus;
          if (tower.incomeTimer >= targetInterval) {
            tower.incomeTimer = 0;
            const incGold = Math.round((tower.data.income?.gold || 0) * highGroundBonus);
            const incScience = Math.round((tower.data.income?.science || 0) * highGroundBonus);
            const incWood = Math.round(((tower.data.income?.wood || (incGold > 0 ? Math.floor(incGold * 0.35) : 0))) * highGroundBonus);

            if (incGold > 0) this.gold += incGold;
            if (incScience > 0) this.science += incScience;
            if (incWood > 0) this.wood += incWood;

            tower.totalEarned = (tower.totalEarned || 0) + (incGold || incScience || incWood);

            const popText = incGold > 0 ? `+${incGold}🪙` : `+${incScience}🔬`;
            this.createIncomeParticle(tower.c, tower.r, popText);
            this.ui.updateStats(this);
            if (this.selectedPlacedTower === tower) {
              this.ui.showTowerDetail(tower);
            }
          }
        }
        continue;
      }

      const tRes = this.getTowerResearch(tower.data.id);
      const highGroundDmgBonus = tower.isStrategicDais ? 1.20 : 1.0;
      const highGroundRangeBonus = tower.isStrategicDais ? 1.25 : 1.0;

      const towerDmgBonus = (1 + (tRes.damage * 0.15)) * highGroundDmgBonus;
      const towerRangeBonus = (1 + (tRes.range * 0.12)) * highGroundRangeBonus;
      const towerRateReduction = Math.max(0.25, 1 - (tRes.fireRate * 0.10));
      const effectiveFireRate = tower.data.fireRate * towerRateReduction;

      const effectiveRange = tower.data.range * rangeMultiplier * towerRangeBonus;
      const rangeInTiles = effectiveRange / (this.renderer.tileWidth * 0.6);
      const targeting = tower.targeting || 'first';
      const inRangeEnemies = [];
      for (const e of this.enemies) {
        if (e.isStealthed) continue;
        const dist = Math.hypot(e.gridX - tower.c, e.gridY - tower.r);
        if (dist <= rangeInTiles) {
          inRangeEnemies.push(e);
        }
      }

      let currentAimTarget = null;
      if (inRangeEnemies.length > 0) {
        if (targeting === 'first') {
          inRangeEnemies.sort((a, b) => b.pathIdx - a.pathIdx);
        } else if (targeting === 'last') {
          inRangeEnemies.sort((a, b) => a.pathIdx - b.pathIdx);
        } else if (targeting === 'strongest') {
          inRangeEnemies.sort((a, b) => b.hp - a.hp);
        } else if (targeting === 'weakest') {
          inRangeEnemies.sort((a, b) => a.hp - b.hp);
        } else if (targeting === 'fastest') {
          inRangeEnemies.sort((a, b) => b.speed - a.speed);
        }
        currentAimTarget = inRangeEnemies[0];
      }

      if (currentAimTarget) {
        const aimScreen = this.renderer.gridToScreen(currentAimTarget.gridX, currentAimTarget.gridY);
        const towerScreen = this.renderer.gridToScreen(tower.c, tower.r, 14);
        const targetAngle = Math.atan2(aimScreen.y - towerScreen.y, aimScreen.x - towerScreen.x);

        if (tower.rotation === undefined) {
          tower.rotation = targetAngle;
        } else {
          let diff = targetAngle - tower.rotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          tower.rotation += diff * Math.min(1.0, effectiveDt * 14);
        }
      }

      tower.lastShot += effectiveDt;
      if (tower.lastShot >= effectiveFireRate) {
        let target = null;
        if (inRangeEnemies.length > 0) {
          const incomingDmgMap = new Map();
          for (const proj of this.projectiles) {
            if (proj.target) {
              const current = incomingDmgMap.get(proj.target) || 0;
              incomingDmgMap.set(proj.target, current + proj.damage);
            }
          }

          target = inRangeEnemies.find(e => {
            const incoming = incomingDmgMap.get(e) || 0;
            const effectiveHealth = (e.hp || 0) + (e.shield || 0);
            return effectiveHealth > incoming;
          }) || inRangeEnemies[0];
        }

        if (target) {
          tower.lastShot = 0;
          sounds.playShoot(tower.eraIndex);

          this.createMuzzleFlash(tower.c, tower.r, tower.data.projColor || '#f59e0b');

          let finalDmg = Math.round(tower.data.damage * dmgMultiplier * towerDmgBonus);
          let finalSplash = tower.data.splash || 0;
          let finalSlow = tower.data.slow || 0;
          let finalSlowDuration = tower.data.slowDuration || 0;

          if (tRes.mastery === 'crit') {
            if (Math.random() < 0.25) {
              finalDmg = Math.round(finalDmg * 2.5);
              this.createIncomeParticle(tower.c, tower.r, 'CRIT!💥');
            }
          } else if (tRes.mastery === 'splash') {
            finalSplash = (finalSplash > 0 ? finalSplash * 1.6 : 38);
          } else if (tRes.mastery === 'freeze') {
            finalSlow = Math.max(0.5, finalSlow + 0.25);
            finalSlowDuration = Math.max(3.0, finalSlowDuration + 1.5);
          }

          this.projectiles.push({
            x: tower.c,
            y: tower.r,
            sourceTower: tower,
            target,
            speed: 7,
            damage: finalDmg,
            damageType: tower.data.damageType || 'blunt',
            splash: finalSplash,
            slow: finalSlow,
            slowDuration: finalSlowDuration,
            color: tRes.mastery === 'crit' ? '#ef4444' : (tRes.mastery === 'splash' ? '#f97316' : (tower.data.projColor))
          });
        }
      }
    }

    // กระสุนพุ่งชนเป้าหมาย
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!this.enemies.includes(p.target)) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = p.target.gridX - p.x;
      const dy = p.target.gridY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.25) {
        this.applyDamage(p);
        this.projectiles.splice(i, 1);
      } else {
        const step = p.speed * effectiveDt;
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }

    // ตรวจสอบศัตรูตาย
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) {
        if (e.lastHitBy) {
          e.lastHitBy.kills = (e.lastHitBy.kills || 0) + 1;
          if (this.selectedPlacedTower === e.lastHitBy) {
            this.ui.showTowerDetail(e.lastHitBy);
          }
        }
        this.gold += e.reward;
        sounds.playHit();
        this.createIncomeParticle(e.gridX, e.gridY, `+${e.reward}🪙`);
        this.createDeathGibs(e.gridX, e.gridY, e.color || '#ea580c');
        this.enemies.splice(i, 1);
        this.ui.updateStats(this);
      }
    }

    // อัปเดตอนุภาค Particle FX
    this.particleSystem.update(effectiveDt);
  }

  gameOver() {
    this.isGameOver = true;
    sounds.playTone(80, 'sawtooth', 0.8, 0.3);
    this.ui.showGameOver();
  }

  render() {
    const ctx = this.renderer.ctx;
    const theme = this.currentEra.theme;

    this.renderer.drawBackground(this.canvas.width, this.canvas.height, theme);

    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. วาดกระดาน Isometric Grid
    for (let r = 0; r < this.mapData.rows; r++) {
      for (let c = 0; c < this.mapData.cols; c++) {
        const tileType = this.mapData.grid[r][c];

        this.renderer.drawIsoTile(c, r, tileType, theme, this.mapData.grid);

        if (tileType === TILE.BUILD_ZONE) {
          const pt = this.renderer.gridToScreen(c, r);
          const beaconPulse = Math.sin((this.renderer.animTick || 0) * 0.08) * 0.5 + 0.5;
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 2, 14 + beaconPulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 204, 21, ${0.35 + beaconPulse * 0.35})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = `rgba(250, 204, 21, ${0.08 + beaconPulse * 0.12})`;
          ctx.fill();

          ctx.fillStyle = `rgba(253, 224, 71, ${0.75 + beaconPulse * 0.25})`;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⭐HIGH GROUND', pt.x, pt.y - 20 - beaconPulse * 3);
          ctx.restore();
        }

        if (this.hoverTile && this.hoverTile.c === c && this.hoverTile.r === r) {
          const { x, y } = this.renderer.gridToScreen(c, r);
          const isBuildMode = !!this.selectedTowerType;
          let haloColor = 'rgba(250, 204, 21, 0.4)';

          if (isBuildMode) {
            if (tileType === TILE.BUILD_ZONE) {
              haloColor = 'rgba(250, 204, 21, 0.7)';
            } else if (tileType === TILE.EMPTY) {
              haloColor = 'rgba(34, 197, 94, 0.6)';
            } else {
              haloColor = 'rgba(239, 68, 68, 0.6)';
            }
          }

          ctx.beginPath();
          ctx.arc(x, y, this.renderer.tileSize * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = haloColor;
          ctx.fill();

          if (isBuildMode && (tileType === TILE.BUILD_ZONE || tileType === TILE.EMPTY)) {
            const isDarkOrSpaceEra = (this.currentEraIndex >= 3);
            const overlayStroke = isDarkOrSpaceEra ? 'rgba(251, 191, 36, 0.35)' : 'rgba(56, 189, 248, 0.25)';
            const overlayFill = isDarkOrSpaceEra ? 'rgba(251, 191, 36, 0.03)' : 'rgba(56, 189, 248, 0.025)';

            for (const placed of this.towers) {
              if (placed.data.range) {
                const pt = this.renderer.gridToScreen(placed.c, placed.r);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, placed.data.range, 0, Math.PI * 2);
                ctx.strokeStyle = overlayStroke;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = overlayFill;
                ctx.fill();
              }
            }

            const previewRange = this.selectedTowerType.range * (tileType === TILE.BUILD_ZONE ? 1.25 : 1.0);
            const previewStroke = tileType === TILE.BUILD_ZONE
              ? 'rgba(250, 204, 21, 0.85)'
              : (isDarkOrSpaceEra ? 'rgba(253, 224, 71, 0.75)' : 'rgba(56, 189, 248, 0.75)');

            ctx.beginPath();
            ctx.arc(x, y, previewRange, 0, Math.PI * 2);
            ctx.strokeStyle = previewStroke;
            ctx.lineWidth = 2.0;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = tileType === TILE.BUILD_ZONE ? 'rgba(250, 204, 21, 0.14)' : (isDarkOrSpaceEra ? 'rgba(253, 224, 71, 0.09)' : 'rgba(56, 189, 248, 0.08)');
            ctx.fill();
          }
        }

        if (tileType === TILE.SPAWN) {
          this.renderer.drawSpawnPortal(c, r);
        }
      }
    }

    // 2. วาดสิ่งก่อสร้าง / ป้อม
    for (const tower of this.towers) {
      const isSel = this.selectedPlacedTower === tower;
      this.renderer.drawTowerModel(tower.c, tower.r, tower, isSel);
    }

    // 3. วาดศูนย์กลางเมือง (Nexus)
    this.renderer.drawNexus(
      this.mapData.nexus.c,
      this.mapData.nexus.r,
      this.nexusHp,
      this.nexusMaxHp,
      this.currentEraIndex
    );

    // 4. วาดศัตรู
    for (const e of this.enemies) {
      this.renderer.drawEnemy(e);
    }

    // 5. วาดกระสุน
    for (const p of this.projectiles) {
      this.renderer.drawProjectile(p);
    }

    // 6. วาดอนุภาค Particle FX
    for (const part of this.particles) {
      if (part.type === 'gib') {
        const { x, y } = this.renderer.gridToScreen(part.c, part.r, 12);
        const alpha = Math.max(0, part.life / part.maxLife);
        ctx.fillStyle = part.color || '#ea580c';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x + part.offsetX, y + part.offsetY, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else if (part.type === 'muzzle') {
        const { x, y } = this.renderer.gridToScreen(part.c, part.r, 26);
        const alpha = Math.max(0, part.life / part.maxLife);
        ctx.save();
        ctx.shadowColor = part.color || '#fde047';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = part.color || '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, part.currentRadius || 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, (part.currentRadius || 12) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (part.type === 'impact') {
        const { x, y } = this.renderer.gridToScreen(part.c, part.r, 10);
        const alpha = Math.max(0, part.life / part.maxLife);
        ctx.save();
        ctx.shadowColor = part.color || '#f97316';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = part.color || '#f97316';
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, part.currentRadius || 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        const { x, y } = this.renderer.gridToScreen(part.c, part.r, 20);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(part.text, x, y + part.y);
      }
    }

    // 7. วาดวงระยะยิงป้อมที่เลือก
    if (this.selectedPlacedTower) {
      const { x, y } = this.renderer.gridToScreen(this.selectedPlacedTower.c, this.selectedPlacedTower.r);
      ctx.beginPath();
      ctx.arc(x, y, this.selectedPlacedTower.data.range, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.fill();
    }

    // 8. วาดแอนิเมชันปล่อยพลังเวทตกจากฟ้า
    if (this.spellAnimation) {
      this.renderer.drawMeteorSpell(this.spellAnimation);
    }

    ctx.restore();
  }

  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.renderer.animTick++;
      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
