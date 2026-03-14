// ============================================================
// config.js — 數值常數，最先載入
// ============================================================

const CONFIG = {

  // 玩家基礎數值
  PLAYER: {
    HP_BASE:        30,
    HP_PER_LEVEL:   5,
    GOLD_START:     100,
    // 三圍骰點公式：skill=1d6, def=1d6+10, luck=1d6
  },

  // 戰鬥公式
  COMBAT: {
    HIT_FORMULA:    '1d20 + skill > enemy.def',
    CRIT_THRESHOLD: 20,       // d20投到20暴擊
    CRIT_MULT:      2,        // 暴擊骰子翻倍
  },

  // 武器傷害骰
  WEAPON_DICE: {
    LIGHT:    4,   // 輕型單手 1d4
    MILITARY: 6,   // 軍用單手 1d6
    HEAVY:    '2d6', // 重型雙手 2d6
    RANGED:   8,   // 遠程雙手 1d8
  },

  // 站位
  BATTLE: {
    PARTY_SLOTS:  4,
    ENEMY_SLOTS:  4,
    // 近戰可打敵方槽位1-2，遠程可打1-4
    MELEE_RANGE:  [1, 2],
    RANGED_RANGE: [1, 2, 3, 4],
  },

  // 等級縮放
  SCALING: {
    ENEMY_SCALE: 0.15,        // 敵人每級成長15%
    GATE_SCALE:  0.25,        // 惡魔之門入侵者成長25%
  },

  // 顏色分類（暫代圖片）
  COLORS: {
    PLAYER:  '#4a7fc1',  // 藍
    LILY:    '#c14a4a',  // 紅
    ENEMY:   '#4a9b5a',  // 綠
    ELITE:   '#c17a2a',  // 橘
    BOSS:    '#222222',  // 黑
    BG:      '#6b4c2a',  // 棕
  },

  // Emoji分類
  EMOJI: {
    WEAPON:  '⚔️',
    ARMOR:   '🛡️',
    HELMET:  '⛑️',
    RING:    '💍',
    POTION:  '🧪',
    GOLD:    '🪙',
    GEM:     '💎',
    KEY:     '🗝️',
  },

};
