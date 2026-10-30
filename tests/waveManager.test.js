import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WaveManager } from '../src/waveManager.js';

describe('WaveManager - Scaling & Progression', () => {
  const createMockEngine = () => ({
    currentEraIndex: 0,
    enemies: [],
    gold: 0,
    wood: 0,
    science: 0,
    screenShake: 0,
    isGameOver: false,
    mapData: {
      path: [
        { c: 0, r: 0 },
        { c: 1, r: 0 }
      ]
    },
    ui: {
      updateStats() {},
      notify() {}
    }
  });

  test('startNextWave generates correct enemy counts and scales HP', () => {
    const engine = createMockEngine();
    const wm = new WaveManager(engine);
    wm.wave = 1;

    wm.startNextWave();
    assert.equal(wm.isWaveRunning, true);
    assert.ok(wm.enemiesToSpawn.length >= 20, 'Should spawn base wave size');

    const firstEnemy = wm.enemiesToSpawn[0];
    assert.ok(firstEnemy.hp > 0);
    assert.ok(firstEnemy.maxHp > 0);
  });

  test('Wave 5 triggers Boss Wave with boss enemy', () => {
    const engine = createMockEngine();
    const wm = new WaveManager(engine);
    wm.wave = 5;

    wm.startNextWave();
    assert.equal(wm.isWaveRunning, true);

    const boss = wm.enemiesToSpawn.find(e => e.isBoss);
    assert.ok(boss, 'Boss Wave 5 must spawn a Boss');
    assert.match(boss.name, /👑/);
    assert.ok(boss.hp > boss.maxHp * 0.5);
  });

  test('Wave clear grants rewards and advances wave index', () => {
    const engine = createMockEngine();
    const wm = new WaveManager(engine);
    wm.wave = 1;
    wm.isWaveRunning = true;
    wm.enemiesToSpawn = [];
    engine.enemies = [];

    wm.update(0.1);
    assert.equal(wm.isWaveRunning, false);
    assert.equal(wm.wave, 2);
    assert.ok(engine.gold > 0, 'Wave clear should reward gold');
    assert.ok(engine.wood > 0, 'Wave clear should reward wood');
    assert.ok(engine.science > 0, 'Wave clear should reward science');
  });
});
