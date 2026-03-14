// ============================================================
// battle.js — 戰鬥邏輯
// ============================================================

// 骰子
function roll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// 武器骰
function rollWeaponDice(weaponType, crit = false) {
  const mult = crit ? 2 : 1;
  switch (weaponType) {
    case 'LIGHT':    return roll(4)  * mult;
    case 'MILITARY': return roll(6)  * mult;
    case 'HEAVY':    return (roll(6) + roll(6)) * mult;
    case 'RANGED':   return roll(8)  * mult;
    default:         return roll(4)  * mult;
  }
}

// 命中判定（disadvantage=防禦中骰2d20取低，advantage=運氣骰2d20取高）
function checkHit(attackerSkill, defenderDef, disadvantage = false, advantage = false, label = '攻擊') {
  let d20 = roll(20);
  let d20b = null;
  if (disadvantage) {
    d20b = roll(20);
    d20  = Math.min(d20, d20b);
  } else if (advantage) {
    d20b = roll(20);
    d20  = Math.max(d20, d20b);
  }
  const total = d20 + attackerSkill;
  const crit  = d20 === CONFIG.COMBAT.CRIT_THRESHOLD;
  const hit   = crit || total > defenderDef;
  const mode  = disadvantage ? 'dis' : advantage ? 'adv' : 'normal';
  if (typeof showBattleDice === 'function') {
    const p = showBattleDice(d20, label, hit, crit);
    if (typeof _dicePromise !== 'undefined') _dicePromise = p;
  }
  return { d20, d20b, mode, total, hit, crit };
}

// ── 先攻系統 ────────────────────────────────────────────────

// 建立先攻順序（所有存活角色各骰1d20+skill，取高排序）
function buildInitiativeOrder() {
  const order = [];

  // 我方
  G.party.forEach((m, i) => {
    if (!m) return;
    const init = roll(20) + m.skill;
    order.push({ type: 'player', idx: i, name: m.name, init, color: m.color });
  });

  // 敵方
  G.combat.enemies.forEach((e, i) => {
    if (!e || e.hp <= 0) return;
    const init = roll(20) + e.skill;
    order.push({ type: 'enemy', idx: i, name: e.name, init, color: e.color || CONFIG.COLORS.ENEMY });
  });

  // 同值再骰一次決勝
  order.sort((a, b) => b.init - a.init || roll(2) - 1);
  return order;
}

// 取得當前行動者
function currentActor() {
  if (!G.combat || !G.combat.turnOrder) return null;
  return G.combat.turnOrder[G.combat.turnIdx];
}

// 推進到下一個存活的行動者
function advanceTurn() {
  const order = G.combat.turnOrder;
  let next = (G.combat.turnIdx + 1) % order.length;
  let safety = 0;

  // 跳過死亡的
  while (safety < order.length) {
    const actor = order[next];
    const alive = actor.type === 'player'
      ? (G.party[actor.idx] && G.party[actor.idx].hp > 0)
      : (G.combat.enemies[actor.idx] && G.combat.enemies[actor.idx].hp > 0);
    if (alive) break;
    next = (next + 1) % order.length;
    safety++;
  }

  // 如果繞回順序開頭，turn+1
  if (next <= G.combat.turnIdx) G.combat.turn++;
  G.combat.turnIdx = next;

  const actor = order[G.combat.turnIdx];
  G.combat.phase = actor.type === 'player' ? 'player' : 'enemy';

  // 清除防禦狀態（輪到自己行動時）
  if (actor.type === 'player') {
    const m = G.party[actor.idx];
    if (m && m.defending) m.defending = false;
  }
}

// ── 攻擊 ───────────────────────────────────────────────────

