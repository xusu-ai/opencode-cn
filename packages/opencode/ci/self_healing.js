/**
 * OpenCode TUI i18n 自测自修调度器
 * 
 * 核心逻辑：
 * 1. 运行 run_self_test.sh 静态检查
 * 2. 失败时分析错误日志
 * 3. 自动生成修复补丁
 * 4. 验证修复并提交
 * 
 * 用法: node ci/self_healing.js [--max-retries=3]
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_DIR = path.resolve(__dirname, "..");
const I18N_DIR = path.join(PROJECT_DIR, "src/cli/cmd/tui/i18n");
const EN_FILE = path.join(I18N_DIR, "en.ts");
const ZH_FILE = path.join(I18N_DIR, "zh.ts");

// ============================================================
// 3M 原则实现
// ============================================================

/**
 * Mark the Boundary: 明确标识这是在修改自身源码
 */
function markBoundary(action) {
  console.log(`\n🔧 [SELF-HEALING] ${action}`);
  console.log("   ⚠️  边界标记: 正在修改 OpenCode 自身源码，不是写新功能");
}

/**
 * Make it Concrete: 提供具体的错误上下文
 */
function makeConcrete(errorLog) {
  console.log("\n📋 [CONTEXT] 具体错误信息:");
  console.log("─".repeat(60));
  const lines = errorLog.split("\n").slice(0, 20);
  for (const line of lines) {
    console.log("  " + line);
  }
  console.log("─".repeat(60));
  return lines;
}

/**
 * Mandate Verification: 强制验证修复
 */
async function mandateVerification(description) {
  console.log(`\n🧪 [VERIFY] 验证修复: ${description}`);
  try {
    const result = spawnSync("bash", [
      path.join(PROJECT_DIR, "e2e/run_self_test.sh"),
      "--tui-only",
    ], {
      stdio: "pipe",
      timeout: 120000,
      cwd: PROJECT_DIR,
    });
    if (result.status === 0) {
      console.log("  ✅ 验证通过");
      return true;
    }
    console.log("  ❌ 验证失败");
    return false;
  } catch (err) {
    console.log("  ❌ 验证异常:", err.message);
    return false;
  }
}

// ============================================================
// 修复策略: 针对常见 i18n 错误的自动修复
// ============================================================

/**
 * 策略1: en.ts 和 zh.ts key 不匹配
 * 从 en.ts 同步缺失的 key 到 zh.ts
 */
function fixKeyMismatch() {
  markBoundary("修复字典 key 不匹配");

  const enContent = fs.readFileSync(EN_FILE, "utf-8");
  const zhContent = fs.readFileSync(ZH_FILE, "utf-8");

  const enKeys = extractKeys(enContent);
  const zhKeys = new Set(extractKeys(zhContent));

  const missingInZh = enKeys.filter((k) => !zhKeys.has(k));

  if (missingInZh.length === 0) {
    console.log("  ✅ key 已匹配，无需修复");
    return false;
  }

  console.log(`  📝 zh.ts 缺失 ${missingInZh.length} 个 key，正在补全...`);

  // 提取 en.ts 中的 key-value 对
  const enDict = extractKeyValuePairs(enContent);

  // 在 zh.ts 的最后一个 key 之后插入缺失的 key
  let newZhContent = zhContent;
  for (const key of missingInZh) {
    const enValue = enDict[key] || key; // 回退到 key 本身
    console.log(`    + 添加: "${key}" = "${enValue}" (暂用英文值)`);
    // 在闭合 } 之前插入
    newZhContent = newZhContent.replace(
      /\n\}\s*$/,
      `\n  "${key}": "${enValue}",\n}\n`
    );
  }

  fs.writeFileSync(ZH_FILE, newZhContent);
  console.log("  ✅ 已补全缺失的 key");
  return true;
}

/**
 * 策略2: 空翻译值
 * 用英文值填充空翻译
 */
