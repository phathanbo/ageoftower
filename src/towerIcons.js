// Vector SVG Icons for each tower across all eras
export const TOWER_SVGS = {
  // Stone Age
  stone_sling: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 36 L19 14 M26 36 L21 14" stroke="#a8a29e" stroke-width="2.5"/>
      <line x1="15" y1="26" x2="25" y2="26" stroke="#78716c"/>
      <circle cx="20" cy="11" r="5" fill="#94a3b8" stroke="#475569"/>
    </svg>`,
  stone_spear: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="16" y="16" width="8" height="20" rx="1" fill="#78716c"/>
      <line x1="12" y1="30" x2="28" y2="8" stroke="#d97706" stroke-width="3"/>
      <polygon points="28,8 32,5 30,12" fill="#e2e8f0"/>
    </svg>`,
  stone_totem: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="16" y="18" width="8" height="18" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
      <circle cx="20" cy="22" r="1.5" fill="#fde047"/>
      <circle cx="20" cy="28" r="1.5" fill="#fde047"/>
      <path d="M20 5 C25 10 25 14 20 17 C15 14 15 10 20 5 Z" fill="#f97316"/>
      <path d="M20 9 C22 12 22 14 20 16 C18 14 18 12 20 9 Z" fill="#fde047"/>
    </svg>`,
  stone_hut: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="13" y="22" width="14" height="14" fill="#a16207"/>
      <polygon points="20,8 31,22 9,22" fill="#ca8a04"/>
      <rect x="17" y="27" width="6" height="9" fill="#451a03"/>
    </svg>`,
  stone_altar: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="14" y="22" width="12" height="14" fill="#6d28d9"/>
      <ellipse cx="20" cy="14" rx="8" ry="8" fill="#a855f7" stroke="#e9d5ff" stroke-width="1.5"/>
      <circle cx="20" cy="14" r="3" fill="#ffffff"/>
    </svg>`,

  // Medieval
  med_archer: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="14" y="16" width="12" height="20" fill="#94a3b8"/>
      <rect x="12" y="12" width="4" height="6" fill="#cbd5e1"/>
      <rect x="24" y="12" width="4" height="6" fill="#cbd5e1"/>
      <line x1="20" y1="12" x2="20" y2="4" stroke="#475569" stroke-width="2"/>
      <polygon points="20,4 27,7 20,10" fill="#ef4444"/>
    </svg>`,
  med_ballista: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="15" y="24" width="10" height="12" fill="#64748b"/>
      <path d="M9 16 Q20 25 31 16" stroke="#b45309" stroke-width="3" fill="none"/>
      <line x1="20" y1="28" x2="20" y2="7" stroke="#e2e8f0" stroke-width="2"/>
      <polygon points="20,4 22,8 18,8" fill="#e2e8f0"/>
    </svg>`,
  med_catapult: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <line x1="12" y1="34" x2="28" y2="34" stroke="#78350f" stroke-width="3"/>
      <line x1="14" y1="34" x2="22" y2="20" stroke="#78350f" stroke-width="2.5"/>
      <line x1="12" y1="28" x2="30" y2="10" stroke="#b45309" stroke-width="3"/>
      <circle cx="31" cy="9" r="4" fill="#ea580c"/>
    </svg>`,
  med_mill: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <polygon points="14,36 17,20 23,20 26,36" fill="#cbd5e1"/>
      <circle cx="20" cy="20" r="3" fill="#78350f"/>
      <line x1="10" y1="10" x2="30" y2="30" stroke="#b45309" stroke-width="2"/>
      <line x1="30" y1="10" x2="10" y2="30" stroke="#b45309" stroke-width="2"/>
    </svg>`,

  // Industrial
  ind_gatling: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="15" y="24" width="10" height="12" fill="#475569"/>
      <circle cx="20" cy="20" r="7" fill="#b45309" stroke="#f59e0b" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="1.5" fill="#1e293b"/>
      <circle cx="22" cy="18" r="1.5" fill="#1e293b"/>
      <circle cx="20" cy="23" r="1.5" fill="#1e293b"/>
      <line x1="20" y1="13" x2="20" y2="5" stroke="#f59e0b" stroke-width="3"/>
    </svg>`,
  ind_cannon: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <circle cx="16" cy="30" r="6" fill="#334155" stroke="#64748b" stroke-width="2"/>
      <line x1="14" y1="26" x2="32" y2="10" stroke="#1e293b" stroke-width="6"/>
      <line x1="14" y1="26" x2="32" y2="10" stroke="#475569" stroke-width="4"/>
    </svg>`,
  ind_tesla: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="17" y="20" width="6" height="16" fill="#0284c7"/>
      <circle cx="20" cy="14" r="7" fill="#38bdf8"/>
      <path d="M18 6 L22 10 L19 12 L23 16" stroke="#fef08a" stroke-width="2"/>
    </svg>`,
  ind_factory: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="8" y="22" width="24" height="14" fill="#713f12"/>
      <rect x="22" y="10" width="6" height="12" fill="#334155"/>
      <circle cx="25" cy="7" r="3" fill="#cbd5e1" opacity="0.6"/>
    </svg>`,

  // Modern
  mod_missile: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="12" y="26" width="16" height="10" rx="2" fill="#1e293b"/>
      <rect x="15" y="10" width="4" height="16" fill="#f8fafc"/>
      <polygon points="17,5 19,10 15,10" fill="#ef4444"/>
      <rect x="21" y="12" width="4" height="14" fill="#f8fafc"/>
      <polygon points="23,7 25,12 21,12" fill="#ef4444"/>
    </svg>`,
  mod_laser: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="17" y="22" width="6" height="14" fill="#334155"/>
      <ellipse cx="20" cy="16" rx="10" ry="5" fill="#06b6d4"/>
      <line x1="20" y1="16" x2="34" y2="8" stroke="#00f0ff" stroke-width="2.5"/>
    </svg>`,
  mod_cryo: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="15" y="24" width="10" height="12" fill="#0284c7"/>
      <circle cx="20" cy="18" r="8" fill="#bae6fd" stroke="#38bdf8" stroke-width="2"/>
      <path d="M20 12 L20 24 M14 18 L26 18" stroke="#0284c7" stroke-width="1.5"/>
    </svg>`,
  mod_lab: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <path d="M12 36 L12 26 A8 8 0 0 1 28 26 L28 36 Z" fill="#475569"/>
      <circle cx="20" cy="24" r="5" fill="#10b981"/>
    </svg>`,

  // Space
  spc_antimatter: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="18" y="26" width="4" height="10" fill="#3b0764"/>
      <ellipse cx="20" cy="18" rx="12" ry="6" stroke="#bd00ff" stroke-width="2.5"/>
      <circle cx="20" cy="18" r="4" fill="#f8fafc"/>
    </svg>`,
  spc_orbital: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <line x1="20" y1="36" x2="20" y2="8" stroke="#065f46" stroke-width="3"/>
      <circle cx="20" cy="8" r="6" fill="#00f0ff"/>
      <circle cx="20" cy="8" r="2.5" fill="#ffffff"/>
    </svg>`,
  spc_chronos: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="17" y="28" width="6" height="8" fill="#500724"/>
      <polygon points="20,6 28,18 20,30 12,18" fill="#fb7185" stroke="#f43f5e" stroke-width="1.5"/>
    </svg>`,
  spc_dyson: `
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect x="16" y="26" width="8" height="10" fill="#713f12"/>
      <circle cx="20" cy="16" r="9" fill="#facc15" stroke="#fef08a" stroke-width="2"/>
      <circle cx="20" cy="16" r="4" fill="#ffffff"/>
    </svg>`
};
