import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MapGenerator, TILE } from '../src/mapGen.js';

describe('MapGenerator - Procedural Map & Pathfinding', () => {
  const mapGen = new MapGenerator(18, 14);

  test('generates valid grid dimensions', () => {
    const map = mapGen.generate(12345);
    assert.equal(map.cols, 18);
    assert.equal(map.rows, 14);
    assert.equal(map.grid.length, 14);
    assert.equal(map.grid[0].length, 18);
  });

  test('creates contiguous path from spawn to nexus', () => {
    const map = mapGen.generate(999);
    assert.ok(map.path.length >= 10, 'Path should be long enough for tower defense');

    const spawn = map.path[0];
    const nexus = map.path[map.path.length - 1];

    assert.equal(map.grid[spawn.r][spawn.c], TILE.SPAWN);
    assert.equal(map.grid[nexus.r][nexus.c], TILE.NEXUS);

    // Verify step continuity
    for (let i = 0; i < map.path.length - 1; i++) {
      const cur = map.path[i];
      const next = map.path[i + 1];
      const dist = Math.abs(cur.c - next.c) + Math.abs(cur.r - next.r);
      assert.equal(dist, 1, `Path segment ${i} to ${i+1} must be adjacent`);
    }
  });

  test('is deterministic given the same seed', () => {
    const mapA = mapGen.generate(42);
    const mapB = mapGen.generate(42);
    assert.deepEqual(mapA.path, mapB.path);
    assert.deepEqual(mapA.grid, mapB.grid);
  });
});
