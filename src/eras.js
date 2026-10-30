export const ERAS = [
  {
    id: 'stone',
    name: 'ยุคหิน (Stone Age)',
    shortName: 'Stone Age',
    description: 'ยุคเริ่มแรกของมนุษยชาติ ใช้หิน ไม้ และถ่านไฟเพื่อเอาชีวิตรอด',
    upgradeCost: { gold: 150, science: 50 },
    theme: {
      ground: '#3a5a40',
      groundAlt: '#344e41',
      path: '#a3b18a',
      water: '#588b8b',
      wall: '#6c584c',
      accent: '#d4a373',
      particle: '#e9c46a'
    },
    towers: [
      {
        id: 'stone_sling',
        name: 'หอขว้างหิน (Slinger Post)',
        type: 'attack',
        damageType: 'blunt', // ทุบ/กระแทก
        cost: { gold: 40, wood: 20 },
        damage: 18,
        range: 120,
        fireRate: 1.2,
        desc: 'โจมตีเป้าหมายเดี่ยวด้วยก้อนหินคม (ดาเมจ Blunt: ตีเกราะเบาแรง 130% ตีหุ้มเกราะ 70%)',
        color: '#8d99ae',
        projColor: '#4a4e69',
        icon: '🪨'
      },
      {
        id: 'stone_spear',
        name: 'ป้อมหอกไม้แหลม (Spear Tower)',
        type: 'attack',
        damageType: 'pierce', // แทงทะลวง
        cost: { gold: 75, wood: 40 },
        damage: 42,
        range: 155,
        fireRate: 1.8,
        desc: 'พุ่งหอกทะลวงเกราะรุนแรง (ดาเมจ Pierce: เจาะสัตว์ยักษ์/เกราะหนัก 150% ตีฝูงเร็ว 75%)',
        color: '#a0522d',
        projColor: '#d2691e',
        icon: '🪵'
      },
      {
        id: 'stone_totem',
        name: 'เสาโทเทมไฟ (Fire Totem)',
        type: 'support',
        damageType: 'magic', // ไฟ/เวทมนตร์
        cost: { gold: 90, wood: 50 },
        damage: 8,
        range: 105,
        fireRate: 0.6,
        splash: 65,
        desc: 'ปล่อยคลื่นไฟลนเผา (ดาเมจ Magic/Fire: เผาสัตว์ป่าและเกราะเบา 140% โดนเกราะหนา 80%)',
        color: '#e76f51',
        projColor: '#f4a261',
        icon: '🔥'
      },
      {
        id: 'stone_hut',
        name: 'กระต๊อบคนป่า (Tribal Hut)',
        type: 'economy',
        cost: { gold: 50, wood: 30 },
        income: { gold: 6, wood: 4 },
        interval: 3.5,
        desc: 'ตัดไม้และเก็บของป่า ป้อนวัสดุและเหรียญทองให้เมือง (เฉพาะระหว่างเวฟ)',
        color: '#b5838d',
        icon: '🛖'
      },
      {
        id: 'stone_altar',
        name: 'แท่นบูชาปรีชาญาณ (Wisdom Altar)',
        type: 'research',
        cost: { gold: 70, wood: 45 },
        income: { science: 4 },
        interval: 3.5,
        desc: 'สังเกตดวงดาวและค้นคว้าวิทยาการโบราณ สร้างแต้มวิจัย 🔬 โดยเฉพาะ',
        color: '#8b5cf6',
        icon: '🔮'
      }
    ]
  },
  {
    id: 'medieval',
    name: 'ยุคกลาง (Medieval Kingdom)',
    shortName: 'Medieval',
    description: 'ยุคแห่งอัศวิน ปราสาทหิน และป้อมหน้าไม้กลไกโบราณ',
    upgradeCost: { gold: 400, science: 160 },
    theme: {
      ground: '#2b4141',
      groundAlt: '#1f363d',
      path: '#9999a1',
      water: '#4361ee',
      wall: '#707070',
      accent: '#f77f00',
      particle: '#fcbf49'
    },
    towers: [
      {
        id: 'med_archer',
        name: 'หอพลธนูพิทักษ์ (Archer Bastion)',
        type: 'attack',
        damageType: 'pierce',
        cost: { gold: 95, wood: 35 },
        damage: 35,
        range: 170,
        fireRate: 1.1,
        desc: 'ยิงลูกศรระยะไกล (Pierce: ชนะทางมอนเกราะเบา/สัตว์ 130% แต่แพ้เกราะเหล็ก 70%)',
        color: '#457b9d',
        projColor: '#f1faee',
        icon: '🏹'
      },
      {
        id: 'med_ballista',
        name: 'หน้าไม้กลยักษ์ (Ballista Engine)',
        type: 'attack',
        damageType: 'pierce',
        cost: { gold: 160, wood: 70 },
        damage: 120,
        range: 210,
        fireRate: 2.4,
        desc: 'ยิงฉมวกทะลวงเกราะรุนแรง (Pierce Heavy: โจมตีอัศวินเกราะเหล็ก/รถถังแรง 160%)',
        color: '#6b705c',
        projColor: '#cb997e',
        icon: '🎯'
      },
      {
        id: 'med_catapult',
        name: 'เครื่องดีดหินเพลิง (Flame Trebuchet)',
        type: 'attack',
        damageType: 'blunt',
        cost: { gold: 210, wood: 90 },
        damage: 90,
        range: 180,
        fireRate: 2.8,
        splash: 80,
        desc: 'ดีดหินเพลิงระเบิดกลุ่ม (Blunt/Blast: ทำลายทหารโล่และกลุ่มมอน 150%)',
        color: '#d62828',
        projColor: '#f77f00',
        icon: '☄️'
      },
      {
        id: 'med_mill',
        name: 'กังหันลมหลวง (Kingdom Mill)',
        type: 'economy',
        cost: { gold: 120, wood: 60 },
        income: { gold: 14, science: 6 },
        interval: 3.5,
        desc: 'บดข้าวและจัดเก็บภาษีป้อนคลังหลวง',
        color: '#e9d8a6',
        icon: '🌾'
      }
    ]
  },
  {
    id: 'industrial',
    name: 'ยุคอุตสาหกรรม (Industrial Steampunk)',
    shortName: 'Industrial',
    description: 'เครื่องจักรไอน้ำ ปืนใหญ่ดินปืน และโรงงานฟันเฟือง',
    upgradeCost: { gold: 950, science: 380 },
    theme: {
      ground: '#333533',
      groundAlt: '#242423',
      path: '#cfdbd5',
      water: '#3d5a80',
      wall: '#b5651d',
      accent: '#f5cb5c',
      particle: '#e0a96d'
    },
    towers: [
      {
        id: 'ind_gatling',
        name: 'ป้อมปืนกลแกตลิ่ง (Steam Gatling)',
        type: 'attack',
        damageType: 'pierce',
        cost: { gold: 220, wood: 60 },
        damage: 22,
        range: 160,
        fireRate: 0.22,
        desc: 'กระหน่ำกระสุนทองเหลืองเจาะทะลวงด้วยความเร็วสูงสุด (Pierce)',
        color: '#b08968',
        projColor: '#ffb703',
        icon: '⚙️'
      },
      {
        id: 'ind_cannon',
        name: 'ปืนใหญ่เหล็กกล้า (Iron Howitzer)',
        type: 'attack',
        damageType: 'blunt',
        cost: { gold: 310, wood: 90 },
        damage: 170,
        range: 220,
        fireRate: 2.4,
        splash: 95,
        desc: 'ยิงระเบิดดินปืนลูกใหญ่สะเทือนพื้นดิน ทุบทำลายเกราะ (Blunt)',
        color: '#495057',
        projColor: '#d00000',
        icon: '💣'
      },
      {
        id: 'ind_tesla',
        name: 'หอคอยสายฟ้าเทสลา (Tesla Coil)',
        type: 'support',
        damageType: 'magic',
        cost: { gold: 360, wood: 100 },
        damage: 48,
        range: 150,
        fireRate: 0.9,
        slow: 0.5, // สโลว์ 50%
        slowDuration: 2.0,
        desc: 'ช็อตศัตรูด้วยไฟฟ้าแรงสูงเวทมนตร์และทำให้เดินช้าลงครึ่งหนึ่ง (Magic)',
        color: '#00b4d8',
        projColor: '#90e0ef',
        icon: '⚡'
      },
      {
        id: 'ind_factory',
        name: 'โรงงานจักรไอน้ำ (Steam Works)',
        type: 'economy',
        cost: { gold: 260, wood: 80 },
        income: { gold: 34, science: 16 },
        interval: 3.5,
        desc: 'ผลิตเหรียญทองและค้นคว้าวิทยาการจักรกล',
        color: '#7f5539',
        icon: '🏭'
      }
    ]
  },
  {
    id: 'modern',
    name: 'ยุคปัจจุบัน (Modern Warfare)',
    shortName: 'Modern',
    description: 'ขีปนาวุธนำวิถี เรดาร์สแกนเนอร์ และป้อมไฮเทคเรลกัน',
    upgradeCost: { gold: 2200, science: 850 },
    theme: {
      ground: '#1e293b',
      groundAlt: '#0f172a',
      path: '#94a3b8',
      water: '#0284c7',
      wall: '#475569',
      accent: '#38bdf8',
      particle: '#38bdf8'
    },
    towers: [
      {
        id: 'mod_missile',
        name: 'ฐานจรวด SAM (Missile Battery)',
        type: 'attack',
        damageType: 'blunt',
        cost: { gold: 460, wood: 120 },
        damage: 260,
        range: 260,
        fireRate: 2.1,
        splash: 110,
        desc: 'ยิงจรวดวิถีไกลระเบิดกระจายกลุ่มเป้าหมาย (Blunt/Explosive)',
        color: '#1d3557',
        projColor: '#e63946',
        icon: '🚀'
      },
      {
        id: 'mod_laser',
        name: 'ป้อมแสงเลเซอร์ความถี่สูง (Laser Array)',
        type: 'attack',
        damageType: 'magic',
        cost: { gold: 490, wood: 130 },
        damage: 55,
        range: 190,
        fireRate: 0.35,
        desc: 'ฉายลำแสงเข้มข้นละลายเกราะเป้าหมายอย่างต่อเนื่อง (Magic/Energy)',
        color: '#00f5d4',
        projColor: '#00f5d4',
        icon: '🔦'
      },
      {
        id: 'mod_cryo',
        name: 'ป้อมไนโตรเจนเหลว (Cryo Emitter)',
        type: 'support',
        damageType: 'magic',
        cost: { gold: 430, wood: 110 },
        damage: 30,
        range: 160,
        fireRate: 1.2,
        slow: 0.65,
        slowDuration: 3.0,
        desc: 'พ่นละอองแช่แข็ง ศัตรูในระยะแทบจะหยุดก้าว (Magic/Frost)',
        color: '#48cae4',
        projColor: '#ade8f4',
        icon: '❄️'
      },
      {
        id: 'mod_lab',
        name: 'สถาบันวิจัยนิวเคลียร์ (Research Center)',
        type: 'economy',
        cost: { gold: 520, wood: 150 },
        income: { gold: 75, science: 42 },
        interval: 3.5,
        desc: 'ศูนย์วิจัยเทคโนโลยีและทุนอุดหนุนกลาโหม',
        color: '#06d6a0',
        icon: '🔬'
      }
    ]
  },
  {
    id: 'space',
    name: 'ยุคเทคโนโลยีอวกาศ (Galactic Space Age)',
    shortName: 'Space Age',
    description: 'ปืนใหญ่ปฏิสสาร คลื่นควอนตัม และสถานีวงโคจรนอกโลก',
    upgradeCost: null, // Final Era
    theme: {
      ground: '#0b091a',
      groundAlt: '#140d2b',
      path: '#bd00ff',
      water: '#00f0ff',
      wall: '#7928ca',
      accent: '#00f0ff',
      particle: '#ff007f'
    },
    towers: [
      {
        id: 'spc_antimatter',
        name: 'ปืนใหญ่ปฏิสสาร (Antimatter Cannon)',
        type: 'attack',
        damageType: 'pierce',
        cost: { gold: 850, wood: 260 },
        damage: 650,
        range: 280,
        fireRate: 1.8,
        splash: 140,
        desc: 'ฉีกมิติสลายอนุภาคทะลวงทุกเกราะเป็นจุล (Pierce)',
        color: '#7928ca',
        projColor: '#ff007f',
        icon: '🌌'
      },
      {
        id: 'spc_orbital',
        name: 'บีมวงโคจรดาวเทียม (Orbital Strike Relay)',
        type: 'attack',
        damageType: 'magic',
        cost: { gold: 1100, wood: 320 },
        damage: 1300,
        range: 340,
        fireRate: 3.8,
        splash: 160,
        desc: 'ส่งสัญญาณเลเซอร์จากดาวเทียมยิงทำลายล้างกวาดทั้งเส้นทาง (Magic/Cosmic)',
        color: '#00f0ff',
        projColor: '#ffffff',
        icon: '🛰️'
      },
      {
        id: 'spc_chronos',
        name: 'เครื่องบิดเบือนเวลา (Chronos Warp Tower)',
        type: 'support',
        damageType: 'magic',
        cost: { gold: 800, wood: 240 },
        damage: 80,
        range: 220,
        fireRate: 1.5,
        slow: 0.8,
        slowDuration: 4.0,
        desc: 'ดึงกาลเวลาให้หยุดนิ่ง ศัตรูติดสถานะมิติชะลอเกือบ 80% (Magic)',
        color: '#ff007f',
        projColor: '#7928ca',
        icon: '⏳'
      },
      {
        id: 'spc_dyson',
        name: 'เครื่องกำเนิดพลังงานดวงดาว (Dyson Node)',
        type: 'economy',
        cost: { gold: 950, wood: 300 },
        income: { gold: 180, science: 90 },
        interval: 3.5,
        desc: 'สูบพลังงานจากจักรวาล สร้างทรัพยากรมหาศาลไร้ขีดจำกัด',
        color: '#ffe600',
        icon: '⚡'
      }
    ]
  }
];

