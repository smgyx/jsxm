#!/usr/bin/env bash
# 新电脑初始化：配置 git 身份 + SSH 密钥 + 拉取 jsxm 仓库
#
# 用法（在另一台电脑的 Git Bash 里跑）：
#   ./初始化新电脑.sh
#
# 设计原则：
#   - 一个 GitHub 账号可以挂多个 SSH 公钥，所以这里走「新机器生成新密钥」
#     而不是复制旧机器的私钥过去。好处是丢某台电脑时可以单独吊销对应的 key。
#   - 已有的密钥会被检测到并跳过，不会覆盖。

set -e

REPO_URL="git@github.com:smgyx/jsxm.git"
CLONE_DIR="${1:-$HOME/games/jsxm}"
KEY="$HOME/.ssh/id_ed25519"

echo "===== jsxm 仓库 · 新电脑初始化 ====="
echo

# 1. 检查 git
if ! command -v git >/dev/null 2>&1; then
  echo "未检测到 git，请先安装 Git for Windows："
  echo "  https://git-scm.com/downloads/win"
  exit 1
fi
echo "[1/6] git 已安装：$(git --version)"

# 2. git 身份
git config --global user.name "smgyx"
git config --global user.email "144696649+smgyx@users.noreply.github.com"
git config --global core.quotepath false
echo "[2/6] git 身份已配置：smgyx / noreply 邮箱"

# 3. SSH 密钥
mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
if [ -f "$KEY" ]; then
  echo "[3/6] 已存在密钥 $KEY，跳过生成"
else
  ssh-keygen -t ed25519 -C "144696649+smgyx@users.noreply.github.com" -f "$KEY" -N "" -q
  echo "[3/6] 已生成新密钥"
fi
echo

echo "======== 请把下面这一整行添加到 GitHub ========"
cat "$KEY.pub"
echo "=============================================="
echo
echo "打开 https://github.com/settings/ssh/new"
echo "粘贴上面的内容，Title 填个标识这台电脑的名字，点 Add SSH key。"
echo
echo "注意：这是新增一把 key，原本那台电脑的 key 不用删，同一个账号可以有多把。"
echo
read -r -p "添加完成后按回车继续..." _

# 4. 测试连接
echo
echo "[4/6] 测试 SSH 连接..."
if timeout 25 ssh -T -o StrictHostKeyChecking=no -o BatchMode=yes git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo "      SSH 认证通过"
else
  echo "      SSH 认证失败。"
  echo "      如果这台机器的网络封了 22 端口，走 443 备用："
  echo "        printf 'Host github.com\\n  HostName ssh.github.com\\n  Port 443\\n  User git\\n' >> ~/.ssh/config"
  echo "      然后重跑本脚本。"
  exit 1
fi

# 5. clone
echo
if [ -d "$CLONE_DIR/.git" ]; then
  echo "[5/6] $CLONE_DIR 已存在，拉取最新..."
  cd "$CLONE_DIR" && git pull
else
  echo "[5/6] 克隆仓库到 $CLONE_DIR ..."
  git clone "$REPO_URL" "$CLONE_DIR"
  cd "$CLONE_DIR"
fi

# 6. 完成
git checkout main 2>/dev/null || true
echo "[6/6] 完成"
echo
echo "仓库位置：$CLONE_DIR"
echo "可用项目："
ls src
echo
echo "以后发布照旧："
echo "  ./发布.sh jsxm v1.4 \"说明\""
echo "  ./调试.sh jsxm \"说明\""