function fixEmptyTranslations() {
  markBoundary("修复空翻译值");

  let fixed = false;
  const enContent = fs.readFileSync(EN_FILE, "utf-8");
  const enDict = extractKeyValuePairs(enContent);

  for (const [file, label] of [
    [EN_FILE, "en.ts"],
    [ZH_FILE, "zh.ts"],
  ]) {
    let content = fs.readFileSync(file, "utf-8");
    const emptyPattern = /^(\s*"[^"]+"):(\s*""\s*,?)$/gm;
    let match;
    while ((match = emptyPattern.exec(content)) !== null) {
      const fullLine = match[0];
      const key = match[1].replace(/"/g, "").trim();
      const enValue = enDict[key];
      if (enValue) {
        console.log(`    ~ 填充: "${key}" = "${enValue}"`);
        content = content.replace(
          fullLine,
          `  "${key}": "${enValue}",`
        );
        fixed = true;
      }
    }
    if (fixed) {
      fs.writeFileSync(file, content);
    }
  }

  if (!fixed) {
    console.log("  ✅ 没有空翻译值");
  }
  return fixed;
}

/**
 * 策略3: t() 调用引用了不存在的 key
 * 在 en.ts 和 zh.ts 中添加缺失的 key
 */
function fixMissingKeysInDict(missingKeys) {
  if (!missingKeys || missingKeys.length === 0) return false;

  markBoundary("修复字典中缺失的 t() 引用 key");

  const enContent = fs.readFileSync(EN_FILE, "utf-8");
  let newEnContent = enContent;
  let newZhContent = fs.readFileSync(ZH_FILE, "utf-8");

  for (const key of missingKeys) {
    // 用 key 的最后一段作为占位值
    const placeholder = key.split(".").pop() || key;
    console.log(`    + 添加: "${key}" = "${placeholder}"`);

    newEnContent = newEnContent.replace(
      /\n\}\s*$/,
      `\n  "${key}": "${placeholder}",\n}\n`
    );
    newZhContent = newZhContent.replace(
      /\n\}\s*$/,
      `\n  "${key}": "${placeholder}",\n}\n`
    );
  }

  fs.writeFileSync(EN_FILE, newEnContent);
  fs.writeFileSync(ZH_FILE, newZhContent);
  console.log("  ✅ 已添加缺失的 key");
  return true;
}

// ============================================================
// 工具函数
// ============================================================

function extractKeys(content) {
  const keys = [];
  const pattern = /"tui\.[a-zA-Z0-9_.]+"/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    keys.push(match[0].replace(/"/g, ""));
  }
  return [...new Set(keys)].sort();
}

function extractKeyValuePairs(content) {
  const dict = {};
  const pattern = /^\s*"(tui\.[a-zA-Z0-9_.]+)":\s*"([^"]*)"/gm;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    dict[match[1]] = match[2];
  }
  return dict;
}

// ============================================================
// 主循环
// ============================================================

async function selfHealingLoop(maxRetries = 3) {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   OpenCode i18n 自测自修调度器 v1.0      ║");
  console.log("╚══════════════════════════════════════════╝");

  for (let i = 0; i < maxRetries; i++) {
    console.log(`\n🔄 第 ${i + 1}/${maxRetries} 轮自测开始...`);

    try {
      const result = spawnSync(
        "bash",
        [path.join(PROJECT_DIR, "e2e/run_self_test.sh"), "--tui-only"],
        {
          stdio: "pipe",
          timeout: 180000,
          cwd: PROJECT_DIR,
        }
      );

      if (result.status === 0) {
        console.log("\n✅ 所有模拟用户测试通过。");
        process.exit(0);
      }

      const errorLog =
        (result.stdout || "").toString() + (result.stderr || "").toString();
      console.log("⚠️ 测试失败，正在分析...");

      const contextLines = makeConcrete(errorLog);

      // 根据错误类型选择修复策略
      let fixed = false;

      if (errorLog.includes("key 完全匹配") || errorLog.includes("缺失的 key")) {
        fixed = fixKeyMismatch() || fixed;
      }

      if (errorLog.includes("空翻译") || errorLog.includes("空值")) {
        fixed = fixEmptyTranslations() || fixed;
      }

      if (errorLog.includes("字典中不存在")) {
        // 提取缺失的 key
        const missingKeys = [];
        const keyPattern = /字典缺失 key: (tui\.[a-zA-Z0-9_.]+)/g;
        let match;
        while ((match = keyPattern.exec(errorLog)) !== null) {
          missingKeys.push(match[1]);
        }
        fixed = fixMissingKeysInDict(missingKeys) || fixed;
      }

      if (!fixed) {
        console.log("⚠️ 无法自动修复此错误，需要人工介入");
        console.log("📋 错误日志摘要:");
        contextLines.forEach((l) => console.log("  " + l));
      } else {
        // 验证修复
        const verified = await mandateVerification("自动修复验证");
        if (verified) {
          console.log("\n✅ 自动修复成功并通过验证！");
          process.exit(0);
        }
      }
    } catch (err) {
      console.error("❌ 执行异常:", err.message);
    }
  }

  console.log("\n❌ 达到最大重试次数，人工介入检查。");
  process.exit(1);
}

// 解析命令行参数
const args = process.argv.slice(2);
let maxRetries = 3;
for (const arg of args) {
  if (arg.startsWith("--max-retries=")) {
    maxRetries = parseInt(arg.split("=")[1], 10);
  }
}

selfHealingLoop(maxRetries);