export const ENEMY_TYPES = [
  // ยุคหิน
  { 
    era: 0, 
    id: 'sabertooth',
    name: 'เสือเขี้ยวดาบ', 
    title: 'Sabertooth',
    armorType: 'beast', // สัตว์ป่าคล่องแคล่ว
    hp: 85, 
    speed: 0.95, // ปรับลดความเร็วลงมาให้พอดี ไม่เร็วเกินไปในช่วงแรก
    reward: 5,   // ปรับสมดุลทองไม่ให้เงินเฟ้อ
    sciReward: 2, 
    icon: '🐅', 
    size: 15, 
    color: '#f4a261',
    strength: 'เคลื่อนที่คล่องตัว วิ่งนำทัพหน้า',
    weakness: 'แพ้ทางโทเทมไฟ/เวทมนตร์ (รับดาเมจ 140%) และก้อนหินทุบ (130%)'
  },
  { 
    era: 0, 
    id: 'mammoth',
    name: 'แมมมอธดึกดำบรรพ์', 
    title: 'Mammoth Tanker',
    armorType: 'heavy', // สัตว์ยักษ์เกราะหนา
    hp: 360, 
    speed: 0.48, // ก้าวย่างสุขุม หนักแน่น
    reward: 12, 
    sciReward: 4, 
    icon: '🦣', 
    size: 23, 
    color: '#8d6e63',
    strength: 'พลังชีวิตสูงมาก ทนทานก้อนหินและอาวุธทุบ (รับดาเมจเพียง 70%)',
    weakness: 'แพ้ทางป้อมหอกแหลมแทงทะลวงเกราะ (รับดาเมจทะลวง 150%)'
  },

  // ยุคกลาง
  { 
    era: 1, 
    id: 'shield_infantry',
    name: 'กองหน้าดาบโล่', 
    title: 'Shield Infantry',
    armorType: 'light', // เกราะเบา/โล่ไม้
    hp: 240, 
    speed: 0.85, 
    reward: 8, 
    sciReward: 3, 
    icon: '🛡️', 
    size: 16, 
    color: '#90a4ae',
    strength: 'ยกโล่กันลูกศรตรงหน้าได้ดี (ทนแทงทะลวง)',
    weakness: 'แพ้ทางเครื่องดีดหินเพลิงระเบิดกลุ่ม (รับดาเมจ Blunt/Blast 150%)'
  },
  { 
    era: 1, 
    id: 'armored_knight',
    name: 'อัศวินเกราะเหล็ก', 
    title: 'Armored Knight',
    armorType: 'heavy', // เกราะเหล็กกล้าหนัก
    hp: 780, 
    speed: 0.58, 
    reward: 18, 
    sciReward: 6, 
    icon: '🐎', 
    size: 22, 
    color: '#546e7a',
    strength: 'เกราะเหล็กกล้าลดความเสียหายธนูทั่วไป 50%',
    weakness: 'แพ้ทางหน้าไม้กลยักษ์ Ballista ทะลวงเกราะหนัก (รับดาเมจ 160%)'
  },

  // ยุคอุตสาหกรรม
  { 
    era: 2, 
    id: 'automaton',
    name: 'หุ่นยนต์จักรกลไอน้ำ', 
    title: 'Steam Automaton',
    armorType: 'heavy',
    hp: 720, 
    speed: 0.78, 
    reward: 15, 
    sciReward: 6, 
    icon: '🤖', 
    size: 18, 
    color: '#d4a373',
    strength: 'ภูมิคุ้มกันความร้อนและเปลวไฟ',
    weakness: 'แพ้ทางหอคอยสายฟ้าเทสลา (ช็อตวงจรไฟฟ้าลัดวงจร รับดาเมจ 160%)'
  },
  { 
    era: 2, 
    id: 'zeppelin',
    name: 'เรือเหาะติดเกราะ', 
    title: 'Zeppelin Dreadnought',
    armorType: 'heavy',
    hp: 2100, 
    speed: 0.45, 
    reward: 38, 
    sciReward: 14, 
    icon: '🛸', 
    size: 26, 
    color: '#8d5b4c',
    strength: 'ขนาดมหึมา เลือดมหาศาล ทนกระสุนปืนกลขนาดเล็ก',
    weakness: 'แพ้ทางปืนใหญ่ดินปืน Howitzer ขนาดใหญ่ (รับดาเมจระเบิด 150%)'
  },

  // ยุคปัจจุบัน
  { 
    era: 3, 
    id: 'cyber_apc',
    name: 'รถหุ้มเกราะไฮสปีด', 
    title: 'Cyber APC',
    armorType: 'light',
    hp: 1450, 
    speed: 1.25, 
    reward: 28, 
    sciReward: 10, 
    icon: '🚙', 
    size: 19, 
    color: '#00b4d8',
    strength: 'ความเร็วสูง บูสต์เครื่องยนต์ฝ่าดงกระสุน',
    weakness: 'แพ้ทางป้อมพ่นไนโตรเจนเหลว Cryo แช่แข็งหยุดการเคลื่อนที่'
  },
  { 
    era: 3, 
    id: 'railgun_tank',
    name: 'รถถังแม่เหล็กไฟฟ้า', 
    title: 'Heavy Railgun Tank',
    armorType: 'heavy',
    hp: 4200, 
    speed: 0.50, 
    reward: 55, 
    sciReward: 20, 
    icon: '🪖', 
    size: 27, 
    color: '#023e8a',
    strength: 'เกราะสนามพลังหนาแน่นดูดซับแรงกระแทก',
    weakness: 'แพ้ทางป้อมเลเซอร์ความร้อนสูง ยิงละลายเกราะต่อเนื่อง (รับดาเมจ 160%)'
  },

  // ยุคอวกาศ
  { 
    era: 4, 
    id: 'void_stalker',
    name: 'ไครซิส วอร์พเกอร์', 
    title: 'Void Stalker',
    armorType: 'beast',
    hp: 3500, 
    speed: 1.35, 
    reward: 45, 
    sciReward: 16, 
    icon: '👾', 
    size: 20, 
    color: '#bd00ff',
    strength: 'วาร์ปหลบการโจมตีปกติและเคลื่อนไหวเร็ว',
    weakness: 'แพ้ทางเครื่องบิดเบือนเวลา Chronos Warp ดึงให้หยุดนิ่ง'
  },
  { 
    era: 4, 
    id: 'galactic_colossus',
    name: 'จอมทำลายล้างดวงดาว', 
    title: 'Galactic Colossus Boss',
    armorType: 'heavy',
    hp: 13500, 
    speed: 0.38, 
    reward: 120, 
    sciReward: 50, 
    icon: '🪐', 
    size: 32, 
    color: '#ff007f',
    strength: 'บอสระดับจักรวาล เลือดหลักหมื่น พลังทำลายล้างสูงสุด',
    weakness: 'แพ้ทางปืนใหญ่ปฏิสสาร Antimatter และบีมวงโคจรดาวเทียม Orbital Strike'
  }
];
