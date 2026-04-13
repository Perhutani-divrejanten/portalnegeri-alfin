const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MAIN_PAGES = new Set([
  'index.html',
  'news.html',
  'contact.html',
  'search.html',
  'login.html',
  'register.html',
  'clearstorage.html',
  'debug-images.html',
  'testauth.html'
]);
const DOC_FILES = new Set([
  'AUTOMATION_README.md',
  'GOOGLE_DRIVE_GUIDE.md',
  'GOOGLE_DRIVE_IMAGES_GUIDE.md',
  'netlify.toml'
]);
const TEXT_EXTENSIONS = new Set(['.html', '.css', '.js', '.json', '.md', '.toml', '.txt', '.ps1']);
const SKIP_DIRS = new Set(['.git', 'node_modules']);

const BRAND_LOGO = '<span class="brand-portal" style="font-weight: 700; color: #15803D; font-size: 24px; letter-spacing: -0.5px;">PORTAL</span><span class="brand-negeri" style="color: #1F5F7F; font-weight: 500; font-size: 18px; margin-left: 2px;">NEGERI</span>';

const counts = {
  mainPages: 0,
  articlePages: 0,
  css: 0,
  package: 0,
  docs: 0,
};

function backupArticlesJson() {
  const source = path.join(ROOT, 'articles.json');
  if (!fs.existsSync(source)) return null;
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const backup = path.join(ROOT, `articles.json.bak.${stamp}`);
  fs.copyFileSync(source, backup);
  return path.basename(backup);
}

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name.includes('.bak')) continue;
      results.push(...walk(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    if (/\.bak(\.|$)/i.test(entry.name) || relPath.includes('.bak.')) continue;
    results.push(fullPath);
  }
  return results;
}

