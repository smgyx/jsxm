#!/usr/bin/env bash
# 调试发布：同步 src→dist，推到 main，输出一个用 commit sha 引用的一次性 CDN 地址
#
# 用法：
#   ./调试.sh [说明]
#
# 每次 commit 都是全新 URL，天然绕开 jsDelivr 缓存，改一次就能立刻生效。
# 调顺之后再用 ./发布.sh <版本号> 打正式 tag。

set -e

说明="${1:-调试更新}"

echo "==> 同步 src 到 dist"
cp -f src/demo/hello.js dist/demo/hello.js

echo "==> 提交"
git add -A
if git diff --cached --quiet; then
  echo "没有改动，跳过提交"
else
  git commit -m "$说明"
fi

echo "==> 推送"
git push origin main

SHA=$(git rev-parse HEAD)
SHORT=$(git rev-parse --short HEAD)

echo
echo "调试地址（每次 commit 都不同，不会被旧缓存影响）:"
echo "  https://testingcf.jsdelivr.net/gh/smgyx/jsxm@$SHORT/dist/demo/hello.js"
echo
echo "角色卡脚本里临时写:"
echo "  import 'https://testingcf.jsdelivr.net/gh/smgyx/jsxm@$SHORT/dist/demo/hello.js';"
echo
echo "完整 sha: $SHA"
