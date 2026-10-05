// 《收租万倍返还》变量信标
// 生成前把当前事件名注入扫描区，让对应《事件详情》按关键词亮起。

$(async () => {
  const BEACON_ID = 'shouzu_event_beacon';
  const revoke = () => {
    if (typeof uninjectPrompts !== 'function') return;
    try { uninjectPrompts([BEACON_ID]); } catch (e) { /* 无旧信标 */ }
  };
  revoke();
  await waitGlobalInitialized('Mvu');

  const readState = () => {
    try { return Mvu.getMvuData({ type: 'message', message_id: 'latest' }); }
    catch (e) { return null; }
  };

  const raise = () => {
    revoke();
    if (typeof injectPrompts !== 'function') return;
    const state = readState();
    const cur = state && state.stat_data && state.stat_data['世界'] && state.stat_data['世界']['剧情节点']
      ? state.stat_data['世界']['剧情节点']['当前事件']
      : '';
    const nxt = state && state.stat_data && state.stat_data['世界'] && state.stat_data['世界']['剧情节点']
      ? state.stat_data['世界']['剧情节点']['下一个事件']
      : '';
    const chunks = [];
    if (cur && cur !== '无') chunks.push(String(cur));
    if (nxt && nxt !== '无') chunks.push(String(nxt).split('|')[0]);
    if (!chunks.length) return;
    try {
      injectPrompts([{
        id: BEACON_ID,
        position: 'none',
        depth: 0,
        role: 'system',
        content: chunks.join(' '),
        should_scan: true,
        filter: () => true,
      }], { once: true });
    } catch (e) {
      console.warn('[收租信标] 注入失败:', e);
    }
  };

  const before = tavern_events.GENERATION_STARTED || tavern_events.GENERATION_AFTER_COMMANDS;
  if (before) eventOn(before, raise);
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, raise);
  if (Mvu.events.VARIABLE_INITIALIZED) eventOn(Mvu.events.VARIABLE_INITIALIZED, raise);
  raise();
});