function normalizeBrokenHtml(content) {
  let updated = content.replace(/\r\n/g, '\n').replace(/\\n/g, '\n');

  const attrPattern = /([A-Za-z_:][-A-Za-z0-9_:.]*)=\s*\n\s*([^\n<>]+?)\s*\n\s*(?=(?:[A-Za-z_:][-A-Za-z0-9_:.]*)=|\/?>)/g;
  let previous;
  do {
    previous = updated;
    updated = updated.replace(attrPattern, (_, attr, value) => `${attr}="${String(value).trim()}" `);
  } while (updated !== previous);

  updated = updated.replace(/\s+(\/?>)/g, '$1');
  updated = updated.replace(/document\.getElementById\(\s*\n\s*([A-Za-z0-9_-]+)\s*\n\s*\)/g, 'document.getElementById("$1")');
  updated = updated.replace(/toLocaleDateString\(\s*\n\s*([A-Za-z-]+)\s*\n\s*,/g, "toLocaleDateString('$1',");
  updated = updated.replace(/window\.location\.href\s*=\s*\n\s*([A-Za-z0-9_./-]+)\s*\n\s*;/g, "window.location.href = '$1';");
  updated = updated.replace(/\n{3,}/g, '\n\n');

  return updated;
}

function applyCommonReplacements(content) {
  let updated = content;

  const replacements = [
    ['warta' + 'janten@gmail.com', 'portalnegeri@gmail.com'],
    ['Indonesia' + 'Daily33@gmail.com', 'portalnegeri@gmail.com'],
    ['indonesia.daily.33@gmail.com', 'portalnegeri@gmail.com'],
    ['Portal' + 'Negeri33@gmail.com', 'portalnegeri@gmail.com'],
    ['Warta' + ' Janten', 'Portal Negeri'],
    ['Warta' + 'Janten', 'PortalNegeri'],
    ['warta' + 'janten', 'portalnegeri'],
    ['Indonesia' + ' Daily', 'Portal Negeri'],
    ['Indonesia' + 'Daily', 'PortalNegeri'],
    ['indonesia' + 'daily', 'portalnegeri'],
    ['Biz' + 'News', 'Portal Negeri'],
    [String.fromCharCode(0x201C), '"'],
    [String.fromCharCode(0x201D), '"'],
    [String.fromCharCode(0x2018), "'"],
    [String.fromCharCode(0x2019), "'"],
    [String.fromCharCode(0x2013), '-'],
    [String.fromCharCode(0x2014), '-'],
    [String.fromCharCode(0x00A0), ' '],
    [String.fromCharCode(0xFFFD), ' '],
    [''"'],
    [''"'],
    ['"'"],
    ['"'"],
    [''-'],
    [''-'],
    [' ', ' '],
    ['ï¿½', ' '],
  ];

  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }

  updated = updated.replace(/https?:\/\/(?:www\.)?twitter\.com(?:\/@?[A-Za-z0-9_.-]+)?/gi, 'https://twitter.com/portalnegeri');
  updated = updated.replace(/https?:\/\/(?:www\.)?facebook\.com(?:\/[A-Za-z0-9_.-]+)?/gi, 'https://facebook.com/portalnegeri');
  updated = updated.replace(/https?:\/\/(?:www\.)?instagram\.com(?:\/[A-Za-z0-9_.-]+)?/gi, 'https://instagram.com/portalnegeri');
  updated = updated.replace(/https?:\/\/(?:www\.)?youtube\.com(?:\/@?[A-Za-z0-9_.-]+)?/gi, 'https://youtube.com/@portalnegeri');
  updated = updated.replace(/https?:\/\/(?:www\.)?linkedin\.com\/company(?:\/[A-Za-z0-9_.-]+)?/gi, 'https://linkedin.com/company/portalnegeri');
  updated = updated.replace(/https?:\/\/mail\.google\.com\/mail\/(?:u\/0\/)?(?:\?view=cm&fs=1&to=[^"'\s<]+)?/gi, 'https://mail.google.com/mail/?view=cm&fs=1&to=portalnegeri@gmail.com');

  return updated;
}

function applyHtmlBranding(content) {
  let updated = applyCommonReplacements(normalizeBrokenHtml(content));

  updated = updated.replace(/<a([^>]*class="[^"]*navbar-brand[^"]*"[^>]*)>[\s\S]*?<\/a>/gi, (_match, attrs) => `<a${attrs}>${BRAND_LOGO}</a>`);
  updated = updated.replace(/<img[^>]*src=["'][^"']*logo\.(?:png|svg)["'][^>]*>\s*/gi, '');
  updated = updated.replace(/alt=["'](?:PortalNegeri|Portal Negeri|Indonesia(?:Daily)|Warta(?:Janten))["']/gi, 'alt="PortalNegeri"');

  return updated;
}

function applyCssTheme(content) {
  let updated = content;
  updated = updated.replace(/--primary:\s*#[0-9A-Fa-f]{6}/g, '--primary: #15803D');
  updated = updated.replace(/--dark:\s*#[0-9A-Fa-f]{6}/g, '--dark: #052E16');
  updated = updated.replace(/--secondary:\s*#[0-9A-Fa-f]{6}/g, '--secondary: #1F5F7F');

  const colors = [
    ['#FFCC00', '#15803D'],
    ['#ffcc00', '#15803D'],
    ['#1E2024', '#052E16'],
    ['#1e2024', '#052E16'],
    ['#31404B', '#1F5F7F'],
    ['#31404b', '#1F5F7F'],
    ['#065F46', '#15803D'],
    ['#022C22', '#052E16'],
    ['#1E3A5F', '#1F5F7F'],
  ];

  for (const [from, to] of colors) {
    updated = updated.split(from).join(to);
  }

  return updated;
}

function updatePackageJson(content, relPath) {
  try {
    const data = JSON.parse(content);
    if (relPath === 'package.json') {
      data.name = 'portalnegeri';
    }
    if (relPath === 'tools/package.json') {
      data.name = 'portalnegeri-article-generator';
      if (data.description) data.description = applyCommonReplacements(data.description);
      if (Array.isArray(data.keywords)) data.keywords = data.keywords.map((item) => applyCommonReplacements(String(item)));
      if (data.author) data.author = 'Portal Negeri Team';
    }
    return JSON.stringify(data, null, 2) + '\n';
  } catch {
    return applyCommonReplacements(content);
  }
}

function categorize(relPath) {
  if (MAIN_PAGES.has(relPath)) return 'mainPages';
  if (relPath.startsWith('article/') && relPath.endsWith('.html')) return 'articlePages';
  if (relPath === 'css/style.css' || relPath === 'css/style.min.css') return 'css';
  if (relPath === 'package.json' || relPath === 'tools/package.json') return 'package';
  if (DOC_FILES.has(relPath)) return 'docs';
  return null;
}

function processFile(filePath) {
  const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (relPath === 'scripts/rebrand-portal-negeri.js') return;
  const ext = path.extname(filePath).toLowerCase();
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  if (ext === '.html') {
    updated = applyHtmlBranding(updated);
  } else if (ext === '.css') {
    updated = applyCssTheme(updated);
    updated = applyCommonReplacements(updated);
  } else if (relPath === 'package.json' || relPath === 'tools/package.json') {
    updated = updatePackageJson(updated, relPath);
  } else {
    updated = applyCommonReplacements(updated);
  }

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    const category = categorize(relPath);
    if (category) counts[category] += 1;
  }
}

const backupFile = backupArticlesJson();
for (const filePath of walk(ROOT)) {
  processFile(filePath);
}

console.log(`Backup articles.json: ${backupFile || 'not found'}`);
console.log(`Main pages: ${counts.mainPages}`);
console.log(`Article pages: ${counts.articlePages}`);
console.log(`CSS files: ${counts.css}`);
console.log(`Package files: ${counts.package}`);
console.log(`Docs: ${counts.docs}`);
console.log('Rebrand Portal Negeri selesai ✅');
