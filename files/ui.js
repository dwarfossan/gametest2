// ============================================================
// ui.js
// ============================================================

let attackMode = false;

// ── 工具 ────────────────────────────────────────────────────
const _wt = ms => new Promise(r => setTimeout(r, ms));

// ── 浮動數字（相對mid-scene定位）────────────────────────────
function ftxOnSlot(txt, colorClass, type, slotIdx, big) {
  const sc = document.getElementById('mid-scene');
  if (!sc) return;
  const sel = type === 'enemy'
    ? `.slot-sprite[data-eslot="${slotIdx}"]`
    : `.slot-sprite[data-pslot="${slotIdx}"]`;
  const el  = document.querySelector(sel);
  const e   = document.createElement('div');
  e.className = 'ftx f' + colorClass + (big ? ' big' : '');
  e.textContent = txt;
  const scR = sc.getBoundingClientRect();
  if (el) {
    const r = el.getBoundingClientRect();
    e.style.left = (r.left - scR.left + r.width  / 2 - 16) + 'px';
    e.style.top  = (r.top  - scR.top  + r.height / 4     ) + 'px';
  } else {
    e.style.left = (type === 'enemy' ? '65%' : '25%');
    e.style.top  = '30%';
  }
  sc.appendChild(e);
  setTimeout(() => e.remove(), 1200);
}

// ── SVG刀光（前作showImpact，slash only）────────────────────
function showSlashFx(tx, ty, isCrit) {
  const sc = document.getElementById('mid-scene');
  if (!sc) return;
  const col  = isCrit ? '#ffe066' : '#ffffff';
  const col2 = isCrit ? '#ff8800' : '#aaddff';
  const glow = isCrit
    ? 'drop-shadow(0 0 8px #ffcc00) drop-shadow(0 0 18px #ff6600)'
    : 'drop-shadow(0 0 5px rgba(200,220,255,0.9))';
  const sz = isCrit ? 140 : 110;
  const hw = sz / 2;
  const e  = document.createElement('div');
  e.style.cssText = `position:absolute;pointer-events:none;z-index:33;left:${tx}px;top:${ty}px;transform:translate(-50%,-50%);`;
  e.innerHTML = `<svg width="${sz}" height="${sz}" viewBox="-${hw} -${hw} ${sz} ${sz}" style="overflow:visible;filter:${glow}">
    ${isCrit ? `
      <path d="M-${hw*.9} ${hw*.7} Q0 -${hw*.3} ${hw*.9} -${hw*.7}" fill="none" stroke="${col2}" stroke-width="9" stroke-linecap="round" opacity=".35"/>
      <path d="M-${hw*.9} ${hw*.7} Q0 -${hw*.3} ${hw*.9} -${hw*.7}" fill="none" stroke="${col}"  stroke-width="6" stroke-linecap="round"/>
      <path d="M-${hw*.7} ${hw*.9} Q${hw*.1} -${hw*.1} ${hw*.7} -${hw*.9}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <circle cx="0" cy="0" r="${hw*.28}" fill="${col}" opacity=".18"/>
      <circle cx="0" cy="0" r="${hw*.14}" fill="white" opacity=".55"/>
    ` : `
      <path d="M-${hw*.85} ${hw*.65} Q${hw*.05} -${hw*.2} ${hw*.85} -${hw*.65}" fill="none" stroke="${col2}" stroke-width="7" stroke-linecap="round" opacity=".25"/>
      <path d="M-${hw*.85} ${hw*.65} Q${hw*.05} -${hw*.2} ${hw*.85} -${hw*.65}" fill="none" stroke="${col}"  stroke-width="4" stroke-linecap="round"/>
    `}
  </svg>`;
  const startX = `translate(calc(-50% + ${hw*.6}px), calc(-50% + ${hw*.5}px))`;
  const midX   = `translate(-50%, -50%)`;
  const endX   = `translate(calc(-50% - ${hw*.4}px), calc(-50% - ${hw*.3}px))`;
  e.animate([
    { opacity:0,   transform: startX + ' scale(0.6) rotate(15deg)' },
    { opacity:1,   transform: midX   + ' scale(1.0) rotate(0deg)',  offset: 0.25 },
    { opacity:0.8, transform: midX   + ` scale(${isCrit?1.15:1.05}) rotate(-3deg)`, offset: 0.55 },
    { opacity:0,   transform: endX   + ` scale(${isCrit?0.85:0.75}) rotate(-8deg)` },
  ], { duration: isCrit ? 480 : 340, easing:'ease-in-out', fill:'forwards' }).onfinish = () => e.remove();
  sc.appendChild(e);
}

