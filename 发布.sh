#!/usr/bin/env bash
# 发布脚本：源码同步到 dist → 提交 → 打标签 → 推送 → 打印 CDN 地址
#
# 用法（在 Git Bash 里跑）：
#   ./发布.sh v0.0.1 "这次改了什么"
#
# 版本号必须每次递增，且与角色卡里的 character_version 对齐。

set -e

版本="$1"
说明="${2:-更新}"

if [ -z "$版本" ]; then
  echo "用法: ./发布.sh <版本号> [说明]"
  echo "示例: ./发布.sh v0.0.1 \"新增问候脚本\""
  exit 1
fi

if git rev-parse "$版本" >/dev/null 2>&1; then
  echo "标签 $版本 已存在，请换一个版本号（tag 内容改了 CDN 不会更新）"
  exit 1
fi

echo "==> 同步 src 到 dist"
cp -f src/demo/hello.js dist/demo/hello.js

echo "==> 提交"
git add -A
git commit -m "$说明"

echo "==> 打标签 $版本"
git tag "$版本"

echo "==> 推送"
git push origin main
git push origin "$版本"

echo
echo "发布完成"
echo "CDN 地址:"
echo "  https://testingcf.jsdelivr.net/gh/smgyx/jsxm@$版本/dist/demo/hello.js"
echo
echo "角色卡脚本里写这一行:"
echo "  import 'https://testingcf.jsdelivr.net/gh/smgyx/jsxm@$版本/dist/demo/hello.js';"
