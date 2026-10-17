#!/usr/bin/env node
/**
 * HELSA — واریانت‌های تصاویر هیرو (عکس‌های واقعی Pexels):
 *   opt/{name}.jpg (mozjpeg ≤1400w) · {name}-{480,768,1080,1400}.webp/.avif · {name}.webp/.avif
 * + به‌روزرسانی src/data/image-variants.json و image-blur.json (LQIP ~16px webp).
 *
 * اسلایدهای محصولی (پرفروش‌ترین/پیشنهاد ویژه) عکس واقعی محصول از کاتالوگ نشان می‌دهند
 * و در این اسکریپت نقشی ندارند. فقط ۳ اسلاید مفهومی اینجا تولید می‌شوند؛ منبع هر عکس
 * باید پیش از اجرا در مسیرهای زیر دانلود شود (مجوز Pexels: تجاری آزاد):
 *   hero-slide-mazeh      ← pexels #4499243  → /tmp/hero-src-mazeh.jpg
 *   hero-slide-gifts      ← pexels #190930   → /tmp/hero-src-gifts.jpg
 *   hero-slide-wholesale  ← pexels #17877981 → /tmp/hero-src-wholesale.jpg
 * مثال دانلود:
 *   curl -sL -o /tmp/hero-src-mazeh.jpg "https://images.pexels.com/photos/4499243/pexels-photo-4499243.jpeg?auto=compress&cs=tinysrgb&w=1920"
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "public/images/opt");
const WIDTHS = [480, 768, 1080, 1400];

const JOBS = [
  ["/tmp/hero-src-mazeh.jpg", "hero-slide-mazeh"],
  ["/tmp/hero-src-gifts.jpg", "hero-slide-gifts"],
  ["/tmp/hero-src-wholesale.jpg", "hero-slide-wholesale"],
];

const variantsPath = join(ROOT, "src/data/image-variants.json");
const blurPath = join(ROOT, "src/data/image-blur.json");
const variants = JSON.parse(readFileSync(variantsPath, "utf-8"));
const blur = JSON.parse(readFileSync(blurPath, "utf-8"));

for (const [src, name] of JOBS) {
  let img = sharp(src, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const baseW = Math.min(meta.width, 1400);

  await img.clone().resize({ width: baseW, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, `${name}.jpg`));
  await img.clone().resize({ width: baseW, withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile(join(OUT, `${name}.webp`));
  await img.clone().resize({ width: baseW, withoutEnlargement: true }).avif({ quality: 55, effort: 3 }).toFile(join(OUT, `${name}.avif`));

  const made = [];
  for (const w of WIDTHS) {
    if (meta.width <= w) continue;
    await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile(join(OUT, `${name}-${w}.webp`));
    await img.clone().resize({ width: w, withoutEnlargement: true }).avif({ quality: 55, effort: 3 }).toFile(join(OUT, `${name}-${w}.avif`));
    made.push(w);
  }
  variants[name] = { avif: made, webp: made, jpg: true };

  const lqip = await img.clone().resize({ width: 16 }).webp({ quality: 40, effort: 3 }).toBuffer();
  blur[name] = `data:image/webp;base64,${lqip.toString("base64")}`;
  console.log(`✓ ${name} (${meta.width}x${meta.height} → ${baseW}w, ${made.join("/") || "-"})`);
}

writeFileSync(variantsPath, JSON.stringify(variants, null, 2) + "\n");
writeFileSync(blurPath, JSON.stringify(blur, null, 2) + "\n");
console.log("json به‌روز شد: image-variants + image-blur");