// ── 取得slot-sprite中心座標（相對mid-scene）──────────────────
function slotCenter(type, idx) {
  const sc  = document.getElementById('mid-scene');
  const sel = type === 'enemy'
    ? `.slot-sprite[data-eslot="${idx}"]`
    : `.slot-sprite[data-pslot="${idx}"]`;
  const el = document.querySelector(sel);
  if (!el || !sc) return { x: type==='enemy'?700:200, y:200 };
  const r   = el.getBoundingClientRect();
  const scR = sc.getBoundingClientRect();
  return { x: r.left - scR.left + r.width/2, y: r.top - scR.top + r.height/2 };
}

// ── 戰鬥特效統一入口 ────────────────────────────────────────
// attackerType/targetType: 'player'|'enemy'
// hit: bool, crit: bool, dmg: number, miss: bool
function showCombatFx(attackerType, attackerIdx, targetType, targetIdx, hit, crit, dmg) {
  // 攻擊者晃動
  const atkSel = attackerType === 'enemy'
    ? `.slot-sprite[data-eslot="${attackerIdx}"]`
    : `.slot-sprite[data-pslot="${attackerIdx}"]`;
  const atkEl = document.querySelector(atkSel);
  if (atkEl) {
    const animClass = attackerType === 'player' ? 'is-atk' : 'is-atkL';
    atkEl.classList.remove(animClass); void atkEl.offsetWidth;
    atkEl.classList.add(animClass);
    setTimeout(() => atkEl.classList.remove(animClass), 400);
  }

  if (!hit) {
    // 落空：目標位置浮出「閃」
    ftxOnSlot('MISS', 'm', targetType, targetIdx, false);
    return;
  }

  // 命中：目標閃紅 + 刀光 + 浮字
  const tgtSel = targetType === 'enemy'
    ? `.slot-sprite[data-eslot="${targetIdx}"]`
    : `.slot-sprite[data-pslot="${targetIdx}"]`;
  const tgtEl = document.querySelector(tgtSel);
  if (tgtEl) {
    tgtEl.classList.remove('is-hit'); void tgtEl.offsetWidth;
    tgtEl.classList.add('is-hit');
    setTimeout(() => tgtEl.classList.remove('is-hit'), 400);
  }

  // 刀光位置
  const c = slotCenter(targetType, targetIdx);
  showSlashFx(c.x, c.y, crit);

  // 浮字
  const col = crit ? 'c' : (targetType === 'enemy' ? 'o' : 'r');
  ftxOnSlot((crit ? '💥' : '') + '-' + dmg, col, targetType, targetIdx, crit);
}


// ── 戰鬥骰子（前作showDice風格）──────────────────────────
let _dicePromise = Promise.resolve();

async function showBattleDice(val, lbl, hit, crit) {
  const ov = document.getElementById('dice-ov');
  const bd = document.getElementById('bdice');
  const dl = document.getElementById('dlbl');
  if (!ov || !bd) return;
  const color = crit ? '#ffd060' : (hit ? '#88dd88' : '#dd7766');
  bd.style.borderColor = color;
  bd.style.color       = color;
  if (dl) dl.textContent = lbl || '骰子';
  ov.style.display = 'flex';
  bd.classList.remove('spin'); void bd.offsetWidth;
  bd.classList.add('spin');
  for (let i = 0; i < 6; i++) { bd.textContent = Math.floor(Math.random()*20)+1; await _wt(60); }
  bd.textContent = val;
  await _wt(1200);
  ov.style.display = 'none';
  bd.style.borderColor = ''; bd.style.color = '';
}

