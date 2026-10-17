/**
 * تست‌های واحد — منطق خالص (بدون DOM)
 * اجرا: npm run test:unit   (node --import tsx --test)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { countdownParts } from "../src/lib/countdown";
import { formatToman, formatPriceShort, faDigits, discountPercent } from "../src/lib/format";

/* ── شمارش معکوس (#۱۶) ── */
test("countdown: تاریخ آینده → مقادیر درست و ناصفر", () => {
  const now = new Date("2026-09-16T12:00:00");
  // کمپین واقعی فلش‌آفر: 2026-12-30T23:59:59 → ~105 روز
  const r = countdownParts("2026-12-30T23:59:59", now);
  assert.ok(r, "باید مقدار برگرداند");
  assert.equal(r.d, 105);
  assert.equal(r.h, 11);
  assert.ok(r.m >= 0 && r.s >= 0);
  assert.ok(r.d > 0 || r.h > 0 || r.m > 0 || r.s > 0, "هرگز همه صفر نباید باشند");
});

test("countdown: تاریخ دقیقاً ۱ روز و ۲ ساعت بعد", () => {
  const now = new Date("2026-09-16T10:00:00");
  const r = countdownParts("2026-09-17T12:00:00", now);
  assert.ok(r);
  assert.equal(r.d, 1);
  assert.equal(r.h, 2);
});

test("countdown: تاریخ گذشته → null (مخفی‌سازی، نه صفر)", () => {
  assert.equal(countdownParts("2020-01-01T00:00:00"), null);
});

test("countdown: تاریخ نامعتبر (رشتهٔ شمسی خام) → null", () => {
  assert.equal(countdownParts("۹ دی ۱۴۰۵"), null);
  assert.equal(countdownParts(""), null);
  assert.equal(countdownParts("undefinedT23:59:59"), null);
});

/* ── فرمت ارز (#۱۱) — منبع واحد «تومان» ── */
test("formatToman: دقیقاً یک «تومان» با فاصله", () => {
  const out = formatToman(890000);
  assert.equal((out.match(/تومان/g) || []).length, 1);
  assert.ok(out.includes("۸۹۰٬۰۰۰"));
  assert.ok(out.startsWith("۸۹۰٬۰۰۰ "));
});

test("formatPriceShort: فقط عدد، بدون ارز", () => {
  assert.equal((formatPriceShort(1020000).match(/تومان/g) || []).length, 0);
});

test("discountPercent/سالم بودن اعداد", () => {
  assert.equal(discountPercent(890000, 1020000), 13);
  assert.equal(discountPercent(500000, null), 0);
  assert.equal(faDigits("123"), "۱۲۳");
});
