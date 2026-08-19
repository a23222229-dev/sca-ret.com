#!/usr/bin/env node
// 內容守門：沿用 credo.com.tw 的「去 AI 味」兩級規則。
//   ERROR：明顯的 AI 生成腔調用詞，直接擋 build（exit 1）。
//   WARN：較輕微的制式行銷詞，先警告；同一次掃描累積達門檻後升級為 ERROR。
//
// ALLOW：本站已逐字盤點、確認是客戶原始文案的字串（見 scaretimportplan-draft.md），
//   即使剛好命中某條規則也不算違規，優先權高於 ERROR_TELLS／WARN_TELLS。
// SITE_ERROR_TELLS：sca-ret 站台專屬要額外擋的用詞，依需求增修，不動 ERROR_TELLS 主清單。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const WARN_ESCALATE_THRESHOLD = 5; // WARN 累積達此數量，整體視為失敗

// 明顯 AI 生成腔調（不分繁簡皆擋）
const ERROR_TELLS = [
  '总的来说', '總的來說',
  '综上所述', '綜上所述',
  '总而言之', '總而言之',
  '不可否认', '不可否認',
  '毋庸置疑',
  '值得注意的是', '值得一提的是',
  '作为一个AI', '作為一個AI', '作为AI语言模型', '作為AI語言模型',
  '在当今社会', '在當今社會',
  '在这个快速发展的时代', '在這個快速發展的時代',
  '赋能', '賦能',
];

// 較輕微、制式化的行銷贅詞——先警告，累積過多才擋
const WARN_TELLS = [
  '助力',
  '全方位',
  '多元化',
  '赋予', '賦予',
  '探索更多可能性', '探索更多可能',
  '让我们一起', '讓我們一起',
  '不仅仅是', '不僅僅是',
];

// sca-ret 站台專屬擴充清單（目前無額外項目，預留給未來新增內容用）
const SITE_ERROR_TELLS = [];

// 已核對為客戶原始逐字文案，不受上面規則約束
const ALLOW = [
  '我們公司帶您一站式跑完所有流程',
  'SCA 公司收費來自於一站式自動化辦理退休監護契約',
  '一站式搞定退休大小事',
  '詠業SCA已經開始打造您的法律鷹架',
  '整合後才能接受退休人士託付的「長期性」管理方案',
];

const ALL_ERROR_TELLS = [...ERROR_TELLS, ...SITE_ERROR_TELLS];

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

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const CJK = /[一-鿿㐀-䶿]/;

function extractTextChunks(raw) {
  // 拿掉 <style>...</style>，樣式不是內容
  const noStyle = raw.replace(/<style[\s\S]*?<\/style>/g, '');

  const chunks = [];

  // 1) 字串字面值（涵蓋 frontmatter 陣列裡的長文案）
  const strRe = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = strRe.exec(noStyle))) {
    const text = m[2];
    if (CJK.test(text) && text.length >= 4) {
      chunks.push({ text, index: m.index });
    }
  }

  // 2) markup 區塊裡標籤之間的純文字節點
  const splitIdx = noStyle.indexOf('\n---', 3);
  const markup = splitIdx === -1 ? noStyle : noStyle.slice(splitIdx + 4);
  const markupOffset = splitIdx === -1 ? 0 : splitIdx + 4;
  const tagTextRe = />([^<>{}]+)</g;
  while ((m = tagTextRe.exec(markup))) {
    const text = m[1].trim();
    if (CJK.test(text) && text.length >= 4) {
      chunks.push({ text, index: markupOffset + m.index + 1 });
    }
  }

  return chunks;
}

function isAllowed(text) {
  return ALLOW.some((a) => text.includes(a) || a.includes(text));
}

const astroFiles = walk(SRC, ['.astro']);
const mdFiles = walk(SRC, ['.md', '.mdx']);
const files = [...astroFiles, ...mdFiles];

const errors = [];
const warns = [];

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const chunks = extractTextChunks(raw);

  for (const { text, index } of chunks) {
    if (isAllowed(text)) continue;

    for (const tell of ALL_ERROR_TELLS) {
      if (text.includes(tell)) {
        errors.push({
          file: relative(ROOT, file),
          line: lineOf(raw, index),
          tell,
          excerpt: text.slice(0, 60),
        });
      }
    }
    for (const tell of WARN_TELLS) {
      if (text.includes(tell)) {
        warns.push({
          file: relative(ROOT, file),
          line: lineOf(raw, index),
          tell,
          excerpt: text.slice(0, 60),
        });
      }
    }
  }
}

if (warns.length > 0) {
  console.warn(`\n⚠ check-content 發現 ${warns.length} 項 WARN 級用詞（門檻 ${WARN_ESCALATE_THRESHOLD}）：\n`);
  for (const w of warns) {
    console.warn(`  ${w.file}:${w.line}  [${w.tell}]  ...${w.excerpt}...`);
  }
}

if (warns.length >= WARN_ESCALATE_THRESHOLD) {
  errors.push({
    file: '(累積)',
    line: '-',
    tell: 'WARN 累積升級',
    excerpt: `WARN 累積 ${warns.length} 項，達到門檻 ${WARN_ESCALATE_THRESHOLD}，視為失敗`,
  });
}

if (errors.length > 0) {
  console.error(`\n✗ check-content 發現 ${errors.length} 項 ERROR 級違規：\n`);
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  [${e.tell}]  ...${e.excerpt}...`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('✓ check-content 通過（去 AI 味兩級規則）' + (warns.length ? `，但有 ${warns.length} 項 WARN 未達升級門檻` : ''));
}