// 外部等骰子跑完用
function waitDice() { return _dicePromise; }

// ── 結算：勝利 ────────────────────────────────────────────
function showVictory() {
  const loot  = (G.combat && G.combat.loot) || { exp: 0, gp: 0 };
  const turns = G.combat ? G.combat.turn : 0;

  G.player.exp += loot.exp;
  G.player.gp  += loot.gp;

  let levelHtml = '';
  while (G.player.exp >= G.player.expNext) {
    G.player.exp  -= G.player.expNext;
    G.player.level++;
    G.player.expNext = Math.floor(G.player.expNext * 1.5);
    G.player.maxHp   += CONFIG.PLAYER.HP_PER_LEVEL;
    G.player.hp       = G.player.maxHp;
    levelHtml += `<br><span style="color:#b8900a;">⬆️ 升級！Lv.${G.player.level}　HP上限 ${G.player.maxHp}</span>`;
  }

  document.getElementById('result-title').textContent = '🏆  勝利';
  document.getElementById('result-title').className   = 'result-title win';
  document.getElementById('result-stats').innerHTML   =
    `回合數：${turns}<br>獲得 EXP <b>+${loot.exp}</b>　GP <b>+${loot.gp}</b>${levelHtml}`;
  document.getElementById('result-lily').innerHTML    =
    `【莉莉】「…總算結束了，廢物歐桑。繼續走。」`;
  document.getElementById('result-btn-main').textContent = '繼續探索';
  document.getElementById('result-btn-main').onclick     = closeResult;
  document.getElementById('overlay-result').classList.add('on');
}

// ── 結算：失敗 ────────────────────────────────────────────
function showDefeat() {
  document.getElementById('result-title').textContent = '💀  敗北';
  document.getElementById('result-title').className   = 'result-title lose';
  document.getElementById('result-stats').innerHTML   =
    `回合數：${G.combat ? G.combat.turn : 0}`;
  document.getElementById('result-lily').innerHTML    =
    `【莉莉】「我就說吧，蠢到死，廢物歐桑。」`;
  document.getElementById('result-btn-main').textContent = '重試';
  document.getElementById('result-btn-main').onclick     = retryBattle;
  document.getElementById('overlay-result').classList.add('on');
}

function closeResult() {
  document.getElementById('overlay-result').classList.remove('on');
  G.combat = null;
  renderParty();
  openCmdLayer('cmd-l0');
}

function retryBattle() {
  document.getElementById('overlay-result').classList.remove('on');
  G.party.forEach(m => { if (m) { m.hp = m.maxHp; m.defending = false; m.luckyNext = false; } });
  testBattle();
}

function showScene(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('on'));
  document.getElementById('sc-'+id).classList.add('on');
  G.scene = id;
}

function hpBarHtml(cur, max) {
  const pct = Math.max(0, cur/max*100);
  return `<div class="slot-hpbar"><div class="slot-hpfill" style="width:${pct}%"></div></div>`;
}

// 我方（左）
function renderParty() {
  const wrap = document.getElementById('ui-party');
  if (!wrap) return;
  wrap.innerHTML = '';
  [...G.party].reverse().forEach((m, ri) => {
    const realIdx = 3 - ri;
    const d = document.createElement('div');
    d.className = 'slot-card';
    if (!m) {
      d.innerHTML = `<div class="slot-empty">—</div>`;
    } else {
      const isActive = G.combat && currentActor() &&
        currentActor().type === 'player' && currentActor().idx === realIdx;
      d.innerHTML = `
        <div class="slot-sprite${isActive?' active-turn':''}"
          data-pslot="${realIdx}"
          style="background:${m.color||CONFIG.COLORS.PLAYER};"
          onmouseenter="showCharInfo('player',${realIdx})"
          onmouseleave="clearCharInfo()">⚒
          ${m.defending ? '<div class="defend-overlay">🛡</div>' : ''}
        </div>
        <div class="slot-name">${m.name}</div>
        ${hpBarHtml(m.hp, m.maxHp)}
        <div class="slot-hptext">${m.hp}/${m.maxHp}</div>`;
    }
    wrap.appendChild(d);
  });
}

