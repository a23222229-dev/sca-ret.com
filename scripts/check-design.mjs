#!/usr/bin/env node
// 設計守門：沿用 credo.com.tw 的 5 條規則。任何一條違規就讓 build 失敗（exit 1）。
// 規則（見 scaretimportplan-draft.md 第 2 節）：
//   1. 字級一律 var(--text-*)，禁止 <style> 裡把 font-size 寫死成 px
//   2. 顏色只准定義在 src/styles/variables.css，元件 <style> 一律用 var(--…)
//   3. 禁止 !important
//   4. 禁止外部字型 CDN（fonts.googleapis.com／fonts.gstatic.com／其他外部 @import url）
//   5. 元件樣式限 scoped <style>，禁止 <style is:global>（:global(...) 選擇器包單一規則不算違規）

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const VARIABLES_FILE = join(SRC, 'styles', 'variables.css');

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.includes(extname(name))) {
      out.push(full);
    }
  }
  return out;
}

// 去掉 CSS 註解，避免規則說明文字本身（例如這支腳本引用的規則描述）被誤判為違規。
function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractStyleBlocks(source) {
  const blocks = [];
  const re = /<style([^>]*)>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = re.exec(source))) {
    blocks.push({ attrs: m[1] ?? '', body: m[2] ?? '' });
  }
  return blocks;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const violations = [];

function report(file, line, rule, message) {
  violations.push({ file: relative(ROOT, file), line, rule, message });
}

// --- 掃 .astro 檔案 ---
const astroFiles = walk(SRC, ['.astro']);

for (const file of astroFiles) {
  const raw = readFileSync(file, 'utf8');

  // 規則 4：外部字型 CDN — 檢查整個檔案（含 <head>），不只 <style>
  const fontCdnRe = /https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|[^"'\s)]+\.(?:woff2?|ttf|otf)(?:\?[^"'\s)]*)?)/gi;
  let fm;
  while ((fm = fontCdnRe.exec(raw))) {
    report(file, lineOf(raw, fm.index), 'no-external-font-cdn', `偵測到外部字型資源：${fm[0]}`);
  }

  // 規則 1／2：inline style="..." 屬性一樣要禁止寫死顏色／px 字級
  const inlineStyleRe = /\bstyle\s*=\s*"([^"]*)"/g;
  let sm;
  while ((sm = inlineStyleRe.exec(raw))) {
    const value = sm[1];
    if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(/.test(value)) {
      report(file, lineOf(raw, sm.index), 'no-inline-color', `inline style 顏色一樣要用 var(--…)：style="${value}"`);
    }
    if (/font-size\s*:\s*[^;]*\d+(\.\d+)?px/.test(value) && !/var\(--text-/.test(value)) {
      report(file, lineOf(raw, sm.index), 'no-px-font-size', `inline style font-size 禁止寫死 px：style="${value}"`);
    }
  }

  const blocks = extractStyleBlocks(raw);
  for (const block of blocks) {
    // 規則 5：禁止整塊 is:global（選擇性的 :global(...) 選擇器不受影響）
    if (/\bis:global\b/.test(block.attrs)) {
      const idx = raw.indexOf(block.attrs);
      report(file, lineOf(raw, idx), 'no-global-style-block', '<style is:global> 會讓整個元件樣式跳過 scoped，改用 :global(選擇器) 包單一規則');
    }

    const body = stripCssComments(block.body);
    const blockStart = raw.indexOf(block.body);

    // 規則 3：禁止 !important
    let re = /!important/g;
    let mm;
    while ((mm = re.exec(body))) {
      report(file, lineOf(raw, blockStart + mm.index), 'no-important', '禁止使用 !important，請透過選擇器優先權或調整規則順序解決');
    }

    // 規則 1：font-size 禁止寫死 px（var(--text-*) 以外一律擋）
    re = /font-size\s*:\s*[^;]+;/gi;
    while ((mm = re.exec(body))) {
      if (/\d+(\.\d+)?px/.test(mm[0]) && !/var\(--text-/.test(mm[0])) {
        report(file, lineOf(raw, blockStart + mm.index), 'no-px-font-size', `font-size 禁止寫死 px，請用 var(--text-*)：${mm[0].trim()}`);
      }
    }

    // 規則 2：顏色只能在 variables.css 定義，元件內不可出現色彩字面值
    // （允許 currentColor / transparent / inherit 等關鍵字，這些不是色彩字面值）
    re = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(/g;
    while ((mm = re.exec(body))) {
      report(file, lineOf(raw, blockStart + mm.index), 'no-inline-color', `顏色只能定義在 src/styles/variables.css，元件請用 var(--…)：${mm[0]}`);
    }
  }
}

// --- variables.css 本身：只檢查禁止 !important，顏色定義本來就允許在這裡 ---
{
  const raw = readFileSync(VARIABLES_FILE, 'utf8');
  const body = stripCssComments(raw);
  const re = /!important/g;
  let mm;
  while ((mm = re.exec(body))) {
    report(VARIABLES_FILE, lineOf(raw, mm.index), 'no-important', '禁止使用 !important');
  }
}

if (violations.length > 0) {
  console.error(`\n✗ check-design 發現 ${violations.length} 項違規：\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}]  ${v.message}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('✓ check-design 通過（字級／顏色／!important／外部字型／scoped style 五條規則）');
}
