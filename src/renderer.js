import { unitRenderer } from './unitRenderer.js';
import { TILE } from './mapGen.js';

// Resolve image URL (compatible with Vite bundled builds, Vite dev server, and native static servers)
const tilesetUrl = new URL('./tileset_spritesheet.jpg', import.meta.url).href;
const bgUrl = new URL('./original_pixel_map.jpg', import.meta.url).href;
const towerSheetUrl = new URL('./tower_spritesheet.jpg', import.meta.url).href;

// โหลด tileset image เป็น HTMLImageElement ไว้ใช้วาด
const _tilesetImg = new Image();
_tilesetImg.src = tilesetUrl;

// โหลด background landscape image สำหรับฉากหลังมหากาพย์
const _bgImg = new Image();
_bgImg.src = bgUrl;

// โหลด Tower Sprite Sheet รูปภาพป้อมคุณภาพสูง
const _towerSheetImg = new Image();
_towerSheetImg.src = towerSheetUrl;

// Layout ของ tileset (1024x1024, 4 cols × 2 rows, tile = 212px, gap = 42px, offsetX=42, offsetY=80)
// Row 0: [0]Grass  [1]Dirt   [2]Cobble [3]Magic
// Row 1: [4]Water  [5]Rocky  [6]Mossy  [7]Wood
const TS_TILE  = 214;   // ขนาด tile ในรูป (px)
const TS_GAP   = 42;    // ระยะห่างระหว่าง tile
const TS_OX    = 42;    // offset X เริ่มต้น
const TS_OY    = 80;    // offset Y เริ่มต้น
const TS_COLS  = 4;

function tilesetRect(idx) {
  const col = idx % TS_COLS;
  const row = Math.floor(idx / TS_COLS);
  return {
    sx: TS_OX + col * (TS_TILE + TS_GAP),
    sy: TS_OY + row * (TS_TILE + TS_GAP),
    sw: TS_TILE,
    sh: TS_TILE
  };
}

// Tile index map: tileType → tileset index
// 0=EMPTY→Grass(0), 1=PATH→Cobblestone(2), 2=SPAWN→Cobblestone(2),
// 3=NEXUS→Cobblestone(2), 4=OBSTACLE→Rocky(5), 5=WATER→Water(4),
// 6=BUILD_ZONE→Magic(3), 7=TOWER→Cobblestone(2)
const TILE_IDX = { 0: 0, 1: 2, 2: 2, 3: 2, 4: 5, 5: 4, 6: 3, 7: 2 };