// 敵方（右）
function renderEnemies() {
  const wrap = document.getElementById('ui-enemies');
  if (!wrap) return;
  wrap.innerHTML = '';
  G.combat.enemies.forEach((e, i) => {
    const d = document.createElement('div');
    d.className = 'slot-card';
    if (!e || e.hp <= 0) {
      d.innerHTML = `<div class="slot-empty">—</div>`;
    } else {
      const isActive = G.combat && currentActor() &&
        currentActor().type === 'enemy' && currentActor().idx === i;
      d.innerHTML = `
        <div class="slot-sprite clickable${isActive?' active-turn':''}"
          data-eslot="${i}"
          style="background:${e.color||CONFIG.COLORS.ENEMY};"
          onclick="onEnemyClick(${i})"
          onmouseenter="showCharInfo('enemy',${i})"
          onmouseleave="clearCharInfo()">👺</div>
        <div class="slot-name">${e.name}</div>
        ${hpBarHtml(e.hp, e.maxHp)}
        <div class="slot-hptext">${e.hp}/${e.maxHp}</div>`;
    }
    wrap.appendChild(d);
  });
}

// 先攻軌道（反映真實順序）
function renderInitTrack() {
  const track = document.getElementById('init-track');
  if (!track || !G.combat || !G.combat.turnOrder) return;
  track.innerHTML = G.combat.turnOrder.map((a, i) => {
    const isCurrent = i === G.combat.turnIdx;
    // 確認是否存活
    const alive = a.type === 'player'
      ? (G.party[a.idx] && G.party[a.idx].hp > 0)
      : (G.combat.enemies[a.idx] && G.combat.enemies[a.idx].hp > 0);
    const emoji = a.type === 'player' ? '⚒' : '👺';
    return `<div class="init-token ${a.type==='player'?'player-token':'enemy-token'} ${isCurrent?'active':''} ${!alive?'dead':''}"
      title="${a.name}(${a.init})">${emoji}</div>`;
  }).join('');
}

// 共用角色資訊hover
function showCharInfo(type, idx) {
  const el = document.getElementById('ui-enemy-info');
  if (!el) return;
  if (type === 'player') {
    const m = G.party[idx];
    if (!m) return;
    el.innerHTML =
      `<b style="color:#7ab0c8;">${m.name}</b><br>
       HP：${m.hp} / ${m.maxHp}<br>
       能力：${m.skill}　防禦：${m.def}<br>
       運氣：${m.luck}
       ${m.defending ? '<br><span style="color:#c0c870;">🛡 防禦中</span>' : ''}`;
  } else {
    const e = G.combat && G.combat.enemies[idx];
    if (!e || e.hp <= 0) { el.innerHTML = '—'; return; }
    el.innerHTML =
      `<b style="color:#c0a870;">${e.name}</b><br>
       HP：${e.hp} / ${e.maxHp}<br>
       能力：${e.skill}　防禦：${e.def}<br>
       <span style="color:#c8907a;font-style:italic;">【莉莉】「${e.lily || '…沒什麼好說的。'}」</span>`;
  }
}
function clearCharInfo() {
  const el = document.getElementById('ui-enemy-info');
  if (el) el.innerHTML = '—';
}

// 指令欄角色名稱（自動切換）
function renderCmdActor() {
  const el = document.getElementById('cmd-actor-name');
  if (!el || !G.combat) return;
  const actor = currentActor();
  if (!actor) return;
  if (actor.type === 'player') {
    el.textContent = G.party[actor.idx].name;
    el.style.color = '#7ab0c8';
  } else {
    el.textContent = actor.name + '（敵方）';
    el.style.color = '#c07060';
  }
}

// 判定欄（骰子算式）
function addLog(msg) {
  if (G.combat) G.combat.log.push(msg);
  renderLog();
}

