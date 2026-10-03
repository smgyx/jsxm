# jsxm

SillyTavern 角色卡远程脚本仓库。角色卡里只存一行 `import` 网址，真正的代码托管在这里，由 jsDelivr 分发。

## 中转地址（CDN 基址）

```
https://testingcf.jsdelivr.net/gh/smgyx/jsxm
```

实测四个 jsDelivr 官方域名的国内耗时：

| 域名 | 状态 | 耗时 |
|---|---|---|
| **testingcf.jsdelivr.net** | 200 | **0.30s** |
| cdn.jsdelivr.net | 200 | 2.75s |
| gcore.jsdelivr.net | 200 | 4.40s |
| fastly.jsdelivr.net | 200 | 8.23s |

统一用 `testingcf`，它是 Cloudflare 节点，国内最快。四个都是 jsDelivr 官方域名，可以互相兜底。

## URL 拼法

```
{基址}@{版本}/{文件路径}
```

- **版本**：git tag（推荐，永久缓存）、分支名（12 小时缓存）、或 commit sha
- **文件路径**：仓库内的相对路径，区分大小写，中文路径要用 URL 编码

当前示例脚本：

```
https://testingcf.jsdelivr.net/gh/smgyx/jsxm@v0.0.1/dist/demo/hello.js
```

## 角色卡里怎么用

在酒馆助手里新建一条「全局脚本」，内容只写一行：

```js
import 'https://testingcf.jsdelivr.net/gh/smgyx/jsxm@v0.0.1/dist/demo/hello.js';
```

对应 tavern-cards-forge 项目的话，就是 `脚本/{名字}.txt` 文件，内容写这一行，然后 `pack`。

## 发布流程

```bash
# 1. 改代码（编辑 src/）
# 2. 产出到 dist/（当前示例是纯 JS，手动复制即可；上了 TS/Vue 之后走 webpack）
cp src/demo/hello.js dist/demo/hello.js

# 3. 提交并打标签，版本号与角色卡版本对齐
git add .
git commit -m "feat: 说明本次改动"
git tag v0.0.1

# 4. 推送（文件和标签要分开推）
git push origin main
git push origin v0.0.1
```

## 三个必须记住的坑

**1. `dist/` 必须提交。** jsDelivr 是从 Git 仓库读文件的，不是从 npm。`.gitignore` 里已经专门注释了这一点，别手滑加回去。

**2. 版本必须锁，别用 `@main`。** 实测响应头：

- tag 引用 → `Cache-Control: public, max-age=31536000, immutable`（永久缓存，永不回源）
- 分支引用 → `s-maxage=43200`（12 小时）

用分支引用用户会加载到随机旧版本；用 tag 则意味着**这个 tag 下的文件内容改了 CDN 也不会更新** —— 所以每版打新 tag，只增不改。

**3. 仓库必须公开。** jsDelivr 读不到私有仓库。

## 目录约定

```
src/   源码，给人看的
dist/  CDN 实际分发的文件，必须提交
```

一个新项目建一套 `src/{项目名}/` + `dist/{项目名}/`，互不影响。

建议的项目内部布局（照抄人妻公寓那套）：

```
dist/{项目名}/
  脚本/index.js      全局脚本，角色卡里 import 这个
  界面/index.html    状态栏前端，用 $('body').load(...) 挂
```

**多项目时的 tag 命名**：tag 是仓库级的，不是目录级的。一个仓库放多个角色卡项目时，用前缀区分，别混着用裸版本号：

```
人妻公寓-v0.1.0
收租万倍返还-v0.1.0
```

否则 A 项目发新版打的 tag，会把 B 项目的版本号也顶掉。

## 分支怎么用：第一版也不用建分支

**日常开发提交到 `main`，发布时在 `main` 上打 tag。** 一个人开发不需要 dev / release 分支，`main` + tag 就够了。

三者的实际区别（实测响应头）：

| 引用方式 | 写法 | CDN 缓存 | 用途 |
|---|---|---|---|
| 分支 | `@main` | 12 小时 | 不建议用于角色卡 |
| tag | `@v0.0.1` | 永久 immutable | **正式发布用这个** |
| commit sha | `@be4af96` | 永久 immutable | **调试用这个** |

所以第一版的完整动作就是：

```bash
git add -A
git commit -m "初始化远程脚本仓库"
git tag v0.0.1
git push origin main
git push origin v0.0.1
```

角色卡里引用 `@v0.0.1`，不是 `@main`。

## 调试技巧：用 commit sha 绕开缓存

tag 是 immutable，内容改了 CDN 不会更新；`@main` 又要等 12 小时。频繁改代码调试时两个都难受。

**用 commit sha**：每次 commit 都是一个全新的 URL，天然没有缓存问题，永远拿到最新内容。

```bash
git push origin main
SHA=$(git rev-parse --short HEAD)
echo "https://testingcf.jsdelivr.net/gh/smgyx/jsxm@$SHA/dist/demo/hello.js"
```

调顺了再打正式 tag 给角色卡用。

> 官方的 `purge.jsdelivr.net` 缓存清除接口实测返回 `MethodNotAllowed`，别指望它。
