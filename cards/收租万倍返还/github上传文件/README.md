# 收租万倍返还 · 远程客户端（已上线）

仓库：`github.com/smgyx/jsxm`（SSH 推送），首发标签 `v0.1.0`。

实际加载地址（卡内状态栏正则正在使用）：

```
https://testingcf.jsdelivr.net/gh/smgyx/jsxm@v0.1.0/dist/收租万倍返还/界面/客户端/index.html
```

## 以后改界面怎么发新版本

1. 改 `D:\games\jsxm\dist\收租万倍返还\界面\客户端\index.html`（与卡内 `正则/状态栏界面.内嵌完整版备份.txt` 内容一致）
2. `git add -A && git commit -m "更新界面" && git tag v0.2.0 && git push origin main --tags`
3. 把卡内状态栏正则里的 `@v0.1.0` 改成新标签号，重新打包卡（或直接改酒馆里的正则）

（jsdelivr 按标签缓存；固定标签 = 稳定不变，想免改卡可以直接用 `@main` 分支地址，但有最长约 12 小时的缓存延迟。）

## 回退

卡内 `正则/状态栏界面.内嵌完整版备份.txt` 是内嵌完整版（不依赖网络），把它的内容盖回 `正则/状态栏界面.html` 再打包即可回到离线模式。
