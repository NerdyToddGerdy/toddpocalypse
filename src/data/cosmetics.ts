// Cosmetic unlock tables (#61): avatars, borders, themes and legacy rewards. Data
// only; engine.ts holds the rules.

/** Player avatar options — unlockable via achievements. */
export const AVATAR_DEFS: { id: string; icon: string; name: string }[] = [
  { id: "default",  icon: "⚔",  name: "Warrior"         },
  { id: "dragon",   icon: "🐉",  name: "Dragon Slayer"   },
  { id: "skull",    icon: "💀",  name: "The Dead"        },
  { id: "gem",      icon: "💎",  name: "Treasure Hunter" },
  { id: "crown",    icon: "👑",  name: "Champion"        },
  { id: "rune",     icon: "🔮",  name: "Arcanist"        },
  { id: "star",     icon: "⭐",  name: "Legend"          },
  { id: "warlord",  icon: "🔱",  name: "Warlord"         },
  { id: "merchant", icon: "💰",  name: "Merchant"        },
  { id: "hunter",   icon: "🏹",  name: "Hunter"          },
  { id: "wolf",     icon: "🐺",  name: "Wolf"            },
  { id: "flame",    icon: "🔥",  name: "Pyromancer"      },
  { id: "hawk",     icon: "🦅",  name: "Hawk Eye"        },
  { id: "explorer", icon: "🗺️", name: "Explorer"        },
  { id: "compass",  icon: "🧭",  name: "Archaeologist"   },
  { id: "medal",    icon: "🎖️", name: "Decorated"       },
  { id: "coin",     icon: "🪙",  name: "Coin Lord"       },
  { id: "wizard",   icon: "🧙",  name: "Spellbinder"     },
  { id: "crystal",  icon: "💠",  name: "Gemcutter"       },
  { id: "scales",   icon: "⚖️", name: "Arbiter"         },
];

/** Player avatar border styles — unlockable via achievements. */
export const BORDER_DEFS: { id: string; cssClass: string; name: string }[] = [
  { id: "none",      cssClass: "border-none",      name: "None"      },
  { id: "iron",      cssClass: "border-iron",      name: "Iron"      },
  { id: "silver",    cssClass: "border-silver",    name: "Silver"    },
  { id: "gold",      cssClass: "border-gold",      name: "Gold"      },
  { id: "blood",     cssClass: "border-blood",     name: "Blood"     },
  { id: "arcane",    cssClass: "border-arcane",    name: "Arcane"    },
  { id: "ancient",   cssClass: "border-ancient",   name: "Ancient"   },
  { id: "void",      cssClass: "border-void",      name: "Void"      },
  { id: "crimson",   cssClass: "border-crimson",   name: "Crimson"   },
  { id: "ember",     cssClass: "border-ember",     name: "Ember"     },
  { id: "bronze",    cssClass: "border-bronze",    name: "Bronze"    },
  { id: "shadow",    cssClass: "border-shadow",    name: "Shadow"    },
  { id: "emerald",   cssClass: "border-emerald",   name: "Emerald"   },
  { id: "frost",     cssClass: "border-frost",     name: "Frost"     },
  { id: "twilight",  cssClass: "border-twilight",  name: "Twilight"  },
  { id: "relic",     cssClass: "border-relic",     name: "Relic"     },
  { id: "celestial", cssClass: "border-celestial", name: "Celestial" },
  { id: "obsidian",  cssClass: "border-obsidian",  name: "Obsidian"  },
  { id: "platinum",  cssClass: "border-platinum",  name: "Platinum"  },
  { id: "sovereign", cssClass: "border-sovereign", name: "Sovereign" },
  { id: "mystic",    cssClass: "border-mystic",    name: "Mystic"    },
  { id: "storm",     cssClass: "border-storm",     name: "Storm"     },
  { id: "runic",     cssClass: "border-runic",     name: "Runic"     },
  { id: "spellfire", cssClass: "border-spellfire", name: "Spellfire" },
];

/** Legacy unlocks granted per retirement milestone: { retirements → { classes, title, avatars, borders } } */
export const LEGACY_UNLOCKS: Record<number, { classes: string[]; title: string; avatar?: string; border?: string }> = {
  1: { classes: ["paladin"], title: "Veteran",    avatar: "crown" },
  2: { classes: ["ranger"],  title: "Twice-Born", border: "blood" },
  3: { classes: ["druid"],   title: "The Eternal", avatar: "warlord" },
};

/** All visual themes with their prestige unlock requirements. */
export const THEME_UNLOCKS: { theme: string; icon: string; label: string; prestiges: number }[] = [
  { theme: "torchlight",  icon: "🕯", label: "Torchlight",   prestiges: 0 },
  { theme: "ledger",      icon: "📜", label: "Ledger",       prestiges: 0 },
  { theme: "grimdark",    icon: "⚔",  label: "Grimdark",    prestiges: 0 },
  { theme: "arcane",      icon: "🔮", label: "Arcane",       prestiges: 0 },
  { theme: "inferno",     icon: "🔥", label: "Inferno",      prestiges: 3 },
  { theme: "void-rift",   icon: "🌀", label: "Void Rift",    prestiges: 5 },
  { theme: "bloodmoon",   icon: "🩸", label: "Bloodmoon",    prestiges: 8 },
  { theme: "frost-crypt", icon: "❄",  label: "Frost Crypt",  prestiges: 12 },
  { theme: "necropolis",  icon: "💀", label: "Necropolis",   prestiges: 17 },
];
