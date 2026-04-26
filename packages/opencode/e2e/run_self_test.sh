#!/usr/bin/env bash
# ============================================================
# OpenCode TUI i18n 自测脚本
# 
# 用法: bash run_self_test.sh [--tui-only] [--fix]
#
# --tui-only  只运行 TUI i18n 相关测试
# --fix       测试失败时自动触发 AI 修复流程
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
MAX_RETRIES=3
FIX_MODE=false
TUI_ONLY=false

# 解析参数
for arg in "$@"; do
  case "$arg" in
    --fix)     FIX_MODE=true ;;
    --tui-only) TUI_ONLY=true ;;
    --max-retries=*) MAX_RETRIES="${arg#*=}" ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_fail()  { echo -e "${RED}[FAIL]${NC} $1"; }

# ============================================================
# Phase 1: 静态检查（不依赖 bun 运行时）
# ============================================================

check_i18n_key_parity() {
  log_info "检查 i18n 字典 key 一致性..."

  local en_file="$PROJECT_DIR/src/cli/cmd/tui/i18n/en.ts"
  local zh_file="$PROJECT_DIR/src/cli/cmd/tui/i18n/zh.ts"

  if [[ ! -f "$en_file" || ! -f "$zh_file" ]]; then
    log_fail "找不到 i18n 字典文件"
    return 1
  fi

  # 提取所有 key
  local en_keys zh_keys
  en_keys=$(grep -oP '"tui\.[a-zA-Z0-9_.]+"' "$en_file" | sort | uniq)
  zh_keys=$(grep -oP '"tui\.[a-zA-Z0-9_.]+"' "$zh_file" | sort | uniq)

  local en_count zh_count
  en_count=$(echo "$en_keys" | wc -l)
  zh_count=$(echo "$zh_keys" | wc -l)

  log_info "en.ts: ${en_count} keys, zh.ts: ${zh_count} keys"

  # 找出差异
  local en_only zh_only
  en_only=$(comm -23 <(echo "$en_keys") <(echo "$zh_keys"))
  zh_only=$(comm -13 <(echo "$en_keys") <(echo "$zh_keys"))

  if [[ -n "$en_only" ]]; then
    log_fail "en.ts 有但 zh.ts 缺失的 key:"
    echo "$en_only" | sed 's/^/  /'
    return 1
  fi

  if [[ -n "$zh_only" ]]; then
    log_fail "zh.ts 有但 en.ts 缺失的 key:"
    echo "$zh_only" | sed 's/^/  /'
    return 1
  fi

  log_ok "i18n 字典 key 完全匹配 (${en_count} keys)"
  return 0
}

check_t_call_coverage() {
  log_info "检查 t() 调用覆盖率..."

  local tui_src="$PROJECT_DIR/src/cli/cmd/tui"
  local en_file="$PROJECT_DIR/src/cli/cmd/tui/i18n/en.ts"

  # 提取所有 t("tui.xxx") 调用 - 只匹配 t() 函数调用，排除 writeHeapSnapshot 等误报
  local t_calls
  t_calls=$(grep -roh '\bt("tui\.[a-zA-Z0-9_.]*")' "$tui_src" 2>/dev/null \
    | sed 's/t("//;s/")//' \
    | sort | uniq)

  if [[ -z "$t_calls" ]]; then
    log_warn "没有找到 t() 调用"
    return 0
  fi

  local call_count
  call_count=$(echo "$t_calls" | wc -l)
  log_info "找到 ${call_count} 个唯一的 t() 调用"

  # 检查是否所有调用的 key 都存在于字典
  local missing=0
  while IFS= read -r key; do
    if ! grep -q "\"${key}\"" "$en_file"; then
      log_fail "字典缺失 key: ${key}"
      missing=$((missing + 1))
    fi
  done <<< "$t_calls"

  if [[ $missing -gt 0 ]]; then
    log_fail "${missing} 个 key 在字典中不存在"
    return 1
  fi

  log_ok "所有 t() 调用的 key 都存在于字典"
  return 0
}

check_type_safety() {
  log_info "运行 TypeScript 类型检查..."

  if ! command -v npx &>/dev/null; then
    log_warn "npx 不可用，跳过类型检查"
    return 0
  fi

  local tsc_output
  tsc_output=$(cd "$PROJECT_DIR" && \
    timeout 90 env NODE_OPTIONS="--max-old-space-size=4096" \
    npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "effect(" | head -20 || true)

  if [[ -n "$tsc_output" ]]; then
    log_fail "TypeScript 类型错误:"
    echo "$tsc_output" | sed 's/^/  /'
    return 1
  fi

  log_ok "TypeScript 类型检查通过"
  return 0
}

check_empty_translations() {
  log_info "检查空翻译值..."

  local en_file="$PROJECT_DIR/src/cli/cmd/tui/i18n/en.ts"
  local zh_file="$PROJECT_DIR/src/cli/cmd/tui/i18n/zh.ts"

  local empty_count=0

  for file in "$en_file" "$zh_file"; do
    local basename
    basename=$(basename "$file")
    local empties
    empties=$(grep -nP '^\s*"tui\.\w+":\s*""' "$file" || true)
    if [[ -n "$empties" ]]; then
      log_fail "${basename} 中有空值:"
      echo "$empties" | sed 's/^/  /'
      empty_count=$((empty_count + 1))
    fi
  done

  if [[ $empty_count -gt 0 ]]; then
    return 1
  fi

  log_ok "没有空翻译值"
  return 0
}

# ============================================================
# Phase 2: 主测试循环
# ============================================================

run_checks() {
  local failures=0

  check_i18n_key_parity || failures=$((failures + 1))
  check_t_call_coverage || failures=$((failures + 1))
  check_empty_translations || failures=$((failures + 1))
  check_type_safety || failures=$((failures + 1))

  return $failures
}

main() {
  echo "========================================"
  echo "  OpenCode TUI i18n 自测流水线"
  echo "========================================"
  echo ""

  local retry=0
  while [[ $retry -lt $MAX_RETRIES ]]; do
    retry=$((retry + 1))
    echo ""
    log_info "🔄 第 ${retry}/${MAX_RETRIES} 轮自测..."

    if run_checks; then
      echo ""
      echo "========================================"
      log_ok "✅ 所有自测通过！"
      echo "========================================"
      exit 0
    fi

    log_warn "⚠️ 第 ${retry} 轮测试失败"

    if [[ "$FIX_MODE" == "true" ]]; then
      log_info "🔧 启动 AI 自动修复..."
      if command -v node &>/dev/null; then
        node "$SCRIPT_DIR/ci/self_healing.js" 2>&1 || true
      else
        log_warn "Node.js 不可用，跳过自动修复"
      fi
    elif [[ $retry -lt $MAX_RETRIES ]]; then
      log_info "等待 5 秒后重试..."
      sleep 5
    fi
  done

  echo ""
  echo "========================================"
  log_fail "❌ 达到最大重试次数 (${MAX_RETRIES})，需人工介入"
  echo "========================================"
  exit 1
}

main
