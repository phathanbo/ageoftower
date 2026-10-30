// Simple Pseudo-Random Number Generator with seed
class PRNG {
  constructor(seed = 123456789) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  rangeInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
}

export const TILE = {
  EMPTY: 0,        // พื้นดินธรรมชาติทั่วไป (ห้ามสร้างป้อม)
  PATH: 1,         // ทางเดินศัตรู
  SPAWN: 2,        // ประตูมิติเกิดมอนสเตอร์
  NEXUS: 3,        // ศูนย์กลางเมือง
  OBSTACLE: 4,     // หิน/สิ่งกีดขวาง
  WATER: 5,        // แหล่งน้ำ
  BUILD_ZONE: 6,   // ฐานแท่นหินยุทธศาสตร์เฉพาะที่อนุญาตให้สร้างป้อมได้ (Strategic Tower Base)
  TOWER: 7         // ช่องที่มีการวางป้อมแล้ว
};

export class MapGenerator {
  constructor(cols = 18, rows = 14) {
    this.cols = cols;
    this.rows = rows;
  }

  generate(seed = Date.now()) {
    const rng = new PRNG(seed);
    const grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(TILE.EMPTY));

    // คลังแม่แบบเส้นทางยุทธศาสตร์ระดับพรีเมียม (Curated Strategic Layout Templates สำหรับแผนที่ 18x14)
    // เพิ่มระยะทางเดินให้ยาวขึ้น ลึกขึ้น มีหลายช่วงโค้ง ทำให้ป้อมไม่กระจุกตัวและไม่สแปมช่วยกันง่ายเกินไป
    const MAP_TEMPLATES = [
      // แม่แบบที่ 1: "The Grand Canyon S-Curve" (โค้งสลาลอมกว้าง 3 ขยัก ทะลวงแนวหิน)
      [
        { c: 1, r: 2 }, { c: 5, r: 2 }, 
        { c: 5, r: 4 }, { c: 5, r: 6 }, { c: 5, r: 8 },
        { c: 6, r: 8 }, { c: 8, r: 8 }, { c: 9, r: 8 },
        { c: 9, r: 6 }, { c: 9, r: 4 }, { c: 9, r: 2 },
        { c: 11, r: 2 }, { c: 13, r: 2 },
        { c: 13, r: 4 }, { c: 13, r: 6 }, { c: 13, r: 9 }, { c: 13, r: 11 },
        { c: 14, r: 11 }, { c: 16, r: 11 }
      ],
      // แม่แบบที่ 2: "Fortress Winding Serpent" (เส้นทางงูยักษ์เลื้อยคดเคี้ยวสองชั้น)
      [
        { c: 1, r: 11 }, { c: 4, r: 11 },
        { c: 4, r: 9 }, { c: 4, r: 6 }, { c: 4, r: 3 },
        { c: 6, r: 3 }, { c: 8, r: 3 },
        { c: 8, r: 5 }, { c: 8, r: 8 }, { c: 8, r: 11 },
        { c: 10, r: 11 }, { c: 12, r: 11 },
        { c: 12, r: 8 }, { c: 12, r: 5 }, { c: 12, r: 3 },
        { c: 14, r: 3 }, { c: 16, r: 3 }, { c: 16, r: 6 }
      ],
      // แม่แบบที่ 3: "Twin River Horseshoe Basin" (ทางโค้งเกือกม้าคู่ล้อมรอบภูเขากลางแมพ)
      [
        { c: 1, r: 4 }, { c: 4, r: 4 }, { c: 6, r: 4 },
        { c: 6, r: 6 }, { c: 6, r: 9 }, { c: 6, r: 11 },
        { c: 8, r: 11 }, { c: 10, r: 11 },
        { c: 10, r: 8 }, { c: 10, r: 5 }, { c: 10, r: 2 },
        { c: 12, r: 2 }, { c: 14, r: 2 },
        { c: 14, r: 5 }, { c: 14, r: 8 }, { c: 15, r: 8 }, { c: 16, r: 8 }
      ],
      // แม่แบบที่ 4: "Dragon Mountain Pass" (ทางลัดเลาะข้ามหุบเขา 3 สเต็ป)
      [
        { c: 1, r: 2 }, { c: 4, r: 2 },
        { c: 4, r: 5 }, { c: 3, r: 5 }, { c: 2, r: 5 },
        { c: 2, r: 8 }, { c: 2, r: 11 }, { c: 5, r: 11 }, { c: 8, r: 11 },
        { c: 8, r: 8 }, { c: 8, r: 5 }, { c: 11, r: 5 },
        { c: 11, r: 8 }, { c: 11, r: 11 }, { c: 14, r: 11 },
        { c: 14, r: 7 }, { c: 15, r: 7 }, { c: 16, r: 7 }
      ]
    ];

    // สุ่มเลือกแม่แบบตาม Seed
    const chosenTemplateIndex = Math.floor(rng.next() * MAP_TEMPLATES.length);
    const keyPoints = MAP_TEMPLATES[chosenTemplateIndex];

    // ขยายเส้นทางเชื่อมจุด (Linear Interpolation เพื่อให้เดินต่อเนื่องทุกช่องไม่มีฟันหลอ)
    const fullPath = [];
    let cur = { c: keyPoints[0].c, r: keyPoints[0].r };
    fullPath.push({ ...cur });

