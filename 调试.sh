#!/usr/bin/env bash
# 调试发布：推到 main 并输出一个用 commit sha 引用的一次性地址
#
# 用法：
#   ./调试.sh <项目名> [说明]
#
# 每次 commit 都是全新 URL，天然绕开 jsDelivr 缓存，改一次立刻生效。
# 调顺之后再用 ./发布.sh <项目名> <版本号> 打正式 tag。

set -e

PROJ="$1"
MSG="${2:-调试更新}"

if [ -z "$PROJ" ]; then
  echo "用法: ./调试.sh <项目名> [说明]"
  echo "示例: ./调试.sh jsxm \"调整好感度逻辑\""
  echo
  echo "现有项目:"
  ls src
  exit 1
fi

if [ ! -d "src/$PROJ" ]; then
  echo "找不到 src/$PROJ"
  echo "现有项目:"
  ls src
  exit 1
fi

echo "==> 同步 src/$PROJ 到 dist/$PROJ"
mkdir -p "dist/$PROJ"
cp -R "src/$PROJ/." "dist/$PROJ/"

echo "==> 提交"
git add -A
if git diff --cached --quiet; then
  echo "没有改动，跳过提交"
else
  git commit -m "$MSG"
fi

echo "==> 推送"
git push origin main

SHORT=$(git rev-parse --short HEAD)
CDN="https://testingcf.jsdelivr.net/gh/smgyx/jsxm@$SHORT"

echo
echo "调试地址（每次 commit 都不同，不受缓存影响）:"
echo "  import '$CDN/dist/$PROJ/script/index.js';"
echo
echo "完整 sha: $(git rev-parse HEAD)"
