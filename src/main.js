import { GameEngine } from './engine.js';
import { ERAS, ENEMY_TYPES } from './eras.js';
import { sounds } from './audio.js';
import { TOWER_SVGS } from './towerIcons.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const resGold = document.getElementById('stat-gold');
  const resWood = document.getElementById('stat-wood');
  const resSci = document.getElementById('stat-sci');
  const resHp = document.getElementById('stat-hp');
  const resTowers = document.getElementById('stat-towers');
  const eraBadge = document.getElementById('era-badge');
  const waveDisplay = document.getElementById('wave-display');
  const seedDisplay = document.getElementById('seed-display');

  const towerDeck = document.getElementById('tower-deck');
  const btnSpell = document.getElementById('btn-spell');
  const btnStartWave = document.getElementById('btn-start-wave');
  const btnEvolve = document.getElementById('btn-evolve');
  const btnNewMap = document.getElementById('btn-new-map');
  const btnMute = document.getElementById('btn-mute');
  const speedBtn = document.getElementById('btn-speed');

  const sidePanel = document.getElementById('side-panel');
  const sideTitle = document.getElementById('side-title');
  const sideDesc = document.getElementById('side-desc');
  const sideDamage = document.getElementById('side-damage');
  const sideRange = document.getElementById('side-range');
  const sideLevel = document.getElementById('side-level');
  const sideTotalDmg = document.getElementById('side-total-dmg');
  const sideTotalKills = document.getElementById('side-total-kills');
  const btnUpgradeTower = document.getElementById('btn-upgrade-tower');
  const btnUpgradeEraTower = document.getElementById('btn-upgrade-era-tower');
  const btnSellTower = document.getElementById('btn-sell-tower');
  const btnCloseSide = document.getElementById('btn-close-side');
  const selectTargeting = document.getElementById('select-targeting');
  const sideTargetContainer = document.getElementById('side-target-container');

  const toastContainer = document.getElementById('toast-container');
  const modalGameOver = document.getElementById('modal-gameover');
  const btnRestart = document.getElementById('btn-restart');

  const btnBestiary = document.getElementById('btn-bestiary');
  const btnTech = document.getElementById('btn-tech');
  const btnMarket = document.getElementById('btn-market');
  const btnHubMain = document.getElementById('btn-hub-main');
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const muteLabel = document.getElementById('mute-label');
  const speedLabel = document.getElementById('speed-label');

  const modalHub = document.getElementById('modal-hub');
  const btnCloseHub = document.getElementById('btn-close-hub');
  const tabBtnTech = document.getElementById('tab-btn-tech');
  const tabBtnMarket = document.getElementById('tab-btn-market');
  const tabBtnBestiary = document.getElementById('tab-btn-bestiary');
  const tabPaneTech = document.getElementById('tab-pane-tech');
  const tabPaneMarket = document.getElementById('tab-pane-market');
  const tabPaneBestiary = document.getElementById('tab-pane-bestiary');

  const bestiaryList = document.getElementById('bestiary-list');
  const techList = document.getElementById('tech-list');
  const marketList = document.getElementById('market-list');

  // ฟังก์ชันสลับแท็บในหน้าต่างศูนย์บัญชาการ (Unified Command Hub)
  const switchHubTab = (tabName) => {
    [tabBtnTech, tabBtnMarket, tabBtnBestiary].forEach(btn => btn && btn.classList.remove('active'));
    [tabPaneTech, tabPaneMarket, tabPaneBestiary].forEach(pane => pane && pane.classList.remove('active'));

    if (tabName === 'tech') {
      if (tabBtnTech) tabBtnTech.classList.add('active');
      if (tabPaneTech) tabPaneTech.classList.add('active');
      renderTechTree();
    } else if (tabName === 'market') {
      if (tabBtnMarket) tabBtnMarket.classList.add('active');
      if (tabPaneMarket) tabPaneMarket.classList.add('active');
      renderMarket();
    } else if (tabName === 'bestiary') {
      if (tabBtnBestiary) tabBtnBestiary.classList.add('active');
      if (tabPaneBestiary) tabPaneBestiary.classList.add('active');
      renderBestiary();
    }
  };

  const openHub = (tabName) => {
    switchHubTab(tabName);
    if (modalHub) modalHub.classList.add('visible');
    sounds.playTone(550, 'triangle', 0.09, 0.12);
  };

  if (tabBtnTech) tabBtnTech.addEventListener('click', () => switchHubTab('tech'));
  if (tabBtnMarket) tabBtnMarket.addEventListener('click', () => switchHubTab('market'));
  if (tabBtnBestiary) tabBtnBestiary.addEventListener('click', () => switchHubTab('bestiary'));

  if (btnTech) btnTech.addEventListener('click', () => openHub('tech'));
  if (btnMarket) btnMarket.addEventListener('click', () => openHub('market'));
  if (btnBestiary) btnBestiary.addEventListener('click', () => openHub('bestiary'));
  if (btnHubMain) btnHubMain.addEventListener('click', () => openHub('tech'));

  if (btnSettingsToggle && settingsDropdown) {
    btnSettingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsDropdown.classList.toggle('visible');
    });
    document.addEventListener('click', (e) => {
      if (!settingsDropdown.contains(e.target) && e.target !== btnSettingsToggle) {
        settingsDropdown.classList.remove('visible');
      }
    });
  }

  if (btnCloseHub) {
    btnCloseHub.addEventListener('click', () => {
      if (modalHub) modalHub.classList.remove('visible');
    });
  }

  if (modalHub) {
    modalHub.addEventListener('click', (e) => {
      if (e.target === modalHub) {
        modalHub.classList.remove('visible');
      }
    });
  }

  // ปรับขนาด Canvas ให้พอดีพื้นที่เล่นตรงกลางระหว่าง Top Bar กับ Bottom Dock
  function resizeCanvas() {
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    if (engine) {
      engine.renderer.resize(w, h, engine.mapData.cols, engine.mapData.rows);
    }
  }

  let engine = null;

  const uiHooks = {
    flashShortage: (type) => {
      let targetEl = null;
      if (type === 'gold') targetEl = resGold.parentElement;
      else if (type === 'wood') targetEl = resWood.parentElement;
      else if (type === 'sci') targetEl = resSci.parentElement;
      else if (type === 'towers') targetEl = resTowers ? resTowers.parentElement : null;

      if (targetEl) {
        targetEl.classList.remove('shortage-flash');
        // Force reflow
        void targetEl.offsetWidth;
        targetEl.classList.add('shortage-flash');
        setTimeout(() => targetEl.classList.remove('shortage-flash'), 1200);
      }
    },

    updateAutoWaveButton: (isActive) => {
      const btnAutoWave = document.getElementById('btn-auto-wave');
      if (btnAutoWave) {
        btnAutoWave.classList.toggle('active', isActive);
        btnAutoWave.innerHTML = isActive ? '<span>⚡ ออโต้เวฟ: เปิด</span>' : '<span>🔄 ออโต้เวฟ: ปิด</span>';
      }
    },

    updateStats: (eng) => {
      resGold.textContent = eng.gold;
      resWood.textContent = eng.wood;
      resSci.textContent = eng.science;
      resHp.textContent = `${eng.nexusHp}/${eng.nexusMaxHp}`;
      if (resTowers) {
        resTowers.textContent = `${eng.towerCount}/${eng.maxTowers}`;
        if (eng.towerCount >= eng.maxTowers) {
          resTowers.style.color = '#ef4444';
          resTowers.parentElement.style.borderColor = 'rgba(239, 68, 68, 0.7)';
        } else {
          resTowers.style.color = '#fde047';
          resTowers.parentElement.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
      }
      eraBadge.textContent = eng.currentEra ? eng.currentEra.name : 'ยุคหิน (Stone Age)';
      waveDisplay.textContent = `เวฟ: ${eng.wave}`;

      // อัปเดตเรดาร์ Wave Intel & Tactical Armor Advice Preview
      const wavePreviewText = document.getElementById('wave-preview-text');
      if (wavePreviewText) {
        if (eng.isWaveRunning) {
          const aliveBoss = eng.enemies.some(e => e.isBoss);
          const aliveShielded = eng.enemies.some(e => e.shield > 0);
          const aliveHealer = eng.enemies.some(e => e.trait === 'healer');
          const statusTags = [];
          if (aliveBoss) statusTags.push('👑BOSS');
          if (aliveShielded) statusTags.push('🛡️เกราะ');
          if (aliveHealer) statusTags.push('💚ฮีล');
          wavePreviewText.textContent = `⚔️ กำลังรบ: เหลือ ${eng.enemies.length + eng.enemiesToSpawn.length} ตัว ${statusTags.length ? `(${statusTags.join(' ')})` : ''}`;
        } else {
          const nextWave = eng.wave;
          const isBoss = (nextWave % 5 === 0);
          if (isBoss) {
            wavePreviewText.innerHTML = `<span style="color:#ef4444; font-weight:bold;">⚠️ ศึก BOSS WAVE! (แนะ: ป้อมเจาะเกราะหนัก 🗡️ & สโลว์ ❄️)</span>`;
          } else {
            // คำนวณประเภทศัตรูที่จะมาในเวฟถัดไปเพื่อให้คำแนะนำเชิงกลยุทธ์แก่ผู้เล่นใหม่
            let advice = 'ฝูงบุกมาตรฐาน';
            if (eng.currentEraIndex === 0) {
              advice = nextWave % 2 === 0 ? 'สัตว์ยักษ์เกราะหนา (แนะ: หอกไม้ 🗡️)' : 'สัตว์ป่าคล่องแคล่ว (แนะ: โทเทมไฟ 🔥/หิน 🪨)';
            } else if (eng.currentEraIndex === 1) {
              advice = nextWave % 2 === 0 ? 'อัศวินเกราะเหล็ก (แนะ: หน้าไม้กล 🎯)' : 'ทหารโล่/พลธนู (แนะ: เครื่องดีดหิน ☄️)';
            } else {
              advice = 'หน่วยรบผสม (แนะ: กระจายป้อมเจาะเกราะ & สแปลช)';
            }
            wavePreviewText.innerHTML = `เตรียมบุก: ${22 + nextWave * 7} ตัว <span style="color:#fde047;">[${advice}]</span>`;
          }
        }
      }

      // อัปเดตปุ่มวิวัฒนาการยุค (เงื่อนไขต้องผ่าน 10 เวฟต่อยุค)
      const nextEra = ERAS[eng.currentEraIndex + 1];
      const requiredWave = (eng.currentEraIndex + 1) * 10;
      if (nextEra && nextEra.upgradeCost) {
        btnEvolve.style.display = 'inline-flex';
        const evolveLabel = document.getElementById('evolve-label');
        if (eng.wave <= requiredWave) {
          const txt = `🔒 ข้ามยุค: ${nextEra.shortName} (เวฟ ${requiredWave}+)`;
          btnEvolve.title = `ต้องผ่านเวฟ ${requiredWave}+ ถึงจะพัฒนาได้ (ปัจจุบันเวฟ: ${eng.wave})`;
          if (evolveLabel) evolveLabel.textContent = txt;
          else btnEvolve.textContent = txt;
          btnEvolve.style.opacity = '0.65';
        } else {
          const txt = `🧬 ข้ามยุค: ${nextEra.shortName} (${nextEra.upgradeCost.gold}🪙 ${nextEra.upgradeCost.science}🔬)`;
          btnEvolve.title = `พัฒนาสู่อารยธรรม ${nextEra.name}`;
          if (evolveLabel) evolveLabel.textContent = txt;
          else btnEvolve.textContent = txt;
          btnEvolve.style.opacity = '1';
        }
      } else {
        btnEvolve.style.display = 'none';
      }

      // สถานะปุ่ม Wave
      btnStartWave.disabled = eng.isWaveRunning;
      btnStartWave.style.opacity = eng.isWaveRunning ? '0.5' : '1';

      // อัปเดตสถานะความสามารถในการซื้อของการ์ดป้อม (Affordability & Capacity Refresh)
      if (eng.currentEra && eng.currentEra.towers) {
        const cards = document.querySelectorAll('.tower-card');
        const isCapped = (eng.towerCount >= eng.maxTowers);
        eng.currentEra.towers.forEach((t, i) => {
          if (cards[i]) {
            const canAfford = (eng.gold >= t.cost.gold && eng.wood >= t.cost.wood) && !isCapped;
            if (canAfford) {
              cards[i].classList.remove('cant-afford');
            } else {
              cards[i].classList.add('cant-afford');
            }
          }
        });
      }
    },

    updateSeed: (seed) => {
      seedDisplay.textContent = `Map Seed: #${seed}`;
    },

    renderTowerSelection: (towers) => {
      towerDeck.innerHTML = '';
      towers.forEach((t, idx) => {
        const card = document.createElement('div');
        const isCapped = engine ? (engine.towerCount >= engine.maxTowers) : false;
        const canAfford = engine ? (engine.gold >= t.cost.gold && engine.wood >= t.cost.wood && !isCapped) : true;
        card.className = `tower-card ${canAfford ? '' : 'cant-afford'}`;
        const iconSvg = TOWER_SVGS[t.id] || `<div style="font-size:1.5rem;">🏰</div>`;

        // สรุปป้ายแท็กคุณสมบัติเด่นของป้อม (Tower Type Specialty Tag)
        let roleBadge = '';
        let quickStat = '';
        if (t.type === 'economy') {
          roleBadge = '<span style="font-size:0.68rem; color:#fde047; background:rgba(234,179,8,0.2); padding:1px 6px; border-radius:4px; margin-bottom:2px; border:1px solid rgba(234,179,8,0.4);">💰 ผลิตเงิน</span>';
          quickStat = `<span style="color:#fde047;">+${t.income?.gold || 0}🪙</span><span>/</span><span style="color:#94a3b8;">${t.interval}s</span>`;
        } else if (t.type === 'research') {
          roleBadge = '<span style="font-size:0.68rem; color:#38bdf8; background:rgba(56,189,248,0.2); padding:1px 6px; border-radius:4px; margin-bottom:2px; border:1px solid rgba(56,189,248,0.4);">🔬 ผลิตวิจัย</span>';
          quickStat = `<span style="color:#38bdf8;">+${t.income?.science || 0}🔬</span><span>/</span><span style="color:#94a3b8;">${t.interval}s</span>`;
        } else if (t.damageType === 'pierce') {
          roleBadge = '<span style="font-size:0.68rem; color:#fb923c; background:rgba(251,146,60,0.2); padding:1px 6px; border-radius:4px; margin-bottom:2px; border:1px solid rgba(251,146,60,0.4);">🗡️ เจาะเกราะ</span>';
          quickStat = `<span style="color:#f87171;">⚔️${t.damage}</span><span>|</span><span style="color:#60a5fa;">🎯${t.range}</span>`;
        } else if (t.splash > 0) {
          roleBadge = '<span style="font-size:0.68rem; color:#f87171; background:rgba(248,113,113,0.2); padding:1px 6px; border-radius:4px; margin-bottom:2px; border:1px solid rgba(248,113,113,0.4);">💥 ระเบิดกลุ่ม</span>';
          quickStat = `<span style="color:#f87171;">⚔️${t.damage}</span><span>|</span><span style="color:#f97316;">💥${t.splash}</span>`;
        } else if (t.damageType === 'magic') {
          roleBadge = '<span style="font-size:0.68rem; color:#c084fc; background:rgba(192,132,252,0.2); padding:1px 6px; border-radius:4px; margin-bottom:2px; border:1px solid rgba(192,132,252,0.4);">🔮 สลายเกราะ</span>';
          quickStat = `<span style="color:#c084fc;">⚔️${t.damage}</span><span>|</span><span style="color:#60a5fa;">🎯${t.range}</span>`;
        } else {
          roleBadge = '<span style="font-size:0.68rem; color:#94a3b8; background:rgba(148,163,184,0.2); padding:1px 6px; border-radius:4px; margin-bottom:2px; border:1px solid rgba(148,163,184,0.3);">🪨 ทุบกระแทก</span>';
          quickStat = `<span style="color:#f87171;">⚔️${t.damage}</span><span>|</span><span style="color:#60a5fa;">🎯${t.range}</span>`;
        }

        card.innerHTML = `
          <div class="card-icon">${iconSvg}</div>
          <div class="card-name">${t.name.split(' (')[0]}</div>
          ${roleBadge}
          <div class="card-quick-stats">${quickStat}</div>
          <div class="card-cost">
            <span class="cost-tag gold-tag">
              <svg class="mini-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0"/></svg>
              ${t.cost.gold}
            </span>
            <span class="cost-tag wood-tag">
              <svg class="mini-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
              ${t.cost.wood}
            </span>
          </div>
        `;

        card.addEventListener('click', () => {
          const isAlreadySelected = card.classList.contains('selected');
          document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));

          if (isAlreadySelected) {
            // คลิกซ้ำที่การ์ดเดิมเพื่อยกเลิกการเลือก (Toggle Deselect)
            if (engine) engine.selectedTowerType = null;
            sounds.playTone(320, 'sine', 0.05, 0.05);
          } else {
            // เลือกป้อมใหม่
            card.classList.add('selected');
            if (engine) engine.selectedTowerType = t;
            sounds.playTone(450, 'sine', 0.05, 0.05);
          }
        });

        towerDeck.appendChild(card);
      });

      // ค่าเริ่มต้น: ไม่เลือกป้อมค้างไว้ เพื่อป้องกันผู้เล่นเผลอคลิกสร้างผิดอัน (Manual Selection)
      if (engine) {
        engine.selectedTowerType = null;
      }
    },

    deselectTower: () => {
      document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
      if (engine) engine.selectedTowerType = null;
    },

    showTowerDetail: (tower) => {
      sidePanel.classList.add('visible');
      const daisTag = tower.isStrategicDais ? ' 👑[ชัยภูมิสูง +20%Dmg, +25%Range]' : '';
      sideTitle.textContent = `${tower.data.name} (Lv.${tower.level})${daisTag}`;
      sideDesc.textContent = tower.isStrategicDais 
        ? `${tower.data.desc} ✨ตั้งอยู่บนแท่นหินยุทธศาสตร์ ได้รับบัฟดาเมจ +20% และระยะยิง +25% อย่างถาวร!`
        : tower.data.desc;
      sideLevel.textContent = `ระดับ: Lv.${tower.level} / Max 5${tower.isStrategicDais ? ' 🌟(Strategic High Ground)' : ''}`;
      
      // แสดงสถานะการผลิตเมื่อเวฟหยุดทำงาน (AFK Exploit Prevention Feedback)
      const waveStatusNotice = (!engine.isWaveRunning && (tower.data.type === 'economy' || tower.data.type === 'research'))
        ? ' ⏸️ [หยุดพักการผลิตชั่วคราว รอเริ่มเวฟ]'
        : '';

      const incomeGold = tower.data.income?.gold || 0;
      const incomeSci = tower.data.income?.science || 0;
      if (tower.data.damage) {
        sideDamage.textContent = `พลังโจมตี: ${tower.data.damage}`;
      } else if (incomeGold > 0) {
        sideDamage.textContent = `รายได้: +${incomeGold}🪙 / ${tower.data.interval}s${waveStatusNotice}`;
      } else {
        sideDamage.textContent = `ผลิต: +${incomeSci}🔬 / ${tower.data.interval}s${waveStatusNotice}`;
      }

      // อัปเดตสถิติการรบ (Combat Analytics)
      if (tower.data.type === 'economy' || tower.data.type === 'research') {
        const earned = tower.totalEarned || 0;
        sideTotalDmg.textContent = `+${earned}`;
        sideTotalDmg.previousElementSibling.textContent = '💰 ทรัพยากรผลิตรวม:';
        sideTotalKills.textContent = `${tower.data.interval}s ต่อรอบ`;
        sideTotalKills.previousElementSibling.textContent = '⏱️ รอบการผลิต:';
      } else {
        sideTotalDmg.textContent = `${(tower.totalDamage || 0).toLocaleString()} dmg`;
        sideTotalDmg.previousElementSibling.textContent = '⚔️ ดาเมจรวมที่ทำได้:';
        sideTotalKills.textContent = `${tower.kills || 0} ตัว`;
        sideTotalKills.previousElementSibling.textContent = '💀 สังหารศัตรู:';
      }

      if (tower.data.range) {
        sideRange.textContent = `ระยะ: ${tower.data.range}m`;
        sideTargetContainer.style.display = 'block';
        selectTargeting.value = tower.targeting || 'first';
        selectTargeting.onchange = () => {
          tower.targeting = selectTargeting.value;
          sounds.playTone(500, 'sine', 0.05, 0.05);
        };
      } else if (incomeSci > 0) {
        sideRange.textContent = `วิจัย: +${incomeSci}🔬`;
        sideTargetContainer.style.display = 'none';
      } else {
        sideRange.textContent = `วัสดุ: +${tower.data.income?.wood || 0}🪵`;
        sideTargetContainer.style.display = 'none';
      }

      const maxLevel = 5;
      if (tower.level >= maxLevel) {
        btnUpgradeTower.textContent = `ระดับสูงสุด (Max Lv.5)`;
        btnUpgradeTower.disabled = true;
        btnUpgradeTower.style.opacity = '0.5';
      } else {
        const upgradeCost = Math.round(tower.data.cost.gold * 1.5 * tower.level);
        btnUpgradeTower.textContent = `อัปเกรด (${upgradeCost}🪙)`;
        btnUpgradeTower.disabled = false;
        btnUpgradeTower.style.opacity = '1';
      }

      // ระบบยกระดับป้อมข้ามยุค (Modernize Era Upgrade Button)
      if (btnUpgradeEraTower) {
        if (tower.eraIndex < engine.currentEraIndex) {
          const modCost = engine.getModernizeCost(tower);
          if (modCost) {
            btnUpgradeEraTower.style.display = 'block';
            btnUpgradeEraTower.innerHTML = `🚀 ยกระดับสู่ ${modCost.counterpart.name.split(' (')[0]}<br><span style="font-size:0.75rem; opacity:0.9;">(${modCost.gold}🪙 ${modCost.wood}🪵 ${modCost.science}🔬)</span>`;
            const canAfford = engine.gold >= modCost.gold && engine.wood >= modCost.wood && engine.science >= modCost.science;
            btnUpgradeEraTower.disabled = !canAfford;
            btnUpgradeEraTower.style.opacity = canAfford ? '1' : '0.6';
            btnUpgradeEraTower.onclick = () => engine.modernizeTower(tower);
          } else {
            btnUpgradeEraTower.style.display = 'none';
          }
        } else {
          btnUpgradeEraTower.style.display = 'none';
        }
      }

      btnUpgradeTower.onclick = () => engine.upgradeTower(tower);
      btnSellTower.onclick = () => engine.sellTower(tower);
    },

    hideTowerDetail: () => {
      sidePanel.classList.remove('visible');
    },

    notify: (msg) => {
      // จำกัดแจ้งเตือนแสดงพร้อมกันไม่เกิน 2 ข้อความเพื่อไม่ให้เกะกะสายตา
      while (toastContainer.children.length >= 2) {
        toastContainer.removeChild(toastContainer.firstChild);
      }
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = msg;
      toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 1600); // แสดงแค่ 1.6 วินาทีแล้วจางหาย
    },

    showGameOver: () => {
      modalGameOver.classList.add('visible');
    },

    updateSpellBar: (spells, activeId) => {
      const spellIds = ['meteor', 'blizzard', 'lightning'];
      spellIds.forEach(id => {
        const btn = document.getElementById(`spell-tab-${id}`);
        if (!btn) return;
        const sp = spells[id];
        const isCurrentActive = activeId === id;
        const isEnergyReady = sp.energy >= sp.maxEnergy;
        const isCoolingDown = sp.cooldown > 0;
        const isReady = isEnergyReady && !isCoolingDown;

        btn.classList.toggle('active', isCurrentActive);
        btn.classList.toggle('cooldown', isCoolingDown);
        btn.classList.toggle('not-ready', !isReady);

        // อัปเดตแถบหลอดพลังงานใต้ปุ่มสกิล
        let bar = btn.querySelector('.spell-energy-bar');
        if (!bar) {
          bar = document.createElement('div');
          bar.className = 'spell-energy-bar';
          btn.appendChild(bar);
        }
        const energyPct = Math.min(100, Math.floor((sp.energy / sp.maxEnergy) * 100));
        bar.style.width = `${energyPct}%`;

        const cdSpan = btn.querySelector('.spell-tab-cd');
        if (cdSpan) {
          if (isCoolingDown) {
            cdSpan.textContent = `${Math.ceil(sp.cooldown)}s`;
            cdSpan.style.color = '#f87171';
          } else if (!isEnergyReady) {
            cdSpan.textContent = `${energyPct}%⚡`;
            cdSpan.style.color = '#38bdf8';
          } else {
            cdSpan.textContent = `พร้อม!`;
            cdSpan.style.color = '#4ade80';
          }
        }
      });
    }
  };

  engine = new GameEngine(canvas, uiHooks);
  // แสดงสารานุกรมศัตรู Bestiary
  function renderBestiary() {
    bestiaryList.innerHTML = '';
    const eraNames = ['ยุคหิน', 'ยุคกลาง', 'ยุคอุตสาหกรรม', 'ยุคปัจจุบัน', 'ยุคอวกาศ'];

    ENEMY_TYPES.forEach((enemy) => {
      const isUnlocked = enemy.era <= engine.currentEraIndex;
      const card = document.createElement('div');
      card.className = `enemy-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      if (isUnlocked) {
        card.innerHTML = `
          <div class="enemy-head">
            <div class="enemy-avatar" style="background:${enemy.color}22; border-color:${enemy.color}">
              <span>${enemy.icon}</span>
            </div>
            <div>
              <div class="enemy-name">${enemy.name}</div>
              <div class="enemy-era-tag">${eraNames[enemy.era]}</div>
            </div>
          </div>
          <div class="enemy-stats-row">
            <span class="stat-pill">❤️ HP: ${enemy.hp}</span>
            <span class="stat-pill">⚡ ความเร็ว: ${enemy.speed}x</span>
            <span class="stat-pill">🪙 รางวัล: +${enemy.reward}</span>
          </div>
          <div class="enemy-intel">
            <div class="intel-line strong-point">
              <span class="intel-badge strong">จุดเด่น</span>
              <span>${enemy.strength}</span>
            </div>
            <div class="intel-line weak-point">
              <span class="intel-badge weak">แพ้ทาง</span>
              <span>${enemy.weakness}</span>
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="enemy-head">
            <div class="enemy-avatar" style="background:rgba(255,255,255,0.05); border-color:#64748b">
              <span>🔒</span>
            </div>
            <div>
              <div class="enemy-name" style="color:#64748b;">ข้อมูลถูกปิดผนึก</div>
              <div class="enemy-era-tag">จะปลดล็อกใน ${eraNames[enemy.era]}</div>
            </div>
          </div>
          <p style="font-size:0.8rem; color:#64748b; margin-top:8px;">
            อัปเกรดอารยธรรมไปยัง ${eraNames[enemy.era]} เพื่อสแกนข้อมูลและจุดอ่อนของศัตรูประเภทนี้
          </p>
        `;
      }
      bestiaryList.appendChild(card);
    });
  }

  // แสดงต้นไม้วิทยาการวิจัยป้อม (Tech Research Tree)
  function renderTechTree() {
    techList.innerHTML = '';

    // ส่วนที่ 1: แท็บหรือหมวดหมู่ "วิจัยสถิติพื้นฐานส่วนกลาง"
    const sectionGlobalHeader = document.createElement('div');
    sectionGlobalHeader.className = 'tech-section-title';
    sectionGlobalHeader.innerHTML = `<span>🌐</span> วิจัยวิทยาการส่วนกลาง (Global Tech)`;
    techList.appendChild(sectionGlobalHeader);

    const techs = [
      {
        key: 'attackPower',
        name: 'พลังทำลายล้างพื้นฐาน (Base Firepower)',
        icon: '💥',
        desc: 'เพิ่มพลังโจมตีของป้อมทุกประเภท +15% ต่อระดับ',
        stat: `+${engine.techLevels.attackPower * 15}% พลังโจมตีรวม`
      },
      {
        key: 'attackRange',
        name: 'ระบบเล็งเป้าและวิถียิง (Targeting Optics)',
        icon: '🎯',
        desc: 'ขยายระยะยิงตรวจจับศัตรูของป้อมทุกประเภท +10% ต่อระดับ',
        stat: `+${engine.techLevels.attackRange * 10}% ระยะตรวจจับ`
      },
      {
        key: 'energyEfficiency',
        name: 'ประสิทธิภาพการผลิตพลังงาน (Grid Efficiency)',
        icon: '⚡',
        desc: 'เร่งความเร็วการผลิตทองและแต้มวิจัยของสิ่งปลูกสร้างเศรษฐกิจ +12% ต่อระดับ',
        stat: `+${engine.techLevels.energyEfficiency * 12}% ความเร็วผลิต`
      },
      {
        key: 'towerCapacity',
        name: 'การบริหารจัดการอาณานิคม (Colony Logistics)',
        icon: '🏰',
        desc: 'ขยายขีดความสามารถการรองรับป้อมปราการในสนามรบ +2 ป้อมต่อระดับ',
        stat: `+${(engine.techLevels.towerCapacity || 0) * 2} โควตาป้อม (สูงสุด ${engine.maxTowers} ป้อม)`
      }
    ];

    techs.forEach(t => {
      const curLv = engine.techLevels[t.key] || 0;
      const maxLevel = 5;
      const isMax = curLv >= maxLevel;
      const cost = 25 + curLv * 35;
      const canAfford = engine.science >= cost && !isMax;

      const card = document.createElement('div');
      card.className = 'tech-card';
      card.innerHTML = `
        <div class="tech-head">
          <div class="tech-icon">${t.icon}</div>
          <div style="flex:1;">
            <div class="tech-name">${t.name}</div>
            <div class="tech-cur-lv">ระดับปัจจุบัน: Lv.${curLv} / ${maxLevel} (${t.stat})</div>
          </div>
        </div>
        <p class="tech-desc">${t.desc}</p>
        <button class="btn btn-tech-up ${canAfford ? '' : 'disabled'}" style="width:100%; justify-content:center;">
          ${isMax ? 'วิจัยระดับสูงสุดแล้ว (Max Lv.5)' : `วิจัย Lv.${curLv + 1} (ใช้ ${cost} 🔬)`}
        </button>
      `;

      const btnUp = card.querySelector('.btn-tech-up');
      btnUp.addEventListener('click', () => {
        engine.researchTech(t.key);
      });

      techList.appendChild(card);
    });

    // ส่วนที่ 2: วิจัยขุมพลังมหาเวทผู้เล่นทั้ง 3 สาย (Commander Spell Arsenal Research)
    const sectionSpellHeader = document.createElement('div');
    sectionSpellHeader.className = 'tech-section-title';
    sectionSpellHeader.style.marginTop = '20px';
    sectionSpellHeader.style.color = '#fb923c';
    sectionSpellHeader.style.borderColor = 'rgba(251, 146, 60, 0.4)';
    sectionSpellHeader.innerHTML = `<span>📜</span> คลังมหาเวทผู้เล่น (Commander Spell Arsenal Research)`;
    techList.appendChild(sectionSpellHeader);

    const spellIds = ['meteor', 'blizzard', 'lightning'];
    spellIds.forEach(spId => {
      const stats = engine.getSpellStats(spId);
      const sp = engine.spells[spId];
      const isSelected = engine.selectedSpellId === spId;

      let subDesc = '';
      if (spId === 'blizzard') {
        subDesc = `ระดับ: <strong style="color:#fde047;">Lv.${stats.level}/5</strong> | แช่แข็งหยุดเวลา: <strong style="color:#38bdf8;">${stats.freezeDuration.toFixed(1)}s</strong> ทั้งแมพ | ดาเมจ: <strong style="color:#a7f3d0;">${stats.damage}</strong> | คูลดาวน์: <strong style="color:#fcd34d;">${stats.cooldown}s</strong>`;
      } else if (spId === 'lightning') {
        subDesc = `ระดับ: <strong style="color:#fde047;">Lv.${stats.level}/5</strong> | ผ่าช็อตชิ่ง: <strong style="color:#facc15;">${stats.chainCount} ตัว</strong> | ดาเมจต่อฮิต: <strong style="color:#f87171;">${stats.damage}</strong> | คูลดาวน์ไว: <strong style="color:#34d399;">${stats.cooldown}s</strong>`;
      } else {
        subDesc = `ระดับ: <strong style="color:#fde047;">Lv.${stats.level}/5</strong> | พลังทำลาย: <strong style="color:#f87171;">${stats.damage}</strong> | รัศมี: <strong style="color:#67e8f9;">${stats.radius.toFixed(1)} ช่อง</strong> | คูลดาวน์: <strong style="color:#fcd34d;">${stats.cooldown}s</strong>`;
      }

      let masteryHtml = '';
      if (spId === 'blizzard') {
        masteryHtml = `
          <button class="btn btn-spell-mastery ${stats.mastery === 'shatter' ? 'active' : ''} ${stats.level < 3 ? 'disabled' : ''}" data-spell="blizzard" data-mastery="shatter" style="padding:8px 10px; font-size:0.8rem; text-align:left; border: 1px solid ${stats.mastery === 'shatter' ? '#38bdf8' : '#57534e'}; background: ${stats.mastery === 'shatter' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)'};">
            <div style="font-weight:bold; color:#38bdf8;">❄️ Frost Shatter</div>
            <div style="color:#cbd5e1; font-size:0.75rem;">ศัตรูที่ถูกแช่แข็งระเบิดดาเมจคริติคอลซ้ำ +40%</div>
          </button>
          <button class="btn btn-spell-mastery ${stats.mastery === 'absolute_zero' ? 'active' : ''} ${stats.level < 3 ? 'disabled' : ''}" data-spell="blizzard" data-mastery="absolute_zero" style="padding:8px 10px; font-size:0.8rem; text-align:left; border: 1px solid ${stats.mastery === 'absolute_zero' ? '#06b6d4' : '#57534e'}; background: ${stats.mastery === 'absolute_zero' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(15, 23, 42, 0.6)'};">
            <div style="font-weight:bold; color:#67e8f9;">🧊 Absolute Zero</div>
            <div style="color:#cbd5e1; font-size:0.75rem;">แช่แข็งหยุดเวลานานขึ้นเป็นพิเศษ +2.5 วินาที</div>
          </button>
        `;
      } else if (spId === 'lightning') {
        masteryHtml = `
          <button class="btn btn-spell-mastery ${stats.mastery === 'overcharge' ? 'active' : ''} ${stats.level < 3 ? 'disabled' : ''}" data-spell="lightning" data-mastery="overcharge" style="padding:8px 10px; font-size:0.8rem; text-align:left; border: 1px solid ${stats.mastery === 'overcharge' ? '#facc15' : '#57534e'}; background: ${stats.mastery === 'overcharge' ? 'rgba(250, 204, 21, 0.25)' : 'rgba(15, 23, 42, 0.6)'};">
            <div style="font-weight:bold; color:#facc15;">⚡ High Voltage</div>
            <div style="color:#cbd5e1; font-size:0.75rem;">ดาเมจสายฟ้าแรงขึ้นเป็นพิเศษ x2.0 เท่าทันที!</div>
          </button>
          <button class="btn btn-spell-mastery ${stats.mastery === 'thunderstorm' ? 'active' : ''} ${stats.level < 3 ? 'disabled' : ''}" data-spell="lightning" data-mastery="thunderstorm" style="padding:8px 10px; font-size:0.8rem; text-align:left; border: 1px solid ${stats.mastery === 'thunderstorm' ? '#eab308' : '#57534e'}; background: ${stats.mastery === 'thunderstorm' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(15, 23, 42, 0.6)'};">
            <div style="font-weight:bold; color:#fef08a;">⛈️ Chain Surge</div>
            <div style="color:#cbd5e1; font-size:0.75rem;">กระโดดชิ่งเพิ่มขึ้นอีก +6 ตัว เคลียร์ฝูงมอนสเตอร์</div>
          </button>
        `;
      } else {
        masteryHtml = `
          <button class="btn btn-spell-mastery ${stats.mastery === 'blaze' ? 'active' : ''} ${stats.level < 3 ? 'disabled' : ''}" data-spell="meteor" data-mastery="blaze" style="padding:8px 10px; font-size:0.8rem; text-align:left; border: 1px solid ${stats.mastery === 'blaze' ? '#ef4444' : '#57534e'}; background: ${stats.mastery === 'blaze' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.6)'};">
            <div style="font-weight:bold; color:#f87171;">🔥 Infernal Blaze</div>
            <div style="color:#cbd5e1; font-size:0.75rem;">เผาไหม้เป้าหมายต่อเนื่อง 4 วินาที (ดาเมจ +15%/s)</div>
          </button>
          <button class="btn btn-spell-mastery ${stats.mastery === 'supernova' ? 'active' : ''} ${stats.level < 3 ? 'disabled' : ''}" data-spell="meteor" data-mastery="supernova" style="padding:8px 10px; font-size:0.8rem; text-align:left; border: 1px solid ${stats.mastery === 'supernova' ? '#f59e0b' : '#57534e'}; background: ${stats.mastery === 'supernova' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)'};">
            <div style="font-weight:bold; color:#fbbf24;">💥 Supernova Blast</div>
            <div style="color:#cbd5e1; font-size:0.75rem;">ขยายรัศมีระเบิดกว้างขึ้น +1.4 ช่อง กวาดล้างทั้งกองทัพ</div>
          </button>
        `;
      }

      const spellCard = document.createElement('div');
      spellCard.className = 'tower-tree-container';
      spellCard.style.marginBottom = '14px';
      spellCard.style.borderColor = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)';
      spellCard.innerHTML = `
        <div class="tree-root-node" style="border-color: ${isSelected ? '#38bdf8' : '#64748b'}; width: 100%; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="tree-root-icon" style="font-size: 1.6rem;">${sp.icon}</div>
            <div>
              <div class="tree-root-title">${sp.name} ${isSelected ? '<span style="color:#38bdf8; font-size:0.8rem;">[มหาเวทที่เลือกใช้]</span>' : ''}</div>
              <div class="tree-root-sub">${subDesc}</div>
            </div>
          </div>
          <button class="btn btn-select-spell" data-spell="${spId}" style="padding: 6px 14px; font-size: 0.8rem; background: ${isSelected ? '#0284c7' : 'rgba(51, 65, 85, 0.8)'};">
            ${isSelected ? '✔️ ติดตั้งอยู่' : 'เลือกใช้สกิลนี้'}
          </button>
        </div>

        <div class="tree-stem-vertical"></div>

        <div class="tree-branches-wrapper">
          <div class="tree-branch-col" style="flex: 1; max-width: 440px;">
            <div class="tree-branch-box">
              <div class="tree-branch-icon">📈</div>
              <div class="tree-branch-name">อัปเกรดขุมพลัง Lv.${stats.level + 1}</div>
              <div class="tree-branch-level">
                ${stats.isMax ? 'ระดับสูงสุด (Max Level)' : `เพิ่มดาเมจ, ขยายผลเอฟเฟกต์ และลดคูลดาวน์ลง`}
              </div>
              <button class="btn btn-tree-up btn-upgrade-spell-node ${stats.isMax || engine.science < stats.nextCost ? 'disabled' : ''}" data-spell="${spId}">
                ${stats.isMax ? 'ระดับสูงสุด (Max)' : `วิจัยเพิ่มพลัง (${stats.nextCost} 🔬)`}
              </button>
            </div>
          </div>
        </div>

        <div class="tree-mastery-section" style="margin-top:12px; padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; border:1px solid rgba(255,255,255,0.08); width: 100%;">
          <div style="font-size:0.82rem; font-weight:bold; color:#fde047; margin-bottom:6px;">
            🌟 พรสวรรค์เฉพาะทางประจำสกิล (ปลดล็อกที่ Lv.3+):
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            ${masteryHtml}
          </div>
        </div>
      `;

      spellCard.querySelector('.btn-select-spell').addEventListener('click', () => {
        engine.selectSpell(spId);
        renderTechTree();
      });

      spellCard.querySelector('.btn-upgrade-spell-node').addEventListener('click', () => {
        engine.upgradeSpellResearch(spId);
      });

      spellCard.querySelectorAll('.btn-spell-mastery').forEach(b => {
        b.addEventListener('click', () => {
          engine.setSpellMastery(b.dataset.spell, b.dataset.mastery);
        });
      });

      techList.appendChild(spellCard);
    });

    // ส่วนที่ 3: วิจัยป้อมแยกตามประเภทป้อม (Tower-Specific Research Tree Diagram)
    const sectionTowerHeader = document.createElement('div');
    sectionTowerHeader.className = 'tech-section-title';
    sectionTowerHeader.style.marginTop = '20px';
    sectionTowerHeader.innerHTML = `<span>🌲</span> แผนผังต้นไม้วิจัยประจำป้อม (${engine.currentEra.name})`;
    techList.appendChild(sectionTowerHeader);

    // ดึงเฉพาะป้อมประเภทโจมตี/ซัพพอร์ตในยุคปัจจุบัน
    const combatTowers = engine.currentEra.towers.filter(t => t.type === 'attack' || t.type === 'support');

    combatTowers.forEach(t => {
      const tRes = engine.getTowerResearch(t.id);
      const iconSvg = TOWER_SVGS[t.id] || `<div style="font-size:1.5rem;">${t.icon || '🏰'}</div>`;

      const treeContainer = document.createElement('div');
      treeContainer.className = 'tower-tree-container';
      treeContainer.innerHTML = `
        <!-- โหนดราก/ลำต้น (Root Tower Node) -->
        <div class="tree-root-node">
          <div class="tree-root-icon">${iconSvg}</div>
          <div>
            <div class="tree-root-title">${t.name}</div>
            <div class="tree-root-sub">${t.desc}</div>
          </div>
        </div>

        <!-- ก้านลำต้นลงมาหากิ่งก้าน -->
        <div class="tree-stem-vertical"></div>

        <!-- กิ่งก้านสาขาของต้นไม้ (Branches: Range, Speed, Damage) -->
        <div class="tree-branches-wrapper">
          <!-- สาขาที่ 1: ระยะยิง -->
          <div class="tree-branch-col">
            <div class="tree-branch-box">
              <div class="tree-branch-icon">🔭</div>
              <div class="tree-branch-name">เพิ่มระยะยิง</div>
              <div class="tree-branch-level">Lv.${tRes.range} / 5 (+${tRes.range * 12}%)</div>
              <button class="btn btn-tree-up node-btn-range ${tRes.range >= 5 ? 'disabled' : (engine.science >= (15 + tRes.range * 20) ? '' : 'disabled')}">
                ${tRes.range >= 5 ? 'ระดับสูงสุด (Max)' : `วิจัย (${15 + tRes.range * 20} 🔬)`}
              </button>
            </div>
          </div>

          <!-- สาขาที่ 2: ความเร็วการยิง -->
          <div class="tree-branch-col">
            <div class="tree-branch-box">
              <div class="tree-branch-icon">⚡</div>
              <div class="tree-branch-name">เพิ่มความเร็วการยิง</div>
              <div class="tree-branch-level">Lv.${tRes.fireRate} / 5 (+${tRes.fireRate * 10}%)</div>
              <button class="btn btn-tree-up node-btn-rate ${tRes.fireRate >= 5 ? 'disabled' : (engine.science >= (15 + tRes.fireRate * 20) ? '' : 'disabled')}">
                ${tRes.fireRate >= 5 ? 'ระดับสูงสุด (Max)' : `วิจัย (${15 + tRes.fireRate * 20} 🔬)`}
              </button>
            </div>
          </div>

          <!-- สาขาที่ 3: พลังโจมตี -->
          <div class="tree-branch-col">
            <div class="tree-branch-box">
              <div class="tree-branch-icon">💥</div>
              <div class="tree-branch-name">เพิ่มพลังโจมตี</div>
              <div class="tree-branch-level">Lv.${tRes.damage} / 5 (+${tRes.damage * 15}%)</div>
              <button class="btn btn-tree-up node-btn-dmg ${tRes.damage >= 5 ? 'disabled' : (engine.science >= (15 + tRes.damage * 20) ? '' : 'disabled')}">
                ${tRes.damage >= 5 ? 'ระดับสูงสุด (Max)' : `วิจัย (${15 + tRes.damage * 20} 🔬)`}
              </button>
            </div>
          </div>
        </div>

        <!-- Mastery Pick-1-of-2 Specialization Trait -->
        <div class="tree-mastery-section" style="margin-top:14px; padding:12px; background:rgba(0,0,0,0.3); border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:0.85rem; font-weight:bold; color:#fde047; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span>🌟</span> เลือกสายความเชี่ยวชาญพิเศษ (Pick 1 Specialization Trait):
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <button class="btn btn-mastery ${tRes.mastery === 'crit' ? 'active' : ''}" data-mastery="crit" style="padding:8px 10px; font-size:0.8rem; text-align:left; line-height:1.3; border: 1px solid ${tRes.mastery === 'crit' ? '#ef4444' : '#475569'}; background: ${tRes.mastery === 'crit' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.6)'};">
              <div style="font-weight:bold; color:#f87171;">⚡ Critical Striker</div>
              <div style="color:#94a3b8; font-size:0.75rem;">โอกาส 25% ทำดาเมจคริติคอล x2.5 เท่า</div>
            </button>
            <button class="btn btn-mastery ${tRes.mastery === (t.splash ? 'splash' : 'freeze') ? 'active' : ''}" data-mastery="${t.splash ? 'splash' : 'freeze'}" style="padding:8px 10px; font-size:0.8rem; text-align:left; line-height:1.3; border: 1px solid ${tRes.mastery === (t.splash ? 'splash' : 'freeze') ? '#38bdf8' : '#475569'}; background: ${tRes.mastery === (t.splash ? 'splash' : 'freeze') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)'};">
              <div style="font-weight:bold; color:#38bdf8;">${t.splash ? '💥 Cluster Impact' : '❄️ Deep Frostbite'}</div>
              <div style="color:#94a3b8; font-size:0.75rem;">${t.splash ? 'เพิ่มรัศมีระเบิดสแปลช +60%' : 'สโลว์เป้าหมายเพิ่มขึ้น +25% นานขึ้น'}</div>
            </button>
          </div>
        </div>
      `;

      treeContainer.querySelectorAll('.btn-mastery').forEach(b => {
        b.addEventListener('click', () => {
          engine.setTowerMastery(t.id, b.dataset.mastery);
        });
      });

      treeContainer.querySelector('.node-btn-range').addEventListener('click', () => {
        engine.researchTowerUpgrade(t.id, 'range');
      });
      treeContainer.querySelector('.node-btn-rate').addEventListener('click', () => {
        engine.researchTowerUpgrade(t.id, 'fireRate');
      });
      treeContainer.querySelector('.node-btn-dmg').addEventListener('click', () => {
        engine.researchTowerUpgrade(t.id, 'damage');
      });

      techList.appendChild(treeContainer);
    });
  }

  uiHooks.renderTechTree = renderTechTree;

  const renderMarket = () => {
    if (!marketList) return;
    marketList.innerHTML = '';

    const marketOffers = [
      {
        id: 'wood_small',
        type: 'wood',
        amount: 35,
        cost: 60,
        title: 'มัดฟืนและไม้ซุงขนาดเล็ก',
        desc: 'จัดซื้อไม้ 35 🪵 จากคาราวานชาวป่าเพื่อนำไปสร้างหรือซ่อมแซมป้อมปราการ',
        icon: '🪵'
      },
      {
        id: 'wood_medium',
        type: 'wood',
        amount: 100,
        cost: 150,
        title: 'เกวียนขนท่อนซุงขนาดกลาง (สุดคุ้ม)',
        desc: 'เหมาเกวียนไม้ 100 🪵 รองรับการสร้างแนวรับขนาดใหญ่ได้อย่างรวดเร็ว',
        icon: '🪵'
      },
      {
        id: 'wood_large',
        type: 'wood',
        amount: 250,
        cost: 320,
        title: 'กองคาราวานท่อนซุงยักษ์ (ระดับกิลด์)',
        desc: 'จัดซื้อไม้ก้อนโต 250 🪵 สำหรับการขยายอาณาจักรและยุคสมัยใหม่',
        icon: '🪵'
      },
      {
        id: 'sci_small',
        type: 'science',
        amount: 25,
        cost: 80,
        title: 'จ้างปราชญ์ท้องถิ่นและบันทึกโบราณ',
        desc: 'แลกซื้อแต้มวิจัย 25 🔬 เพื่อเร่งปลดล็อกวิทยาการป้อมและมหาเวท',
        icon: '🔬'
      },
      {
        id: 'sci_medium',
        type: 'science',
        amount: 70,
        cost: 200,
        title: 'ทุนสนับสนุนการวิจัยของราชบัณฑิต',
        desc: 'สนับสนุนกองทุนวิทยาการ 70 🔬 เพิ่มพลังการรบของป้อมทั้งอาณาจักร',
        icon: '🔬'
      },
      {
        id: 'sci_large',
        type: 'science',
        amount: 180,
        cost: 450,
        title: 'การค้นพบองค์ความรู้ครั้งยิ่งใหญ่',
        desc: 'จัดซื้อแต้มวิจัยก้อนโต 180 🔬 เพื่อพัฒนาข้ามยุคสมัยและอัปเกรดขั้นสูงสุด',
        icon: '🔬'
      }
    ];

    marketOffers.forEach(item => {
      const card = document.createElement('div');
      card.className = 'tech-card';
      const canAfford = engine.gold >= item.cost;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.6rem;">${item.icon}</span>
            <div>
              <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc;">${item.title}</div>
              <div style="font-size:0.8rem; color:#38bdf8;">ได้รับ: +${item.amount} ${item.type === 'wood' ? '🪵 ไม้' : '🔬 แต้มวิจัย'}</div>
            </div>
          </div>
          <span style="font-weight:bold; color:#fbbf24; background:rgba(245, 158, 11, 0.15); padding:4px 8px; border-radius:6px; font-size:0.85rem; border:1px solid rgba(245,158,11,0.3);">
            ${item.cost} 🪙
          </span>
        </div>
        <p style="font-size:0.8rem; color:#94a3b8; line-height:1.4; margin-bottom:12px;">
          ${item.desc}
        </p>
        <button class="btn btn-tree-up btn-buy-market ${canAfford ? '' : 'disabled'}" style="width:100%; justify-content:center; background:${canAfford ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(51,65,85,0.5)'}; border: 1px solid ${canAfford ? '#f59e0b' : '#334155'};">
          ${canAfford ? `🛒 ซื้อทันที (${item.cost} 🪙)` : `เหรียญทองไม่พอ (ต้องการ ${item.cost} 🪙)`}
        </button>
      `;

      card.querySelector('.btn-buy-market').addEventListener('click', () => {
        engine.buyMarketGoods(item.type, item.amount);
      });

      marketList.appendChild(card);
    });
  };

  uiHooks.renderMarket = renderMarket;

  // เริ่มต้นโดยไม่เลือกป้อม เพื่อป้องกันการคลิกลั่น
  engine.selectedTowerType = null;
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ปุ่ม Esc เพื่อยกเลิกการเลือกป้อมหรือโหมดร่ายเวท
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (engine) {
        engine.selectedTowerType = null;
        engine.selectedPlacedTower = null;
        engine.isCastingSpell = false;
        uiHooks.deselectTower();
        uiHooks.hideTowerDetail();
      }
    }
  });

  // ควบคุมปุ่มคลังมหาเวทผู้เล่น (Commander Spell Arsenal Bar)
  const spellTabMeteor = document.getElementById('spell-tab-meteor');
  const spellTabBlizzard = document.getElementById('spell-tab-blizzard');
  const spellTabLightning = document.getElementById('spell-tab-lightning');

  const setupSpellTab = (btn, spellId) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      const sp = engine.spells[spellId];

      if (sp.energy < sp.maxEnergy) {
        sounds.playError();
        const pct = Math.floor((sp.energy / sp.maxEnergy) * 100);
        uiHooks.notify(`⚡ สกิล [${sp.name}] พลังงานยังไม่เต็ม! (${pct}%/100%) ต้องให้ป้อมยิงสะสมพลังก่อน`);
        return;
      }

      if (sp.cooldown > 0) {
        sounds.playError();
        uiHooks.notify(`⏳ สกิล [${sp.name}] ยังไม่พร้อม! (เหลือคูลดาวน์ ${Math.ceil(sp.cooldown)}s)`);
        return;
      }

      // หากคลิกสกิลที่เลือกอยู่แล้ว ให้เปิด/ปิดโหมดร่าย
      if (engine.selectedSpellId === spellId) {
        engine.isCastingSpell = !engine.isCastingSpell;
        if (engine.isCastingSpell) {
          uiHooks.notify(`🎯 โหมดร่ายเวท: กรุณาคลิกเลือกจุดบนแผนที่เพื่อปล่อย [${sp.icon} ${sp.name}]!`);
          sounds.playTone(600, 'sine', 0.1, 0.15);
        }
      } else {
        // สลับสกิลที่เลือกใช้งาน
        engine.selectSpell(spellId);
        engine.isCastingSpell = true;
        uiHooks.notify(`🎯 เลือก [${sp.icon} ${sp.name}] แล้ว! คลิกบนแผนที่เพื่อปล่อยพลังได้ทันที`);
      }
    });
  };

  setupSpellTab(spellTabMeteor, 'meteor');
  setupSpellTab(spellTabBlizzard, 'blizzard');
  setupSpellTab(spellTabLightning, 'lightning');

  btnStartWave.addEventListener('click', () => {
    engine.startNextWave();
  });

  const btnAutoWave = document.getElementById('btn-auto-wave');
  if (btnAutoWave) {
    btnAutoWave.addEventListener('click', () => {
      engine.autoWave = !engine.autoWave;
      uiHooks.updateAutoWaveButton(engine.autoWave);
      if (engine.autoWave) {
        sounds.playTone(660, 'sine', 0.1, 0.15);
        uiHooks.notify('⚡ เปิดระบบออโต้เวฟ: ระบบจะส่งเวฟต่อไปให้อัตโนมัติ (พักเมื่อถึงเวฟบอส)');
        if (!engine.isWaveRunning) {
          engine.startNextWave();
        }
      } else {
        sounds.playTone(330, 'triangle', 0.1, 0.15);
        uiHooks.notify('⏸️ ปิดระบบออโต้เวฟแล้ว');
      }
    });
  }

  btnEvolve.addEventListener('click', () => {
    engine.evolveEra();
  });

  btnNewMap.addEventListener('click', () => {
    if (confirm('คุณต้องการสุ่มแผนที่ใหม่ใช่หรือไม่? (ความคืบหน้าจะถูกรีเซ็ต)')) {
      engine.initMap();
    }
  });

  btnCloseSide.addEventListener('click', () => {
    uiHooks.hideTowerDetail();
    engine.selectedPlacedTower = null;
  });

  speedBtn.addEventListener('click', () => {
    let speedText = '1x';
    if (engine.gameSpeed === 1) {
      engine.gameSpeed = 2;
      speedText = '2x';
    } else if (engine.gameSpeed === 2) {
      engine.gameSpeed = 4;
      speedText = '4x ⚡';
    } else if (engine.gameSpeed === 4) {
      engine.gameSpeed = 0;
      speedText = '⏸️ พัก';
    } else {
      engine.gameSpeed = 1;
      speedText = '1x';
    }
    if (speedLabel) speedLabel.textContent = speedText;
    else speedBtn.textContent = `▶️ ${speedText}`;
    sounds.playTone(480, 'sine', 0.05, 0.05);
  });

  btnMute.addEventListener('click', () => {
    const isMuted = sounds.toggleMute();
    if (muteLabel) {
      muteLabel.textContent = isMuted ? 'เสียง: ปิด' : 'เสียง: เปิด';
    } else {
      btnMute.textContent = isMuted ? '🔇 ปิดเสียง' : '🔊 เปิดเสียง';
    }
  });

  // ปลดล็อก Web Audio และเปิดเสียง BGM ทันทีที่ผู้เล่นคลิกบนหน้าจอครั้งแรก (Browser Autoplay Policy)
  const startAudioOnFirstInteraction = () => {
    sounds.init();
    sounds.startBGM(engine.currentEraIndex);
    window.removeEventListener('click', startAudioOnFirstInteraction);
    window.removeEventListener('keydown', startAudioOnFirstInteraction);
  };
  window.addEventListener('click', startAudioOnFirstInteraction, { once: true });
  window.addEventListener('keydown', startAudioOnFirstInteraction, { once: true });

  btnRestart.addEventListener('click', () => {
    window.location.reload();
  });

  // เริ่ม Game Loop ทันที
  engine.startLoop();
});