function renderLog() {
  const el = document.getElementById('ui-status-mini');
  if (!el) return;
  const src = G.combat ? G.combat.log : [];
  if (src.length === 0) return;
  el.innerHTML = src.slice(-12).map(l => `<div style="color:#706050;">${l}</div>`).join('');
  el.scrollTop = el.scrollHeight;
}

// tab切換
function switchLogTab(tab) {
  document.getElementById('main-drama').style.display = tab==='drama' ? 'flex' : 'none';
  document.getElementById('main-log').style.display   = tab==='log'   ? 'flex' : 'none';
  document.getElementById('tab-drama').classList.toggle('active', tab==='drama');
  document.getElementById('tab-log').classList.toggle('active', tab==='log');
}

// 劇情欄（命中/傷害/狀態）→ 只寫右側主欄
function addDrama(text, type) {
  const colors = {
    player:  '#90c8e8',
    enemy:   '#e89080',
    status:  '#e0e080',
    system:  '#a09080',
  };
  const color = colors[type] || colors.system;
  const el = document.getElementById('ui-main-drama');
  if (el) { el.innerHTML += `<div style="color:${color};">${text}</div>`; el.scrollTop = el.scrollHeight; }
}

// 角色台詞 → 右側主欄劇情tab
function addDialogue(speaker, text) {
  const color = speaker === '莉莉' ? '#c8907a' : '#d0e8d0';
  const html = `<div style="color:${color};"><span style="font-weight:bold;">【${speaker}】</span>「${text}」</div>`;
  const el = document.getElementById('ui-main-drama');
  if (el) { el.innerHTML += html; el.scrollTop = el.scrollHeight; }
}

// 莉莉台詞 → 只寫左側小欄
// key 有傳：每場戰鬥只說一次；key 為 null：每次都說（結算用）
function setLilyDialogue(text, key) {
  if (key && G.combat && G.combat.lilySpoke) {
    if (G.combat.lilySpoke.has(key)) return;
    G.combat.lilySpoke.add(key);
  }
  const clean = text.replace(/^「|」$/g, '');
  const el = document.getElementById('ui-drama');
  if (!el) return;
  el.innerHTML += `<div><span style="color:#c8907a;">【莉莉】</span>「${clean}」</div>`;
  el.scrollTop = el.scrollHeight;
}

// 說服（進入選目標模式）
function playerPersuade() {
  enterPersuadeMode();
}

// 逃跑（我方1d20+skill vs 所有敵人1d20+skill，全贏才成功）
function playerEscape() {
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return;
  const m = G.party[actor.idx];
  if (!m) return;

  const advantage = m.luckyNext || false;
  if (m.luckyNext) { m.luckyNext = false; }
  const myD20 = advantage ? Math.max(roll(20), roll(20)) : roll(20);
  const myRoll = myD20 + m.skill;
  if (typeof showBattleDice === 'function') showBattleDice(myD20, '逃跑', false, false);
  G.combat.log.push(`🏃 ${m.name} 嘗試逃跑（${myRoll}${advantage?' ✨優勢':''}）`);

  let failed = false;
  G.combat.enemies.forEach(e => {
    if (!e || e.hp <= 0) return;
    const eRoll = roll(20) + e.skill;
    if (myRoll <= eRoll) {
      G.combat.log.push(`　${e.name} 攔住了！（${eRoll}）`);
      failed = true;
    } else {
      G.combat.log.push(`　超過 ${e.name}（${eRoll}）`);
    }
  });

  if (!failed) {
    G.combat.log.push('💨 成功逃跑！');
    setLilyDialogue('跑路了。廢物歐桑的唯一技能。', 'escape_ok');
    renderLog();
    // 之後接回走廊場景
  } else {
    G.combat.log.push('❌ 逃跑失敗！');
    setLilyDialogue('跑不掉的，蠢貨。活該。', 'escape_fail');
    renderLog();
    advanceTurn();
    renderInitTrack();
    renderCmdActor();
    openCmdLayer('cmd-l0');
    runEnemyTurns();
  }
}

