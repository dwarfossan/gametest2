// ============================================================
// state.js — 遊戲狀態，單一資料來源
// ============================================================

const G = {
  player: null,
  /*
  player = {
    skill, def, luck, maxLuck,
    hp, maxHp,
    gp, exp, level, expNext,
    inv: [],
    eq: { weapon: null, armor: null, helmet: null, ring: null },
    status: []
  }
  */

  party:  [null, null, null, null],  // 槽位0=歐桑, 1-3=隊友
  combat: null,
  /*
  combat = {
    enemies: [null, null, null, null],  // 敵方4槽
    turn: 1,
    phase: 'player' | 'enemy',
    log: [],
    turnOrder: [{ type, idx, name, init, color }, ...],  // 先攻順序
    turnIdx: 0,  // 當前行動者在turnOrder的位置
  }
  */

  floor:    1,    // 地下城層數
  scene:    'title',  // title | char | main | battle | event
};
