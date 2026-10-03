#!/usr/bin/env bash
# 正式发布：src/{项目} → dist/{项目} → 提交 → 打 tag → 推送 → 打印 CDN 地址
#
# 用法（在 Git Bash 里跑）：
#   ./发布.sh <项目名> <版本号> [说明]
#
# 示例：
#   ./发布.sh jsxm v0.1.0 "初始版本"
#
# 标签会自动加项目前缀（jsxm + v0.1.0 → jsxm-v0.1.0），
# 这样一个仓库放多个角色卡项目时版本号不会互相顶掉。
#
# 注意：bash 变量名只能用 ASCII，所以这里全用英文变量名。

set -e

PROJ="$1"
VER="$2"
MSG="${3:-更新}"

if [ -z "$PROJ" ] || [ -z "$VER" ]; then
  echo "用法: ./发布.sh <项目名> <版本号> [说明]"
  echo "示例: ./发布.sh jsxm v0.1.0 \"初始版本\""
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

TAG="$PROJ-$VER"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "标签 $TAG 已存在"
  echo "tag 内容改了 CDN 不会更新（immutable 缓存），请换一个版本号"
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

echo "==> 打标签 $TAG"
git tag "$TAG"

echo "==> 推送"
git push origin main
git push origin "$TAG"

CDN="https://testingcf.jsdelivr.net/gh/smgyx/jsxm@$TAG"

echo
echo "发布完成：$TAG"
echo
echo "角色卡脚本条目里写这一行："
echo "  import '$CDN/dist/$PROJ/script/index.js';"

if [ -f "dist/$PROJ/ui/index.html" ]; then
  echo
  echo "状态栏里写："
  echo "  \$('body').load('$CDN/dist/$PROJ/ui/index.html')"
fi
