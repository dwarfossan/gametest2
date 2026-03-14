// ============================================================
// db_enemy.js — 敵人資料，純數據
// ============================================================

const DB_ENEMY = {

  // 第一層：哥布林巢穴
  goblin_club: {
    name:   '哥布林棍兵',
    color:  CONFIG.COLORS.ENEMY,
    hp:     15,
    skill:  3,
    def:    12,
    exp:    10,
    gp:     8,
    weapon: 'MILITARY',   // 傷害骰參照
    slots:  [1, 2],       // 偏好前排
    lily:   '雜兵中的雜兵。連這種東西都打不過的話，笨矮人你趁早回去種田。',
    qt: ['打死矮子！', '給我打！', '嘎嘎嘎！'],
    actions: [
      { name: '普通攻擊', chance: 1.0 }
    ],
  },

  goblin_spear: {
    name:   '哥布林矛兵',
    color:  CONFIG.COLORS.ENEMY,
    hp:     15,
    skill:  4,
    def:    13,
    exp:    12,
    gp:     8,
    weapon: 'MILITARY',
    slots:  [1, 2],
    lily:   '比棍兵多點刺距。靠近之前先想清楚，雖然你肯定不會想的。',
    qt: ['刺穿他！', '不許通過！', '矮子滾開！'],
    actions: [
      { name: '普通攻擊', chance: 0.7 },
      { name: '穿刺',     chance: 0.3, effect: 'pierce' },
    ],
  },

  goblin_archer: {
    name:   '哥布林弓手',
    color:  CONFIG.COLORS.ENEMY,
    hp:     10,
    skill:  4,
    def:    12,
    exp:    12,
    gp:     8,
    weapon: 'RANGED',
    slots:  [3, 4],       // 偏好後排
    range:  'ranged',
    lily:   '縮在後面的懦夫。但箭不會因為你是矮子就射偏，注意點。',
    qt: ['嘿嘿嘿！', '看箭！', '射死他！'],
    actions: [
      { name: '射擊',   chance: 0.7 },
      { name: '連射',   chance: 0.3, hits: 2 },
    ],
  },

  goblin_shaman: {
    name:   '哥布林祭司',
    color:  CONFIG.COLORS.ENEMY,
    hp:     20,
    skill:  3,
    def:    12,
    exp:    15,
    gp:     10,
    weapon: 'LIGHT',
    slots:  [3, 4],
    range:  'ranged',
    lily:   '那個詛咒很煩。魔法系先打，這是常識——笨矮人應該不懂。',
    qt: ['顫抖吧！', '黑暗降臨！', '詛咒你！'],
    actions: [
      { name: '詛咒',   chance: 0.5, effect: 'curse' },
      { name: '普通攻擊', chance: 0.5 },
    ],
  },

  // Boss
  goblin_king: {
    name:   '哥布林王',
    color:  CONFIG.COLORS.BOSS,
    hp:     50,
    skill:  6,
    def:    15,
    exp:    50,
    gp:     30,
    weapon: 'HEAVY',
    slots:  [1],
    isBoss: true,
    lily:   '……這層的頭目。慾望比那些雜兵濃多了，真噁心。別死在這裡，我還沒吃飽。',
    qt: ['我要把你踩扁！', '矮子，今天就是你的死期！', '哈哈哈！廢物！'],
    actions: [
      { name: '猛擊',     chance: 0.5 },
      { name: '震地',     chance: 0.3, effect: 'stun' },
      { name: '狂暴',     chance: 0.2, effect: 'berserk' },
    ],
  },

};

// 第一層普通敵人池
const ENEMY_POOL_F1 = ['goblin_club', 'goblin_spear', 'goblin_archer', 'goblin_shaman'];
const BOSS_F1       = 'goblin_king';
