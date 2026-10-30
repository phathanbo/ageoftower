import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CombatSystem } from '../src/combatSystem.js';

describe('CombatSystem - Damage Matrix & Modifiers', () => {
  const mockEngine = {
    screenShake: 0,
    enemies: [],
    gainSpellEnergy() {},
    createImpactRing() {},
    createIncomeParticle() {},
    ui: { showTowerDetail() {} }
  };
  const combat = new CombatSystem(mockEngine);

  test('Blunt damage vs Armor Types', () => {
    // blunt vs light = 1.6x
    assert.equal(combat.calculateTypeModifier('blunt', 'light'), 1.6);
    // blunt vs beast = 1.6x
    assert.equal(combat.calculateTypeModifier('blunt', 'beast'), 1.6);
    // blunt vs heavy = 0.55x (resist)
    assert.equal(combat.calculateTypeModifier('blunt', 'heavy'), 0.55);
  });

  test('Pierce damage vs Armor Types', () => {
    // pierce vs heavy = 1.75x
    assert.equal(combat.calculateTypeModifier('pierce', 'heavy'), 1.75);
    // pierce vs light = 0.6x (resist)
    assert.equal(combat.calculateTypeModifier('pierce', 'light'), 0.6);
  });

  test('Magic damage vs Armor Types', () => {
    // magic vs beast = 1.65x
    assert.equal(combat.calculateTypeModifier('magic', 'beast'), 1.65);
    // magic vs light = 1.30x
    assert.equal(combat.calculateTypeModifier('magic', 'light'), 1.3);
    // magic vs heavy = 0.85x
    assert.equal(combat.calculateTypeModifier('magic', 'heavy'), 0.85);
  });

  test('Null or missing parameters fallback safely to 1.0', () => {
    assert.equal(combat.calculateTypeModifier(null, 'heavy'), 1.0);
    assert.equal(combat.calculateTypeModifier('blunt', null), 1.0);
    assert.equal(combat.calculateTypeModifier(undefined, undefined), 1.0);
  });

  test('Single target hit reduces enemy HP and accounts for shields', () => {
    const enemy = {
      gridX: 2,
      gridY: 3,
      hp: 100,
      armorType: 'light',
      shield: 20,
      baseSpeed: 1,
      speed: 1
    };

    // blunt 50 dmg vs light (mod 1.6) -> 80 raw hit.
    // Shield blocks 50% non-magic = 40 hit vs shield.
    // 20 shield absorbed, remaining 20 hits HP.
    const proj = {
      damageType: 'blunt',
      damage: 50,
      splash: 0,
      target: enemy,
      sourceTower: { totalDamage: 0 }
    };

    combat.applyDamage(proj);
    assert.equal(enemy.shield, 0);
    assert.equal(enemy.hp, 80);
    assert.equal(proj.sourceTower.totalDamage, 20);
  });
});
