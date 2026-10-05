// 《收租万倍返还》事件调度
// 用 世界.日期 比对《主线事件节点表》的「第N天」，写入当前事件 / 下一个事件。
// 模型禁止改这两个字段。切换章节时，把当前节点重置为该行首节点。

const parseDay = (hint) => {
  const m = String(hint || '').match(/第\s*(\d+)\s*天/);
  return m ? Number(m[1]) : null;
};

$(async () => {
  await waitGlobalInitialized('Mvu');

  if (typeof updateWorldbookWith !== 'function' && typeof getWorldbook !== 'function') {
    console.error('[收租调度] 世界书 API 不可用，调度器退出');
    return;
  }

  let cacheEpoch = 0;
  let inflight = false;
  let rerun = false;

  const dive = (obj, keys, fallback) => {
    let cur = obj;
    for (const k of keys) {
      if (cur == null || typeof cur !== 'object') return fallback;
      cur = cur[k];
    }
    return cur == null || cur === '' ? fallback : cur;
  };

  const resolveWorldbook = () => {
    try {
      const names = getCharWorldbookNames('current');
      if (names && names.primary) return names.primary;
    } catch (e) { /* 下一路径 */ }
    try { return getChatWorldbookName('current') || null; } catch (e) { return null; }
  };

  const readEntries = async (wbName) => {
    if (typeof getWorldbook === 'function') {
      try { return await getWorldbook(wbName); } catch (e) { /* 回退 */ }
    }
    let entries = [];
    await updateWorldbookWith(wbName, (list) => { entries = list; return list; });
    return entries;
  };

  const latestState = () => {
    try { return Mvu.getMvuData({ type: 'message', message_id: 'latest' }); }
    catch (e) { return null; }
  };

  const LINE_RE = /^[-*]\s+([^|]+)\|([^|]+)\|([^\n]+)$/gm;

  async function readTable() {
    const wbName = resolveWorldbook();
    if (!wbName) return { seq: [], reason: '无绑定世界书' };
    let entries = [];
    try { entries = await readEntries(wbName); }
    catch (err) { return { seq: [], reason: '世界书读取失败' }; }
    const table = entries.find((en) => String(en.name || en.comment || '').includes('主线事件节点表'));
    if (!table) return { seq: [], reason: '节点表缺失' };
    const seq = [];
    LINE_RE.lastIndex = 0;
    let m;
    const text = table.content || '';
    while ((m = LINE_RE.exec(text)) !== null) {
      const name = m[1].trim();
      const day = parseDay(m[2]);
      if (name && day != null) seq.push({ name, hint: m[2].trim(), place: m[3].trim(), day });
    }
    if (!seq.length) return { seq: [], reason: '节点表解析为空' };
    return { seq, reason: '' };
  }

  async function refresh(reason) {
    if (inflight) { rerun = true; return; }
    inflight = true;
    try {
      const epoch = cacheEpoch;
      const state0 = latestState();
      if (!state0 || epoch !== cacheEpoch) return;
      const table = await readTable();
      if (epoch !== cacheEpoch) return;
      if (!table.seq.length) {
        console.warn('[收租调度] 跳过：' + table.reason);
        return;
      }
      const state = latestState();
      if (!state || !state.stat_data || epoch !== cacheEpoch) return;
      const stat = state.stat_data;
      const day = Number(dive(stat, ['世界', '日期'], 1));
      if (!Number.isFinite(day)) return;
      let at = 0;
      for (let i = 0; i < table.seq.length; i++) {
        if (table.seq[i].day <= day) at = i;
      }
      const cur = table.seq[at];
      const nxt = table.seq[at + 1] || null;
      const nextPayload = nxt ? (nxt.name + '|' + nxt.hint + '|' + nxt.place) : '无';
      if (!stat['世界'] || typeof stat['世界'] !== 'object') stat['世界'] = {};
      if (!stat['世界']['剧情节点'] || typeof stat['世界']['剧情节点'] !== 'object') stat['世界']['剧情节点'] = {};
      const pn = stat['世界']['剧情节点'];
      let dirty = false;
      let switched = false;
      if (pn['当前事件'] !== cur.name) {
        pn['当前事件'] = cur.name;
        pn['当前节点'] = cur.place;
        dirty = true;
        switched = true;
      }
      if (String(pn['下一个事件'] ?? '') !== nextPayload) {
        pn['下一个事件'] = nextPayload;
        dirty = true;
      }
      if (!dirty || epoch !== cacheEpoch) return;
      await Mvu.replaceMvuData(state, { type: 'message', message_id: 'latest' });
      console.log('[收租调度] 第' + day + '天 →', cur.name, switched ? '（节点已重置）' : '', '| 下一个', nextPayload, '|', reason);
    } catch (err) {
      console.error('[收租调度] 执行异常:', err);
    } finally {
      inflight = false;
      if (rerun) { rerun = false; refresh('rerun'); }
    }
  }

  const dropEpoch = () => { cacheEpoch += 1; };
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => refresh('var'));
  if (Mvu.events.VARIABLE_INITIALIZED) eventOn(Mvu.events.VARIABLE_INITIALIZED, () => refresh('init'));
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, () => refresh('gen'));
  if (tavern_events.CHAT_CREATED) eventOn(tavern_events.CHAT_CREATED, dropEpoch);
  if (tavern_events.CHAT_CHANGED) eventOn(tavern_events.CHAT_CHANGED, dropEpoch);
  refresh('boot');
});