// 玩家攻擊敵人
function playerAttack(targetSlot) {
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return null;
  const p = G.party[actor.idx];
  const target = G.combat.enemies[targetSlot];
  if (!target || target.hp <= 0) return null;

  const weaponType = p.eq && p.eq.weapon ? p.eq.weapon.dice : 'MILITARY';
  const advantage = p.luckyNext || false;
  if (p.luckyNext) { p.luckyNext = false; }
  const { d20, d20b, mode, total, hit, crit } = checkHit(p.skill, target.def, false, advantage, '攻擊');

  // 判定欄骰子顯示字串
  function diceStr() {
    if (mode === 'adv') return `1d20(${d20b},▲${d20})`;
    if (mode === 'dis') return `1d20(${d20b},▼${d20})`;
    return `1d20(${d20})`;
  }

  let dmg = 0;
  if (hit) {
    dmg = rollWeaponDice(weaponType, crit) + p.skill;
    target.hp = Math.max(0, target.hp - dmg);
    if (target.hp <= 0) {
      G.combat.loot.exp += target.exp || 0;
      G.combat.loot.gp  += target.gp  || 0;
    }
    const dramaText = crit
      ? `⚡ ${p.name} 暴擊！${target.name} 受到 ${dmg} 點傷害！`
      : `⚔️ ${p.name} 命中 ${target.name}，造成 ${dmg} 點傷害`;
    if (typeof addDrama === 'function') addDrama(dramaText, 'player');
    G.combat.log.push(`${diceStr()}+${p.skill}=${total} vs def${target.def} ✅${crit?' 暴擊':''} 傷害${dmg}`);
  } else {
    if (typeof addDrama === 'function') addDrama(`${p.name} 攻擊 ${target.name} 未命中`, 'system');
    G.combat.log.push(`${diceStr()}+${p.skill}=${total} vs def${target.def} ❌`);
  }
  if (typeof showCombatFx === 'function')
    showCombatFx('player', actor.idx, 'enemy', targetSlot, hit, crit, dmg);
  return { hit, crit, dmg };
}

// 敵人攻擊我方（自動選前排）
function enemyAttack(enemySlot) {
  const enemy = G.combat.enemies[enemySlot];
  if (!enemy || enemy.hp <= 0) return null;

  // 說服狀態檢查
  if (checkPersuadeStatus(enemy)) return null;

  // 找最前排存活角色（idx最小）
  const target = G.party.find(m => m && m.hp > 0);
  if (!target) return null;

  const defending = target.defending || false;
  const { d20, d20b, mode, total, hit, crit } = checkHit(enemy.skill, target.def, defending, false, enemy.name);

  const eDiceStr = mode === 'dis'
    ? `1d20(${d20b},▼${d20})`
    : `1d20(${d20})`;

  let dmg = 0;
  if (hit) {
    dmg = rollWeaponDice(enemy.weapon || 'MILITARY', crit) + enemy.skill;
    target.hp = Math.max(0, target.hp - dmg);
    const dramaText = crit
      ? `💥 ${enemy.name} 暴擊！${target.name} 受到 ${dmg} 點傷害！`
      : `🗡️ ${enemy.name} 命中 ${target.name}，造成 ${dmg} 點傷害`;
    if (typeof addDrama === 'function') addDrama(dramaText, 'enemy');
    if (enemy.qt && enemy.qt.length) {
      const qt = enemy.qt[Math.floor(Math.random() * enemy.qt.length)];
      if (typeof addDialogue === 'function') addDialogue(enemy.name, qt);
    }
    G.combat.log.push(`${eDiceStr}+${enemy.skill}=${total} vs def${target.def} ✅${crit?' 暴擊':''} 傷害${dmg}${defending?' 🛡劣勢':''}`);
  } else {
    if (typeof addDrama === 'function') addDrama(`${enemy.name} 攻擊 ${target.name} 未命中`, 'system');
    G.combat.log.push(`${eDiceStr}+${enemy.skill}=${total} vs def${target.def} ❌${defending?' 🛡劣勢':''}`);
  }
  // 找目標在party的index
  const targetIdx = G.party.indexOf(target);
  if (typeof showCombatFx === 'function')
    showCombatFx('enemy', enemySlot, 'player', targetIdx, hit, crit, dmg);
  return { hit, crit, dmg };
}

// 生成敵人（帶等級縮放）
function spawnEnemy(key, level = 1) {
  const base  = DB_ENEMY[key];
  const scale = 1 + (level - 1) * CONFIG.SCALING.ENEMY_SCALE;
  return {
    ...base,
    hp:    Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    skill: Math.round(base.skill * scale),
    def:   Math.round(base.def  * scale),
    status: [],
    defending: false,
  };
}

// 初始化戰鬥
function initCombat(enemyKeys) {
  const level = G.player.level || 1;
  G.combat = {
    enemies: [null, null, null, null],
    turn: 1,
    phase: 'player',
    log: [],
    loot: { exp: 0, gp: 0 },
    lilySpoke: new Set(),
    turnOrder: [],
    turnIdx: 0,
  };
  enemyKeys.forEach((key, i) => {
    if (i < 4 && key) G.combat.enemies[i] = spawnEnemy(key, level);
  });

  // 建立先攻順序
  G.combat.turnOrder = buildInitiativeOrder();
  G.combat.turnIdx   = 0;
  G.combat.phase     = G.combat.turnOrder[0].type === 'player' ? 'player' : 'enemy';

  // log先攻結果
  G.combat.log.push('⚔️ 戰鬥開始！先攻順序：');
  G.combat.turnOrder.forEach((a, i) =>
    G.combat.log.push(`  ${i+1}. ${a.name}（${a.init}）`)
  );
}