// 2D Orthographic Top-Down Vector Renderer & Pixel Art Architect
export class IsometricRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.baseTileW = 60;
    this.baseTileH = 60;
    this.zoom = 1.0; // สเกลซูม (0.6x ถึง 2.5x)
    this.tileW = 60;
    this.tileH = 60;
    this.tileSize = 60;
    this.tileWidth = 60;
    this.tileHeight = 60;

    this.panX = 0; // ระยะเลื่อนแผนที่ (Pan X)
    this.panY = 0; // ระยะเลื่อนแผนที่ (Pan Y)

    this.offsetX = 0;
    this.offsetY = 0;
    this.animTick = 0;
    this.tilesetReady = false;
    this.bgReady = false;
    this.towerSheetReady = false;
    this.cleanTowerCanvases = []; // อาร์เรย์เก็บ Sprite แต่ละป้อมที่ไดคัทตัดพื้นหลังขาวออกแล้ว
    _tilesetImg.onload = () => { this.tilesetReady = true; };
    if (_tilesetImg.complete) this.tilesetReady = true;
    _bgImg.onload = () => { this.bgReady = true; };
    if (_bgImg.complete) this.bgReady = true;
    _towerSheetImg.onload = () => { 
      this.initCleanTowerSprites();
      this.towerSheetReady = true; 
    };
    if (_towerSheetImg.complete) {
      this.initCleanTowerSprites();
      this.towerSheetReady = true;
    }
  }

  // ไดคัทตัดพื้นหลังสีขาว/เทาสว่างของรูปภาพออก (Chroma-key White Remover & Alpha Masking)
  // พร้อมแบ่งช่อง 3x3 แยกเป็น Canvas ย่อย 9 อันแบบโปร่งใส 100%
  initCleanTowerSprites() {
    if (!_towerSheetImg.width || this.cleanTowerCanvases.length > 0) return;
    const sheetW = _towerSheetImg.width;
    const sheetH = _towerSheetImg.height;
    const cellW = Math.floor(sheetW / 3);
    const cellH = Math.floor(sheetH / 3);

    for (let idx = 0; idx < 9; idx++) {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const sx = col * cellW;
      const sy = row * cellH;

      const c = document.createElement('canvas');
      c.width = cellW;
      c.height = cellH;
      const cctx = c.getContext('2d');

      // วาดชิ้นส่วนป้อมลงบน canvas ย่อย
      cctx.drawImage(_towerSheetImg, sx, sy, cellW, cellH, 0, 0, cellW, cellH);

      // ดึงข้อมูล ImageData เพื่อตัดพื้นหลังขาว (R > 235, G > 235, B > 238)
      try {
        const imgData = cctx.getImageData(0, 0, cellW, cellH);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // ถ้าเป็นสีพื้นหลังสว่างขาว-เทาอ่อน หรือเงาสีเทาด้านล่างภาพ ให้โปร่งใส
          if (r > 230 && g > 230 && b > 232) {
            data[i + 3] = 0;
          } else if (r > 215 && g > 215 && b > 220) {
            // Feather edge ขอบให้นุ่มเนียน
            const alpha = 1.0 - ((Math.min(r, g, b) - 215) / 18);
            data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, alpha)));
          } else if (r > 150 && r < 210 && g > 150 && g < 210 && b > 160 && b < 220 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10) {
            // ลบเงาสีเทาอมฟ้าใต้ฐานภาพวาดเดิม
            const shadowDist = 1.0 - ((r - 150) / 60);
            data[i + 3] = Math.round(data[i + 3] * Math.max(0, 1 - shadowDist * 0.9));
          }
        }
        cctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.warn('Canvas pixel cutout skipped:', err);
      }

      this.cleanTowerCanvases.push(c);
    }
  }

  // วาดภาพฉากหลังแบบ Landscape สวยงามเต็มหน้าจอ พร้อม Vignette บรรยากาศ
  drawBackground(w, h, eraTheme) {
    const ctx = this.ctx;
    if (this.bgReady && _bgImg.width > 0) {
      // คำนวณ Aspect Fill ให้ภาพวิวเต็มขอบ Canvas
      const scale = Math.max(w / _bgImg.width, h / _bgImg.height);
      const dw = _bgImg.width * scale;
      const dh = _bgImg.height * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(_bgImg, dx, dy, dw, dh);

      // ย้อมสี Ambient Tint ตามธีมประจำยุคอย่างละมุนตา เพื่อให้ภาพพิกเซลอาร์ตแท้คมชัดและกลมกลืน
      ctx.fillStyle = eraTheme.groundAlt || '#1e293b';
      ctx.globalAlpha = 0.22;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1.0;
    } else {
      // Fallback ไล่เฉดสีทิวทัศน์
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.4, '#312e81');
      grad.addColorStop(1, eraTheme.groundAlt || '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // ขอบมืด Dramatic Vignette ช่วยขับกระดานแผนที่ 3D ให้เด่นตระหง่าน
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  setZoom(newZoom) {
    this.zoom = Math.max(0.6, Math.min(2.5, newZoom));
    this.tileW = this.baseTileW * this.zoom;
    this.tileH = this.baseTileH * this.zoom;
    this.tileSize = Math.min(this.tileW, this.tileH);
    this.tileWidth = this.tileW;
    this.tileHeight = this.tileH;
    this.updateOffset();
  }

  changeZoom(delta) {
    this.setZoom(this.zoom + delta);
  }

  setPan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.updateOffset();
  }

  resetPan() {
    this.panX = 0;
    this.panY = 0;
    this.updateOffset();
  }

  updateOffset(w = this.canvas.width, h = this.canvas.height, cols = 18, rows = 14) {
    const mapW = cols * this.tileW;
    const mapH = rows * this.tileH;
    // จัดวางตรงกลางจอเป๊ะ
    this.offsetX = Math.floor((w - mapW) / 2) + this.panX;
    this.offsetY = Math.floor((h - mapH) / 2) + this.panY;
  }

  resize(w, h, cols = 18, rows = 14) {
    this.canvas.width = w;
    this.canvas.height = h;

    // คำนวณขนาด Tile ให้แผนที่ยืดขยายเต็ม 100% ทั้งความกว้างและความสูงของจอ (Edge-to-Edge Full Screen)
    if (w > 0 && h > 0 && cols > 0 && rows > 0) {
      this.baseTileW = w / cols;
      this.baseTileH = h / rows;
      this.tileW = this.baseTileW * this.zoom;
      this.tileH = this.baseTileH * this.zoom;
      this.tileSize = Math.min(this.tileW, this.tileH);
      this.tileWidth = this.tileW;
      this.tileHeight = this.tileH;
    }
    this.updateOffset(w, h, cols, rows);
  }

  gridToScreen(c, r, heightOffset = 0) {
    // Top-down Orthogonal: ตรง 100% เต็มจอ
    const x = c * this.tileW + this.offsetX + this.tileW / 2;
    const y = r * this.tileH + this.offsetY + this.tileH / 2 - heightOffset;
    return { x, y };
  }

  screenToGrid(sx, sy) {
    const adjX = sx - this.offsetX;
    const adjY = sy - this.offsetY;
    const c = Math.floor(adjX / this.tileW);
    const r = Math.floor(adjY / this.tileH);
    return { c, r };
  }

  // ======== 2D TOP-DOWN ORTHOGONAL PIXEL ART MAP ENGINE ========
  // วาดกระเบื้องแผนที่พิกเซลอาร์ตแท้ 100% ตรงๆ ไม่เอียง ไม่บิดเบี้ยว
  drawIsoTile(c, r, tileType, theme, grid = null) {
    const { x, y } = this.gridToScreen(c, r);
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;
    const ctx = this.ctx;

    // Seeded pseudo-random เพื่อให้รายละเอียดพิกเซลและ Props ในแต่ละช่องคงที่ถาวร ไม่กะพริบ
    const tileRng = (offset = 0) => {
      const n = Math.sin(c * 127.1 + r * 311.7 + offset * 74.3) * 43758.5453;
      return n - Math.floor(n);
    };

    // ตรวจสอบว่าช่องทางเดินนี้อยู่ติดหรือข้ามผืนน้ำหรือไม่ (เพื่อวาดสะพานไม้)
    let isBridge = false;
    if ((tileType === TILE.PATH || tileType === TILE.SPAWN || tileType === TILE.NEXUS) && grid) {
      const neighbors = [
        grid[r - 1]?.[c], grid[r + 1]?.[c],
        grid[r]?.[c - 1], grid[r]?.[c + 1]
      ];
      isBridge = neighbors.some(t => t === TILE.WATER);
    }

    if (tileType === TILE.PATH || tileType === TILE.SPAWN || tileType === TILE.NEXUS) {
      // 1. ทางเดินมอนสเตอร์: ทางหิน Cobblestone / ถนนดิน หรือ สะพานไม้ข้ามน้ำ
      this._drawPixelPathTile(ctx, x, y, hw, hh, 14, c, r, isBridge, tileRng);
    } else if (tileType === TILE.BUILD_ZONE) {
      // 2. แท่นหินยุทธศาสตร์สำหรับสร้างป้อม (Strategic Tower Dais)
      this._drawPixelBuildZoneTile(ctx, x, y, hw, hh, 16, c, r, tileRng);
    } else if (tileType === TILE.OBSTACLE) {
      // 3. หน้าผาหินลดหลั่นหลายระดับ (Stepped Slate-Blue Cliffs)
      this._drawPixelCliffTile(ctx, x, y, hw, hh, 22, c, r, tileRng);
    } else if (tileType === TILE.WATER) {
      // 4. ผืนน้ำพิกเซลอาร์ตเคลื่อนไหวได้ (Animated Pixel Water & Shore Foam)
      this._drawPixelWaterTile(ctx, x, y, hw, hh, 10, c, r, tileRng);
    } else {
      // 5. พื้นหญ้าธรรมชาติ (Lush Pixel Grass) พร้อมตกแต่งพืชพรรณและ Props
      this._drawPixelGrassTile(ctx, x, y, hw, hh, 14, c, r, tileRng);
      // ตกแต่งธรรมชาติเฉพาะช่องว่างที่ไม่มีอะไรขวาง
      if (tileType === TILE.EMPTY) {
        this._drawPixelDecoration(ctx, x, y, c, r, tileRng);
      }
    }
  }

  // 1. พื้นหญ้าพิกเซลอาร์ต Top-Down สะอาดตา ไม่เอียง (Lush Pixel Grass Tile)
  _drawPixelGrassTile(ctx, x, y, hw, hh, depth, c, r, rng) {
    const rx = x - hw;
    const ry = y - hh;
    const rw = hw * 2;
    const rh = hh * 2;

    // พื้นหลังหญ้าหลัก
    ctx.fillStyle = '#2d5a1e';
    ctx.fillRect(rx, ry, rw, rh);
    // หน้าตัดผิวหญ้าด้านใน
    ctx.fillStyle = '#386b24';
    ctx.fillRect(rx + 1, ry + 1, rw - 2, rh - 2);

    // ไฮไลท์หญ้าอ่อนด้านบน-ซ้าย และเงาเข้มด้านล่าง-ขวา ให้มิติกริดที่ดูสบายตา
    ctx.fillStyle = '#4e8c2d';
    ctx.fillRect(rx + 1, ry + 1, rw - 2, 2);
    ctx.fillRect(rx + 1, ry + 1, 2, rh - 2);
    ctx.fillStyle = '#224615';
    ctx.fillRect(rx + 1, ry + rh - 3, rw - 2, 2);
    ctx.fillRect(rx + rw - 3, ry + 1, 2, rh - 2);

    // กอหญ้าพิกเซลกระจายตัวตามช่อง
    const tufts = [
      { ox: -hw + 8,  oy: -hh + 8,  col: '#6db33f' },
      { ox: hw - 14,  oy: -hh + 12, col: '#94d84f' },
      { ox: -hw + 12, oy: hh - 12,  col: '#6db33f' },
      { ox: hw - 16,  oy: hh - 10,  col: '#94d84f' }
    ];
    tufts.forEach(t => {
      ctx.fillStyle = t.col;
      ctx.fillRect(x + t.ox, y + t.oy, 3, 3);
      ctx.fillRect(x + t.ox + 2, y + t.oy - 2, 2, 2);
    });

    // เส้นแบ่งกริดบางๆ อย่างประณีต
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, rw, rh);
  }

  // 2. ทางเดินมอนสเตอร์พิกเซลอาร์ต Top-Down (Monster Path: Cobblestone Road / Bridge)
  _drawPixelPathTile(ctx, x, y, hw, hh, depth, c, r, isBridge, rng) {
    const rx = x - hw;
    const ry = y - hh;
    const rw = hw * 2;
    const rh = hh * 2;

    if (isBridge) {
      // === สะพานไม้ตรงข้ามน้ำ ===
      ctx.fillStyle = '#3a1f0e';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = '#7a4521';
      ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);

      // แผ่นไม้ปูพื้นเรียงตัวตามทิศทาง
      ctx.fillStyle = '#442517';
      for (let py = ry + 6; py < ry + rh - 4; py += 10) {
        ctx.fillRect(rx + 2, py, rw - 4, 2);
      }
      // ราวสะพานสองข้าง
      ctx.fillStyle = '#a86737';
      ctx.fillRect(rx, ry, 3, rh);
      ctx.fillRect(rx + rw - 3, ry, 3, rh);
      return;
    }

    // === ถนนหินกรวดและดิน Cobblestone ตรงๆ ===
    ctx.fillStyle = '#4a2813';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.fillStyle = '#8e4e22';
    ctx.fillRect(rx + 1, ry + 1, rw - 2, rh - 2);

    // ก้อนหิน Cobblestones เรียงตัวบนทางเดิน
    const stones = [
      { ox: -12, oy: -12, w: 9, h: 7, col: '#c47635' },
      { ox: 2,   oy: -14, w: 10, h: 8, col: '#d48b48' },
      { ox: -14, oy: 2,   w: 11, h: 8, col: '#b86a2d' },
      { ox: 1,   oy: 1,   w: 10, h: 9, col: '#e09855' },
      { ox: -6,  oy: 11,  w: 12, h: 6, col: '#c47635' }
    ];
    stones.forEach(s => {
      ctx.fillStyle = '#442612';
      ctx.fillRect(x + s.ox - 1, y + s.oy, s.w + 2, s.h + 1);
      ctx.fillStyle = s.col;
      ctx.fillRect(x + s.ox, y + s.oy, s.w, s.h);
      ctx.fillStyle = '#e8aa5d';
      ctx.fillRect(x + s.ox + 1, y + s.oy, Math.max(2, s.w - 3), 1);
    });

    // เม็ดกรวดทรายระยิบระยับ
    ctx.fillStyle = '#f5bb78';
    ctx.fillRect(x - 6, y - 4, 2, 2);
    ctx.fillRect(x + 7, y + 6, 2, 2);

    // เส้นทองนำทางเดินประประสำหรับ Tower Defense
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(rx, y);
    ctx.lineTo(rx + rw, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3. แท่นหินยุทธศาสตร์สำหรับวางป้อม Top-Down (Strategic Tower Build Zone)
  _drawPixelBuildZoneTile(ctx, x, y, hw, hh, depth, c, r, rng) {
    const rx = x - hw;
    const ry = y - hh;
    const rw = hw * 2;
    const rh = hh * 2;

    // ขอบนอกแท่นหินตัดเหลี่ยม
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rx, ry, rw, rh);
    // หน้าแท่นหินบล็อกแกรนิต
    ctx.fillStyle = '#334155';
    ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);

    // ขอบโลหะทองเหลืองรอบแท่น (Brass Bevel Rim)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);

    // หมุดทองเหลือง 4 มุม
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(rx + 4, ry + 4, 4, 4);
    ctx.fillRect(rx + rw - 8, ry + 4, 4, 4);
    ctx.fillRect(rx + 4, ry + rh - 8, 4, 4);
    ctx.fillRect(rx + rw - 8, ry + rh - 8, 4, 4);

    // แท่นหินวงกลมแปดเหลี่ยมด้านใน (Central Runed Dais)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(x, y, hw * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // วงเวทรูนเรืองแสงกะพริบอย่างมีมนต์ขลัง (Pulsing Magic Sigil)
    const pulse = 0.55 + Math.sin(this.animTick * 0.08 + c + r) * 0.35;
    ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, hw * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // อัญมณีรูนสลักใจกลาง
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }

  // 4. หน้าผาหินลดหลั่น / สิ่งกีดขวาง Top-Down (Slate-Blue Cliff & Rock Tile)
  _drawPixelCliffTile(ctx, x, y, hw, hh, depth, c, r, rng) {
    const rx = x - hw;
    const ry = y - hh;
    const rw = hw * 2;
    const rh = hh * 2;

    // ฐานหินดำทึบ
    ctx.fillStyle = '#1a1926';
    ctx.fillRect(rx, ry, rw, rh);
    // ก้อนหินใหญ่ผาหิน
    ctx.fillStyle = '#262438';
    ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);

    // ลายชั้นหินและรอยแตกพิกเซล
    ctx.fillStyle = '#413e59';
    ctx.fillRect(rx + 4, ry + 6, rw - 8, 6);
    ctx.fillRect(rx + 8, ry + 16, rw - 16, 8);
    ctx.fillRect(rx + 6, ry + 28, rw - 12, 8);

    ctx.fillStyle = '#635f82'; // ไฮไลท์สันหิน
    ctx.fillRect(rx + 5, ry + 6, rw - 12, 2);
    ctx.fillRect(rx + 9, ry + 16, rw - 18, 2);

    // ก้อนหินผาหินยักษ์ 2 ก้อนพิกเซล
    // ก้อนหินหลัก
    ctx.fillStyle = '#1e1c2b';
    ctx.fillRect(x - 12, y - 10, 16, 14);
    ctx.fillStyle = '#413e59';
    ctx.fillRect(x - 11, y - 9, 14, 12);
    ctx.fillStyle = '#706c8a';
    ctx.fillRect(x - 10, y - 8, 10, 3);

    // ก้อนหินรอง
    ctx.fillStyle = '#1e1c2b';
    ctx.fillRect(x + 2, y - 4, 12, 12);
    ctx.fillStyle = '#4a465f';
    ctx.fillRect(x + 3, y - 3, 10, 10);
    ctx.fillStyle = '#8985a8';
    ctx.fillRect(x + 4, y - 2, 6, 2);
  }

  // 5. ผืนน้ำพิกเซลอาร์ตเคลื่อนไหวได้ Top-Down (Animated Pixel Water Tile)
  _drawPixelWaterTile(ctx, x, y, hw, hh, depth, c, r, rng) {
    const rx = x - hw;
    const ry = y - hh;
    const rw = hw * 2;
    const rh = hh * 2;

    // ก้นตลิ่งน้ำลึก
    ctx.fillStyle = '#0a1d2e';
    ctx.fillRect(rx, ry, rw, rh);
    // ผิวน้ำสีคราม
    ctx.fillStyle = '#164263';
    ctx.fillRect(rx + 1, ry + 1, rw - 2, rh - 2);

    // ชั้นน้ำสีฟ้าใส
    ctx.fillStyle = '#246592';
    ctx.fillRect(rx + 3, ry + 4, rw - 6, rh - 8);

    // ลอนคลื่นสะท้อนแสงเคลื่อนไหว (Animated Shimmering Ripples)
    const waveOffset = Math.sin(this.animTick * 0.06 + c * 1.5 + r) * 4;
    ctx.fillStyle = '#4da6d8';
    ctx.fillRect(x - 10 + waveOffset, y - 5, 12, 2);
    ctx.fillRect(x + 2 - waveOffset, y + 4, 10, 2);

    // ฟองคลื่นสีขาวซัดริมตลิ่ง (Shore Foam)
    ctx.fillStyle = '#c3f4fe';
    ctx.fillRect(x - 4 + waveOffset * 0.5, y, 6, 2);
  }

  // 6. ของประดับตกแต่งธรรมชาติและ Props สไตล์พิกเซลบนช่องว่าง (Pixel Foliage & Props)
  _drawPixelDecoration(ctx, x, y, c, r, rng) {
    const seed = rng(5);

    if (seed > 0.82) {
      // ต้นสนแฟนตาซี (Pixel Pine / Spruce Tree)
      this._drawPixelPineTree(ctx, x, y - 4, rng);
    } else if (seed > 0.68) {
      // ต้นโอ๊คใบเขียวพุ่มฟู (Lush Pixel Oak Tree)
      this._drawPixelOakTree(ctx, x, y - 4, rng);
    } else if (seed > 0.55) {
      // ดอกเห็ดแฟนตาซีสีแดง/ม่วงจุดขาว (Fairy Mushrooms)
      this._drawPixelMushrooms(ctx, x, y, rng);
    } else if (seed > 0.42) {
      // ดอกไม้ป่าระยิบระยับ (Wildflower Cluster)
      this._drawPixelFlowers(ctx, x, y, rng);
    } else if (seed > 0.35) {
      // ลังไม้หรือถังไม้เสบียง (Wooden Supply Barrel / Crate)
      this._drawPixelCrateOrBarrel(ctx, x, y, rng);
    } else if (seed > 0.28) {
      // โคมไฟเสาหินเรืองแสง (Stone Lantern Post)
      this._drawPixelStoneLantern(ctx, x, y);
    }
  }

  _drawPixelPineTree(ctx, x, y, rng) {
    const sway = Math.sin(this.animTick * 0.05 + x) * 0.8;
    // ลำต้นไม้
    ctx.fillStyle = '#3a1f0e';
    ctx.fillRect(x - 2, y, 4, 8);
    // พุ่มสน 3 ชั้น
    const tiers = [
      { w: 16, h: 7, dy: 1, col: '#1e3d16' },
      { w: 12, h: 6, dy: -4, col: '#2d5a22' },
      { w: 8,  h: 5, dy: -8, col: '#4e8c2d' }
    ];
    tiers.forEach(t => {
      ctx.fillStyle = t.col;
      ctx.beginPath();
      ctx.moveTo(x - t.w / 2 + sway, y + t.dy);
      ctx.lineTo(x + sway, y + t.dy - t.h);
      ctx.lineTo(x + t.w / 2 + sway, y + t.dy);
      ctx.closePath();
      ctx.fill();
      // ไฮไลท์ยอดใบสน
      ctx.fillStyle = '#6db33f';
      ctx.fillRect(x - 1 + sway, y + t.dy - t.h + 1, 2, 2);
    });
  }

  _drawPixelOakTree(ctx, x, y, rng) {
    const sway = Math.sin(this.animTick * 0.04 + y) * 0.8;
    // ลำต้น
    ctx.fillStyle = '#442612';
    ctx.fillRect(x - 2.5, y, 5, 8);
    // พุ่มใบไม้ซ้อน 3 วง
    ctx.fillStyle = '#224615';
    ctx.beginPath(); ctx.arc(x + sway, y - 5, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#386b24';
    ctx.beginPath(); ctx.arc(x + sway, y - 7, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6db33f';
    ctx.beginPath(); ctx.arc(x - 2 + sway, y - 9, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94d84f';
    ctx.fillRect(x - 4 + sway, y - 11, 4, 3);
  }

  _drawPixelMushrooms(ctx, x, y, rng) {
    // เห็ดแดงจุดขาว
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x - 5, y - 1, 2, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x - 8, y - 4, 6, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 7, y - 4, 1, 1);
    ctx.fillRect(x - 4, y - 3, 1, 1);

    // เห็ดม่วงเล็ก
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x + 3, y, 2, 3);
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(x + 1, y - 2, 5, 2.5);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(x + 2, y - 2, 1, 1);
  }

  _drawPixelFlowers(ctx, x, y, rng) {
    // ดอกไม้สีชมพู
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x - 6, y - 2, 2, 2);
    ctx.fillRect(x - 4, y - 3, 2, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 5, y - 2, 1, 1);

    // ดอกไม้สีฟ้า
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 4, y - 1, 2, 2);
    ctx.fillRect(x + 6, y - 2, 2, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 5, y - 1, 1, 1);
  }

  _drawPixelCrateOrBarrel(ctx, x, y, rng) {
    if (rng(2) > 0.5) {
      // ลังไม้สี่เหลี่ยม (Wooden Crate)
      ctx.fillStyle = '#3a1f0e';
      ctx.fillRect(x - 4, y - 7, 9, 8);
      ctx.fillStyle = '#7a4521';
      ctx.fillRect(x - 3, y - 6, 7, 6);
      ctx.fillStyle = '#a86737';
      ctx.fillRect(x - 2, y - 5, 5, 1);
      ctx.strokeStyle = '#3a1f0e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 6); ctx.lineTo(x + 4, y);
      ctx.stroke();
    } else {
      // ถังไม้กลม (Wooden Barrel)
      ctx.fillStyle = '#5c3319';
      ctx.fillRect(x - 4, y - 8, 8, 9);
      ctx.fillStyle = '#475569'; // สายรัดเหล็ก
      ctx.fillRect(x - 4, y - 6, 8, 1);
      ctx.fillRect(x - 4, y - 2, 8, 1);
      ctx.fillStyle = '#8e4e22';
      ctx.fillRect(x - 2, y - 8, 4, 8);
    }
  }

  _drawPixelStoneLantern(ctx, x, y) {
    // ฐานหิน
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 2, y - 9, 4, 10);
    // ตัวโคมไฟเรืองแสงอุ่น
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(x - 3, y - 8, 6, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 2, y - 7, 4, 3);
    // หลังคาโคมหิน
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 4, y - 10, 8, 2);

    // แสง Ambient Light สีส้มอบอุ่น
    const glow = Math.sin(this.animTick * 0.1) * 2;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y - 6, 12 + glow, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. ประตูมิติเกิดศัตรูพิกเซลอาร์ตแท้ (Monster Spawn Portal)
  drawSpawnPortal(c, r) {
    const { x, y } = this.gridToScreen(c, r);
    const ctx = this.ctx;
    ctx.save();

    // ฐานหินอักขระโบราณ
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(x, y + 2, 16, 0, Math.PI * 2);
    ctx.fill();

    // ซุ้มเสาหินรูน 2 ฝั่ง
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 14, y - 24, 5, 26);
    ctx.fillRect(x + 9, y - 24, 5, 26);
    // ทับหลังหินด้านบน
    ctx.fillRect(x - 16, y - 27, 32, 5);

    // อักขระรูนเรืองแสงบนเสาหิน
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 13, y - 18, 2, 3);
    ctx.fillRect(x - 13, y - 10, 2, 3);
    ctx.fillRect(x + 11, y - 18, 2, 3);
    ctx.fillRect(x + 11, y - 10, 2, 3);

    // วงเวทวังวนมิติสีม่วง-คราม (Swirling Void Vortex)
    const spin = this.animTick * 0.12;
    const pulse = Math.sin(this.animTick * 0.1) * 2;

    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 14;

    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(x, y - 10, 12 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(x, y - 10, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x, y - 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // สะเก็ดพลังงานเวทมนตร์ลอยขึ้น
    for (let i = 0; i < 4; i++) {
      const sparkY = (y - 5 - ((this.animTick * 1.2 + i * 8) % 28));
      const sparkX = x + Math.sin(this.animTick * 0.1 + i) * 8;
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(sparkX, sparkY, 2, 2);
    }

    ctx.restore();
  }

  // วาดโมเดลป้อมปราการ 3D / Sprite Sheet ตามสถาปัตยกรรมระดับพรีเมียม
  drawTowerModel(c, r, tower, isSelected = false) {
    const { x, y } = this.gridToScreen(c, r);
    const ctx = this.ctx;
    const id = tower.data.id;
    const era = tower.eraIndex;

    // คำนวณความคืบหน้าของการชาร์จ/ง้างยิง (Windup / Charge Animation Progress 0.0 - 1.0)
    const fireInterval = tower.data.fireRate || 1.0;
    const chargeProgress = Math.min(1.0, (tower.lastShot || 0) / fireInterval);

    // วงแหวนเมื่อคลิกเลือกป้อม (Top-Down Selection Ring)
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, this.tileSize * 0.44, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // แมปป้อมเข้ากับ Sprite Sheet คุณภาพสูงจากภาพที่กำหนด (3x3 Grid, 736x736, cell = 245px)
    // [0]=หอคอยไม้ซุงลูกศรคริสตัลม่วง [1]=ปราสาทหินหลังคาม่วง [2]=ป้อมหินเขาควายยอดเต็นท์
    // [3]=ปืนใหญ่เหล็กกล้าล้อไม้      [4]=ปืนใหญ่ทองเหลือง    [5]=หอคอยสายฟ้าเทสลาคริสตัลฟ้า
    // [6]=ป้อมน้ำแข็งไครโอคริสตัล     [7]=ป้อมหินปืนใหญ่ไฟ    [8]=ป้อมปราสาทเพลิงบรรลัยกัลป์
    // ครอบคลุมป้อมครบทุกชนิดในทั้ง 5 ยุค (21 แบบ) อย่างสมบูรณ์แบบ
    const TOWER_SPRITE_MAP = {
      // ยุค 0: ยุคหิน
      'stone_spear': 0,     // หอคอยไม้ซุงแหลมคม
      'stone_totem': 1,     // เสาโทเทมไฟคริสตัลม่วง
      'stone_hut': 2,       // กระต๊อบคนป่ายอดเต็นท์ชนเผ่า
      'stone_altar': 7,     // แท่นบูชาปรีชาญาณหินกลม
      'stone_sling': 8,     // หอขว้างหินเพลิง

      // ยุค 1: ยุคกลาง
      'med_archer': 0,      // หอพลธนูพิทักษ์
      'med_ballista': 4,    // หน้าไม้กลยักษ์ทองเหลือง
      'med_catapult': 3,    // เครื่องดีดหินเพลิง/ปืนใหญ่เหล็กกล้า
      'med_mill': 7,        // กังหันลมหลวงฐานหิน

      // ยุค 2: ยุคอุตสาหกรรม
      'ind_gatling': 4,     // ป้อมปืนกลแกตลิ่งทองเหลือง
      'ind_cannon': 3,      // ปืนใหญ่เหล็กกล้าดินปืน
      'ind_tesla': 5,       // หอคอยสายฟ้าเทสลาคริสตัลฟ้า
      'ind_factory': 7,     // โรงงานจักรไอน้ำฐานเตาหลอม

      // ยุค 3: ยุคปัจจุบัน
      'mod_missile': 3,     // ฐานจรวด SAM
      'mod_laser': 5,       // ป้อมแสงเลเซอร์ความถี่สูง
      'mod_cryo': 6,        // ป้อมไนโตรเจนเหลวคริสตัลน้ำแข็ง
      'mod_lab': 1,         // สถาบันวิจัยนิวเคลียร์

      // ยุค 4: ยุคอวกาศ
      'spc_antimatter': 8,  // ปืนใหญ่ปฏิสสาร
      'spc_orbital': 5,     // บีมวงโคจรดาวเทียม
      'spc_chronos': 6,     // เครื่องบิดเบือนเวลา
      'spc_dyson': 2        // เครื่องกำเนิดพลังงานดวงดาวไดสัน
    };

    const spriteIdx = TOWER_SPRITE_MAP[id];
    if (this.towerSheetReady && spriteIdx !== undefined && this.cleanTowerCanvases[spriteIdx]) {
      ctx.save();

      const cleanCanvas = this.cleanTowerCanvases[spriteIdx];
      const targetW = this.tileSize * 1.15;
      const targetH = this.tileSize * 1.15;

      // ฐานตั้งติดแนบสนิทกับแท่นกระเบื้อง Isometric พอดีเป๊ะ ไม่ลอย ไม่เอียง ไม่มีเงาดำ
      ctx.translate(x, y + this.tileSize * 0.16);

      // เอฟเฟกต์แสงออร่าเวลาชาร์จพลังงานใกล้เต็ม (Glow Flare)
      if (chargeProgress > 0.8) {
        ctx.shadowColor = tower.data.color || '#38bdf8';
        ctx.shadowBlur = (chargeProgress - 0.8) * 35;
      }

      // วาดตัวฐานของป้อมปราการ (Base Body)
      ctx.drawImage(cleanCanvas, -targetW / 2, -targetH, targetW, targetH);

      // ถ้าเป็นป้อมโจมตี/ซัพพอร์ต (ไม่ใช่ป้อมฟาร์มเศรษฐกิจ): วาดหัวป้อม/กระบอกปืนหันหมุนตามมอนสเตอร์
      if (tower.data.type !== 'economy' && tower.data.type !== 'research') {
        const aimAngle = tower.rotation !== undefined ? tower.rotation : -Math.PI / 4;
        const headPivotY = -targetH * 0.62; // จุดกึ่งกลางหัวป้อม
        
        ctx.save();
        ctx.translate(0, headPivotY);

        // วาดกระบอกปืน / ปลายหอก / ลำกล้องเลเซอร์ หันตามมุมเล็งเป้าหมายมอนสเตอร์
        const muzzleLen = this.tileSize * 0.38;
        const barrelColor = tower.data.projColor || tower.data.color || '#f59e0b';
        
        // เงากระบอกปืน
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.lineWidth = Math.max(2, this.tileSize * 0.07);
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(Math.cos(aimAngle) * (muzzleLen + 2), Math.sin(aimAngle) * (muzzleLen * 0.55 + 2));
        ctx.stroke();

        // ตัวลำกล้องปืน/ทิศทางเล็ง (Turret Barrel / Aim Indicator)
        ctx.strokeStyle = barrelColor;
        ctx.lineWidth = Math.max(2, this.tileSize * 0.06);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(aimAngle) * muzzleLen, Math.sin(aimAngle) * (muzzleLen * 0.55));
        ctx.stroke();

        // หัวกระบอกปืนเรืองแสงตามพลังงานชาร์จ
        const tipX = Math.cos(aimAngle) * muzzleLen;
        const tipY = Math.sin(aimAngle) * (muzzleLen * 0.55);
        ctx.fillStyle = chargeProgress > 0.7 ? '#ffffff' : barrelColor;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2.5 + chargeProgress * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // ข้อต่อหมุนใจกลางหัวป้อม (Turret Turntable Joint)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();
      return;
    }

    ctx.save();

    // ================== ยุคหิน (STONE AGE) ==================
    if (era === 0) {
      if (id === 'stone_sling') {
        // หอคอยไม้ซุง 4 ขา + ตะกร้าหินด้านบนหมุนเหวี่ยงสลิงตามการง้าง
        this.drawWoodenLegs(ctx, x, y, 28);
        const slingAngle = chargeProgress * Math.PI * 2;
        const slingRadius = 8 + chargeProgress * 4;
        const slingX = x + Math.cos(slingAngle) * slingRadius;
        const slingY = y - 30 + Math.sin(slingAngle) * (slingRadius * 0.5);

        // เชือกสลิง
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 28);
        ctx.lineTo(slingX, slingY);
        ctx.stroke();

        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.arc(slingX, slingY, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (id === 'stone_spear') {
        // เสาหินขนาดใหญ่ + หอกไม้ง้างถอยหลังเตรียมพุ่งแทง
        this.drawPillar(ctx, x, y, 16, 26, '#78716c', '#57534e');
        // ง้างหอกถอยหลังตาม chargeProgress (ยิ่งใกล้ 1 ยิ่งดึงถอยหลังสุดตัว)
        const spearPullback = (1.0 - chargeProgress) * 9;
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 6 - spearPullback, y - 20 + spearPullback * 0.5);
        ctx.lineTo(x + 10 - spearPullback, y - 42 + spearPullback * 0.5);
        ctx.stroke();
        // หัวหอกหิน
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(x + 10 - spearPullback, y - 42 + spearPullback * 0.5);
        ctx.lineTo(x + 14 - spearPullback, y - 46 + spearPullback * 0.5);
        ctx.lineTo(x + 6 - spearPullback, y - 45 + spearPullback * 0.5);
        ctx.closePath();
        ctx.fill();
      } else if (id === 'stone_totem') {
        // เสาโทเทมไฟเพลิง + เปลวไฟรวมพลังสะสมก่อนปล่อยคลื่นไฟ (Fire Charge Flare)
        this.drawPillar(ctx, x, y, 14, 30, '#b45309', '#78350f');
        const flameOffset = Math.sin(this.animTick * 0.15) * 2;
        const flameSize = 5 + chargeProgress * 7; // ลูกไฟขยายใหญ่ขึ้นเมื่อพลังสะสมเต็ม
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(x, y - 34 + flameOffset, flameSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(x, y - 35 + flameOffset, flameSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // กระต๊อบคนป่า หลังคาฟาง
        this.drawPillar(ctx, x, y, 18, 14, '#a16207', '#713f12');
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.moveTo(x, y - 28);
        ctx.lineTo(x + 16, y - 14);
        ctx.lineTo(x - 16, y - 14);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ================== ยุคกลาง (MEDIEVAL) ==================
    else if (era === 1) {
      if (id === 'med_archer') {
        // ป้อมปราการหินฉลุช่องมอง + คันธนูง้างสาย (Bowstring Drawback)
        this.drawPillar(ctx, x, y, 18, 34, '#94a3b8', '#64748b');
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x - 10, y - 40, 5, 6);
        ctx.fillRect(x + 5, y - 40, 5, 6);

        // ง้างสายธนูบนยอดป้อม
        const bowPull = chargeProgress * 6;
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + 4, y - 46, 9, -0.6, 1.4);
        ctx.stroke();
        // สายเอ็นธนูดึงถอยหลัง
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 53);
        ctx.lineTo(x + 4 - bowPull, y - 46);
        ctx.lineTo(x + 10, y - 39);
        ctx.stroke();
      } else if (id === 'med_ballista') {
        // ฐานหินเตี้ย + คันหน้าไม้กลยักษ์ที่ดึงสายสปริงตึง
        this.drawPillar(ctx, x, y, 18, 16, '#64748b', '#475569');
        const pull = chargeProgress * 8;
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y - 24, 14, Math.PI * 0.8, Math.PI * 1.8);
        ctx.stroke();
        // ลูกศรเหล็กพาดพร้อมยิง
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 12 - pull * 0.5, y - 20 + pull * 0.3);
        ctx.lineTo(x + 12 - pull * 0.5, y - 30 + pull * 0.3);
        ctx.stroke();
      } else if (id === 'med_catapult') {
        // เครื่องดีดหินเพลิง Trebuchet กระดกคานดีดตามการหมุนกว้าน (Catapult Windup Arm)
        this.drawWoodenLegs(ctx, x, y, 22);
        // คานกระดก: เริ่มต้นจากชี้ลงต่ำ (ง้าง) แล้วกระดกขึ้น
        const armTilt = (1 - chargeProgress) * 0.6; // มุมเอียงกว้าน
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 10);
        ctx.lineTo(x + 12 + armTilt * 12, y - 36 + armTilt * 15);
        ctx.stroke();
        // ก้อนหินติดไฟในตะกร้า
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(x + 12 + armTilt * 12, y - 36 + armTilt * 15, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // กังหันลมใบพัดหมุน
        this.drawPillar(ctx, x, y, 16, 26, '#e2e8f0', '#94a3b8');
        const rot = this.animTick * 0.04;
        ctx.save();
        ctx.translate(x, y - 26);
        ctx.rotate(rot);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -18);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ================== ยุคอุตสาหกรรม (INDUSTRIAL) ==================
    else if (era === 2) {
      if (id === 'ind_gatling') {
        // ป้อมเหล็กกล้า + ลำกล้องปืนกล 6 ลำหมุน
        this.drawPillar(ctx, x, y, 16, 20, '#475569', '#334155');
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x - 6, y - 28, 12, 8);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 6, y - 28, 12, 8);
      } else if (id === 'ind_cannon') {
        // ปืนใหญ่ Howitzer ลำกล้องเฉียงเหล็กหล่อ
        this.drawPillar(ctx, x, y, 20, 16, '#334155', '#1e293b');
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 18);
        ctx.lineTo(x + 16, y - 34);
        ctx.stroke();
      } else if (id === 'ind_tesla') {
        // หอคอยเทสลา ลูกแก้วสายฟ้า
        this.drawPillar(ctx, x, y, 12, 32, '#0284c7', '#0369a1');
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, y - 36, 9, 0, Math.PI * 2);
        ctx.fill();
        // เส้นอาร์กไฟฟ้า
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        const spark = (Math.random() - 0.5) * 8;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 36);
        ctx.lineTo(x + spark, y - 48);
        ctx.stroke();
      } else {
        // โรงงานพร้อมปล่องควันพ่นไอน้ำ
        this.drawPillar(ctx, x, y, 22, 18, '#854d0e', '#582b0c');
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 4, y - 32, 6, 14);
        // ละอองควัน
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x + 7, y - 36 - ((this.animTick % 30) * 0.4), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ================== ยุคปัจจุบัน (MODERN) ==================
    else if (era === 3) {
      if (id === 'mod_missile') {
        // ฐานยิงขีปนาวุธจรวด 4 ลูก
        this.drawPillar(ctx, x, y, 18, 16, '#1e293b', '#0f172a');
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x - 8, y - 28, 4, 12);
        ctx.fillRect(x - 2, y - 32, 4, 14);
        ctx.fillRect(x + 4, y - 28, 4, 12);
        ctx.fillStyle = '#ef4444'; // หัวรบแดง
        ctx.fillRect(x - 8, y - 30, 4, 3);
        ctx.fillRect(x - 2, y - 34, 4, 3);
        ctx.fillRect(x + 4, y - 30, 4, 3);
      } else if (id === 'mod_laser') {
        // จานเลเซอร์ไฮเทคเรืองแสงสีฟ้า
        this.drawPillar(ctx, x, y, 14, 28, '#334155', '#1e293b');
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(x, y - 32, 12, 6, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (id === 'mod_cryo') {
        // ป้อมแช่แข็ง Cryo มีโดมน้ำแข็งเรืองแสง
        this.drawPillar(ctx, x, y, 16, 22, '#0284c7', '#0369a1');
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.arc(x, y - 28, 10, Math.PI, 0);
        ctx.fill();
      } else {
        // โดมศูนย์วิจัยไฮเทค
        this.drawPillar(ctx, x, y, 22, 14, '#475569', '#334155');
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y - 18, 10, Math.PI, 0);
        ctx.fill();
      }
    }

    // ================== ยุคอวกาศ (GALACTIC SPACE) ==================
    else {
      if (id === 'spc_antimatter') {
        // วงแหวนควอนตัมลอยอยู่กลางอากาศ
        this.drawPillar(ctx, x, y, 12, 18, '#3b0764', '#1e0538');
        const floatY = Math.sin(this.animTick * 0.08) * 4;
        ctx.shadowColor = '#bd00ff';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(x, y - 32 + floatY, 14, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y - 32 + floatY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (id === 'spc_orbital') {
        // เสาส่งสัญญาณบีมอวกาศ สูงเพรียวเรืองแสง
        this.drawPillar(ctx, x, y, 10, 38, '#065f46', '#022c22');
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(x, y - 44, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (id === 'spc_chronos') {
        // ผลึกคริสตัลกาลเวลา 8 เหลี่ยมลอยหมุน
        this.drawPillar(ctx, x, y, 14, 18, '#831843', '#500724');
        const floatY = Math.cos(this.animTick * 0.08) * 4;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.moveTo(x, y - 42 + floatY);
        ctx.lineTo(x + 9, y - 30 + floatY);
        ctx.lineTo(x, y - 18 + floatY);
        ctx.lineTo(x - 9, y - 30 + floatY);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Dyson Node แท่นพลังงานดวงดาว
        this.drawPillar(ctx, x, y, 20, 20, '#713f12', '#451a03');
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(x, y - 28, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // แสดงเลเวลป้อม Lv.Badge ด้านบน
    if (tower.level > 1 || tower.isStrategicDais) {
      const badgeText = tower.isStrategicDais ? `👑Lv.${tower.level}` : `Lv.${tower.level}`;
      const badgeW = tower.isStrategicDais ? 38 : 28;
      ctx.fillStyle = tower.isStrategicDais ? 'rgba(120, 53, 15, 0.9)' : 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = tower.isStrategicDais ? '#facc15' : 'transparent';
      ctx.lineWidth = 1;
      ctx.fillRect(x - badgeW / 2, y - 56, badgeW, 13);
      if (tower.isStrategicDais) ctx.strokeRect(x - badgeW / 2, y - 56, badgeW, 13);
      ctx.fillStyle = tower.isStrategicDais ? '#fef08a' : '#fde047';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, x, y - 46);
    }

    // วงแหวนออร่าประกายทองใต้ฐานป้อมสำหรับป้อมที่สร้างบนแท่นยุทธศาสตร์ (High Ground Aura)
    if (tower.isStrategicDais) {
      const auraPulse = Math.sin(this.animTick * 0.08 + c + r) * 2;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, this.tileSize * 0.42 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // วาดเสาหลัก Top-Down / บล็อกอาคารตรง
  drawPillar(ctx, x, y, w, h, lightCol, darkCol) {
    const hw = w / 2;
    // ฐานล่างเงา
    ctx.fillStyle = darkCol;
    ctx.fillRect(x - hw, y - h, w, h);
    // ด้านบนไฮไลท์
    ctx.fillStyle = lightCol;
    ctx.fillRect(x - hw + 2, y - h + 2, w - 4, h - 4);
    // ขอบคม
    ctx.strokeStyle = darkCol;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - hw, y - h, w, h);
  }

  // วาดขาค้ำไม้ 4 ขา
  drawWoodenLegs(ctx, x, y, h) {
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 4);
    ctx.lineTo(x, y - h);
    ctx.moveTo(x + 12, y + 4);
    ctx.lineTo(x, y - h);
    ctx.stroke();
  }

  // วาดศูนย์กลางเมือง (Nexus) โมเดล Top-Down ขนาดยักษ์อลังการสมเป็นมหาปราการศูนย์กลาง
  drawNexus(c, r, hp, maxHp, eraIndex) {
    const { x, y } = this.gridToScreen(c, r);
    const ctx = this.ctx;

    ctx.save();

    // รัศมีสนามพลังเรืองแสงรอบฐานเมือง
    const glowColor = eraIndex === 0 ? '#f59e0b' : (eraIndex === 1 ? '#3b82f6' : (eraIndex === 2 ? '#f97316' : (eraIndex === 3 ? '#06b6d4' : '#bd00ff')));
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, this.tileSize * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (eraIndex === 0) {
      // ยุคหิน: มหาหมู่อภิมหาวิหารสโตนเฮนจ์หินยักษ์ + กองไฟศักดิ์สิทธิ์ใจกลาง
      this.drawPillar(ctx, x - 18, y, 14, 30, '#78716c', '#57534e');
      this.drawPillar(ctx, x + 18, y, 14, 30, '#78716c', '#57534e');
      this.drawPillar(ctx, x, y - 10, 16, 38, '#a8a29e', '#78716c');

      // คานหินทับหลังยักษ์
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(x - 26, y - 38, 52, 10);

      // กองเพลิงศักดิ์สิทธิ์ใจกลางวิหาร
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x, y - 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x, y - 8, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (eraIndex === 1) {
      // ยุคกลาง: มหาปราสาทหลวงป้อมปราการ 3 หอคอย ธงศึกปลิวไสว
      // กำแพงฐานหินหน้า
      this.drawPillar(ctx, x, y, 44, 32, '#94a3b8', '#64748b');
      // หอคอยปีกซ้าย-ขวา
      this.drawPillar(ctx, x - 18, y - 6, 16, 42, '#cbd5e1', '#94a3b8');
      this.drawPillar(ctx, x + 18, y - 6, 16, 42, '#cbd5e1', '#94a3b8');
      // หอกลางหลังคาจอมราชันย์
      this.drawPillar(ctx, x, y - 24, 22, 28, '#f1f5f9', '#cbd5e1');

      // หลังคาทรงกรวยสีน้ำเงินรอยัลบลู 3 ยอด
      const drawRoof = (rx, ry, rw, rh) => {
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.moveTo(rx, ry - rh);
        ctx.lineTo(rx + rw, ry);
        ctx.lineTo(rx - rw, ry);
        ctx.closePath();
        ctx.fill();
      };
      drawRoof(x - 18, y - 48, 11, 20);
      drawRoof(x + 18, y - 48, 11, 20);
      drawRoof(x, y - 52, 14, 26);

      // ธงศึกสีแดงยอดปราสาท
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y - 82, 12, 7);

    } else if (eraIndex === 2) {
      // ยุคอุตสาหกรรม: มหานครจักรกลไอน้ำ หอนาฬิกาฟันเฟืองทองเหลือง & ปล่องควันไอพ่น
      this.drawPillar(ctx, x, y, 38, 36, '#b45309', '#78350f');
      this.drawPillar(ctx, x - 12, y - 10, 16, 52, '#d97706', '#92400e');
      this.drawPillar(ctx, x + 14, y - 8, 12, 46, '#78350f', '#451a03');

      // หน้าปัดนาฬิกาเรืองแสงทอง
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x - 12, y - 50, 7, 0, Math.PI * 2);
      ctx.fill();

      // ควันไอน้ำพวยพุ่งจากปล่อง
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x + 14, y - 60, 6, 0, Math.PI * 2);
      ctx.arc(x + 16, y - 72, 8, 0, Math.PI * 2);
      ctx.fill();

    } else if (eraIndex === 3) {
      // ยุคปัจจุบัน: ศูนย์บัญชาการกลาโหมไฮเทค เรดาร์โดมหมุนวน & ตึกระฟ้าเกราะสะท้อนแสง
      this.drawPillar(ctx, x, y, 42, 40, '#1e293b', '#0f172a');
      this.drawPillar(ctx, x - 10, y - 15, 20, 56, '#0284c7', '#0369a1');
      this.drawPillar(ctx, x + 12, y - 10, 18, 48, '#38bdf8', '#0284c7');

      // เรดาร์โดมสแกนเนอร์ทรงกลม
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x - 10, y - 76, 8, 0, Math.PI * 2);
      ctx.fill();

      // ลำแสงสแกนเนอร์สีเขียว
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 76);
      ctx.lineTo(x - 10 + Math.cos(this.animTick * 0.1) * 20, y - 76 + Math.sin(this.animTick * 0.1) * 8);
      ctx.stroke();

    } else {
      // ยุคอวกาศ: ยานแม่ศูนย์กลางคอสมิก คอร์ปฏิสสารลอยหมุนกลางเวหา
      this.drawPillar(ctx, x, y, 36, 28, '#2e1065', '#0f051d');

      // แท่นพลังงานวงแหวนลอย
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.ellipse(x, y - 36, 32, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // แกนคอร์ปฏิสสารเรืองแสงลอยอยู่เหนือฐาน
      const hoverY = Math.sin(this.animTick * 0.1) * 5;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(x, y - 62 + hoverY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // หลอดเลือด HP Bar
    const hpRatio = Math.max(0, hp / maxHp);
    const barW = 54;
    const barH = 6;
    const barY = y - 72;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - barW / 2, barY, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(x - barW / 2, barY, barW * hpRatio, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barW / 2, barY, barW, barH);
  }

  // วาดศัตรู 2.5D Animated Character Sprite (ขยับดุ๊กดิ๊ก เดิน กระพือปีก)
  drawEnemy(enemy) {
    const { x, y } = this.gridToScreen(enemy.gridX, enemy.gridY, 0);
    // Dynamic Wiggle & Lateral Drifting: ให้มอนสเตอร์เคลื่อนที่ส่ายไปมาอย่างมีชีวิตชีวา
    const driftWiggle = Math.sin(this.animTick * 0.08 + (enemy.driftPhase || 0)) * 4;
    const laneOffX = (enemy.laneOffset || 0) * (this.tileSize * 0.22) + driftWiggle;
    const laneOffY = (enemy.laneOffset || 0) * (this.tileSize * 0.22);
    unitRenderer.drawAnimatedEnemy(this.ctx, x + laneOffX, y + laneOffY, enemy, this.animTick);
  }

  drawProjectile(proj) {
    const { x, y } = this.gridToScreen(proj.x, proj.y, 0);
    const ctx = this.ctx;
    const targetScreen = this.gridToScreen(proj.target.gridX, proj.target.gridY, 0);
    const angle = Math.atan2(targetScreen.y - y, targetScreen.x - x);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const dmgType = proj.damageType || 'blunt';
    const color = proj.color || '#f59e0b';

    if (dmgType === 'pierce') {
      // ลูกศร หรือ หอกพุ่งแหลมคม
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-7, -3);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 3);
      ctx.closePath();
      ctx.fill();

      // เส้นลูกศร / ปลายขนนก
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
    } else if (dmgType === 'magic') {
      // คอร์พลังงานเวทมนตร์ / คอสมิก มีวงแหวนหมุนรอบ
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // วงประกายพลังงาน
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3, this.animTick * 0.1, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // blunt / explosive / หินระเบิดดินปืน
      if (proj.splash > 0) {
        // หัวรบขีปนาวุธ หรือ กระสุนปืนใหญ่ดินปืนมีควัน
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        // ตัวหัวรบ/ลูกระเบิด
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // เปลวไฟขับดันด้านท้าย
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-6, 2);
        ctx.closePath();
        ctx.fill();
      } else {
        // ก้อนหินสลิงเกอร์ กระสุนทองเหลือง
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(-1.5, -1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // วาดแอนิเมชันลูกอุกกาบาตยักษ์พุ่งดิ่งลงจากฟ้าลงสู่เป้าหมาย (Epic Meteor Strike Animation - Optimized)
  drawMeteorSpell(spellAnim) {
    if (!spellAnim) return;
    const { targetC, targetR, timer, duration, type } = spellAnim;
    const progress = Math.min(1.0, timer / duration);
    const { x: groundX, y: groundY } = this.gridToScreen(targetC, targetR, 0);
    const ctx = this.ctx;

    ctx.save();

    if (type === 'blizzard') {
      // แอนิเมชันพายุหิมะเยือกแข็ง (Swirling Blizzard Storm)
      const ringRadius = 48 * progress;
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.8 - progress * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(groundX, groundY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // ผลึกน้ำแข็งลอยหมุนวน
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI * 2 / 6) * i + (this.animTick * 0.2);
        const dist = 32 * progress;
        const fx = groundX + Math.cos(ang) * dist;
        const fy = groundY + Math.sin(ang) * dist;
        ctx.fillStyle = '#c3f4fe';
        ctx.fillRect(fx - 2, fy - 2, 4, 4);
      }
    } else if (type === 'lightning') {
      // แอนิเมชันสายฟ้าฟาดจากฟ้า (Sky Lightning Bolt)
      const boltStartY = groundY - 320;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(groundX + (Math.random() - 0.5) * 30, boltStartY);
      ctx.lineTo(groundX + (Math.random() - 0.5) * 15, groundY - 180);
      ctx.lineTo(groundX + (Math.random() - 0.5) * 20, groundY - 70);
      ctx.lineTo(groundX, groundY + 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // ฝนอุกกาบาต (Meteor Strike)
      const startX = groundX + 180;
      const startY = groundY - 360;

      const curX = startX + (groundX - startX) * progress;
      const curY = startY + (groundY - startY) * progress;

      // 1. วงแหวนเป้าหมายสีแดงเตือนภัยบนพื้นดิน (Ground Target Reticle)
      const reticleRadius = 36 * (1 - progress * 0.25);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + progress * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(groundX, groundY, reticleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. หางเพลิงและควันไฟพุ่งตามหลังอุกกาบาต (Flame Trail)
      const trailLength = 70;
      const angle = Math.atan2(groundY - startY, groundX - startX);
      const tailX = curX - Math.cos(angle) * trailLength;
      const tailY = curY - Math.sin(angle) * trailLength;

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(curX - Math.cos(angle) * (trailLength * 0.6), curY - Math.sin(angle) * (trailLength * 0.6));
      ctx.stroke();

      // 3. หัวอุกกาบาตหินหลอมเหลว (Meteor Core)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(curX, curY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  adjustBrightness(hex, percent) {
    let num = parseInt(hex.replace('#', ''), 16);
    if (isNaN(num)) return '#333333';
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }
}
