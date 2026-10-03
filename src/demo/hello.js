// jsxm 远程脚本示例 · 源码
//
// 这是 SillyTavern「酒馆助手」扩展在全局脚本 iframe 中执行的 ES module。
// 运行环境已预注入 $ / toastr / eventOn / eventEmit / SillyTavern 等，
// 不需要 import，直接用即可。详见酒馆助手文档。
//
// 改完这里之后，复制到 dist/demo/hello.js 再提交（见 README 的发布流程）。

const 版本 = '0.0.1';

$(() => {
  console.log(`[jsxm] 远程脚本已加载 v${版本}`);
  toastr.info(`远程脚本已加载 v${版本}`, 'jsxm', { timeOut: 2500 });

  // 注册一个事件，供角色卡世界书或其它脚本调用
  eventOn('jsxm:ping', async data => {
    console.log('[jsxm] 收到 ping:', data);
    return { ok: true, 版本 };
  });

  // 监听 AI 消息渲染完成
  eventOn('jsxm:消息渲染完成', async () => {
    const ctx = SillyTavern.getContext();
    console.log('[jsxm] 当前角色:', ctx.name2, '| 消息数:', ctx.chat?.length);
  });
});