// 說服判定（對指定敵人）
function resolvePersuade(targetSlot) {
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return;
  const m = G.party[actor.idx];
  const target = G.combat.enemies[targetSlot];
  if (!m || !target || target.hp <= 0) return;

  const persuadeBonus = m.persuade || 0;
  const advantage = m.luckyNext || false;
  if (m.luckyNext) { m.luckyNext = false; }
  const baseRoll = advantage ? Math.max(roll(20), roll(20)) : roll(20);
  const myRoll  = baseRoll + persuadeBonus;
  const tgtRoll = roll(20);
  const success = myRoll > tgtRoll;
  if (typeof showBattleDice === 'function') showBattleDice(baseRoll, '說服', success, false);

  const styles = [
    { name:'說服', status:'sad',   lily:'好聲好氣...這招居然可能有用。' },
    { name:'威脅', status:'panic', lily:'嚇唬他？有意思，讓我看看。' },
    { name:'欺騙', status:'sad',   lily:'騙人也是本事，用好了笨矮人。' },
    { name:'嘲諷', status:'rage',  lily:'嘲諷他...哈，瘋狗戰術。' },
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];

  G.combat.log.push(`🗣 莉莉對 ${target.name} 發動${style.name}！${advantage?'✨優勢':''}`);
  G.combat.log.push(`說服判定：${m.name}(${myRoll}) vs ${target.name}(${tgtRoll})`);
  if (success) {
    applyPersuadeStatus(target, style.status, m);
    if (typeof addDrama === 'function') addDrama(`✅ ${target.name} 陷入${statusName(style.status)}！`, 'status');
  } else {
    if (typeof addDrama === 'function') addDrama(`❌ ${target.name} 不為所動`, 'system');
  }

  return { success, style };
}

function statusName(s) {
  return { sad:'難過', panic:'恐慌', rage:'狂怒' }[s] || s;
}

function applyPersuadeStatus(target, status, persuader) {
  // 清除舊說服狀態
  target.status = target.status.filter(s => !['sad','panic','rage'].includes(s.type));

  if (status === 'panic') {
    // 直接離場
    target.hp = 0;
    target.fled = true;
    const loot = target.gp || 0;
    G.player.gp += loot;
    G.combat.log.push(`　💨 ${target.name} 逃離戰場！掉落 ${loot} gp`);
  } else {
    // sad / rage：跳過一回合，之後持續判定
    target.status.push({
      type: status,
      skipTurn: true,          // 第一回合跳過行動
      persuader: persuader,    // 用來做持續判定
    });
  }
}

// 說服持續判定（每回合敵人行動前呼叫）
function checkPersuadeStatus(enemy) {
  const st = enemy.status.find(s => s.type === 'sad' || s.type === 'rage');
  if (!st) return false;

  // 第一回合：跳過行動
  if (st.skipTurn) {
    st.skipTurn = false;
    if (st.type === 'rage') {
      const ally = G.combat.enemies.find(e => e && e !== enemy && e.hp > 0);
      if (ally) {
        const dmg = rollWeaponDice(enemy.weapon || 'MILITARY') + enemy.skill;
        ally.hp = Math.max(0, ally.hp - dmg);
        if (typeof addDrama === 'function') addDrama(`😡 ${enemy.name} 狂怒攻擊 ${ally.name}！造成 ${dmg} 傷害`, 'status');
      }
    } else {
      if (typeof addDrama === 'function') addDrama(`😢 ${enemy.name} 陷入難過，失去行動`, 'status');
    }
    return true;
  }

  const eRoll = roll(20);
  const persuader = st.persuader;
  const pRoll = roll(20) + (persuader.persuade || 0);
  G.combat.log.push(`狀態判定：${enemy.name}(${eRoll}) vs ${persuader.name}(${pRoll})`);
  if (eRoll > pRoll) {
    enemy.status = enemy.status.filter(s => s !== st);
    if (typeof addDrama === 'function') addDrama(`${enemy.name} 從${statusName(st.type)}中恢復！`, 'system');
    return false;
  } else {
    if (typeof addDrama === 'function') addDrama(`${enemy.name} 仍處於${statusName(st.type)}`, 'status');
    return true;
  }
}

// 戰鬥結束判定
function checkBattleEnd() {
  const allEnemiesDead = G.combat.enemies.every(e => !e || e.hp <= 0);
  const allPlayersDead = G.party.every(m => !m || m.hp <= 0);
  if (allEnemiesDead) return 'win';
  if (allPlayersDead) return 'lose';
  return null;
}
