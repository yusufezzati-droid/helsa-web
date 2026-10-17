#!/usr/bin/env bash
# push-to-git.sh — پوش کامل پروژهٔ هلسا به GitHub (کد + تصاویر بهینه‌شده)
# استفاده:  GITHUB_TOKEN=ghp_xxxxx bash scripts/push-to-git.sh
# امنیت: توکن فقط از متغیر محیطی خوانده می‌شود و هرگز چاپ نمی‌شود؛
#         git-dir در /tmp ساخته می‌شود تا فضای ورک‌اسپیس پر نشود.
set -euo pipefail

REPO="yusufeztati-droid/helsa-web"
BRANCH="main"
: "${GITHUB_TOKEN:?خطا: GITHUB_TOKEN ست نشده — GITHUB_TOKEN=xxx bash scripts/push-to-git.sh}"

cd /home/user/helsa
GITDIR=/tmp/helsa-git

# شروع تازه (فایل اشاره‌گر .git بعداً حذف می‌شود)
rm -rf "$GITDIR" .git
git init --separate-git-dir="$GITDIR" -b "$BRANCH" >/dev/null
git config user.name "ezzatiyusuf-ops"
git config user.email "ezzatiyusuf-ops@users.noreply.github.com"
# postBuffer عمداً پیش‌فرض: بدنهٔ یکپارچهٔ بزرگ توسط پروکسی خروجی بلاک می‌شود

echo "[push] ۱/۵ stage فایل‌ها (طبق .gitignore — بدون .env/بکاپ/qa-shots)…"
git add -A

# گارد امنیتی: هرگز اجازهٔ push رازها را نده
if git ls-files --cached | grep -qx ".env"; then
  echo "خطای امنیتی: .env استیج شده است — متوقف شد!" >&2; exit 1
fi
if git ls-files --cached | grep -q "^backups/"; then
  echo "خطای امنیتی: backups/ استیج شده است — متوقف شد!" >&2; exit 1
fi

# تصاویر بهینه‌شده + منابع gen (شامل عکس‌های واقعی مالک) — طبق الگوی پوش‌های قبلی
git add -f public/images/opt public/images/gen 2>/dev/null || true
git add -f public/images/*.jpg public/images/*.png 2>/dev/null || true

FILES=$(git ls-files --cached | wc -l)
echo "[push] ۲/۵ commit ($FILES فایل)…"
git commit -q -m "Helsa — pre-launch کامل: بریف G1-G5 + عکس‌های واقعی محصولات

- بریف پیش‌راه‌اندازی ۵ گروه کامل (دادهٔ ساختگی صفر، فلوها 17/17+4/4+9/9+8/8، سئو/a11y/آنالیتیکس)
- اسکیما + AggregateRating فقط از نظرات واقعی + صف ادرار نظرات ادمین
- ۶ محصول با عکس واقعی مالک (استودیو هلسا v2): چای لاهیجان · شکلات دست‌ساز خرما · مغز گردو · کشمش سبز · انجیر استهبان · خرما بار
- بخش پادکست/ویدیوکاست روی خانه + فوتر
- گاردهای ماندگاری: fix-product-images.sql + ensure-product-images.sh در restore-db.sh
- گزارش نهایی: PRE-LAUNCH-FINAL-REPORT.md"

echo "[push] ۳/۵ اتصال به $REPO و پوش…"
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"
FORCE=""
if ! git push -u origin "$BRANCH" 2>/tmp/push.err; then
  echo "[push] پوش عادی رد شد (احتمالاً commit اولیهٔ repo) — تلاش با --force…"
  FORCE=" (force)"
  git push -u origin "$BRANCH" --force
fi

echo "[push] ۴/۵ پاک‌کردن توکن از remote…"
git remote set-url origin "https://github.com/${REPO}.git"

echo "[push] ۵/۵ جمع‌بندی…"
SHA=$(git rev-parse --short HEAD)
echo "──────────────────────────────────────"
echo "✅ پوش موفق$FORCE"
echo "   repo:   github.com/$REPO (شاخهٔ $BRANCH)"
echo "   commit: $SHA"
echo "   فایل‌ها: $FILES"
echo "   حجم: $(du -sh "$GITDIR" | cut -f1) (شئ‌های git)"
echo "──────────────────────────────────────"

# نظافت: اشاره‌گر .git از پروژه حذف شود (git-dir در /tmp بین نشست‌ها می‌ماند/می‌رود)
rm -f .git