    for (let k = 1; k < keyPoints.length; k++) {
      const target = keyPoints[k];
      while (cur.c !== target.c || cur.r !== target.r) {
        if (cur.c !== target.c) {
          cur.c += (target.c > cur.c) ? 1 : -1;
        } else if (cur.r !== target.r) {
          cur.r += (target.r > cur.r) ? 1 : -1;
        }
        fullPath.push({ ...cur });
      }
    }

    const spawnNode = fullPath[0];
    const nexusNode = fullPath[fullPath.length - 1];

    grid[spawnNode.r][spawnNode.c] = TILE.SPAWN;
    grid[nexusNode.r][nexusNode.c] = TILE.NEXUS;

    // วาดทางเดินถนนหินคู่ (Dual-Lane Grand Battlefield Path) กว้าง 2 ช่อง
    for (let i = 0; i < fullPath.length; i++) {
      const node = fullPath[i];
      if (grid[node.r][node.c] === TILE.EMPTY) {
        grid[node.r][node.c] = TILE.PATH;
      }

      // ขยายช่องทางเดินคู่ขนาน (Parallel Road Tile) กว้าง 2 ช่องอย่างเป็นระเบียบ
      const next = fullPath[i + 1] || fullPath[i - 1];
      if (next) {
        const dx = next.c - node.c;
        const dy = next.r - node.r;

        // ขยายด้านข้าง
        const sideCandidates = (dx !== 0) 
          ? [{ c: node.c, r: node.r + 1 }, { c: node.c, r: node.r - 1 }]
          : [{ c: node.c + 1, r: node.r }, { c: node.c - 1, r: node.r }];

        for (const cand of sideCandidates) {
          if (
            cand.c >= 0 && cand.c < this.cols &&
            cand.r >= 0 && cand.r < this.rows &&
            grid[cand.r][cand.c] === TILE.EMPTY
          ) {
            grid[cand.r][cand.c] = TILE.PATH;
            break;
          }
        }
      }
    }

    // สิ่งกีดขวางธรรมชาติ (แม่น้ำ และ ก้อนหิน) จัดวางให้สวยงามนอกแนวถนน
    const obstacleCount = rng.rangeInt(6, 9);
    for (let i = 0; i < obstacleCount; i++) {
      const oc = rng.rangeInt(1, this.cols - 2);
      const or = rng.rangeInt(1, this.rows - 2);
      if (grid[or][oc] === TILE.EMPTY) {
        grid[or][oc] = rng.next() > 0.4 ? TILE.OBSTACLE : TILE.WATER;
      }
    }

    // *** จัดวางแท่นหินยุทธศาสตร์เฉพาะ (Strategic Build Zones) ***
    // คัดเลือกเฉพาะจุด "วงในของโค้งหักศอก" (Apex Chokepoints) และขนาบข้างถนนหลวง
    const candidateSpots = [];
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (grid[r][c] === TILE.EMPTY) {
          // ตรวจสอบเพื่อนบ้านรอบทิศ 8 ช่อง
          const neighbors = [
            { c: c+1, r }, { c: c-1, r }, { c, r: r+1 }, { c, r: r-1 },
            { c: c+1, r: r+1 }, { c: c-1, r: r-1 }, { c: c+1, r: r-1 }, { c: c-1, r: r+1 }
          ];
          let pathTouches = 0;
          for (const n of neighbors) {
            if (grid[n.r][n.c] === TILE.PATH || grid[n.r][n.c] === TILE.SPAWN || grid[n.r][n.c] === TILE.NEXUS) {
              pathTouches++;
            }
          }

          // จุดที่สัมผัสถนน 2-4 ด้าน คือจุดยุทธศาสตร์ชั้นยอดที่ครอบคลุมการยิงสูงสุด
          if (pathTouches >= 1) {
            candidateSpots.push({ c, r, score: pathTouches * 10 + rng.next() * 5 });
          }
        }
      }
    }

    candidateSpots.sort((a, b) => b.score - a.score);

    // เลือกแท่นยุทธศาสตร์ทอง 12 - 15 จุด โดยเว้นระยะห่างไม่ให้ป้อมติดกันเป็นก้อน เพื่อป้องกันการสแปมป้อมซ้อนทับกัน
    const chosenSpots = [];
    const minDistanceBetweenSpots = 2.1; // ต้องห่างกันอย่างน้อย 2 ช่อง Grid

    for (const spot of candidateSpots) {
      if (chosenSpots.length >= 14) break;
      const isTooClose = chosenSpots.some(s => Math.hypot(s.c - spot.c, s.r - spot.r) < minDistanceBetweenSpots);
      if (!isTooClose) {
        chosenSpots.push(spot);
        grid[spot.r][spot.c] = TILE.BUILD_ZONE;
      }
    }

    // กรอง Path ต่อเนื่องไม่มีจุดซ้ำ
    const uniquePath = [];
    const visited = new Set();
    for (const p of fullPath) {
      const key = `${p.c},${p.r}`;
      if (!visited.has(key)) {
        visited.add(key);
        uniquePath.push(p);
      }
    }

    return {
      seed,
      grid,
      path: uniquePath,
      spawn: spawnNode,
      nexus: nexusNode,
      cols: this.cols,
      rows: this.rows
    };
  }
}
