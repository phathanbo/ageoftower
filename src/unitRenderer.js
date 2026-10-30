// Resolve image URL (compatible with Vite bundled builds, Vite dev server, and native static servers)
const enemySheetUrl = new URL('./enemy_spritesheet.jpg', import.meta.url).href;

// โหลด Enemy Sprite Sheet รูปภาพมอนสเตอร์พิกเซลอาร์ตคุณภาพสูงระดับ 32-bit (Aseprite Masterwork)
const _enemySheetImg = new Image();
_enemySheetImg.src = enemySheetUrl;

// 2.5D Animated Character Canvas Sprite Renderer (Aseprite-Style Pixel Art Monster Engine)
export class UnitRenderer {
  constructor() {
    this.sheetReady = false;
    this.cleanEnemyCanvases = []; // อาร์เรย์เก็บ Sprite มอนสเตอร์แต่ละตัวที่ตัดพื้นหลังเรียบร้อย
    _enemySheetImg.onload = () => {
      this.initCleanEnemySprites();
      this.sheetReady = true;
    };
    if (_enemySheetImg.complete) {
      this.initCleanEnemySprites();
      this.sheetReady = true;
    }
  }

  // ไดคัทและแบ่งช่อง Sprite Sheet มอนสเตอร์ 6 ตัว (2 แถว x 3 คอลัมน์)
  initCleanEnemySprites() {
    if (!_enemySheetImg.width || this.cleanEnemyCanvases.length > 0) return;
    const sheetW = _enemySheetImg.width;
    const sheetH = _enemySheetImg.height;
    const cols = 3;
    const rows = 2;
    const cellW = Math.floor(sheetW / cols);
    const cellH = Math.floor(sheetH / rows);

    for (let idx = 0; idx < 6; idx++) {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const sx = col * cellW;
      const sy = row * cellH;

      const c = document.createElement('canvas');
      c.width = cellW;
      c.height = cellH;
      const cctx = c.getContext('2d');
      cctx.drawImage(_enemySheetImg, sx, sy, cellW, cellH, 0, 0, cellW, cellH);

      // ตัดพื้นหลัง กรอบการ์ด และแถบป้ายตัวหนังสือข้างล่างออกอย่างหมดจด 100%
      try {
        const imgData = cctx.getImageData(0, 0, cellW, cellH);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const pixelIdx = i / 4;
          const py = Math.floor(pixelIdx / cellW);
          const px = pixelIdx % cellW;

          // ตัดแถบป้ายตัวหนังสือ/แบนเนอร์ด้านล่างการ์ดออกทั้งหมด (y >= 348)
          if (py >= 348) {
            data[i + 3] = 0;
            continue;
          }

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 1. ขอบมืดรอบนอกและเส้นขอบกรอบการ์ด (Dark outer border & card lines)
          const isDarkBorder = (r < 38 && g < 46 && b < 58);

          // 2. พื้นหลังกระดานสีเทาอมฟ้าในช่องการ์ด (Slate blue-gray background)
          // ค่ามาตรฐานของพื้นหลังใน Spritesheet: R ~ 35-68, G ~ 46-78, B ~ 56-92 โดยที่ B >= G และ B - R >= 7
          const isSlateBg = (r >= 34 && r <= 68 && g >= 44 && g <= 78 && b >= 54 && b <= 92 && (b - r) >= 7);

          // 3. ขอบสีเทาเข้มรอยต่อ (Anti-aliased border feathering)
          const isEdgeTint = (r >= 26 && r <= 48 && g >= 36 && g <= 58 && b >= 46 && b <= 68 && Math.abs(g - r) < 14);

          if (isDarkBorder || isSlateBg || isEdgeTint) {
            data[i + 3] = 0; // ตัดพื้นหลังออกให้โปร่งใสสนิท
          }
        }
        cctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.warn('Enemy sprite cutout skipped:', err);
      }

      this.cleanEnemyCanvases.push(c);
    }
  }

  // วาดและอนิเมตมอนสเตอร์พิกเซลอาร์ตแท้ 32-bit (พร้อมแอนิเมชันก้าวเดินตามน้ำหนักตัว)
  drawAnimatedEnemy(ctx, x, y, enemy, animTick) {
    ctx.save();

    // มอนสเตอร์พรางตัว (Stealthed): ถ้ายังไม่ถูกเปิดเผย จะโปร่งแสงลงเหลือ 35%
    if (enemy.isStealthed) {
      ctx.globalAlpha = 0.38;
    }

    // 1. คำนวณจังหวะก้าวเดิน (Stepping Bobbing & Squash) ตามน้ำหนักของมอนสเตอร์
    const isHeavy = enemy.isBoss || enemy.id === 'mammoth' || enemy.id === 'railgun_tank';
    const stepSpeed = isHeavy ? 0.15 : 0.28;
    const walkCycle = Math.sin((animTick * stepSpeed) * enemy.speed);
    const breathe = Math.sin(animTick * 0.12) * (isHeavy ? 1.0 : 1.8);
    const bodyTilt = isHeavy ? (walkCycle * 0.04) : (walkCycle * 0.08); // ตัวหนักจะโยกน้อยกว่า
    const squashX = 1 + Math.abs(walkCycle) * (isHeavy ? 0.04 : 0.09);
    const squashY = 1 - Math.abs(walkCycle) * (isHeavy ? 0.04 : 0.09);

    // เงาใต้เท้า 2.5D Isometric (Pixel Shadow)
    const shadowScale = 1 - Math.abs(walkCycle) * 0.08;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, Math.max(14, enemy.size * 0.88) * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y + breathe);
    ctx.rotate(bodyTilt);
    ctx.scale(squashX, squashY);

    // Hit Flash Effect: เมื่อโดนโจมตี จะกระพริบแสงสว่างวาบ (Pixel Damage Flash)
    const isHit = (enemy.hitFlashTimer && enemy.hitFlashTimer > 0);
    if (isHit) {
      ctx.filter = 'brightness(2.6) drop-shadow(0 0 6px #ffffff)';
    }

    const id = enemy.id || 'sabertooth';

    // ดัชนีใน Spritesheet 2x3 Grid:
    // [0] = Sabertooth Beast (เสือเขี้ยวดาบ)
    // [1] = Armored Knight / Goblin (อัศวินเกราะเหล็ก)
    // [2] = Steampunk Automaton (จักรกลไอน้ำ)
    // [3] = Cyber Hover Tank (รถถังไซเบอร์)
    // [4] = Void Stalker (ปิศาจมิติ)
    // [5] = Armored War Mammoth Boss (จอมทัพบอสแมมมอธ)
    const ENEMY_SPRITE_MAP = {
      'sabertooth': 0,
      'mammoth': 5,
      'shield_infantry': 1,
      'armored_knight': 1,
      'automaton': 2,
      'zeppelin': 2,
      'cyber_apc': 3,
      'railgun_tank': 3,
      'void_stalker': 4,
      'boss': 5
    };

    const spriteIdx = enemy.isBoss ? 5 : (ENEMY_SPRITE_MAP[id] !== undefined ? ENEMY_SPRITE_MAP[id] : 0);

    let drewSprite = false;
    if (this.cleanEnemyCanvases[spriteIdx]) {
      const spriteCanvas = this.cleanEnemyCanvases[spriteIdx];
      // ปรับขนาดสเกลตามขนาดของมอนสเตอร์แต่ละประเภท
      const renderSize = enemy.isBoss ? Math.max(68, enemy.size * 2.3) : Math.max(42, enemy.size * 1.6);
      ctx.drawImage(
        spriteCanvas,
        -renderSize / 2,
        -renderSize * 0.85,
        renderSize,
        renderSize
      );
      drewSprite = true;
    }

    // Fallback กรณีที่กำลังโหลด Spritesheet
    if (!drewSprite) {
      if (id === 'sabertooth') {
        this.drawBeast(ctx, '#f59e0b', walkCycle * 4, false);
      } else if (id === 'mammoth') {
        this.drawMammoth(ctx, '#78716c', walkCycle * 4, animTick);
      } else if (id === 'shield_infantry' || id === 'armored_knight') {
        this.drawArmoredGoblin(ctx, '#475569', '#f59e0b', walkCycle * 4, true);
      } else if (id === 'automaton' || id === 'zeppelin') {
        this.drawMech(ctx, '#d97706', walkCycle * 4);
      } else if (id === 'cyber_apc' || id === 'railgun_tank') {
        this.drawHoverTank(ctx, '#0284c7', animTick, true);
      } else if (id === 'void_stalker') {
        this.drawVoidImp(ctx, '#a855f7', walkCycle * 4, animTick);
      } else {
        this.drawColossusBoss(ctx, '#ec4899', animTick);
      }
    }

    // วาดเอฟเฟกต์ Traits พิเศษของมอนสเตอร์
    // 1. บาเรียพลังงานสีฟ้าเรืองแสง (Shielded Trait)
    if (enemy.shield && enemy.shield > 0) {
      const shieldPulse = Math.sin(animTick * 0.15) * 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, -18, (enemy.size || 18) * 1.35 + shieldPulse, (enemy.size || 18) * 1.1 + shieldPulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 2. ออร่าฮีลเลอร์สีเขียวธรรมชาติ (Healer Trait)
    if (enemy.trait === 'healer') {
      const healPulse = Math.sin(animTick * 0.12) * 3;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -6, (enemy.size || 18) + healPulse, ((enemy.size || 18) + healPulse) * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // สัญลักษณ์กากบาทแพทย์สีเขียวลอยเหนือหัว
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-2, -38, 4, 10);
      ctx.fillRect(-5, -35, 10, 4);
    }

    // 3. สถานะพรางตัวกึ่งโปร่งแสง (Stealthed Trait)
    if (enemy.isStealthed) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, -16, (enemy.size || 18) * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // 2. หลอดเลือด HP Bar สไตล์ Pixel HUD
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
    const isBoss = enemy.isBoss;
    const barW = isBoss ? Math.max(62, enemy.size * 2.2) : Math.max(30, enemy.size * 1.6);
    const barH = isBoss ? 8 : 5;
    const barY = isBoss ? y - 56 : y - 40;

    // ออร่ามงกุฎบอส
    if (isBoss) {
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`👑 ${enemy.title || enemy.name}`, x, barY - 5);
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(x - barW / 2, barY, barW, barH);
    ctx.fillStyle = isBoss ? (hpRatio > 0.5 ? '#ef4444' : '#b91c1c') : (hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444');
    ctx.fillRect(x - barW / 2, barY, barW * hpRatio, barH);
    ctx.strokeStyle = isBoss ? '#fde047' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = isBoss ? 1.8 : 0.8;
    ctx.strokeRect(x - barW / 2, barY, barW, barH);

    // หลอดบาเรีย Shield สีฟ้าเหนือหลอดเลือด
    if (enemy.shield && enemy.maxShield && enemy.shield > 0) {
      const shieldRatio = Math.min(1, enemy.shield / enemy.maxShield);
      const shieldBarY = barY - 4;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(x - barW / 2, shieldBarY, barW, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x - barW / 2, shieldBarY, barW * shieldRatio, 3);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - barW / 2, shieldBarY, barW, 3);
    }
  }

  // 1. เสือเขี้ยวดาบ / สัตว์ 4 ขาดึกดำบรรพ์
  drawBeast(ctx, color, leg, hasHorns) {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-8 - leg, -4, 4, 8);
    ctx.fillRect(4 + leg, -4, 4, 8);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -8, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(8, -14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, -16, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(11, -15, 1.5, 2);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(11, -11);
    ctx.lineTo(13, -6);
    ctx.lineTo(9, -10);
    ctx.closePath();
    ctx.fill();
  }

  // 2. แมมมอธดึกดำบรรพ์เวอร์ชันการ์ตูน 2.5D ละเอียด (ขยับงวง + งายักษ์ + ขนฟู + เท้ากลม)
  drawMammoth(ctx, color, leg, animTick) {
    const trunkWiggle = Math.sin(animTick * 0.2) * 4;

    // 2.1 ขา 4 ข้างทรงกระบอกเท้าช้าง (หน้า-หลัง ซ้าย-ขวา) มีเล็บเท้าสีครีม
    // ขาหลังคู่
    ctx.fillStyle = '#44403c';
    this.drawElephantLeg(ctx, -14 - leg, -6, 7, 12);
    this.drawElephantLeg(ctx, -6 + leg, -6, 7, 12);
    // ขาหน้าคู่
    this.drawElephantLeg(ctx, 4 + leg, -6, 8, 13);
    this.drawElephantLeg(ctx, 12 - leg, -6, 8, 13);

    // 2.2 หางช้างดุ๊กดิ๊กด้านหลัง
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -16);
    ctx.quadraticCurveTo(-22, -14, -20, -8);
    ctx.stroke();
    // ปอยขนหาง
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.arc(-20, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 2.3 ลำตัวแมมมอธใหญ่ขนปุยหนา (Hump Back)
    ctx.fillStyle = color;
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2;

    ctx.beginPath();
    // สันหลังโหนกสูง (Mammoth Hump)
    ctx.moveTo(-16, -10);
    ctx.quadraticCurveTo(-12, -26, 2, -24); // โหนกหลัง
    ctx.quadraticCurveTo(10, -22, 14, -14); // ท้ายทอย
    ctx.quadraticCurveTo(12, 0, 0, 0);       // ท้อง
    ctx.quadraticCurveTo(-14, 0, -16, -10); // ก้น
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ปอยขนแหลมๆ ตามลำตัว (Fur Tufts)
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.moveTo(-8, -2); ctx.lineTo(-6, 2); ctx.lineTo(-4, -2);
    ctx.moveTo(0, -2); ctx.lineTo(2, 2); ctx.lineTo(4, -2);
    ctx.fill();

    // 2.4 หัวและหน้าผากโหนก
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.arc(12, -18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ใบหูช้างดึกดำบรรพ์ขนาดเล็กหนา (ป้องกันความหนาว)
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.ellipse(8, -20, 4, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2.5 งวงช้างแกว่งขยับได้ (Animated Trunk)
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(17, -15);
    ctx.quadraticCurveTo(24, -10 + (trunkWiggle * 0.5), 20 + trunkWiggle, -2);
    ctx.stroke();
    ctx.lineCap = 'butt'; // reset

    // 2.6 งายักษ์สีงาช้างโค้งยาว 2 ข้าง (Grand Mammoth Tusks)
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // งาด้านหลัง
    ctx.moveTo(14, -13);
    ctx.quadraticCurveTo(26, -12, 24, -22);
    ctx.stroke();
    // งาด้านหน้า
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(16, -11);
    ctx.quadraticCurveTo(29, -9, 27, -20);
    ctx.stroke();

    // ปลายแหลมงาช้าง
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(27, -20, 2, 0, Math.PI * 2);
    ctx.fill();

    // 2.7 ดวงตาดุร้ายสีแดงการ์ตูน พร้อมคิ้วเข้ม
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(14, -20, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626'; // ตาดำแดงก่ำ
    ctx.beginPath();
    ctx.arc(15, -20, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // คิ้วเข้ม
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, -23);
    ctx.lineTo(17, -21);
    ctx.stroke();
  }

  // วาดขาช้างพร้อมเล็บเท้า
  drawElephantLeg(ctx, x, y, w, h) {
    ctx.fillStyle = '#44403c';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, w, h);

    // เล็บเท้า 2 จุดสีครีม
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x + 1, y + h - 3, 2, 3);
    ctx.fillRect(x + w - 3, y + h - 3, 2, 3);
  }

  // 3. ก๊อบลิน / อัศวินเกราะถือดาบโล่
  drawArmoredGoblin(ctx, armorColor, shieldColor, leg, isKnight = false) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-5 - leg, -2, 4, 6);
    ctx.fillRect(2 + leg, -2, 4, 6);

    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.ellipse(0, -9, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -19, 6, 2.5);

    ctx.fillStyle = shieldColor;
    ctx.beginPath();
    ctx.ellipse(6, -9, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (isKnight) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(-12, -22);
      ctx.stroke();
    }
  }

  // 4. หุ่นยนต์จักรกลไอน้ำ (Mech)
  drawMech(ctx, color, leg) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6 - leg, -2, 5, 7);
    ctx.fillRect(2 + leg, -2, 5, 7);

    ctx.fillStyle = color;
    ctx.fillRect(-8, -17, 16, 14);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-8, -17, 16, 14);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, -13, 8, 3);
  }

  // 5. เรือเหาะทิ้งระเบิด ลอยกลางอากาศ
  drawZeppelin(ctx, color, tick) {
    const floatY = Math.sin(tick * 0.1) * 3;
    ctx.translate(0, -10 + floatY);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -6, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e1a00';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6, 2, 12, 4);
  }

  // 6. รถถังไซเบอร์ / ยานโฮเวอร์
  drawHoverTank(ctx, color, tick, isRailgun = false) {
    const floatY = Math.sin(tick * 0.15) * 2;
    ctx.translate(0, floatY);

    ctx.fillStyle = color;
    ctx.fillRect(-12, -8, 24, 9);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -8, 24, 9);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -8, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = isRailgun ? 4 : 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(16, -12);
    ctx.stroke();
  }

  // 7. ไครซิส วอร์พเกอร์ (Void Imp ปิศาจมิติมีปีก)
  drawVoidImp(ctx, color, leg, tick) {
    const wingFlap = Math.sin(tick * 0.3) * 6;

    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-18, -18 + wingFlap);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(6, -12);
    ctx.lineTo(18, -18 + wingFlap);
    ctx.lineTo(10, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -12, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -13, 2.5, 0, Math.PI * 2);
    ctx.arc(3, -13, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Galactic Colossus บอสระดับคอสมิก
  drawColossusBoss(ctx, color, tick) {
    const pulse = Math.sin(tick * 0.1) * 3;

    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -16, 20 + pulse, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -16, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -16, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const unitRenderer = new UnitRenderer();