// 運氣（消耗1 luck，下次判定優勢）
function playerUseLuck() {
  if (!G.combat) return;
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return;
  const m = G.party[actor.idx];
  if (!m) return;

  if (m.luck <= 0) {
    addLog(`${m.name} 運氣已耗盡！`);
    return;
  }
  if (m.luckyNext) {
    addLog(`已經使用運氣了！`);
    return;
  }

  m.luck--;
  m.luckyNext = true;
  addLog(`✨ ${m.name} 使用運氣！（剩餘 ${m.luck}）下次判定優勢。`);
  setLilyDialogue('靠運氣？白癡的解法，不過隨便。', 'luck');
  renderParty();
}

// 防禦
function playerDefend() {
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return;
  const m = G.party[actor.idx];
  if (!m) return;

  m.defending = true;
  G.combat.log.push(`🛡 ${m.name} 進入防禦姿態！`);
  setLilyDialogue('縮起來了。廢物歐桑的招牌動作。', 'defend');
  renderLog();
  renderParty();

  advanceTurn();
  renderInitTrack();
  renderCmdActor();
  openCmdLayer('cmd-l0');
  runEnemyTurns();
}

// 攻擊模式
function enterAttackMode() {
  if (!G.combat) { addLog('先按測試戰鬥'); return; }
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return;
  attackMode = true;
  document.getElementById('cmd-attack').classList.add('active');
  setLilyDialogue('選哪個，白癡？早點決定。', 'attack');
  addLog('選擇攻擊目標...');
}

// 說服模式
let persuadeMode = false;

function enterPersuadeMode() {
  if (!G.combat) return;
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return;
  persuadeMode = true;
  addLog('選擇說服目標...');
  setLilyDialogue('要對哪個用嘴？指好了，蠢矮子。', 'persuade');
}

// 點擊敵人
function onEnemyClick(slot) {
  if (!G.combat) return;
  const actor = currentActor();
  if (!actor || actor.type !== 'player') return;

  // 說服模式
  if (persuadeMode) {
    persuadeMode = false;
    const res = resolvePersuade(slot);
    if (!res) return;
    if (res.style) setLilyDialogue(res.style.lily, 'persuade_result');
    renderEnemies();
    renderLog();
    if (checkBattleEnd() === 'win') {
      showVictory();
      return;
    }
    renderInitTrack();
    renderCmdActor();
    renderParty();
    openCmdLayer('cmd-l0');
    runEnemyTurns();
    return;
  }

  // 攻擊模式
  if (!attackMode) return;
  attackMode = false;
  document.getElementById('cmd-attack').classList.remove('active');

  const res = playerAttack(slot);
  if (!res) return;

  renderEnemies();
  renderLog();

  if (checkBattleEnd() === 'win') {
    showVictory();
    return;
  }

  // 推進到下一個行動者
  advanceTurn();
  renderInitTrack();
  renderCmdActor();
  renderParty();
  openCmdLayer('cmd-l0');

  // 如果輪到敵人，自動執行
  runEnemyTurns();
}

// 執行所有連續的敵人回合
async function runEnemyTurns() {
  if (!G.combat || G.combat.phase !== 'enemy') return;
  const actor = currentActor();
  if (!actor || actor.type !== 'enemy') return;

  await _wt(400);  // 短暫停頓讓玩家看清楚輪到誰

  enemyAttack(actor.idx);
  await waitDice();  // 等骰子動畫跑完

  renderParty();
  renderLog();

  if (checkBattleEnd() === 'lose') {
    showDefeat();
    return;
  }

  advanceTurn();
  renderInitTrack();
  renderCmdActor();
  renderEnemies();

  // 如果下一個還是敵人，繼續
  runEnemyTurns();
}

// 測試戰鬥
function testBattle() {
  initCombat(['goblin_club','goblin_spear','goblin_archer']);
  showScene('main');
  renderParty();
  renderEnemies();
  renderInitTrack();
  renderCmdActor();
  renderLog();
  openCmdLayer('cmd-l0');

  // 若第一個行動者是敵人
  if (G.combat.phase === 'enemy') runEnemyTurns();
}
