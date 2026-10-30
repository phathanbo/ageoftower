import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TechTreeManager } from '../src/techTree.js';
import { EconomyManager } from '../src/economyManager.js';

describe('TechTreeManager - Research & Masteries', () => {
  const createMockEngine = () => ({
    science: 100,
    ui: {
      notify() {},
      updateStats() {},
      renderTechTree() {}
    }
  });

  test('researchTech increases level and deducts science', () => {
    const engine = createMockEngine();
    const tech = new TechTreeManager(engine);

    tech.researchTech('attackPower');
    assert.equal(tech.techLevels.attackPower, 1);
    assert.equal(engine.science, 75); // 100 - 25 cost
  });

  test('setTowerMastery sets mastery branch', () => {
    const engine = createMockEngine();
    const tech = new TechTreeManager(engine);

    tech.setTowerMastery('t_archer', 'crit');
    const res = tech.getTowerResearch('t_archer');
    assert.equal(res.mastery, 'crit');
  });
});

describe('EconomyManager - Tower Operations & Modernize', () => {
  const createMockEngine = () => ({
    gold: 500,
    wood: 200,
    science: 100,
    currentEraIndex: 1, // Medieval
    currentEra: { name: 'Medieval' },
    towers: [],
    get towerCount() { return this.towers.length; },
    maxTowers: 10,
    mapData: {
      grid: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ]
    },
    ui: {
      notify() {},
      updateStats() {},
      showTowerDetail() {},
      hideTowerDetail() {}
    },
    createBuildParticles() {},
    createIncomeParticle() {}
  });

  test('buildTower places tower on valid tile and deducts resources', () => {
    const engine = createMockEngine();
    const eco = new EconomyManager(engine);
    const template = {
      name: 'Test Tower',
      cost: { gold: 80, wood: 40 }
    };

    eco.buildTower(1, 1, template);
    assert.equal(engine.towers.length, 1);
    assert.equal(engine.gold, 420);
    assert.equal(engine.wood, 160);
    assert.equal(engine.mapData.grid[1][1], 7); // TILE.TOWER (7)
  });

  test('buildTower blocks placement when exceeding maxTowers capacity', () => {
    const engine = createMockEngine();
    engine.maxTowers = 1;
    const eco = new EconomyManager(engine);
    const template = { name: 'Tower', cost: { gold: 10, wood: 10 } };

    // สร้างป้อมแรกสำเร็จ
    const res1 = eco.buildTower(0, 0, template);
    assert.equal(res1, true);
    assert.equal(engine.towerCount, 1);

    // สร้างป้อมที่สองต้องถูกบล็อกเพราะเกินโควตา
    const res2 = eco.buildTower(0, 1, template);
    assert.equal(res2, false);
    assert.equal(engine.towerCount, 1);
  });

  test('sellTower refunds resources and restores grid', () => {
    const engine = createMockEngine();
    const eco = new EconomyManager(engine);
    const tower = {
      c: 1,
      r: 1,
      level: 1,
      originalTileType: 0,
      data: { cost: { gold: 100, wood: 50 } }
    };
    engine.towers.push(tower);
    engine.mapData.grid[1][1] = 7;

    eco.sellTower(tower);
    assert.equal(engine.towers.length, 0);
    assert.equal(engine.gold, 570); // 500 + 70 refund
    assert.equal(engine.mapData.grid[1][1], 0);
  });
});
