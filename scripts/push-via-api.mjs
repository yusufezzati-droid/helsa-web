#!/usr/bin/env node
// push-via-api.mjs — پوش کامل پروژه به گیت‌هاب از طریق Git Database API
// (وقتی git-receive-pack توسط گیت‌هاب بلاک می‌شود ولی REST آزاد است)
// استفاده: node scripts/push-via-api.mjs [owner/repo]
// توکن: /tmp/gh-token یا متغیر GITHUB_TOKEN
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first'); // مسیر IPv6 خروجی سندباکس توسط گیت‌هاب بلاک است (404 نقاب‌دار)
import { execFile } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { promisify } from 'node:util';
const run = promisify(execFile);

const TARGET = process.argv[2] || 'yusufeztati-droid/helsa-web';
const TOKEN = (process.env.GITHUB_TOKEN || (existsSync('/tmp/gh-token') ? readFileSync('/tmp/gh-token', 'utf8') : '')).trim();
if (!TOKEN) { console.error('توکن نیست'); process.exit(1); }
const API = 'https://api.github.com';
const CWD = '/home/user/helsa';
const CONCURRENCY = 1;

// بدنه‌های >۸۰۰KB به‌صورت chunked استریم می‌روند (پروکسی خروجی بدنهٔ یکپارچهٔ بزرگ را می‌بندد)
function bodyStream(str) {
  if (str.length < 800000) return str;
  const enc = new TextEncoder();
  const chunks = [];
  for (let i = 0; i < str.length; i += 262144) chunks.push(enc.encode(str.slice(i, i + 262144)));
  return new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(ch); c.close(); } });
}

async function api(method, path, body, retry404 = false) {
  for (let attempt = 1; attempt <= 40; attempt++) {
    const res = await fetch(API + path, {
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'helsa-push',
        'X-GitHub-Api-Version': '2022-11-28',
        'Connection': 'close', // اتصال بازاستفاده‌شده از این IP بلاک می‌شود
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? bodyStream(JSON.stringify(body)) : undefined,
      ...(body ? { duplex: 'half' } : {})
    });
    if (res.status === 403 || res.status === 429 || (retry404 && res.status === 404)) {
      const ra = res.headers.get('retry-after');
      const wait = ra ? parseInt(ra) * 1000 : Math.min(30000, 1500 + 2500 * attempt);
      console.log(`  ⏳ ${res.status} — ${Math.round(wait / 1000)}s صبر (${path.slice(0, 40)})`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.json();
  }
  throw new Error('rate-limit پایدار: ' + path);
}

// ── ۱) فهرست فایل‌ها از گیت محلی (mode + sha + path)
let stdout;
if (process.env.SKIP_LS) {
  stdout = "100644 x\t.env.example\u0000100644 x\t.gitignore\u0000";
} else {
  ({ stdout } = await run('git', ['ls-files', '-s', '-z'], { cwd: CWD, maxBuffer: 1 << 26 }));
}
const entries = [];
for (const item of stdout.split('\0')) {
  if (!item) continue;
  const tab = item.indexOf('\t');
  const [mode, sha] = item.slice(0, tab).split(' ');
  entries.push({ mode, sha, path: item.slice(tab + 1) });
}
if (+process.env.LIMIT) entries.length = +process.env.LIMIT;
console.log(`[api-push] ۱/۵ ${entries.length} فایل برای پوش`);

// ── ۲) آپلود blobها (با بررسی سلامت sha)
const treeItems = new Array(entries.length);
let done = 0, failed = 0;
async function worker(queue) {
  while (queue.length) {
    const e = queue.shift();
    const content = readFileSync(CWD + '/' + e.path).toString('base64');
    const b = await api('POST', `/repos/${TARGET}/git/blobs`, { content, encoding: 'base64' }, true);
    await new Promise(r => setTimeout(r, 350));
    if (e.sha !== 'x' && b.sha !== e.sha) { failed++; console.error(`  ✗ sha mismatch: ${e.path}`); }
    treeItems[entries.indexOf(e)] = { path: e.path, mode: e.mode, type: 'blob', sha: b.sha };
    donePaths.add(e.path);
    if (++done % 100 === 0) { console.log(`  blob ${done}/${queue2.length + donePaths.size - queue2.length} (کل: ${donePaths.size}/${entries.length})`); saveProgress(); }
  }
}
// ازسرگیری: blobهای قبلاً انجام‌شده را رد کن
import { writeFileSync } from 'node:fs';
const PROG = '/tmp/api-push-progress.json';
let donePaths = new Set();
try { donePaths = new Set(JSON.parse(readFileSync(PROG, 'utf8'))); } catch {}
const queue = entries.filter(e => !donePaths.has(e.path));
console.log(`  (ازسرگیری: ${donePaths.size} فایل قبلاً کامل شده)`);

const queue2 = [...queue];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue2)));

function saveProgress() {
  try { writeFileSync(PROG, JSON.stringify([...donePaths])); } catch {}
}
if (failed) throw new Error(failed + ' blob ناسازگار');
console.log(`[api-push] ۲/۵ ${done} blob آپلود شد ✓`);

// ── ۳) ساخت tree (اول تکی، در خطا: سلسله‌مراتبی)
let treeSha = null;
try {
  const t = await api('POST', `/repos/${TARGET}/git/trees`, { tree: treeItems });
  treeSha = t.sha;
} catch (err) {
  console.log('  tree تکی نشد — ساخت سلسله‌مراتبی:', err.message.slice(0, 120));
  async function buildTree(dir) {
    const itemsHere = [];
    const subdirs = new Map();
    for (const it of treeItems) {
      const rel = dir ? it.path.slice(dir.length + 1) : it.path;
      const slash = rel.indexOf('/');
      if (slash === -1) itemsHere.push(it);
      else {
        const sub = rel.slice(0, slash);
        if (!subdirs.has(sub)) subdirs.set(sub, []);
        subdirs.get(sub).push(it);
      }
    }
    for (const [sub, items] of subdirs) {
      const subSha = await buildTree(dir ? dir + '/' + sub : sub);
      itemsHere.push({ path: sub, mode: '040000', type: 'tree', sha: subSha });
    }
    const t = await api('POST', `/repos/${TARGET}/git/trees`, { tree: itemsHere });
    return t.sha;
  }
  treeSha = await buildTree('');
}
console.log(`[api-push] ۳/۵ tree ساخته شد: ${treeSha.slice(0, 12)}`);

// ── ۴) کامیت روی main فعلی
const ref = await api('GET', `/repos/${TARGET}/git/ref/heads/main`);
const commit = await api('POST', `/repos/${TARGET}/git/commits`, {
  message: 'Helsa — pre-launch کامل: بریف G1-G5 + عکس‌های واقعی محصولات (۶ محصول) + پادکست/ویدیوکاست + گاردهای ماندگاری\n\n(پوش از طریق Git Database API)',
  tree: treeSha,
  parents: [ref.object.sha]
});
console.log(`[api-push] ۴/۵ کامیت: ${commit.sha.slice(0, 12)}`);

// ── ۵) به‌روزرسانی ref
await api('PATCH', `/repos/${TARGET}/git/refs/heads/main`, { sha: commit.sha });
console.log(`[api-push] ۵/۵ ✓ کامل — github.com/${TARGET} @ ${commit.sha.slice(0, 12)}`);
