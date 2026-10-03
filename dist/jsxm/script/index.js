// jsxm（精神小妹）角色卡 · 远程脚本入口
//
// 运行环境：SillyTavern「酒馆助手」扩展的全局脚本 iframe。
// 已预注入，无需 import：
//   $ / toastr / eventOn / eventEmit / eventClearAll
//   getVariables / replaceVariables / getChatMessages
//   SillyTavern / Mvu（需 await waitGlobalInitialized('Mvu')）
//
// 改完这里之后，用仓库根目录的 ./发布.sh jsxm v0.1.0 "说明" 发布。

const 项目名 = 'jsxm';
const 版本 = '0.1.0';

$(() => {
  console.log(`[${项目名}] 远程脚本已加载 v${版本}`);

  // —— 在这里注册你的事件 ——
  // 世界书或其它脚本里用 eventEmit(`${项目名}:xxx`) 触发

  eventOn(`${项目名}:ping`, async data => {
    console.log(`[${项目名}] 收到 ping:`, data);
    return { ok: true, 版本 };
  });

  // AI 消息渲染完成后触发，适合做变量后处理
  eventOn(`${项目名}:消息渲染完成`, async () => {
    const ctx = SillyTavern.getContext();
    console.log(`[${项目名}] 当前角色:`, ctx.name2, '| 消息数:', ctx.chat?.length);
    // 示例：读取当前楼层的 MVU 变量
    // const v = await Mvu.getMvuData({ message_id: 'latest' });
    // console.log('[jsxm] 变量:', v);
  });

  console.log(`[${项目名}] 脚本初始化完成`);
});
